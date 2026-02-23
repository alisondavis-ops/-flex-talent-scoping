import { NextResponse } from "next/server";
import { validateToken, getSession, submitResponse, allInvitesSubmitted } from "@/lib/sessions";
import { notifyTAPSubmission } from "@/lib/slack";
import type { SubmitResponseRequest } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const RELATIONSHIP_QUESTION = {
  id: "relationship",
  label: "What is your relationship to this role?",
  probe: "This helps us understand your perspective and ask the most relevant follow-up questions.",
  type: "select",
  options: [
    "Cross-functional partner — I work closely with this team but sit in a different function",
    "Key stakeholder — this role will directly impact my work or team",
    "Department lead — I lead the department or org this role sits within",
    "DRI — I am directly responsible for the project or outcome this role supports",
  ],
};

const CORE_QUESTIONS = [
  { id: "level_expectation", label: "What level do you expect this person to be hired at?", type: "select", options: ["L3","L4","L5","L6","L7","L8","L9"] },
  { id: "level_rationale", label: "Walk us through your reasoning. Why that level?", probe: "What about scope, impact, or the team's needs led you there?", type: "textarea" },
  { id: "success_definition", label: "What does success look like from your vantage point at 6 months?", probe: "Be specific — what will you see them doing, influencing, or delivering?", type: "textarea" },
];

const RELATIONSHIP_FOLLOWUPS: Record<string, { id: string; label: string; probe?: string; type: string }[]> = {
  "Cross-functional partner — I work closely with this team but sit in a different function": [
    { id: "collaboration_expectations", label: "How will this person need to work with your team day-to-day?", probe: "Think about handoffs, shared projects, or dependencies.", type: "textarea" },
    { id: "gap_you_see", label: "What gap do you most hope this hire fills from your vantage point?", probe: "Is there a skill, approach, or perspective missing that affects your team too?", type: "textarea" },
  ],
  "Key stakeholder — this role will directly impact my work or team": [
    { id: "impact_on_you", label: "How will this hire directly impact your work or team?", probe: "Think about what changes, improves, or becomes possible once this person is in seat.", type: "textarea" },
    { id: "what_you_need", label: "What do you most need from this person to do your job well?", probe: "Be direct — this is about setting the hire up for success.", type: "textarea" },
  ],
  "Department lead — I lead the department or org this role sits within": [
    { id: "strategic_context", label: "How does this hire fit into the broader org strategy?", probe: "What's the business problem this role is solving over the next 12–18 months?", type: "textarea" },
    { id: "budget_context", label: "Is there any headcount or budget context we should know?", probe: "Any constraints on comp level, timeline, or headcount classification?", type: "textarea" },
  ],
  "DRI — I am directly responsible for the project or outcome this role supports": [
    { id: "non_negotiables", label: "What are your absolute non-negotiables for this hire?", probe: "If a candidate is missing this, it's an automatic no — regardless of everything else.", type: "textarea" },
    { id: "tradeoffs", label: "What tradeoffs are you willing to make?", probe: "e.g. less experience for higher potential, domain expertise over Flex attributes, etc.", type: "textarea" },
  ],
};

function getQuestionsForRole(roleType: string) {
  return [RELATIONSHIP_QUESTION, ...CORE_QUESTIONS];
}

function getFollowupQuestions(relationshipAnswer: string) {
  return RELATIONSHIP_FOLLOWUPS[relationshipAnswer] ?? [];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const decoded = validateToken(token);
  if (!decoded) {
    return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 401 });
  }

  const session = getSession(decoded.sessionId);
  if (!session) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }

  const invite = session.invites.find(inv => inv.id === decoded.inviteId);
  if (!invite) {
    return NextResponse.json({ success: false, error: "Invite not found" }, { status: 404 });
  }

  if (invite.status === "submitted") {
    return NextResponse.json({ success: false, error: "already_submitted" }, { status: 409 });
  }

  const questions = getQuestionsForRole(decoded.roleType);

  return NextResponse.json({
    success: true,
    data: {
      invite_id: decoded.inviteId,
      session_id: decoded.sessionId,
      role_type: decoded.roleType,
      stakeholder_name: invite.name,
      job_family: session.job_family,
      role_title: session.hm_answers.role_title ?? session.job_family,
      requester_name: session.tap_name ?? null,
      questions,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
  const decoded = validateToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 401 });
    }

    const session = getSession(decoded.sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const invite = session.invites.find(inv => inv.id === decoded.inviteId);
    if (!invite || invite.status === "submitted") {
      return NextResponse.json({ success: false, error: "Cannot submit" }, { status: 409 });
    }

    const body = (await request.json()) as SubmitResponseRequest;
    const response = submitResponse(
      decoded.sessionId,
      decoded.inviteId,
      body.answers,
      decoded.roleType
    );

    if (session.tap_slack_id) {
      const updatedSession = getSession(decoded.sessionId)!;
      const submitted = updatedSession.invites.filter(inv => inv.status === "submitted").length;
      const total = updatedSession.invites.length;

      notifyTAPSubmission({
        tapSlackId: session.tap_slack_id,
        stakeholderName: invite.name,
        stakeholderRole: decoded.roleType,
        sessionId: decoded.sessionId,
        totalInvited: total,
        totalSubmitted: submitted,
        dashboardUrl: `${APP_URL}/results/${decoded.sessionId}`,
      }).catch(console.error);
    }

    const allDone = allInvitesSubmitted(decoded.sessionId);

    return NextResponse.json({
      success: true,
      data: {
        response_id: response.id,
        all_submitted: allDone,
      },
    });
  } catch (err) {
    console.error("Submit response error:", err);
    return NextResponse.json({ success: false, error: "Submission failed" }, { status: 500 });
  }
}
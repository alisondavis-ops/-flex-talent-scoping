import { NextResponse } from "next/server";
import { validateToken, getSession, submitResponse, allInvitesSubmitted } from "@/lib/sessions";
import { notifyTAPSubmission } from "@/lib/slack";
import type { SubmitResponseRequest } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const STAKEHOLDER_QUESTIONS: Record<string, { id: string; label: string; probe?: string; type: string; options?: string[] }[]> = {
  all: [
    { id: "level_expectation", label: "What level do you expect this person to be hired at?", type: "select", options: ["L3","L4","L5","L6","L7","L8","L9"] },
    { id: "level_rationale", label: "Walk us through your reasoning. Why that level?", probe: "What about scope, impact, or the team's needs led you there?", type: "textarea" },
    { id: "success_definition", label: "What does success look like from your vantage point at 6 months?", probe: "Be specific — what will you see them doing, influencing, or delivering?", type: "textarea" },
  ],
  hm_lead: [
    { id: "strategic_context", label: "How does this hire fit into the broader org strategy?", probe: "What's the business problem this role is solving over the next 12–18 months?", type: "textarea" },
    { id: "budget_context", label: "Is there any budget or headcount context we should know?", probe: "Is this approved headcount? Any constraints on comp level or timeline?", type: "textarea" },
  ],
  hm_peer: [
    { id: "collaboration_expectations", label: "How will this person need to work with your team day-to-day?", probe: "Think about handoffs, shared projects, or dependencies.", type: "textarea" },
    { id: "gap_you_see", label: "What gap in the current team do you most hope this hire fills?", probe: "Is there a skill, approach, or perspective missing from the team today?", type: "textarea" },
  ],
  future_peer: [
    { id: "team_dynamics", label: "What does this person need to be like to thrive on this team?", probe: "Think about working style, communication, speed, and how the team makes decisions.", type: "textarea" },
    { id: "biggest_challenge", label: "What's the hardest part of working here that a new person needs to be ready for?", probe: "Be candid — this helps us set candidates up for success.", type: "textarea" },
  ],
  ic_team: [
    { id: "what_you_need_in_a_manager", label: "What does a great manager look like for you and this team?", probe: "Think about how they make decisions, how they unblock, and how they develop people.", type: "textarea" },
    { id: "ic_concern", label: "Is there anything you think we should know that a hiring manager might not surface?", probe: "This is confidential — only the Talent team will see your answer.", type: "textarea" },
  ],
  backfill_colleague: [
    { id: "what_worked", label: "Looking back at the person in this role, what did they do exceptionally well?", probe: "What should we make sure the next person can do equally well or better?", type: "textarea" },
    { id: "what_was_missing", label: "Where did you see gaps or opportunities to do things differently?", probe: "No need to be diplomatic — this is about improving the role.", type: "textarea" },
  ],
};

function getQuestionsForRole(roleType: string) {
  const shared = STAKEHOLDER_QUESTIONS.all;
  const roleSpecific = STAKEHOLDER_QUESTIONS[roleType] ?? [];
  return [...shared, ...roleSpecific];
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
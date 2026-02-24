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

const HM_QUESTIONS = [
  { id: "org_area", label: "Which part of the org does this role sit in?", probe: "e.g. Consumer, Platform, Partner — where does this team live?", type: "text" },
  { id: "people_management", label: "Does this person need to manage people?", probe: "If yes — how many reports, how senior, and how much management experience is truly needed?", type: "text" },
  { id: "ic_vs_manager", label: "Is this role hands-on IC, purely managerial, or a player/coach?", type: "select", options: ["Primarily IC — mostly in the weeds", "Player/coach — significant IC + managing others", "Primarily managerial — IC in critical spots only", "Full people leader — IC is rare"] },
  { id: "zero_to_one", label: "Is this a 0-to-1 build or evolving something that exists?", type: "select", options: ["Yes — fully net new", "Mostly new, some foundation exists", "Scaling/evolving an existing product or function", "Primarily maintenance and optimization"] },
  { id: "success", label: "What does success look like at 6 and 12 months?", probe: "Be specific. What will this person have shipped, influenced, or changed?", type: "textarea" },
  { id: "failure", label: "What does failure look like?", probe: "What would cause this hire not to work out? This often reveals the real requirements.", type: "textarea" },
  { id: "backfill", label: "Is this a backfill or a new role?", probe: "If backfill — what did you learn? If new — who owned this scope before?", type: "text" },
  { id: "domain_experience", label: "How much domain or industry experience is needed?", type: "select", options: ["Not required — strong fundamentals are enough", "Helpful but not a dealbreaker", "Strongly preferred", "Required — complexity demands it"] },
  { id: "competitors", label: "Any specific companies, backgrounds, or profiles we should target?", type: "text" },
  { id: "location", label: "Where can this role be based?", type: "select", options: ["New York, NY — Tier 1 (HQ)", "San Francisco / Bay Area — Tier 1", "Salt Lake City, UT — Tier 3", "Remote — Engineering / Data Science / AI/ML / L4+ Field Sales", "Remote — Exception requested (L7+ only)", "Multiple locations"] },
  { id: "hm_level_pick", label: "What level do you believe this role should be?", probe: "Pick the level you feel most convicted about.", type: "select", options: ["L3", "L4", "L5", "L6", "L7", "L8", "L9"] },
  { id: "hm_level_rationale", label: "Walk us through your reasoning. Why that level?", probe: "What about scope, impact, or skills needed led you there?", type: "textarea" },
];

function getQuestionsForRole(roleType: string, track?: string) {
  if (roleType === "hiring_manager") return getHMQuestions(track ?? "ga");
  return [RELATIONSHIP_QUESTION, ...CORE_QUESTIONS];
}

function getHMQuestions(track: string) {
  const orgQuestion = track === "product"
    ? { id: "org_area", label: "Which part of the product org is this role part of?", probe: "e.g. Consumer, Platform, Partner — where does this team sit?", type: "text" }
    : { id: "org_area", label: "Which part of the org does this role support?", probe: "e.g. Engineering, GTM, People — who are the primary internal stakeholders?", type: "text" };

  const trackSpecific: Record<string, object[]> = {
    product: [
      { id: "zero_to_one", label: "Is this a 0-to-1 build?", probe: "Building something net new, or evolving/scaling something that exists?", type: "select", options: ["Yes — fully net new", "Mostly new, some foundation exists", "Scaling/evolving an existing product", "Primarily maintenance and optimization"] },
      { id: "vision_vs_execution", label: "Do we know the solution — or do we need someone to define both vision AND execution?", probe: "This is one of the biggest leveling signals.", type: "select", options: ["We know the solution — need strong execution", "Rough direction exists — need someone to sharpen and build", "We have the problem — need someone to define solution and strategy", "We don't fully know the problem or solution — need someone to define both"] },
      { id: "specialization", label: "How niche or specialized is this role?", type: "select", options: ["Agile product athlete can ramp — domain is learnable", "Some domain familiarity helpful but not required", "Prior domain experience strongly preferred", "Prior experience with this exact problem set is critical"] },
    ],
    engineering: [
      { id: "greenfield", label: "Is this a greenfield build or maintaining/extending existing systems?", type: "select", options: ["Greenfield — net new system or platform", "Mostly new with some existing foundation", "Extending / evolving existing systems", "Primarily maintaining and optimizing existing systems"] },
      { id: "tech_scope", label: "How would you describe the technical scope of this role?", type: "select", options: ["Deep specialist — expert in a narrow domain", "Full-stack contributor — breadth across the system", "Systems architect — designs across platforms", "Technical leader — sets direction, enables others"] },
      { id: "cross_functional_scope", label: "How cross-functional is this role?", type: "select", options: ["Primarily within the engineering team", "Works closely with 1–2 adjacent teams", "Significant cross-functional coordination required", "Enterprise-wide — interfaces across the entire org"] },
    ],
    marketing: [
      { id: "marketing_motion", label: "Is this role primarily building the marketing function/strategy, or executing within an established one?", type: "select", options: ["Building — strategy and function largely undefined", "Inheriting a strategy, needs significant refinement", "Executing within a defined strategy and playbook", "Optimizing an established motion — improve and scale"] },
      { id: "channel_scope", label: "What is the primary scope of this role's channel or domain ownership?", type: "select", options: ["Single channel or campaign type", "Multiple channels within a function", "Full function ownership", "Cross-functional — spans brand, growth, and product marketing"] },
    ],
    revenue: [
      { id: "market_maturity", label: "Is this role focused on a new market/segment or an existing book of business?", type: "select", options: ["New market — no existing motion or pipeline", "Emerging — early signal, limited infrastructure", "Established — existing pipeline, room to grow", "Mature book — optimize and retain"] },
      { id: "gtm_definition", label: "How defined is the go-to-market motion this person will operate in?", type: "select", options: ["Fully defined playbook — execute within it", "Playbook exists but needs refinement", "Rough direction — significant building required", "Blank slate — define the motion from scratch"] },
    ],
    ga: [
      { id: "process_maturity", label: "How mature is the process or function this person is stepping into?", type: "select", options: ["Undefined — no process exists yet", "Nascent — early attempts, inconsistent", "Established but broken — needs a rebuild", "Functional — works, but has clear optimization opportunities", "Mature — well-documented, scalable, needs stewardship"] },
      { id: "primary_mode", label: "What is the primary mode of this role?", type: "select", options: ["Defining — build the function or process from scratch", "Optimizing — inherit something and make it significantly better", "Executing — operate within established systems and processes", "Mixed — some definition, mostly optimization and execution"] },
      { id: "cross_functional_scope", label: "How cross-functional is this role?", type: "select", options: ["Primarily team-internal", "Works closely with 1–2 adjacent teams", "Significant cross-functional coordination required", "Enterprise-wide — interfaces across the entire org"] },
    ],
  };

  const coreHMQuestions = [
    { id: "people_management", label: "Does this person need to manage people?", probe: "If yes — how many reports, how senior, and how much management experience is truly needed?", type: "text" },
    { id: "ic_vs_manager", label: "Is this role hands-on IC, purely managerial, or a player/coach?", type: "select", options: ["Primarily IC — mostly in the weeds", "Player/coach — significant IC + managing others", "Primarily managerial — IC in critical spots only", "Full people leader — IC is rare"] },
    { id: "success", label: "What does success look like at 6 and 12 months?", probe: "Be specific. What will this person have shipped, influenced, or changed?", type: "textarea" },
    { id: "failure", label: "What does failure look like?", probe: "What would cause this hire not to work out? This often reveals the real requirements.", type: "textarea" },
    { id: "backfill", label: "Is this a backfill or a new role?", probe: "If backfill — what did you learn? If new — who owned this scope before?", type: "text" },
    { id: "domain_experience", label: "How much domain or industry experience is needed?", type: "select", options: ["Not required — strong fundamentals are enough", "Helpful but not a dealbreaker", "Strongly preferred", "Required — complexity demands it"] },
    { id: "competitors", label: "Any specific companies, backgrounds, or profiles we should target?", type: "text" },
    { id: "location", label: "Where can this role be based?", type: "select", options: ["New York, NY — Tier 1 (HQ)", "San Francisco / Bay Area — Tier 1", "Salt Lake City, UT — Tier 3", "Remote — Engineering / Data Science / AI/ML / L4+ Field Sales", "Remote — Exception requested (L7+ only)", "Multiple locations"] },
    { id: "hm_level_pick", label: "What level do you believe this role should be?", probe: "Pick the level you feel most convicted about.", type: "select", options: ["L3", "L4", "L5", "L6", "L7", "L8", "L9"] },
    { id: "hm_level_rationale", label: "Walk us through your reasoning. Why that level?", probe: "What about scope, impact, or skills needed led you there?", type: "textarea" },
  ];

  return [orgQuestion, ...(trackSpecific[track] ?? trackSpecific.ga), ...coreHMQuestions];
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

  const session = await getSession(decoded.sessionId);
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

  console.log("DEBUG roleType:", decoded.roleType, "track:", session.track);
const questions = getQuestionsForRole(decoded.roleType, session.track);

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

    const session = await getSession(decoded.sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const invite = session.invites.find(inv => inv.id === decoded.inviteId);
    if (!invite || invite.status === "submitted") {
      return NextResponse.json({ success: false, error: "Cannot submit" }, { status: 409 });
    }

    const body = (await request.json()) as SubmitResponseRequest;
    const response = await submitResponse(
      decoded.sessionId,
      decoded.inviteId,
      body.answers,
      decoded.roleType
    );

    if (session.tap_slack_id) {
      const updatedSession = await getSession(decoded.sessionId);
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

    const allDone = await allInvitesSubmitted(decoded.sessionId);

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
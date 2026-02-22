import Anthropic from "@anthropic-ai/sdk";
import type { HMAnswers, AIAnalysisResult, StakeholderResponse, SynthesisResult } from "@/types";
import type { Track } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are the intelligence layer of Flex's TAP (Talent Acquisition Partner) Intelligence Tool — an internal platform designed to help Talent partners proactively advise hiring managers rather than reactively process job descriptions.

Your role is to:
1. Analyze a hiring manager's intake responses against Flex's career ladder framework
2. Surface tensions, misalignments, and risks with nuance and specificity
3. Generate a TAP brief with probing questions that will sharpen alignment
4. Draft a job description rooted in the actual level, scope, and attributes
5. Build an interview plan that maps to Flex's talent philosophy and attribute framework
6. Suggest a sourcing strategy that reflects the real candidate profile needed

Flex's six core attributes (assessed at every level, with level-calibrated language):
- Doer: Gets things done. Moves fast. Unblocks self and others.
- Owner: Owns outcomes, not just tasks. Never defers accountability.
- Collaborative: Cross-functional relationship builder. Welcomes debate.
- Precise: Clarity of thought and communication. Structured thinker.
- Resilient: Grit under pressure. Stable in uncertainty.
- Humble: Learns constantly. Balances conviction with openness.

Flex career ladder signals by level:
- L4: Executes assigned work, feature-level impact, low autonomy, needs clear direction
- L5: Owns complex features independently, moderate autonomy, handles feature-level ambiguity
- L6: Owns a domain/product including roadmap, high autonomy, cross-functional leadership
- L7: Owns broader product area or business goals, player/coach, very high ambiguity tolerance
- L8: Owns a vertical across strategy and execution, primarily strategic, extreme ambiguity
- L9: Shapes company strategy, complete autonomy, defines the problem space itself

Flex's talent philosophy on interviewing:
- Every search begins with an Intro Call (TAP-led, 30 min)
- Hiring Manager Screen before any panel work
- Work samples / case studies for all roles L5+
- Cross-functional interviews are non-negotiable for L6+
- Values and Leadership interview for all management roles
- Executive interview for L8+

Output format: Respond ONLY with valid JSON matching the AIAnalysisResult type. No markdown, no prose, no preamble.`;

export async function analyzeIntake(
  hmAnswers: HMAnswers,
  track: Track,
  jobFamily: string
): Promise<AIAnalysisResult> {
  const prompt = `
Analyze this role intake for Flex's TAP Intelligence Tool.

JOB FAMILY: ${jobFamily}
TRACK: ${track}
HM LEVEL REQUEST: ${hmAnswers.hm_level_pick}

HM INTAKE RESPONSES:
${JSON.stringify(hmAnswers, null, 2)}

Produce a complete AIAnalysisResult JSON with these exact fields:

{
  "level_analysis": {
    "recommended_level": <number>,
    "hm_requested_level": <number>,
    "level_match": <boolean>,
    "tension_flag": <boolean>,
    "reasoning": "<2-3 sentences>",
    "scope_assessment": "<1-2 sentences>",
    "impact_assessment": "<1-2 sentences>",
    "people_assessment": "<1-2 sentences>",
    "autonomy_assessment": "<1-2 sentences>",
    "ambiguity_assessment": "<1-2 sentences>",
    "attribute_fit": {
      "Doer": "<specific signal from intake>",
      "Owner": "<specific signal>",
      "Collaborative": "<specific signal>",
      "Precise": "<specific signal>",
      "Resilient": "<specific signal>",
      "Humble": "<specific signal>"
    }
  },
  "tensions": [
    {
      "id": "<snake_case_id>",
      "title": "<short title>",
      "description": "<2-3 sentences>",
      "severity": "high|medium|low",
      "probing_question": "<exact question for TAP to ask HM>",
      "source": "hm_intake"
    }
  ],
  "tap_brief": {
    "summary": "<3-4 sentence executive summary — candid, concise, actionable>",
    "priority_questions": ["<question 1>", "<question 2>", "<up to 5>"],
    "watch_items": ["<watch item 1>", "<watch item 2>"],
    "level_signal": "<one clear sentence on the level situation>",
    "candidate_profile_notes": "<2-3 sentences on what the ideal candidate actually looks like>"
  },
  "jd_draft": {
    "job_title": "<clean title with level label>",
    "level_label": "<e.g. Senior, Staff, Lead>",
    "about_the_role": "<3-4 sentence paragraph>",
    "what_you_will_do": ["<responsibility 1>", "<up to 8 items>"],
    "what_we_are_looking_for": ["<requirement 1>", "<up to 8 items>"],
    "nice_to_have": ["<nice to have 1>", "<up to 4 items>"],
    "location_statement": "<based on location field>"
  },
  "interview_plan": {
    "stages": [
      {
        "stage_name": "<e.g. Intro Call>",
        "stage_type": "intro_call|technical|case|values|executive|offer",
        "duration_minutes": <number>,
        "interviewer_type": "<e.g. TAP, Hiring Manager>",
        "focus_areas": ["<focus 1>", "<focus 2>"],
        "sample_questions": ["<question 1>", "<question 2>", "<question 3>"],
        "attributes_assessed": ["<attribute 1>", "<attribute 2>"]
      }
    ],
    "overall_notes": "<2-3 sentences>",
    "attribute_mapping": {
      "Doer": ["<stage name>"],
      "Owner": ["<stage name>"],
      "Collaborative": ["<stage name>"],
      "Precise": ["<stage name>"],
      "Resilient": ["<stage name>"],
      "Humble": ["<stage name>"]
    }
  },
  "sourcing_strategy": {
    "headline": "<1 sentence sourcing thesis>",
    "target_companies": ["<company 1>", "<up to 8>"],
    "target_titles": ["<title 1>", "<up to 6>"],
    "search_strings": ["<LinkedIn boolean string 1>", "<string 2>"],
    "channels": [
      {
        "channel": "<e.g. LinkedIn Recruiter>",
        "rationale": "<why this channel>",
        "priority": "primary|secondary"
      }
    ],
    "diversity_considerations": "<1-2 sentences>",
    "outreach_angle": "<the hook a TAP should lead with in outreach>"
  }
}

Be specific, candid, and rigorous. Surface real tensions even if uncomfortable.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");

  try {
    return JSON.parse(content.text) as AIAnalysisResult;
  } catch {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as AIAnalysisResult;
    throw new Error("Could not parse Claude response as JSON");
  }
}

export async function synthesizeStakeholders(
  hmAnswers: HMAnswers,
  responses: StakeholderResponse[],
  existingAnalysis: AIAnalysisResult
): Promise<SynthesisResult> {
  const prompt = `
You are synthesizing stakeholder input for a talent search at Flex.

HM LEVEL REQUEST: ${hmAnswers.hm_level_pick}
HM LEVEL RATIONALE: ${hmAnswers.hm_level_rationale}
AI LEVEL RECOMMENDATION: L${existingAnalysis.level_analysis.recommended_level}

STAKEHOLDER RESPONSES:
${responses.map((r, i) => `
Stakeholder ${i + 1} (${r.role_type}):
${JSON.stringify(r.answers, null, 2)}
`).join("\n---\n")}

EXISTING TENSIONS FOR REFERENCE:
${existingAnalysis.tensions.map(t => `- [${t.severity.toUpperCase()}] ${t.title}`).join("\n")}

Produce a SynthesisResult JSON:

{
  "level_spread": [
    {
      "respondent": "<role type label>",
      "role_type": "<hm_peer|hm_lead|future_peer|ic_team|backfill_colleague>",
      "level_pick": <number>,
      "rationale_summary": "<1 sentence>"
    }
  ],
  "level_consensus": <number or null>,
  "level_divergence_flag": <boolean>,
  "tensions": [
    {
      "id": "<snake_case_id>",
      "title": "<tension title>",
      "description": "<2-3 sentences>",
      "severity": "high|medium|low",
      "probing_question": "<exact question to resolve this>",
      "source": "stakeholder_synthesis",
      "respondents_involved": ["<role types>"]
    }
  ],
  "probing_questions": ["<question 1>", "<up to 6>"],
  "slack_summary": "<3-4 sentences safe for Slack — no ic_concern content>",
  "tap_private_brief": "<4-5 sentences for TAP only — include ic_concern signals>",
  "notion_summary": "<formatted text for Notion page>"
}

NEVER include ic_concern content in slack_summary. Be specific about who diverges and how.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");

  try {
    return JSON.parse(content.text) as SynthesisResult;
  } catch {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as SynthesisResult;
    throw new Error("Could not parse synthesis response as JSON");
  }
}
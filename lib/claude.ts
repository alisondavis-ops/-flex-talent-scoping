import Anthropic from "@anthropic-ai/sdk";
import type { HMAnswers, AIAnalysisResult, StakeholderResponse, SynthesisResult } from "@/types";
import type { Track } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are the intelligence layer of Flex's TAP (Talent Acquisition Partner) Intelligence Tool — an internal platform that helps Talent partners proactively advise hiring managers rather than reactively process job descriptions.

Your job is to reason deeply against Flex's actual career frameworks and surface real tensions — not platitudes. Be candid, specific, and direct. A TAP reading your output should feel like they just got briefed by a senior colleague who has done this role before.

---

## FLEX HIRING PHILOSOPHY

Flex evaluates all candidates across two dimensions:

**Intrinsic (who they are — hardest to train, weighted most heavily):**
- Intellect: Raw cognitive speed, pattern recognition, ability to learn fast and think abstractly. Not about pedigree.
- Flex Attributes: The 6 traits that define Flex's best people (see below).

**Role-Specific (what they know — important, but can be developed):**
- Skills: Learned abilities required for the work.
- Experiences: Application of skills in relevant contexts.

Candidates who spike on Intellect and Flex Attributes will outperform "experienced" candidates who lack them. The TAP brief and tensions should always filter through this lens.

---

## FLEX ATTRIBUTES (use exact language — these are verbatim from Flex's framework)

### Doer
**Universal:** Gets shit done, efficiently. Willing to roll up their sleeves and do what it takes, whatever the barriers.
- **L1–5:** Delivers high-quality work consistently and with urgency, reliably hitting or beating deadlines. Asks for clarity when needed, takes initiative to unblock themselves, and follows through on commitments. Raises their hand to help when they see a problem to be solved.
- **L6–8:** Drives work forward with minimal oversight, balancing speed with quality. Anticipates obstacles and proactively removes them. Can shift between strategic and tactical execution as needed. Creates systems to scale their capacity & output. Begins to elevate others by creating clarity, structure, and momentum across projects.
- **L9+:** Believes that "exceptional leadership" requires knowing their domain inside and out, which only comes with getting their hands dirty, constantly. Works effectively through others and gets the most out of their team, but welcomes IC work as a key part of their role.

### Owner
**Universal:** Takes full accountability for every initiative they work on — from ideation to outcomes, whether a major project or a 15-minute meeting. Always has a plan B. Behaves as an owner of the company, always contextualizing decisions and priorities accordingly.
- **L1–5:** Owns their deliverables end-to-end. Communicates progress early and often. Understands how their work contributes to team goals and is hungry to take on more responsibility. Learns from mistakes and sees things through.
- **L6–8:** Takes ownership of projects and outcomes, not just tasks. Acts with autonomy, drives cross-functional alignment, and delivers reliably. Makes thoughtful decisions based on broader context and business needs.
- **L9+:** Takes ownership for the outcomes of their full function and sees around corners. Can speak to and defend every part of their domain with intimate detail. Never defers responsibility or accountability.

### Collaborative
**Universal:** Brings people together to solve problems. Believes the strongest ideas are shaped through sharing, challenge, and refinement.
- **L1–5:** Actively seeks input from teammates and contributes ideas in group settings. Prioritizes team success over personal credit and is eager to learn from others.
- **L6–8:** Builds strong cross-functional relationships to drive outcomes. Welcomes challenge and debate to improve the quality of decisions. Helps create a team culture of openness, inclusion, and constructive feedback.
- **L9+:** Has high conviction (built on data and experience), but defaults to active listening. Coaches team members to build and share their own perspectives and challenges them appropriately.

### Precise
**Universal:** Clear in thought and clear in communication. Understands ideas are only valuable if made legible to others.
- **L1–5:** Focuses on clarity in both thinking and communication. Asks thoughtful questions to better understand problems. Adapts communication based on audience.
- **L6–8:** Translates complexity into clear ideas, plans, and decisions. Brings structured thinking to ambiguous problems. Communicates effectively across levels and functions to gain alignment.
- **L9+:** Works from first principles. Develops frameworks to compress and synthesize complex problems. Able to articulate and defend strategy at any altitude for any audience.

### Resilient
**Universal:** Adapts quickly to change and bounces back from the most challenging setbacks.
- **L1–5:** Stays focused and positive in the face of setbacks. Uses feedback to bounce back stronger. Embraces change and keeps moving forward.
- **L6–8:** Demonstrates grit and composure under pressure. Helps stabilize the team during uncertainty or change. Maintains momentum even when outcomes are unclear.
- **L9+:** Able to withstand high pressure. Translates heat into kinetic energy for their team. Holds their ground, but knows when to disagree and commit.

### Humble
**Universal:** Self-aware and low ego. Cares more about getting to the truth than looking good. Assumes there is much to learn from others' perspectives.
- **L1–5:** Shows eagerness to learn and grow. Open to feedback and willing to admit what they don't know. Prioritizes progress over ego.
- **L6–8:** Leads with curiosity and self-awareness. Actively seeks diverse perspectives and gives credit where it's due. Balances conviction with openness to being wrong.
- **L9+:** Does not lean into hierarchy. Welcomes evaluation and challenges from others regardless of their experience level. Relentless pursuit of the truth.

---

## FLEX CAREER LADDER SIGNALS

### Product Management
- **L4:** Executes features assigned to them. Feature-level impact. Produces specs with guidance. Communicates with guidance.
- **L5:** Owns complex new features independently. Specifies well-designed features from scratch. Independent bridge between engineering and company.
- **L6:** Owns a domain or product including roadmap definition and prioritization. Sets compelling vision with guidance. Proactively gathers customer insights and competitive data. Begins acting as face of product to stakeholders.
- **L7:** Owns a broader product area or top-level business goals. Independently sets vision and strategy. Takes vague areas and creates frameworks. Acts as face of product to internal and external stakeholders. Guides customer-facing teams.
- **L8:** Owns a vertical (Consumer, Platform, Partner) across strategy, roadmap, resource allocation, and execution. Sets compelling strategy with LT buy-in. Accountable for complex, multi-dimensional roadmap suite. Face of product at executive level. Leads company-wide discussions.
- **L9:** Same vertical ownership as L8 but impacts overall company strategy (product, business, GTM). Shares compelling multi-year vision. Strong executive communicator who independently aligns VP+ leaders.

### Engineering
- **L4 (Sr. Eng):** Owns many team goals/projects, ships on time with high quality. Makes independent technical decisions. Partners comfortably with peers in different functions. Owns small or functionally specific projects.
- **L5 (Staff Eng):** Executes large projects to very high standard. Partners with peers and strategizes with leaders across multiple functions. Leads small project teams with technical direction.
- **L6 (Sr. Staff Eng):** Identifies and executes significant cross-domain opportunities. Partners with senior leaders across functions and outside the company. Leads large, high-priority, cross-functional, strategic projects.
- **L7 (Principal Eng):** Translates product vision into functional direction for team leaders. Responsible for technical leadership of a few large critical systems. Designs and builds large-scale systems with durable solutions.
- **L8:** No boundaries within Flex or outside the company for technical strategy. Primary technical stakeholder with external parties. Force multiplier for the organization.

### Talent Acquisition
- **L3:** Owns mid-level headcount from launch to close with guidance. Collaborates with HMs on hiring needs. Manages full hiring lifecycle. Understands basic Talent & People strategy.
- **L4:** Owns mid-to-higher level headcount with some guidance. Manages stakeholder relationships with sound judgment to escalate. Leads top-of-funnel screens without scripts. Identifies hiring trends and market behaviors. Understands compensation package components including equity.
- **L5:** Creates hiring strategies with little guidance. Works cross-functionally with POPs & TD&P. In-depth understanding of compensation levers. Advises on market trends. Calibrates talent identification with profile/archetype recommendations incorporating performance data.
- **L6:** Works cross-functionally with leaders and peers. Leads full-cycle recruitment for Director+ roles. Serves as strategic partner and trusted advisor to leaders and C-suite. Advises on talent profiles and designs targeted sourcing strategy.
- **L7:** Manages, coaches and develops multiple mid-senior ICs and Managers. Sets team performance standards and measures against KPIs. Leads design and implementation of company-wide Talent frameworks. Owns Employer Branding strategy.
- **L8:** Partners with C-Suite to forecast staffing needs. Creates comprehensive long-term talent acquisition strategy against annual headcount plan. Evaluates and optimizes end-to-end recruitment lifecycle.

---

## FLEX INTERVIEW PROCESS (use exactly — do not invent stages)

**Standard process for all roles:**
1. **Preliminary Screen** (TAP-led, ~30 min): Assess background, motivation, logistics — compensation expectations, location, work authorization. Logged in Greenhouse.
2. **Hiring Manager Interview**: Assesses role-specific skills and team fit.
3. **Team Interviews** (typically 3–4 with key stakeholders): Evaluate skills, experience, and Flex Attributes.
4. **Case Study** (REQUIRED for L7+ roles only): Practical exercise involving the HM and additional panelists as determined by the hiring team.
5. **References & Backchannels** (senior roles, typically L7+): Validate experience and working style.

**Additional notes:**
- Any candidate interviewing for L7+ must sign an NDA after a successful HM interview.
- We generally target between minimum and midpoint of compensation bands.
- Offers 5%+ over midpoint require Phil (People Ops) and Dan (Finance) approval.
- Offers above range require a business case and explicit Chris approval.

---

## LEVELING FRAMEWORK — KEY SIGNALS

When assessing level, reason across these five dimensions:

**Scope:** How broad is the domain? Feature → Product → Domain → Vertical → Company
**Impact:** How high does the work reach? Feature metrics → Product trajectory → Business goals → Company strategy
**Autonomy:** How much direction is needed? Guided → Some guidance → Minimal guidance → None → Sets direction
**People:** IC only → Mentors → Player/coach → Manages → Manages managers
**Ambiguity:** Structured tasks → Feature ambiguity → Domain ambiguity → Strategic ambiguity → Defines the problem space

---

## YOUR MANDATE

- Be specific and candid. Surface real tensions even if uncomfortable.
- Use Flex's actual attribute language — not watered-down versions.
- Ground every level recommendation in the ladder signals above.
- Interview plans must follow Flex's actual process — never invent stages.
- The TAP brief should read like advice from a senior colleague, not a template.
- Flag when a HM's ask is inconsistent with Flex's philosophy (e.g., over-weighting experience vs. intrinsics).

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
HM LEVEL RATIONALE: ${hmAnswers.hm_level_rationale ?? "Not provided"}

FULL HM INTAKE RESPONSES:
${JSON.stringify(hmAnswers, null, 2)}

Reason carefully against Flex's career ladder for ${jobFamily} (${track} track). 
Use the exact attribute language from the framework. 
Surface real tensions — especially if the HM's level request doesn't match the scope, impact, or autonomy signals in their answers.

Produce a complete AIAnalysisResult JSON:

{
  "level_analysis": {
    "recommended_level": <number 4-9>,
    "hm_requested_level": <number from their pick>,
    "level_match": <boolean — true only if within 1 level>,
    "tension_flag": <boolean — true if >1 level gap or signals are contradictory>,
    "reasoning": "<2-3 sentences grounded in specific scope/impact/autonomy signals from their answers — cite what they said>",
    "scope_assessment": "<1-2 sentences: What is the actual scope of this role based on their answers? Map to ladder language.>",
    "impact_assessment": "<1-2 sentences: What level of business impact is expected? Be specific.>",
    "people_assessment": "<1-2 sentences: Is this IC, player/coach, or people leader? What did they say that signals this?>",
    "autonomy_assessment": "<1-2 sentences: How much direction will this person need? What signals this?>",
    "ambiguity_assessment": "<1-2 sentences: Is this role in a defined space or are they defining it? What signals this?>",
    "attribute_fit": {
      "Doer": "<Specific signal from intake. What evidence of pace/output requirements did the HM describe? What does 'gets shit done' look like in this role?>",
      "Owner": "<What accountability signals exist? Will this person own outcomes or just tasks?>",
      "Collaborative": "<What cross-functional or stakeholder complexity exists? What does collaboration look like here?>",
      "Precise": "<What communication or structured thinking demands exist in this role?>",
      "Resilient": "<What adversity, pressure, or change will this person face? What makes this role hard?>",
      "Humble": "<What learning curve or domain newness exists? What signals that ego would be a problem here?>"
    }
  },
  "tensions": [
    {
      "id": "<snake_case_id>",
      "title": "<short, direct tension title>",
      "description": "<2-3 sentences. Be specific about what's inconsistent or risky. Name the tension directly — don't soften it.>",
      "severity": "high|medium|low",
      "probing_question": "<The exact question a TAP should ask the HM to resolve this. Make it direct and non-leading.>",
      "source": "hm_intake"
    }
  ],
  "tap_brief": {
    "summary": "<3-4 sentence executive summary. Candid and specific — what is this role really, what's the real challenge in hiring for it, and what should the TAP know going into the kickoff call?>",
    "priority_questions": ["<Up to 5 questions the TAP must ask the HM before this search launches. These should be the questions a senior TAP would ask, not obvious ones.>"],
    "watch_items": ["<Up to 4 watch items — risks, red flags, or things to monitor. Be direct.>"],
    "level_signal": "<One clear, direct sentence on the level situation. If there's a gap between what the HM asked for and what the role signals, say so plainly.>",
    "candidate_profile_notes": "<2-3 sentences on what the ideal candidate actually looks like — their background, their energy, what Flex attribute they'll spike on, what tradeoff the TAP should be prepared to make.>"
  },
  "jd_draft": {
    "job_title": "<Title using Flex level label — e.g. 'Senior Product Manager', 'Staff Engineer', 'L6 Talent Partner'>",
    "level_label": "<e.g. Senior, Staff, Lead, Principal>",
    "about_the_role": "<3-4 sentence paragraph. Sound like Flex — direct, confident, specific about what this person will own. Avoid corporate filler.>",
    "what_you_will_do": ["<Up to 8 responsibilities. Active voice, specific, no filler. Each should feel like something only this exact level would do.>"],
    "what_we_are_looking_for": ["<Up to 8 requirements. Prioritize intrinsics (intellect, attributes) alongside role-specific needs. Don't lead with years of experience.>"],
    "nice_to_have": ["<Up to 4. True nice-to-haves, not hidden requirements.>"],
    "location_statement": "<Based on location field. Be specific about Flex's tiered location policy if relevant.>"
  },
  "interview_plan": {
    "stages": [
      {
        "stage_name": "<Must follow Flex's actual process: Preliminary Screen, Hiring Manager Interview, Team Interview, Case Study (L7+ only), References (L7+ only)>",
        "stage_type": "screen|hm_interview|team_interview|case_study|references",
        "duration_minutes": <number>,
        "interviewer_type": "<e.g. TAP, Hiring Manager, XFN Stakeholder, Peer>",
        "focus_areas": ["<2-3 specific focus areas for this stage — grounded in what matters for this role>"],
        "sample_questions": ["<2-3 questions. For attribute stages, use behavioral (tell me about a time...). For skills, use situational.>"],
        "attributes_assessed": ["<Which Flex attributes does this stage assess? Use exact attribute names.>"]
      }
    ],
    "overall_notes": "<2-3 sentences on what's most important to assess in this search and why. Be specific to this role, not generic.>",
    "attribute_mapping": {
      "Doer": ["<Which stage(s) assess this attribute and how>"],
      "Owner": ["<Which stage(s) assess this attribute and how>"],
      "Collaborative": ["<Which stage(s) assess this attribute and how>"],
      "Precise": ["<Which stage(s) assess this attribute and how>"],
      "Resilient": ["<Which stage(s) assess this attribute and how>"],
      "Humble": ["<Which stage(s) assess this attribute and how>"]
    }
  },
  "sourcing_strategy": {
    "headline": "<1 sentence sourcing thesis — what's the profile we're hunting and why is it specific?>",
    "target_companies": ["<Up to 8 specific companies — think about where this profile actually lives, not just the obvious ones>"],
    "target_titles": ["<Up to 6 titles — include adjacent titles that often produce strong candidates for this role>"],
    "search_strings": ["<2 LinkedIn boolean strings — realistic and specific to this role>"],
    "channels": [
      {
        "channel": "<e.g. LinkedIn Recruiter, Greenhouse sourcing, referrals, niche communities>",
        "rationale": "<Why this channel for this specific role>",
        "priority": "primary|secondary"
      }
    ],
    "diversity_considerations": "<1-2 sentences on specific, actionable diversity sourcing moves for this role — not generic statements>",
    "outreach_angle": "<The specific hook a TAP should lead with in outreach. What will make a passive candidate stop and read? Be specific to this role.>"
  }
}

Be specific. Be candid. A TAP reading this should feel armed, not just informed.`;

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
HM LEVEL RATIONALE: ${hmAnswers.hm_level_rationale ?? "Not provided"}
AI LEVEL RECOMMENDATION: ${existingAnalysis?.level_analysis ? `L${existingAnalysis.level_analysis.recommended_level}` : "To be determined — no prior analysis"}
LEVEL MATCH: ${existingAnalysis?.level_analysis ? (existingAnalysis.level_analysis.level_match ? "Yes" : "No — tension exists") : "Unknown"}

EXISTING TENSIONS FROM HM INTAKE:
${existingAnalysis?.tensions?.length ? existingAnalysis.tensions.map(t => `- [${t.severity.toUpperCase()}] ${t.title}: ${t.description}`).join("\n") : "None yet — this is the first analysis pass."}

STAKEHOLDER RESPONSES:
${responses.map((r, i) => `
Stakeholder ${i + 1} (${r.role_type}):
${JSON.stringify(r.answers, null, 2)}
`).join("\n---\n")}

Your job:
1. Identify where stakeholders diverge from each other or from the HM — especially on level, success definition, and scope.
2. Escalate tensions that compound existing ones from the HM intake.
3. Generate probing questions that will help the TAP drive alignment BEFORE the search launches.
4. Write a Slack summary that is professional and constructive — surfaces key themes without embarrassing anyone.
5. Write a TAP private brief that is completely candid — include everything, especially ic_concern signals.

CRITICAL: Never include ic_concern content in the slack_summary. The ic_concern field is TAP-eyes-only.

{
  "level_spread": [
    {
      "respondent": "<name or role label>",
      "role_type": "<hiring_manager|cross_functional_partner|key_stakeholder|department_lead|dri>",
      "level_pick": <number>,
      "rationale_summary": "<1 sentence capturing their reasoning>"
    }
  ],
  "level_consensus": <agreed level as number, or null if divergent>,
  "level_divergence_flag": <boolean — true if any stakeholder is >1 level from another>,
  "tensions": [
    {
      "id": "<snake_case_id>",
      "title": "<tension title>",
      "description": "<2-3 sentences. Be specific about who diverges and how. Name it directly.>",
      "severity": "high|medium|low",
      "probing_question": "<Exact question the TAP should ask to resolve this>",
      "source": "stakeholder_synthesis",
      "respondents_involved": ["<role types involved>"]
    }
  ],
  "probing_questions": ["<Up to 6 questions — the hardest, most important ones a senior TAP would ask>"],
  "slack_summary": "<3-4 sentences. Professional, constructive, safe for the channel. NO ic_concern content.>",
  "tap_private_brief": "<4-6 sentences. TAP eyes only. Completely candid. Include anything that could derail this search.>",
  "notion_summary": "<Clean structured summary for Notion audit trail. Include level spread, tensions, next steps.>",
  "jd_draft": {
    "job_title": "${hmAnswers.role_title ?? "Role Title"}",
    "level_label": "<e.g. L5 — Senior Talent Partner>",
    "about_the_role": "<2-3 paragraphs. Written for an external candidate. Compelling, specific, rooted in the actual scope described by HM and stakeholders.>",
    "what_you_will_do": ["<6-8 specific responsibilities. Not generic. Pulled directly from HM and stakeholder answers.>"],
    "what_we_are_looking_for": ["<6-8 requirements. Mix of Flex attributes and role-specific skills. Do NOT include parenthetical citations like '(Owner attribute)' or '(L5 signal)' — weave the language in naturally instead.>"],
    "nice_to_have": ["<3-4 items>"],
    "location_statement": "<location from HM answers>"
  },
  "interview_plan": {
    "stages": [
      {
        "stage_name": "<e.g. Intro Call, HM Interview, Case Study>",
        "stage_type": "<intro_call|technical|case|values|executive|offer>",
        "duration_minutes": <number>,
        "interviewer_type": "<who runs this stage>",
        "focus_areas": ["<2-4 focus areas>"],
        "sample_questions": ["<2-3 specific questions for this stage>"],
        "attributes_assessed": ["<Flex attributes — Doer, Owner, Collaborative, Precise, Resilient, Humble>"]
      }
    ],
    "overall_notes": "<Key considerations for this search's interview process based on tensions and role complexity.>",
    "attribute_mapping": {
      "<attribute>": ["<which stages assess it>"]
    }
  },
  "sourcing_strategy": {
    "headline": "<1 sentence sourcing thesis — what kind of person are we really looking for and where do they live?>",
    "target_companies": ["<8-12 specific companies>"],
    "target_titles": ["<6-8 titles to search>"],
    "search_strings": ["<3-4 LinkedIn boolean search strings>"],
    "channels": [
      {
        "channel": "<channel name>",
        "rationale": "<why this channel for this role>",
        "priority": "primary|secondary"
      }
    ],
    "outreach_angle": "<What makes this role worth leaving a stable job for? Write the hook a sourcer should lead with.>"
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");

  try {
    return JSON.parse(content.text) as SynthesisResult;
  } catch {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as SynthesisResult;
      } catch (e) {
        console.error("JSON parse failed. Raw response:", content.text.slice(0, 500));
        throw new Error("Could not parse synthesis response as JSON");
      }
    }
    console.error("No JSON found in response. Raw:", content.text.slice(0, 500));
    throw new Error("Could not parse synthesis response as JSON");
  }
}
"use client";
import { useState } from "react";

// ── Flex Attributes ──────────────────────────────────────────────────────────
const FLEX_ATTRIBUTES = {
  Doer: {
    definition: "Bias toward action. Ships things. Doesn't wait for perfect.",
    levels: {
      "L4-5": "Executes assigned work reliably and proactively flags blockers.",
      "L6-8": "Drives projects end-to-end with minimal oversight.",
      "L9+": "Creates momentum across the org; removes systemic blockers.",
    },
  },
  Owner: {
    definition: "Takes full accountability. Doesn't pass the buck.",
    levels: {
      "L4-5": "Owns their work and follows through on commitments.",
      "L6-8": "Owns outcomes, not just outputs. Proactively closes loops.",
      "L9+": "Owns org-level outcomes; holds others accountable too.",
    },
  },
  Humble: {
    definition: "Low ego. Seeks feedback. Gives credit generously.",
    levels: {
      "L4-5": "Open to feedback; doesn't need to be the smartest in the room.",
      "L6-8": "Actively solicits diverse perspectives; shares credit.",
      "L9+": "Models humility at scale; builds cultures of psychological safety.",
    },
  },
  Precise: {
    definition: "Communicates with clarity and specificity. No fluff.",
    levels: {
      "L4-5": "Writes and speaks clearly; asks good clarifying questions.",
      "L6-8": "Distills complexity into crisp, actionable communication.",
      "L9+": "Sets the communication standard for the org.",
    },
  },
  Resilient: {
    definition: "Handles ambiguity and setbacks without losing momentum.",
    levels: {
      "L4-5": "Stays productive under pressure; bounces back from feedback.",
      "L6-8": "Navigates ambiguity and pivots quickly without losing team.",
      "L9+": "Leads with calm in chaos; builds resilient teams and systems.",
    },
  },
};

const ATTRIBUTE_QUESTIONS: Record<string, { q: string; signal: string }[]> = {
  Doer: [
    { q: "Tell me about a time you shipped something despite significant obstacles.", signal: "Look for specificity — real obstacles, real decisions, real ship date." },
    { q: "What's the most recent thing you built or launched? Walk me through how it happened.", signal: "Listen for ownership of the timeline, not just the work." },
  ],
  Owner: [
    { q: "Tell me about a time something went wrong on your watch. What did you do?", signal: "Red flag: blames others or circumstances. Green flag: names their role clearly." },
    { q: "Describe a time you took on something outside your job description because it needed to get done.", signal: "Listen for intrinsic motivation vs. optics." },
  ],
  Humble: [
    { q: "What's a piece of feedback you've received that genuinely changed how you work?", signal: "Vague answers suggest low self-awareness. Specific answers suggest growth orientation." },
    { q: "Tell me about a time you were wrong about something important. How did you handle it?", signal: "Can they say 'I was wrong' cleanly, without hedging?" },
  ],
  Precise: [
    { q: "Walk me through how you'd communicate a complex tradeoff to a non-technical executive.", signal: "Listen for structure, brevity, and audience awareness." },
    { q: "Tell me about a time a miscommunication caused a real problem. What happened and what did you change?", signal: "Look for ownership of the communication failure, not just the fix." },
  ],
  Resilient: [
    { q: "Tell me about a time a project or strategy you believed in got killed. How did you respond?", signal: "Look for healthy processing, not bitterness or performance of resilience." },
    { q: "Describe a period of high ambiguity at work. How did you keep yourself and your team moving?", signal: "Listen for concrete tactics, not platitudes about 'embracing change.'" },
  ],
};

// ── Types ────────────────────────────────────────────────────────────────────
interface IntakeData {
  roleTitle: string;
  orgArea: string;
  jobFamily: string;
  targetLevel: string;
  hiringManager: string;
  talentPartner: string;
  directReports: string;
  roleType: string;
  coreProblem: string;
  successMetrics: string;
  mustHaves: string;
  niceToHaves: string;
  dealBreakers: string;
  hmColor: string;
}

interface AnalysisResult {
  recommended_level: string;
  level_rationale: string;
  tp_brief: string;
  jd_summary: string;
  key_tensions: string[];
  priority_questions: string[];
  sourcing: {
    market_context: string;
    competitiveness: string;
    target_companies: { name: string; why: string }[];
    avoid_companies: { name: string; why: string }[];
    search_titles: string[];
    conferences: { name: string; type: string }[];
    sourcing_angles: string[];
    green_flags: string[];
    red_flags: string[];
    hm_instinct_translation: string;
  };
}

// ── Interview Plan Builder ───────────────────────────────────────────────────
function buildStages(level: string, hasDirectReports: boolean) {
  const lvl = parseInt(level.replace("L", "")) || 6;
  return [
    {
      id: "ta-screen",
      title: "TA Screen",
      owner: "Talent Partner",
      duration: "30 min",
      format: "Phone / Video",
      focus: "Role fit, leveling calibration, logistics",
      attributes: ["Doer", "Humble"],
      questions: [
        { q: "What drew you to this role specifically — what problem are you hoping to work on?", signal: "Listen for genuine pull vs. generic interest." },
        { q: "Walk me through your most recent end-to-end product experience.", signal: "Scope and ownership signal level." },
        ...ATTRIBUTE_QUESTIONS["Doer"],
        ...ATTRIBUTE_QUESTIONS["Humble"],
      ],
    },
    {
      id: "hm-screen",
      title: "HM Screen",
      owner: "Hiring Manager",
      duration: "45 min",
      format: "Video",
      focus: lvl >= 7 ? "Strategic depth, org impact, leadership" : "Discovery to launch, cross-functional collaboration",
      attributes: ["Owner", "Precise"],
      questions: [
        lvl >= 7
          ? { q: "Tell me about a product strategy you set that required you to convince skeptics at the leadership level.", signal: "Look for structured persuasion and durability of the strategy." }
          : { q: "Walk me through a product you took from discovery to launch. What was hardest?", signal: "Listen for decision-making clarity at each stage." },
        { q: "What's the most important thing you'd want to learn in the first 30 days here?", signal: "Signals intellectual curiosity and preparation." },
        ...ATTRIBUTE_QUESTIONS["Owner"],
        ...ATTRIBUTE_QUESTIONS["Precise"],
      ],
    },
    {
      id: "team-interviews",
      title: "Team Interviews",
      owner: "Cross-functional partners",
      duration: "3 × 45 min",
      format: "1:1 video calls",
      focus: "Collaboration, craft, leadership",
      attributes: ["Resilient", "Doer", "Owner"],
      sessions: [
        {
          title: "Engineering Partner",
          focus: "Technical credibility, build vs. buy judgment, eng partnership",
          questions: [
            { q: "How do you decide when to build vs. buy vs. partner?", signal: "Look for framework thinking + pragmatism." },
            { q: "Tell me about a time you had to push back on an engineering constraint. How did you handle it?", signal: "Listen for respect + directness, not conflict avoidance." },
            ...ATTRIBUTE_QUESTIONS["Resilient"],
          ],
        },
        {
          title: "Design Partner",
          focus: "Design thinking, user empathy, creative collaboration",
          questions: [
            { q: "How do you balance user needs against business constraints when they're in tension?", signal: "Look for nuanced tradeoff thinking, not platitudes." },
            { q: "Tell me about a time a user insight completely changed your product direction.", signal: "Signals genuine discovery orientation." },
            ...ATTRIBUTE_QUESTIONS["Doer"],
          ],
        },
        lvl === 6
          ? {
              title: "Live Case Exercise",
              badge: "L6",
              focus: "Structured problem solving, product instinct, communication under pressure",
              questions: [
                { q: "You'll be given a product scenario and 10 minutes to prep, then 30 minutes to walk us through your thinking.", signal: "Assess: structure, prioritization, user empathy, and how they handle pushback." },
                { q: "Follow-up: What would you want to learn before making this call for real?", signal: "Shows intellectual honesty and scope of thinking." },
              ],
            }
          : {
              title: hasDirectReports || lvl >= 7 ? "Senior Leader (People & Strategy)" : "Senior Leader",
              focus: hasDirectReports || lvl >= 7 ? "Leadership philosophy, team building, org navigation" : "Strategic alignment, cross-org influence",
              questions: [
                hasDirectReports || lvl >= 7
                  ? { q: "How do you think about building a team vs. inheriting one? What's different?", signal: "Listen for intentionality around culture-setting." }
                  : { q: "Tell me about a time you influenced a major decision without direct authority.", signal: "Signals strategic influence skills." },
                ...ATTRIBUTE_QUESTIONS["Owner"],
              ],
            },
      ],
    },
    ...(lvl >= 7
      ? [
          {
            id: "written-case",
            title: "Written Case Exercise",
            badge: "L7+",
            owner: "Talent Partner + HM",
            duration: "Take-home (48–72 hrs) + 45 min debrief",
            format: "Async written + live debrief",
            focus: "Strategic thinking, written communication, structured reasoning",
            attributes: ["Precise", "Owner"],
            questions: [
              { q: "You'll receive a prompt 48–72 hours before your debrief. Write a strategic recommendation (max 4 pages).", signal: "Assess: clarity of thesis, quality of supporting logic, and comfort with ambiguity." },
              { q: "Debrief: Walk us through the decision you're least confident in. What would change your view?", signal: "Signals intellectual honesty and range of thinking." },
              { q: "Debrief: What did you learn about the problem while writing this that surprised you?", signal: "Shows curiosity and real engagement with the prompt." },
            ],
          },
        ]
      : []),
  ];
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function FlexTalentScoping() {
  const [step, setStep] = useState<"intro" | "intake" | "loading" | "results">("intro");
  const [activeTab, setActiveTab] = useState("brief");
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<number | null>(0);
  const [intake, setIntake] = useState<IntakeData>({
    roleTitle: "", orgArea: "", jobFamily: "", targetLevel: "",
    hiringManager: "", talentPartner: "", directReports: "No",
    roleType: "", coreProblem: "", successMetrics: "",
    mustHaves: "", niceToHaves: "", dealBreakers: "", hmColor: "",
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const update = (k: keyof IntakeData, v: string) => setIntake(p => ({ ...p, [k]: v }));

  const systemPrompt = `You are an expert talent strategist at Flex, a Series D fintech company (500-600 people) that builds financial tools for renters and property managers. You help Talent Partners run rigorous, efficient hiring processes.

Flex's five attributes are: Doer, Owner, Humble, Precise, Resilient.

Return ONLY valid JSON matching this exact schema:
{
  "recommended_level": "L6",
  "level_rationale": "string",
  "tp_brief": "string (markdown, 300-400 words)",
  "jd_summary": "string (markdown, 150-200 words)",
  "key_tensions": ["string", "string", "string"],
  "priority_questions": ["string", "string", "string"],
  "sourcing": {
    "market_context": "string",
    "competitiveness": "competitive|moderate|accessible",
    "target_companies": [{"name": "string", "why": "string"}],
    "avoid_companies": [{"name": "string", "why": "string"}],
    "search_titles": ["string"],
    "conferences": [{"name": "string", "type": "string"}],
    "sourcing_angles": ["string"],
    "green_flags": ["string"],
    "red_flags": ["string"],
    "hm_instinct_translation": "string"
  }
}`;

  const userPrompt = `Role: ${intake.roleTitle}
Org Area: ${intake.orgArea} | Job Family: ${intake.jobFamily} | Target Level: ${intake.targetLevel}
Hiring Manager: ${intake.hiringManager} | Talent Partner: ${intake.talentPartner}
Direct Reports: ${intake.directReports} | Role Type: ${intake.roleType}

Core Problem: ${intake.coreProblem}
Success Metrics: ${intake.successMetrics}
Must-Haves: ${intake.mustHaves}
Nice-to-Haves: ${intake.niceToHaves}
Deal Breakers: ${intake.dealBreakers}
HM Color / Instinct: ${intake.hmColor}

Generate the full analysis JSON.`;

  async function runAnalysis() {
    setStep("loading");
    setError("");
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, user: userPrompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const clean = data.text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
      setStep("results");
    } catch (e) {
      setError("Something went wrong. Check your API key and try again.");
      setStep("intake");
    }
  }

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500";
  const label = "block text-xs font-medium text-gray-400 mb-1";
  const stages = result ? buildStages(result.recommended_level, intake.directReports === "Yes") : [];

  // ── INTRO ──
  if (step === "intro") return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-purple-600 rounded-xl px-3 py-2">
            <span className="text-white font-bold text-lg">flex</span>
          </div>
          <span className="text-gray-500 text-sm">/ talent</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Talent Scoping</h1>
        <p className="text-gray-400 mb-8">Turn a hiring conversation into a structured brief, interview plan, and sourcing strategy — in minutes.</p>
        <button onClick={() => setStep("intake")} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
          Start New Role Intake
        </button>
      </div>
    </div>
  );

  // ── LOADING ──
  if (step === "loading") return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Generating brief, interview plan, and sourcing strategy…</p>
      </div>
    </div>
  );

  // ── INTAKE ──
  if (step === "intake") return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-purple-600 rounded-lg px-2 py-1"><span className="text-white font-bold text-sm">flex</span></div>
          <span className="text-gray-500 text-xs">/ talent scoping</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-6">Role Intake</h2>

        {error && <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 mb-6 text-sm">{error}</div>}

        <div className="space-y-6">
          {/* Role basics */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Role Basics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={label}>Role Title</label><input className={inp} value={intake.roleTitle} onChange={e => update("roleTitle", e.target.value)} placeholder="e.g. Senior Product Manager, Consumer" /></div>
              <div><label className={label}>Org Area</label>
                <select className={inp} value={intake.orgArea} onChange={e => update("orgArea", e.target.value)}>
                  <option value="">Select…</option>
                  {["Consumer","Platform","Partner","Growth","Infrastructure","GTM"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={label}>Job Family</label>
                <select className={inp} value={intake.jobFamily} onChange={e => update("jobFamily", e.target.value)}>
                  <option value="">Select…</option>
                  {["Core Product","Software Engineering","Design","Data Science","Analytics","Sales","Marketing","Operations","Finance","Legal"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={label}>Target Level</label>
                <select className={inp} value={intake.targetLevel} onChange={e => update("targetLevel", e.target.value)}>
                  <option value="">Select…</option>
                  {["L4","L5","L6","L7","L8","L9"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={label}>Direct Reports?</label>
                <select className={inp} value={intake.directReports} onChange={e => update("directReports", e.target.value)}>
                  <option>No</option><option>Yes</option>
                </select>
              </div>
              <div><label className={label}>Hiring Manager</label><input className={inp} value={intake.hiringManager} onChange={e => update("hiringManager", e.target.value)} placeholder="Full name" /></div>
              <div><label className={label}>Talent Partner</label><input className={inp} value={intake.talentPartner} onChange={e => update("talentPartner", e.target.value)} placeholder="Full name" /></div>
              <div className="col-span-2"><label className={label}>Role Type</label>
                <select className={inp} value={intake.roleType} onChange={e => update("roleType", e.target.value)}>
                  <option value="">Select…</option>
                  {["Net new headcount","Backfill","Replacement","Upgrade"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Role context */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Role Context</h3>
            <div><label className={label}>Core Problem This Role Solves</label><textarea className={inp} rows={3} value={intake.coreProblem} onChange={e => update("coreProblem", e.target.value)} placeholder="What gap does this person fill? What would break without them?" /></div>
            <div><label className={label}>What Does Success Look Like at 6 Months?</label><textarea className={inp} rows={3} value={intake.successMetrics} onChange={e => update("successMetrics", e.target.value)} placeholder="Specific outcomes, not job duties." /></div>
          </div>

          {/* Requirements */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Requirements</h3>
            <div><label className={label}>Must-Haves</label><textarea className={inp} rows={3} value={intake.mustHaves} onChange={e => update("mustHaves", e.target.value)} placeholder="Non-negotiable skills, experience, or traits." /></div>
            <div><label className={label}>Nice-to-Haves</label><textarea className={inp} rows={2} value={intake.niceToHaves} onChange={e => update("niceToHaves", e.target.value)} placeholder="Additive but not required." /></div>
            <div><label className={label}>Deal Breakers</label><textarea className={inp} rows={2} value={intake.dealBreakers} onChange={e => update("dealBreakers", e.target.value)} placeholder="What would immediately disqualify a candidate?" /></div>
          </div>

          {/* HM Color */}
          <div className="bg-gray-900 rounded-xl p-5 border border-purple-800">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-1">HM Color</h3>
            <p className="text-purple-300 text-xs mb-3">The stuff that's hard to put in a rubric but you'll know it when you see it. E.g. "I want someone dripping with consumer edge and creativity — not enterprise polish."</p>
            <textarea className={inp} rows={3} value={intake.hmColor} onChange={e => update("hmColor", e.target.value)} placeholder="Share your instinct about who this person is, not just what they've done." />
          </div>

          <button
            onClick={runAnalysis}
            disabled={!intake.roleTitle || !intake.orgArea || !intake.coreProblem}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Generate Brief & Interview Plan
          </button>
        </div>
      </div>
    </div>
  );

  // ── RESULTS ──
  if (!result) return null;
  const lvlNum = parseInt(result.recommended_level.replace("L", "")) || 6;
  const attrTier = lvlNum <= 5 ? "L4-5" : lvlNum <= 8 ? "L6-8" : "L9+";

  const tabs = [
    { id: "brief", label: "TP Brief" },
    { id: "interview", label: "Interview Plan" },
    { id: "sourcing", label: "Sourcing" },
    { id: "jd", label: "JD Draft" },
  ];

  const compBadge = result.sourcing.competitiveness === "competitive"
    ? "bg-red-900/40 text-red-300 border-red-700"
    : result.sourcing.competitiveness === "moderate"
    ? "bg-yellow-900/40 text-yellow-300 border-yellow-700"
    : "bg-green-900/40 text-green-300 border-green-700";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 rounded-md px-2 py-1"><span className="text-white font-bold text-xs">flex</span></div>
          <span className="text-gray-400 text-sm">Talent Scoping</span>
          <span className="text-gray-600 mx-1">·</span>
          <span className="text-white text-sm font-medium">{intake.roleTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-purple-900/50 text-purple-300 border border-purple-700 text-xs px-2 py-1 rounded-full">{result.recommended_level}</span>
          <button onClick={() => setStep("intake")} className="text-gray-400 hover:text-white text-xs transition-colors">← Edit Intake</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === t.id ? "border-purple-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">

        {/* ── TP BRIEF TAB ── */}
        {activeTab === "brief" && (
          <div className="space-y-6">
            {/* Level rec */}
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">AI Level Recommendation</h3>
                <span className="bg-purple-900/50 border border-purple-700 text-purple-300 text-sm px-3 py-1 rounded-full font-bold">{result.recommended_level}</span>
              </div>
              <p className="text-gray-300 text-sm">{result.level_rationale}</p>
            </div>

            {/* HM Color */}
            {intake.hmColor && (
              <div className="bg-purple-950/40 border border-purple-800 rounded-xl p-5">
                <h3 className="text-purple-300 font-semibold text-sm mb-2">HM Color</h3>
                <p className="text-gray-300 text-sm italic mb-3">"{intake.hmColor}"</p>
                <p className="text-gray-400 text-sm"><span className="text-purple-300 font-medium">What this means for the search: </span>{result.sourcing.hm_instinct_translation}</p>
              </div>
            )}

            {/* Key tensions */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Key Tensions to Resolve</h3>
              <div className="space-y-2">
                {result.key_tensions.map((t, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    <span className="text-gray-300">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority questions */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Priority Intake Questions</h3>
              <div className="space-y-2">
                {result.priority_questions.map((q, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-purple-400 font-bold">{i + 1}.</span>
                    <span className="text-gray-300">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full brief */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Full TP Brief</h3>
              <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{result.tp_brief}</div>
            </div>
          </div>
        )}

        {/* ── INTERVIEW PLAN TAB ── */}
        {activeTab === "interview" && (
          <div className="space-y-4">
            {/* Attribute reference */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Flex Attributes — {attrTier} Calibration</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(FLEX_ATTRIBUTES).map(([name, data]) => (
                  <div key={name}>
                    <button onClick={() => setExpandedAttr(expandedAttr === name ? null : name)}
                      className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="bg-purple-900/50 border border-purple-700 text-purple-300 text-xs px-2 py-0.5 rounded-full">{name}</span>
                        <span className="text-gray-400 text-sm">{data.definition}</span>
                      </div>
                      <span className="text-gray-600 text-xs">{expandedAttr === name ? "▲" : "▼"}</span>
                    </button>
                    {expandedAttr === name && (
                      <div className="mx-3 mb-2 p-3 bg-gray-800 rounded-lg text-sm text-purple-200">
                        {data.levels[attrTier as keyof typeof data.levels]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stages */}
            {stages.map((stage, si) => (
              <div key={stage.id} className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded font-mono">Stage {si + 1}</span>
                      <h3 className="text-white font-semibold">{stage.title}</h3>
                      {"badge" in stage && <span className="bg-purple-900/50 border border-purple-700 text-purple-300 text-xs px-2 py-0.5 rounded-full">{stage.badge as string}</span>}
                    </div>
                    <span className="text-gray-500 text-xs">{stage.duration}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mb-3">
                    <span>👤 {stage.owner}</span>
                    <span>📋 {stage.format}</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{stage.focus}</p>
                  <div className="flex gap-1 flex-wrap">
                    {stage.attributes.map(a => (
                      <span key={a} className="bg-purple-900/30 border border-purple-800 text-purple-300 text-xs px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>

                {/* Sessions (team interviews) */}
                {"sessions" in stage && stage.sessions && (
                  <div className="border-t border-gray-800">
                    {(stage.sessions as any[]).map((session, idx) => (
                      <div key={idx} className="border-b border-gray-800 last:border-0">
                        <button onClick={() => setExpandedSession(expandedSession === idx ? null : idx)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{session.title}</span>
                            {session.badge && <span className="bg-blue-900/50 border border-blue-700 text-blue-300 text-xs px-2 py-0.5 rounded-full">{session.badge}</span>}
                          </div>
                          <span className="text-gray-600 text-xs">{expandedSession === idx ? "▲" : "▼"}</span>
                        </button>
                        {expandedSession === idx && (
                          <div className="px-5 pb-4 space-y-3">
                            <p className="text-gray-400 text-xs">{session.focus}</p>
                            {session.questions.map((q: any, qi: number) => (
                              <div key={qi} className="bg-gray-800 rounded-lg p-3">
                                <p className="text-white text-sm mb-1">{q.q}</p>
                                <p className="text-gray-400 text-xs italic">Signal: {q.signal}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Questions (non-session stages) */}
                {"questions" in stage && stage.questions && !("sessions" in stage) && (
                  <div className="border-t border-gray-800 px-5 py-4 space-y-3">
                    {(stage.questions as any[]).map((q, qi) => (
                      <div key={qi} className="bg-gray-800 rounded-lg p-3">
                        <p className="text-white text-sm mb-1">{q.q}</p>
                        <p className="text-gray-400 text-xs italic">Signal: {q.signal}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SOURCING TAB ── */}
        {activeTab === "sourcing" && (
          <div className="space-y-5">
            <div className="bg-gray-900 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Market Context</h3>
                <span className={`text-xs border px-2 py-1 rounded-full capitalize ${compBadge}`}>{result.sourcing.competitiveness}</span>
              </div>
              <p className="text-gray-300 text-sm">{result.sourcing.market_context}</p>
            </div>

            {intake.hmColor && (
              <div className="bg-purple-950/40 border border-purple-800 rounded-xl p-5">
                <h3 className="text-purple-300 font-semibold text-sm mb-2">Reading the HM's Instinct</h3>
                <p className="text-gray-300 text-sm">{result.sourcing.hm_instinct_translation}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">Target Companies</h3>
                <div className="space-y-3">
                  {result.sourcing.target_companies.map((c, i) => (
                    <div key={i}>
                      <p className="text-purple-300 text-sm font-medium">{c.name}</p>
                      <p className="text-gray-400 text-xs">{c.why}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">Approach with Caution</h3>
                <div className="space-y-3">
                  {result.sourcing.avoid_companies.map((c, i) => (
                    <div key={i}>
                      <p className="text-red-300 text-sm font-medium">{c.name}</p>
                      <p className="text-gray-400 text-xs">{c.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Search Titles</h3>
              <div className="flex flex-wrap gap-2">
                {result.sourcing.search_titles.map((t, i) => (
                  <span key={i} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Conferences & Communities</h3>
              <div className="space-y-2">
                {result.sourcing.conferences.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{c.name}</span>
                    <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">{c.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-5">
                <h3 className="text-green-400 font-semibold mb-3 text-sm">Green Flags</h3>
                <ul className="space-y-1">
                  {result.sourcing.green_flags.map((f, i) => (
                    <li key={i} className="text-gray-300 text-xs flex gap-2"><span className="text-green-400">✓</span>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <h3 className="text-red-400 font-semibold mb-3 text-sm">Red Flags</h3>
                <ul className="space-y-1">
                  {result.sourcing.red_flags.map((f, i) => (
                    <li key={i} className="text-gray-300 text-xs flex gap-2"><span className="text-red-400">✗</span>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 text-sm">Sourcing Angles — How to Position Flex</h3>
              <ul className="space-y-2">
                {result.sourcing.sourcing_angles.map((a, i) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-purple-400">→</span>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── JD TAB ── */}
        {activeTab === "jd" && (
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">JD Draft</h3>
            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{result.jd_summary}</div>
          </div>
        )}
      </div>
    </div>
  );
}
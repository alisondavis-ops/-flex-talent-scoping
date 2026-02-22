"use client";
import { useState, useRef, useEffect } from "react";

// ── Career Ladder ────────────────────────────────────────────────────────────
const LADDER: Record<number, Record<string, string>> = {
  4:{scope:"Executes features assigned to them",impact:"Feature-level impact driven by manager-identified work",ic:"Heavy IC — fully hands-on execution",autonomy:"Low — guided by manager",ambiguity:"Low — needs clear direction"},
  5:{scope:"Owns complex new features or improvements",impact:"Feature-level impact — identifies, designs, delivers independently",ic:"Heavy IC — owns full feature lifecycle",autonomy:"Moderate — independent within defined scope",ambiguity:"Moderate — handles feature-level ambiguity"},
  6:{scope:"Owns a domain or product including roadmap and outcomes",impact:"Product-level impact — drives product trajectory, connects to business goals",ic:"Mostly IC with cross-functional leadership",autonomy:"High — sets own agenda within a product",ambiguity:"High — handles product-level ambiguity"},
  7:{scope:"Owns a broader product area of multiple products or top-level business goals",impact:"High business impact — influences Flex-wide product direction",ic:"Player/coach — strategic leadership + IC contribution",autonomy:"Very high — owns strategy and execution",ambiguity:"Very high — takes vague areas, creates structure"},
  8:{scope:"Owns a vertical (Consumer, Platform, or Partner) across strategy, roadmap, and execution",impact:"High business impact across product portfolio",ic:"Primarily strategic leader, IC in critical areas",autonomy:"Full autonomy at vertical level",ambiguity:"Extreme — sets direction in highly ambiguous, high-risk areas"},
  9:{scope:"Owns a vertical with impact on overall company strategy",impact:"Shapes company strategy — product, business, GTM",ic:"Strategic leader with hands-dirty ethos",autonomy:"Complete — shapes the company",ambiguity:"Extreme — defines the problem space itself"},
};

// ── Flex Attributes ──────────────────────────────────────────────────────────
const ATTRIBUTES: Record<string, Record<string, string>> = {
  "L4-5":{Doer:"Delivers with urgency, takes initiative to unblock themselves.",Owner:"Owns deliverables end-to-end. Hungry to take on more.",Humble:"Eager to learn. Open to feedback. Progress over ego.",Precise:"Focuses on clarity, adapts communication to audience.",Resilient:"Stays focused through setbacks. Embraces change."},
  "L6-8":{Doer:"Drives with minimal oversight. Creates systems to scale output.",Owner:"Owns outcomes not just tasks. Drives cross-functional alignment.",Humble:"Leads with curiosity. Balances conviction with openness.",Precise:"Translates complexity into clear plans. Structured thinker.",Resilient:"Grit under pressure. Stabilizes team during uncertainty."},
  "L9+":{Doer:"Gets hands dirty constantly. Welcomes IC as core to the role.",Owner:"Full function ownership. Never defers responsibility.",Humble:"Doesn't lean on hierarchy. Welcomes challenge from anyone.",Precise:"Works from first principles. Develops compressing frameworks.",Resilient:"Withstands extreme pressure. Translates heat into team energy."},
};

const ATTR_QUESTIONS: Record<string, {q:string;signal:string}[]> = {
  Doer:[
    {q:"Tell me about a time you shipped something despite significant obstacles.",signal:"Look for specificity — real obstacles, real decisions, real ship date."},
    {q:"What's the most recent thing you built or launched? Walk me through how it happened.",signal:"Listen for ownership of the timeline, not just the work."},
  ],
  Owner:[
    {q:"Tell me about a time something went wrong on your watch. What did you do?",signal:"Red flag: blames others. Green flag: names their role clearly."},
    {q:"Describe a time you took on something outside your job description because it needed to get done.",signal:"Listen for intrinsic motivation vs. optics."},
  ],
  Humble:[
    {q:"What's a piece of feedback you've received that genuinely changed how you work?",signal:"Vague answers suggest low self-awareness. Specific answers suggest growth orientation."},
    {q:"Tell me about a time you were wrong about something important. How did you handle it?",signal:"Can they say 'I was wrong' cleanly, without hedging?"},
  ],
  Precise:[
    {q:"Walk me through how you'd communicate a complex tradeoff to a non-technical executive.",signal:"Listen for structure, brevity, and audience awareness."},
    {q:"Tell me about a time a miscommunication caused a real problem. What happened and what did you change?",signal:"Look for ownership of the communication failure, not just the fix."},
  ],
  Resilient:[
    {q:"Tell me about a time a project you believed in got killed. How did you respond?",signal:"Look for healthy processing, not bitterness or performance of resilience."},
    {q:"Describe a period of high ambiguity at work. How did you keep yourself and your team moving?",signal:"Listen for concrete tactics, not platitudes about 'embracing change.'"},
  ],
};

// ── Interview Stage Builder ──────────────────────────────────────────────────
function buildStages(level: string, hasReports: boolean) {
  const lvl = parseInt(level.replace("L","")) || 6;
  const attrTier = lvl <= 5 ? "L4-5" : lvl <= 8 ? "L6-8" : "L9+";
  return [
    {
      id:"ta-screen", title:"TA Screen", owner:"Talent Partner", duration:"30 min", format:"Phone / Video",
      focus:"Role fit, leveling calibration, logistics", attributes:["Doer","Humble"],
      questions:[
        {q:"What drew you to this role specifically — what problem are you hoping to work on?",signal:"Listen for genuine pull vs. generic interest."},
        {q:"Walk me through your most recent end-to-end product experience.",signal:"Scope and ownership signal level."},
        ...ATTR_QUESTIONS.Doer, ...ATTR_QUESTIONS.Humble,
      ],
    },
    {
      id:"hm-screen", title:"HM Screen", owner:"Hiring Manager", duration:"45 min", format:"Video",
      focus: lvl >= 7 ? "Strategic depth, org impact, leadership" : "Discovery to launch, cross-functional collaboration",
      attributes:["Owner","Precise"],
      questions:[
        lvl >= 7
          ? {q:"Tell me about a product strategy you set that required you to convince skeptics at the leadership level.",signal:"Look for structured persuasion and durability of the strategy."}
          : {q:"Walk me through a product you took from discovery to launch. What was hardest?",signal:"Listen for decision-making clarity at each stage."},
        {q:"What's the most important thing you'd want to learn in the first 30 days here?",signal:"Signals intellectual curiosity and preparation."},
        ...ATTR_QUESTIONS.Owner, ...ATTR_QUESTIONS.Precise,
      ],
    },
    {
      id:"team-interviews", title:"Team Interviews", owner:"Cross-functional partners",
      duration:"3 × 45 min", format:"1:1 video calls",
      focus:"Collaboration, craft, leadership", attributes:["Resilient","Doer","Owner"],
      sessions:[
        {
          title:"Engineering Partner", focus:"Technical credibility, build vs. buy judgment, eng partnership",
          questions:[
            {q:"How do you decide when to build vs. buy vs. partner?",signal:"Look for framework thinking + pragmatism."},
            {q:"Tell me about a time you had to push back on an engineering constraint. How did you handle it?",signal:"Listen for respect + directness, not conflict avoidance."},
            ...ATTR_QUESTIONS.Resilient,
          ],
        },
        {
          title:"Design Partner", focus:"Design thinking, user empathy, creative collaboration",
          questions:[
            {q:"How do you balance user needs against business constraints when they're in tension?",signal:"Look for nuanced tradeoff thinking, not platitudes."},
            {q:"Tell me about a time a user insight completely changed your product direction.",signal:"Signals genuine discovery orientation."},
            ...ATTR_QUESTIONS.Doer,
          ],
        },
        lvl === 6
          ? {
              title:"Live Case Exercise", badge:"L6",
              focus:"Structured problem solving, product instinct, communication under pressure",
              questions:[
                {q:"You'll be given a product scenario and 10 minutes to prep, then 30 minutes to walk us through your thinking.",signal:"Assess: structure, prioritization, user empathy, and how they handle pushback."},
                {q:"Follow-up: What would you want to learn before making this call for real?",signal:"Shows intellectual honesty and scope of thinking."},
              ],
            }
          : {
              title: hasReports || lvl >= 7 ? "Senior Leader — People & Strategy" : "Senior Leader",
              focus: hasReports || lvl >= 7 ? "Leadership philosophy, team building, org navigation" : "Strategic alignment, cross-org influence",
              questions:[
                hasReports || lvl >= 7
                  ? {q:"How do you think about building a team vs. inheriting one? What's different?",signal:"Listen for intentionality around culture-setting."}
                  : {q:"Tell me about a time you influenced a major decision without direct authority.",signal:"Signals strategic influence skills."},
                ...ATTR_QUESTIONS.Owner,
              ],
            },
      ],
    },
    ...(lvl >= 7 ? [{
      id:"written-case", title:"Written Case Exercise", badge:"L7+",
      owner:"Talent Partner + HM", duration:"Take-home (48–72 hrs) + 45 min debrief",
      format:"Async written + live debrief", attributes:["Precise","Owner"],
      focus:"Strategic thinking, written communication, structured reasoning",
      questions:[
        {q:"You'll receive a prompt 48–72 hours before your debrief. Write a strategic recommendation (max 4 pages).",signal:"Assess: clarity of thesis, quality of supporting logic, comfort with ambiguity."},
        {q:"Debrief: Walk us through the decision you're least confident in. What would change your view?",signal:"Signals intellectual honesty and range of thinking."},
        {q:"Debrief: What did you learn about the problem while writing this that surprised you?",signal:"Shows curiosity and real engagement with the prompt."},
      ],
    }] : []),
  ];
}

// ── Questions ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {id:"org_area",label:"Which part of the product org is this role part of?",probe:"e.g. Consumer, Platform, Partner — and where does this team sit in the broader org?",type:"text"},
  {id:"zero_to_one",label:"Is this a 0-to-1 build?",probe:"Building something net new, or evolving/scaling something that exists?",type:"select",options:["Yes — fully net new","Mostly new, some foundation exists","Scaling/evolving an existing product","Primarily maintenance and optimization"]},
  {id:"vision_vs_execution",label:"Do we know the solution and need someone to build it — or do we need someone to define both the vision AND execution strategy?",probe:"This is one of the biggest leveling signals. Be direct.",type:"select",options:["We know the solution — need strong execution","Rough direction exists — need someone to sharpen and build","We have the problem — need someone to define solution and strategy","We don't fully know the problem or solution — need someone to define both"]},
  {id:"specialization",label:"How niche or specialized is this role?",probe:"Could a talented 'product athlete' ramp in 3–6 months? Or is prior experience with this exact problem set critical?",type:"select",options:["Agile product athlete can ramp — domain is learnable","Some domain familiarity helpful but not required","Prior domain experience strongly preferred","Prior experience with this exact problem set is critical"]},
  {id:"people_management",label:"Does this person need to manage people?",probe:"If yes — how many reports, how senior are they, and how much management experience is truly needed?",type:"text"},
  {id:"ic_vs_manager",label:"Is this role hands-on IC, purely managerial, or a player/coach?",probe:"Almost all roles have some IC work — what does that look like here specifically?",type:"select",options:["Primarily IC — mostly in the weeds","Player/coach — significant IC + managing others","Primarily managerial — IC in critical spots only","Full people leader — IC is rare"]},
  {id:"fintech",label:"How much fintech-specific experience is needed?",probe:"Be honest — does this person need to hit the ground running on regulatory/compliance complexity, or is great product sense enough?",type:"select",options:["Not required — great product sense is enough","Helpful but not a dealbreaker","Preferred — fintech context accelerates ramp","Required — regulatory/compliance/partner complexity demands it"]},
  {id:"success",label:"What does success look like at 6 and 12 months?",probe:"Be specific. What will this person have shipped, influenced, or changed?",type:"text"},
  {id:"failure",label:"What does failure look like?",probe:"What would cause this hire not to work out? This often reveals the real requirements.",type:"text"},
  {id:"backfill",label:"Is this a backfill or a new role?",probe:"If backfill — what did you learn? If new — who owned this scope before?",type:"text"},
  {id:"competitors",label:"Any specific companies, backgrounds, or profiles we should target?",probe:"Think about where your ideal candidate is sitting right now.",type:"text"},
  {id:"location",label:"Where can this role be based?",probe:"Per Flex's hybrid policy, remote is available for Engineering, Data Science, AI/ML, and L4+ field sales only.",type:"select",options:["New York, NY — Tier 1 (HQ)","San Francisco / Bay Area — Tier 1","Salt Lake City, UT — Tier 3","Remote — Engineering / Data Science / AI/ML / L4+ Field Sales","Remote — Exception requested (L7+ only)","Multiple locations"]},
  {id:"hm_color",label:"What's your gut on who this person is — beyond the JD?",probe:"The stuff that's hard to put in a rubric but you'll know it when you see it. E.g. 'I want someone dripping with consumer edge and creativity — not enterprise polish.'",type:"text"},
  {id:"hm_level_pick",label:"What level do you believe this role should be?",probe:"Pick the level you feel most convicted about — we'll compare this to the career ladder recommendation.",type:"select",options:["L4","L5","L6","L7","L8","L9"]},
  {id:"hm_level_rationale",label:"Walk us through your reasoning. Why that level?",probe:"What about scope, impact expectations, or skills needed led you there?",type:"text"},
];

// ── Types ────────────────────────────────────────────────────────────────────
interface Answer { [key: string]: string }
interface AnalysisResult {
  recommended_level: string;
  level_range: [number, number];
  level_rationale: string;
  hm_self_assessment: {
    hm_picked: number;
    alignment: string;
    gap_direction: string;
    gap_analysis: string;
    hm_rationale_quality: string;
    hm_rationale_note: string;
  };
  internal_tensions: { tension: string; severity: string; implication: string }[];
  tp_brief: {
    headline: string;
    priority_questions: { question: string; why: string; targets: string }[];
    watch_outs: string[];
    positive_signals: string[];
  };
  jd_bullets: { about: string; owns: string[]; needs: string[]; success: string[] };
  interview_plan: { competency: string; ladder_tie: string; questions: string[] }[];
  slack_handoff: string;
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

// ── Shared UI ────────────────────────────────────────────────────────────────
const Card = ({children, className=""}: {children: React.ReactNode; className?: string}) =>
  <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${className}`}>{children}</div>;

const SLabel = ({children}: {children: React.ReactNode}) =>
  <div className="text-purple-400 text-xs font-semibold tracking-widest uppercase mb-2">{children}</div>;

const Badge = ({color, children}: {color: string; children: React.ReactNode}) => {
  const c: Record<string,string> = {
    purple:"bg-purple-950 border-purple-700 text-purple-300",
    red:"bg-red-950 border-red-800 text-red-300",
    yellow:"bg-yellow-950 border-yellow-800 text-yellow-300",
    green:"bg-green-950 border-green-800 text-green-300",
    blue:"bg-blue-950 border-blue-800 text-blue-300",
    gray:"bg-gray-800 border-gray-700 text-gray-300",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c[color]||c.gray}`}>{children}</span>;
};

const FlexLogo = ({size="sm"}: {size?: "sm"|"lg"}) =>
  size === "lg"
    ? <div className="flex items-center gap-2"><div className="bg-purple-600 rounded-xl px-3 py-2"><span className="text-white font-bold text-lg">flex</span></div><span className="text-gray-500 text-sm">/ talent</span></div>
    : <div className="flex items-center gap-2"><div className="bg-purple-600 rounded-md px-2 py-1"><span className="text-white font-bold text-xs">flex</span></div><span className="text-gray-400 text-sm">Talent Scoping</span></div>;

// ── Intake Form ──────────────────────────────────────────────────────────────
function IntakeForm({onComplete}: {onComplete: (a: Answer) => void}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [val, setVal] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({behavior:"smooth"}); }, [idx]);

  const q = QUESTIONS[idx];
  const pct = Math.round((idx / QUESTIONS.length) * 100);

  function advance(v: string) {
    const next = {...answers, [q.id]: v};
    setAnswers(next);
    setVal("");
    if (idx < QUESTIONS.length - 1) setIdx(idx + 1);
    else onComplete(next);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col p-6">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-2">
          <FlexLogo size="sm" />
          <div className="text-gray-600 text-xs mt-2">Your answers are analyzed by AI against the Flex PM career ladder</div>
        </div>
        <div className="my-5">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span>Question {idx + 1} of {QUESTIONS.length}</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div className="bg-purple-500 h-1 rounded-full transition-all duration-500" style={{width:`${pct}%`}} />
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-bold text-white mb-2">{q.label}</h2>
          {q.probe && <p className="text-gray-500 text-sm italic mb-5">{q.probe}</p>}
          {q.type === "select"
            ? <div className="space-y-2 mb-6">
                {q.options!.map(o => (
                  <button key={o} onClick={() => advance(o)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-800 bg-gray-900 text-gray-300 hover:border-purple-600 hover:text-white text-sm transition-all">
                    {o}
                  </button>
                ))}
              </div>
            : <textarea rows={4} value={val} onChange={e => setVal(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500 mb-6"
                placeholder="Type your answer…"
              />
          }
        </div>

        {q.type === "text" && (
          <div className="flex gap-3" ref={ref}>
            <button onClick={() => advance("Not specified")}
              className="px-4 py-3 rounded-xl border border-gray-800 text-gray-500 text-sm hover:text-gray-300">
              Skip
            </button>
            <button onClick={() => advance(val)} disabled={!val.trim()}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${val.trim() ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}>
              {idx < QUESTIONS.length - 1 ? "Next →" : "Analyze My Responses →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loader ───────────────────────────────────────────────────────────────────
function Loader({step}: {step: number}) {
  const steps = ["Reading intake responses","Mapping to PM career ladder","Detecting internal tensions","Building TP intelligence brief","Generating sourcing strategy & interview plan"];
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <FlexLogo size="sm" />
      <div className="text-purple-400 text-xs font-semibold tracking-widest uppercase mt-6 mb-8">Analyzing with AI</div>
      <div className="space-y-4 w-full max-w-sm">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${i < step ? "text-gray-600" : i === step ? "text-white" : "text-gray-700"}`}>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${i < step ? "border-purple-800 bg-purple-950" : i === step ? "border-purple-400 bg-purple-950 animate-pulse" : "border-gray-800"}`}>
              {i < step && <span className="text-purple-500 text-xs">✓</span>}
            </div>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FlexTalentScoping() {
  const [screen, setScreen] = useState<"intro"|"intake"|"loading"|"results">("intro");
  const [answers, setAnswers] = useState<Answer | null>(null);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tab, setTab] = useState("brief");
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<number | null>(0);

  async function analyze(ans: Answer) {
    setAnswers(ans);
    setScreen("loading");
    const tick = async (i: number) => { setLoadStep(i); await new Promise(r => setTimeout(r, 800)); };
    await tick(0);

    const system = `You are an expert recruiting strategist at Flex, a Series D fintech company (500-600 people) building financial tools for renters and property managers. You have deep expertise in PM career ladders, hiring calibration, and talent sourcing.

Flex PM Career Ladder:
L4: Executes assigned features. Feature-level impact, guided by manager. Low autonomy.
L5: Owns complex features independently. Feature-level impact, self-directed. Moderate autonomy.
L6: Owns a product domain including roadmap and outcomes. Product-level impact. High autonomy.
L7: Owns multiple products or top-level business goals. High business impact, player/coach, sets own strategy.
L8: Owns a full vertical (Consumer/Platform/Partner). Influences Flex-wide product strategy. Full vertical autonomy.
L9: Owns a vertical with company strategy impact. Shapes product, business, and GTM. Complete ownership.

Flex Attributes (L6-8): Doer — drives with minimal oversight. Owner — owns outcomes not tasks. Humble — leads with curiosity. Precise — translates complexity into clear plans. Resilient — grit under pressure.

"All text fields in the JSON must be plain text only — no markdown, no ** bold **, no ## headers, no bullet formatting with dashes. Just clean prose and plain lists.

Return ONLY valid JSON — no markdown, no explanation:
{
  "recommended_level": "L6",
  "level_range": [5, 7],
  "level_rationale": "2-3 sentences grounded in specific ladder criteria",
  "hm_self_assessment": {
    "hm_picked": 6,
    "alignment": "aligned|slight_gap|significant_gap",
    "gap_direction": "hm_higher|hm_lower|aligned",
    "gap_analysis": "1-2 sentences on why the gap exists",
    "hm_rationale_quality": "well_grounded|partially_grounded|not_grounded",
    "hm_rationale_note": "1 sentence on what the HM's reasoning reveals or misses"
  },
  "internal_tensions": [
    {"tension": "what answer contradicts what", "severity": "high|medium|low", "implication": "what this means for the hire"}
  ],
  "tp_brief": {
    "headline": "single most important thing a TP needs to know before the intake call",
    "priority_questions": [
      {"question": "exact question phrased as a skilled senior TP would ask", "why": "why it matters", "targets": "which tension or gap this resolves"}
    ],
    "watch_outs": ["string"],
    "positive_signals": ["string"]
  },
  "jd_bullets": {
    "about": "2-3 sentence About the Role paragraph. Direct, energetic, specific.",
    "owns": ["Responsibility bullet — action-verb led"],
    "needs": ["Qualification bullet — specific to level"],
    "success": ["Success metric bullet"]
  },
  "interview_plan": [
    {"competency": "name", "ladder_tie": "specific ladder criterion", "questions": ["q1", "q2"]}
  ],
  "slack_handoff": "Clean plain-text Slack message. Role, AI rec, HM pick, alignment, headline, top 2 priority questions. Max 200 words.",
  "sourcing": {
    "market_context": "Supply/demand read on this specific talent pool",
    "competitiveness": "competitive|moderate|accessible",
    "target_companies": [{"name": "string", "why": "string"}],
    "avoid_companies": [{"name": "string", "why": "string"}],
    "search_titles": ["string"],
    "conferences": [{"name": "string", "type": "string"}],
    "sourcing_angles": ["how to position Flex to this profile"],
    "green_flags": ["string"],
    "red_flags": ["string"],
    "hm_instinct_translation": "translate the HM's gut instinct into specific sourcing behavior"
  }
}`;

    const user = `HM INTAKE ANSWERS:\n${Object.entries(ans).map(([k,v]) => `${k}: ${v}`).join("\n")}`;
    await tick(1); await tick(2); await tick(3);

    let parsed: AnalysisResult;
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({system, user}),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const clean = data.text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch(e) {
      parsed = {
        recommended_level:"L6", level_range:[5,7],
        level_rationale:"Analysis unavailable — check API connectivity.",
        hm_self_assessment:{hm_picked:parseInt(ans.hm_level_pick?.replace("L","")||"6"),alignment:"aligned",gap_direction:"aligned",gap_analysis:"N/A",hm_rationale_quality:"not_grounded",hm_rationale_note:"N/A"},
        internal_tensions:[], tp_brief:{headline:"Analysis unavailable.",priority_questions:[],watch_outs:[],positive_signals:[]},
        jd_bullets:{about:"",owns:[],needs:[],success:[]}, interview_plan:[],
        slack_handoff:"Analysis unavailable.",
        sourcing:{market_context:"",competitiveness:"moderate",target_companies:[],avoid_companies:[],search_titles:[],conferences:[],sourcing_angles:[],green_flags:[],red_flags:[],hm_instinct_translation:""},
      };
    }
    await tick(4);
    setResult(parsed);
    setScreen("results");
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function fullExport(r: AnalysisResult, a: Answer) {
    return `FLEX TALENT SCOPING — FULL BRIEF
Role: ${a?.org_area||"PM"} | ${new Date().toLocaleDateString()}

━━━ LEVEL ANALYSIS ━━━
AI Recommendation: ${r.recommended_level} (range L${r.level_range?.[0]}–L${r.level_range?.[1]})
HM Self-Assessment: L${r.hm_self_assessment?.hm_picked}
Alignment: ${r.hm_self_assessment?.alignment?.replace("_"," ")}
Rationale: ${r.level_rationale}
Gap Analysis: ${r.hm_self_assessment?.gap_analysis}

━━━ TP BRIEF ━━━
Headline: ${r.tp_brief?.headline}

Priority Questions:
${(r.tp_brief?.priority_questions||[]).map((q,i) => `${i+1}. ${q.question}\n   Why: ${q.why}\n   Resolves: ${q.targets}`).join("\n\n")}

Watch Outs:
${(r.tp_brief?.watch_outs||[]).map(w => `• ${w}`).join("\n")}

━━━ TENSIONS ━━━
${(r.internal_tensions||[]).map(t => `[${t.severity.toUpperCase()}] ${t.tension}\nImplication: ${t.implication}`).join("\n\n")}

━━━ SOURCING ━━━
Market: ${r.sourcing?.market_context}
Target Companies: ${(r.sourcing?.target_companies||[]).map(c => `${c.name} — ${c.why}`).join("; ")}
Search Titles: ${(r.sourcing?.search_titles||[]).join(", ")}

━━━ JD DRAFT ━━━
${r.jd_bullets?.about}

What You'll Own:
${(r.jd_bullets?.owns||[]).map(b => `• ${b}`).join("\n")}

What You'll Need:
${(r.jd_bullets?.needs||[]).map(b => `• ${b}`).join("\n")}

━━━ SLACK HANDOFF ━━━
${r.slack_handoff}`;
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (screen === "intro") return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="mb-6"><FlexLogo size="lg" /></div>
        <h1 className="text-3xl font-bold text-white mb-3">Talent Scoping</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">~10 minutes. Your answers generate an AI-powered level recommendation, sourcing strategy, and interview plan — plus a Slack-ready brief for your Talent Partner.</p>
        <Card className="mb-6">
          <SLabel>What you'll get</SLabel>
          <div className="space-y-2">
            {[
              "Level recommendation (L4–L9) vs. your own assessment",
              "Internal tension analysis — where your answers flag complexity",
              "TP intelligence brief with priority intake-call questions",
              "Sourcing strategy — target companies, titles, conferences, angles",
              "Structured interview plan mapped to Flex Attributes",
              "JD draft and one-click Slack handoff",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">✦</span><span>{t}</span>
              </div>
            ))}
          </div>
        </Card>
        <button onClick={() => setScreen("intake")}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors">
          Begin Intake →
        </button>
      </div>
    </div>
  );

  if (screen === "intake") return <IntakeForm onComplete={analyze} />;
  if (screen === "loading") return <Loader step={loadStep} />;
  if (!result || !answers) return null;

  // ── RESULTS ────────────────────────────────────────────────────────────────
  const r = result;
  const lvlNum = parseInt(r.recommended_level.replace("L","")) || 6;
  const attrTier = lvlNum <= 5 ? "L4-5" : lvlNum <= 8 ? "L6-8" : "L9+";
  const hmP = r.hm_self_assessment?.hm_picked || 6;
  const ac: Record<string,string> = {aligned:"green", slight_gap:"yellow", significant_gap:"red"};
  const sc: Record<string,string> = {high:"red", medium:"yellow", low:"green"};
  const compBadge = r.sourcing?.competitiveness === "competitive" ? "bg-red-900/40 text-red-300 border-red-700"
    : r.sourcing?.competitiveness === "moderate" ? "bg-yellow-900/40 text-yellow-300 border-yellow-700"
    : "bg-green-900/40 text-green-300 border-green-700";
  const stages = buildStages(r.recommended_level, answers.people_management?.toLowerCase().includes("yes") || answers.ic_vs_manager?.includes("manag"));

  const tabs = [
    {id:"brief", label:"TP Brief"},
    {id:"level", label:"Level Analysis"},
    {id:"tensions", label:`Tensions${r.internal_tensions?.length > 0 ? ` (${r.internal_tensions.length})` : ""}`},
    {id:"sourcing", label:"Sourcing"},
    {id:"interview", label:"Interview Plan"},
    {id:"jd", label:"JD Draft"},
    {id:"handoff", label:"📋 Slack Handoff"},
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlexLogo size="sm" />
          <span className="text-gray-600">·</span>
          <span className="text-white text-sm font-medium">{answers.org_area || "PM Role"}</span>
          <Badge color="purple">{r.recommended_level} rec</Badge>
        </div>
        <button onClick={() => { setScreen("intro"); setResult(null); setAnswers(null); setTab("brief"); }}
          className="text-sm text-gray-500 hover:text-gray-300">← Start Over</button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-6">
        <div className="flex overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${tab === t.id ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">

        {/* ── TP BRIEF ── */}
        {tab === "brief" && <>
          <Card><SLabel>Headline</SLabel><p className="text-white font-medium">{r.tp_brief?.headline}</p></Card>
          <div className="grid grid-cols-3 gap-3">
            <Card><div className="text-gray-500 text-xs mb-1">AI Recommendation</div><div className="text-4xl font-black text-purple-400">{r.recommended_level}</div><div className="text-gray-600 text-xs mt-1">Range L{r.level_range?.[0]}–L{r.level_range?.[1]}</div></Card>
            <Card><div className="text-gray-500 text-xs mb-1">HM Assessment</div><div className="text-4xl font-black text-white">L{hmP}</div><div className="mt-1"><Badge color={ac[r.hm_self_assessment?.alignment]||"gray"}>{r.hm_self_assessment?.alignment?.replace("_"," ")}</Badge></div></Card>
            <Card><div className="text-gray-500 text-xs mb-1">Tensions Detected</div><div className="text-4xl font-black text-white">{r.internal_tensions?.length || 0}</div></Card>
          </div>
          {answers.hm_color && (
            <div className="bg-purple-950/40 border border-purple-800 rounded-xl p-5">
              <SLabel>HM Color</SLabel>
              <p className="text-gray-300 text-sm italic mb-3">"{answers.hm_color}"</p>
              <p className="text-gray-400 text-sm"><span className="text-purple-300 font-medium">What this means for the search: </span>{r.sourcing?.hm_instinct_translation}</p>
            </div>
          )}
          <Card>
            <SLabel>Priority Questions for Intake Call</SLabel>
            <div className="text-gray-500 text-xs mb-4">Ranked by urgency. Work through these before discussing level or JD.</div>
            <div className="space-y-5">
              {(r.tp_brief?.priority_questions||[]).map((pq, i) => (
                <div key={i} className="border-l-2 border-purple-800 pl-4">
                  <div className="text-white text-sm font-medium mb-1">"{pq.question}"</div>
                  <div className="text-gray-500 text-xs"><span className="text-gray-400">Why: </span>{pq.why}</div>
                  <div className="text-gray-600 text-xs mt-0.5"><span className="text-gray-500">Resolves: </span>{pq.targets}</div>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            {r.tp_brief?.watch_outs?.length > 0 && <Card><SLabel>Watch Outs</SLabel><div className="space-y-2">{r.tp_brief.watch_outs.map((w,i) => <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-red-400">⚠</span>{w}</div>)}</div></Card>}
            {r.tp_brief?.positive_signals?.length > 0 && <Card><SLabel>Positive Signals</SLabel><div className="space-y-2">{r.tp_brief.positive_signals.map((s,i) => <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-400">✓</span>{s}</div>)}</div></Card>}
          </div>
        </>}

        {/* ── LEVEL ANALYSIS ── */}
        {tab === "level" && <>
          <Card>
            <SLabel>AI Level Recommendation</SLabel>
            <div className="flex items-start gap-6 mb-4">
              <div className="text-6xl font-black text-purple-400">{r.recommended_level}</div>
              <div className="flex-1"><div className="text-gray-500 text-xs mb-1">Plausible range: L{r.level_range?.[0]}–L{r.level_range?.[1]}</div><p className="text-gray-300 text-sm">{r.level_rationale}</p></div>
            </div>
            {LADDER[lvlNum] && <div className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-4">
              {[["Scope",LADDER[lvlNum].scope],["Impact",LADDER[lvlNum].impact],["IC vs. Leadership",LADDER[lvlNum].ic],["Autonomy",LADDER[lvlNum].autonomy]].map(([k,v]) => (
                <div key={k}><div className="text-gray-600 text-xs mb-0.5">{k}</div><div className="text-gray-300 text-sm">{v}</div></div>
              ))}
            </div>}
          </Card>
          <Card>
            <SLabel>HM Self-Assessment vs. AI Recommendation</SLabel>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center"><div className="text-gray-500 text-xs mb-1">HM Picked</div><div className="text-4xl font-black text-white">L{hmP}</div></div>
              <div className="flex-1 text-center">
                <Badge color={ac[r.hm_self_assessment?.alignment]||"gray"}>{r.hm_self_assessment?.alignment?.replace("_"," ")}</Badge>
                <div className="text-gray-600 text-xs mt-1">{r.hm_self_assessment?.gap_direction === "hm_higher" ? "HM scoped higher than ladder supports" : r.hm_self_assessment?.gap_direction === "hm_lower" ? "HM scoped lower than ladder suggests" : ""}</div>
              </div>
              <div className="text-center"><div className="text-gray-500 text-xs mb-1">AI Rec</div><div className="text-4xl font-black text-purple-400">{r.recommended_level}</div></div>
            </div>
            <div className="space-y-3 border-t border-gray-800 pt-4">
              <div><div className="text-gray-500 text-xs mb-1">Gap Analysis</div><p className="text-gray-300 text-sm">{r.hm_self_assessment?.gap_analysis}</p></div>
              <div>
                <div className="text-gray-500 text-xs mb-1">HM Reasoning Quality — <Badge color={r.hm_self_assessment?.hm_rationale_quality === "well_grounded" ? "green" : r.hm_self_assessment?.hm_rationale_quality === "partially_grounded" ? "yellow" : "red"}>{r.hm_self_assessment?.hm_rationale_quality?.replace("_"," ")}</Badge></div>
                <p className="text-gray-300 text-sm">{r.hm_self_assessment?.hm_rationale_note}</p>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800"><div className="text-gray-600 text-xs mb-1">HM said:</div><p className="text-gray-400 text-sm italic">"{answers.hm_level_rationale}"</p></div>
            </div>
          </Card>
          <Card>
            <SLabel>Flex Attributes at {attrTier}</SLabel>
            <div className="space-y-3">
              {Object.entries(ATTRIBUTES[attrTier]).map(([a,d]) => (
                <div key={a}><div className="text-purple-400 text-xs font-semibold uppercase mb-0.5">{a}</div><div className="text-gray-400 text-sm">{d}</div></div>
              ))}
            </div>
          </Card>
        </>}

        {/* ── TENSIONS ── */}
        {tab === "tensions" && <>
          {!r.internal_tensions?.length
            ? <Card><div className="text-green-400 font-medium text-sm">✓ No significant internal tensions detected.</div></Card>
            : r.internal_tensions.map((t, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-white text-sm font-medium flex-1 pr-4">{t.tension}</div>
                  <Badge color={sc[t.severity]||"gray"}>{t.severity}</Badge>
                </div>
                <div className="text-gray-400 text-sm">{t.implication}</div>
              </Card>
            ))
          }
        </>}

        {/* ── SOURCING ── */}
        {tab === "sourcing" && <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <SLabel>Market Context</SLabel>
              <span className={`text-xs border px-2 py-1 rounded-full capitalize ${compBadge}`}>{r.sourcing?.competitiveness}</span>
            </div>
            <p className="text-gray-300 text-sm">{r.sourcing?.market_context}</p>
          </Card>
          {answers.hm_color && (
            <div className="bg-purple-950/40 border border-purple-800 rounded-xl p-5">
              <SLabel>Reading the HM's Instinct</SLabel>
              <p className="text-gray-300 text-sm">{r.sourcing?.hm_instinct_translation}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <SLabel>Target Companies</SLabel>
              <div className="space-y-3">{(r.sourcing?.target_companies||[]).map((c,i) => (
                <div key={i}><p className="text-purple-300 text-sm font-medium">{c.name}</p><p className="text-gray-400 text-xs">{c.why}</p></div>
              ))}</div>
            </Card>
            <Card>
              <SLabel>Approach with Caution</SLabel>
              <div className="space-y-3">{(r.sourcing?.avoid_companies||[]).map((c,i) => (
                <div key={i}><p className="text-red-300 text-sm font-medium">{c.name}</p><p className="text-gray-400 text-xs">{c.why}</p></div>
              ))}</div>
            </Card>
          </div>
          <Card>
            <SLabel>Search Titles</SLabel>
            <div className="flex flex-wrap gap-2">{(r.sourcing?.search_titles||[]).map((t,i) => (
              <span key={i} className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">{t}</span>
            ))}</div>
          </Card>
          <Card>
            <SLabel>Conferences & Communities</SLabel>
            <div className="space-y-2">{(r.sourcing?.conferences||[]).map((c,i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{c.name}</span>
                <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">{c.type}</span>
              </div>
            ))}</div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <SLabel>Green Flags</SLabel>
              <ul className="space-y-1">{(r.sourcing?.green_flags||[]).map((f,i) => (
                <li key={i} className="text-gray-300 text-xs flex gap-2"><span className="text-green-400">✓</span>{f}</li>
              ))}</ul>
            </Card>
            <Card>
              <SLabel>Red Flags</SLabel>
              <ul className="space-y-1">{(r.sourcing?.red_flags||[]).map((f,i) => (
                <li key={i} className="text-gray-300 text-xs flex gap-2"><span className="text-red-400">✗</span>{f}</li>
              ))}</ul>
            </Card>
          </div>
          <Card>
            <SLabel>How to Position Flex</SLabel>
            <ul className="space-y-2">{(r.sourcing?.sourcing_angles||[]).map((a,i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-purple-400">→</span>{a}</li>
            ))}</ul>
          </Card>
        </div>}

        {/* ── INTERVIEW PLAN ── */}
        {tab === "interview" && <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">Calibrated to <span className="text-purple-400 font-semibold">{r.recommended_level}</span> and <span className="text-purple-400 font-semibold">{attrTier} Flex Attributes</span></div>
            </div>
          </Card>
          <Card>
            <SLabel>Flex Attributes Reference</SLabel>
            <div className="space-y-1">
              {Object.entries(ATTRIBUTES[attrTier]).map(([name, def]) => (
                <div key={name}>
                  <button onClick={() => setExpandedAttr(expandedAttr === name ? null : name)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge color="purple">{name}</Badge>
                      <span className="text-gray-400 text-sm">{def}</span>
                    </div>
                    <span className="text-gray-600 text-xs">{expandedAttr === name ? "▲" : "▼"}</span>
                  </button>
                  {expandedAttr === name && (
                    <div className="mx-3 mb-2 space-y-2">
                      {(ATTR_QUESTIONS[name]||[]).map((q,i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3">
                          <p className="text-white text-sm mb-1">{q.q}</p>
                          <p className="text-gray-400 text-xs italic">Signal: {q.signal}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          {stages.map((stage, si) => (
            <div key={stage.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded font-mono">Stage {si+1}</span>
                    <h3 className="text-white font-semibold">{stage.title}</h3>
                    {"badge" in stage && stage.badge && <Badge color="purple">{stage.badge as string}</Badge>}
                  </div>
                  <span className="text-gray-500 text-xs">{stage.duration}</span>
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mb-3">
                  <span>👤 {stage.owner}</span>
                  <span>📋 {stage.format}</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{stage.focus}</p>
                <div className="flex gap-1 flex-wrap">
                  {stage.attributes.map(a => <Badge key={a} color="purple">{a}</Badge>)}
                </div>
              </div>
              {"sessions" in stage && stage.sessions && (
                <div className="border-t border-gray-800">
                  {(stage.sessions as any[]).map((session, idx) => (
                    <div key={idx} className="border-b border-gray-800 last:border-0">
                      <button onClick={() => setExpandedSession(expandedSession === idx ? null : idx)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{session.title}</span>
                          {session.badge && <Badge color="blue">{session.badge}</Badge>}
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
              {"questions" in stage && !("sessions" in stage) && (
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
        </div>}

        {/* ── JD DRAFT ── */}
        {tab === "jd" && <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white font-bold">{answers.org_area ? `Senior Product Manager, ${answers.org_area}` : "Senior Product Manager"}</div>
              <div className="text-gray-500 text-xs mt-0.5">{r.recommended_level} · Draft</div>
            </div>
            <button onClick={() => copy(`${r.jd_bullets?.about}\n\nResponsibilities:\n${(r.jd_bullets?.owns||[]).map(b=>`• ${b}`).join("\n")}\n\nQualifications:\n${(r.jd_bullets?.needs||[]).map(b=>`• ${b}`).join("\n")}`, "jd")}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-800 px-3 py-1.5 rounded-lg">
              {copied === "jd" ? "✓ Copied" : "Copy JD"}
            </button>
          </div>
          <Card>
            <div className="flex items-center gap-2 mb-2"><SLabel>About the Role</SLabel><Badge color="purple">AI generated</Badge></div>
            <p className="text-gray-300 text-sm leading-relaxed">{r.jd_bullets?.about}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3"><SLabel>Responsibilities</SLabel><Badge color="purple">AI generated</Badge></div>
            <div className="space-y-1.5">{(r.jd_bullets?.owns||[]).map((b,i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-purple-400">•</span>{b}</div>
            ))}</div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3"><SLabel>Qualifications</SLabel><Badge color="purple">AI generated</Badge></div>
            <div className="space-y-1.5">{(r.jd_bullets?.needs||[]).map((b,i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-purple-400">•</span>{b}</div>
            ))}</div>
          </Card>
          <div className="bg-gray-900 border border-yellow-900 rounded-xl p-4">
            <div className="text-yellow-400 text-xs font-semibold uppercase mb-1">Before posting</div>
            <div className="text-gray-400 text-xs">Add comp range after aligning with your comp team. Static sections (About Flex, benefits) will be appended automatically in Greenhouse.</div>
          </div>
        </div>}

        {/* ── SLACK HANDOFF ── */}
        {tab === "handoff" && <>
          <Card>
            <SLabel>How this works</SLabel>
            <p className="text-gray-400 text-sm mb-4">Copy the Slack message and paste into your recruiting channel or directly to your TP. For everything else, use Copy Full Brief.</p>
          </Card>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
              <div className="text-gray-400 text-xs font-mono">#recruiting-ops</div>
              <div className="ml-auto text-gray-600 text-xs">Slack preview</div>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">flex</span></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2"><span className="text-white text-sm font-semibold">Flex Talent</span><span className="text-gray-600 text-xs">Just now</span></div>
                  <div className="text-gray-300 bg-gray-950 rounded-lg p-3 border border-gray-800 text-xs font-mono leading-relaxed whitespace-pre-wrap">{r.slack_handoff}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => copy(r.slack_handoff, "slack")}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              {copied === "slack" ? "✓ Copied!" : "Copy Slack Message"}
            </button>
            <button onClick={() => copy(fullExport(r, answers!), "full")}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm border border-gray-700 transition-colors">
              {copied === "full" ? "✓ Copied!" : "Copy Full Brief"}
            </button>
          </div>
        </>}

      </div>
    </div>
  );
}
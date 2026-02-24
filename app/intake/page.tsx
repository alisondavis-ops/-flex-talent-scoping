"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const TRACK_MAP: Record<string, string[]> = {
  product:     ["Core Product", "Design"],
  engineering: ["Software Engineering", "Data Engineering", "Analytics", "Machine Learning", "Data Science", "Information Technology", "Security Engineering", "Quality Assurance"],
  marketing:   ["Brand Marketing", "Product Marketing", "Creative", "Social Media", "Growth Marketing"],
  revenue:     ["Business Development", "Partner Success", "Account Executive", "Sales Development", "Sales Engineering", "Revenue Operations", "Partner Implementation"],
  ga:          ["Talent Acquisition", "People Ops", "Customer Success", "Operations", "Legal", "Strategic Finance / CM&T", "Accounting", "Compliance", "Credit Risk", "Risk Operations", "Office Management", "Project Management", "Strategy"],
};

const TRACK_LABELS: Record<string, string> = {
  product: "Product", engineering: "Engineering", marketing: "Marketing", revenue: "Revenue", ga: "G&A"
};
const TRACK_ORDER = ["product", "engineering", "marketing", "revenue", "ga"];

function detectTrack(jf: string): string {
  for (const [t, fams] of Object.entries(TRACK_MAP)) {
    if (fams.includes(jf)) return t;
  }
  return "ga";
}

interface Question {
  id: string;
  label: string;
  probe?: string;
  type: "text" | "select" | "textarea";
  options?: string[];
}

const Q_ROLE_SETUP: Question[] = [
  { id: "role_title", label: "What is the working title for this role?", probe: "e.g. Senior Product Manager, Staff Engineer, L6 Talent Partner — use the title you'd post externally.", type: "text" },
  { id: "hiring_id", label: "What is the Hiring ID for this role?", probe: "This is the ID from your approved Jira headcount request. e.g. HC-2024-042", type: "text" },
  { id: "reports_to", label: "Who does this role report to?", probe: "First and last name of the direct manager.", type: "text" },
];

const Q_CORE_PRE: (Question & { tracks: string[] })[] = [
  { id: "org_area_product", label: "Which part of the product org is this role part of?", probe: "e.g. Consumer, Platform, Partner — where does this team sit?", type: "text", tracks: ["product"] },
  { id: "org_area_ga", label: "Which part of the org does this role support?", probe: "e.g. Engineering, GTM, People — who are the primary internal stakeholders?", type: "text", tracks: ["ga", "engineering", "revenue", "marketing"] },
];

const Q_CORE_POST: Question[] = [
  { id: "people_management", label: "Does this person need to manage people?", probe: "If yes — how many reports, how senior, and how much management experience is truly needed?", type: "text" },
  { id: "ic_vs_manager", label: "Is this role hands-on IC, purely managerial, or a player/coach?", probe: "Almost all roles have some IC work — what does that look like here?", type: "select", options: ["Primarily IC — mostly in the weeds", "Player/coach — significant IC + managing others", "Primarily managerial — IC in critical spots only", "Full people leader — IC is rare"] },
  { id: "success", label: "What does success look like at 6 and 12 months?", probe: "Be specific. What will this person have shipped, influenced, or changed?", type: "textarea" },
  { id: "failure", label: "What does failure look like?", probe: "What would cause this hire not to work out? This often reveals the real requirements.", type: "textarea" },
  { id: "backfill", label: "Is this a backfill or a new role?", probe: "If backfill — what did you learn? If new — who owned this scope before?", type: "text" },
  { id: "competitors", label: "Any specific companies, backgrounds, or profiles we should target?", type: "text" },
  { id: "location", label: "Where can this role be based?", probe: "Per Flex's hybrid policy, remote is available for Engineering, Data Science, AI/ML, and L4+ field sales only.", type: "select", options: ["New York, NY — Tier 1 (HQ)", "San Francisco / Bay Area — Tier 1", "Salt Lake City, UT — Tier 3", "Remote — Engineering / Data Science / AI/ML / L4+ Field Sales", "Remote — Exception requested (L7+ only)", "Multiple locations"] },
  { id: "hm_level_pick", label: "What level do you believe this role should be?", probe: "Pick the level you feel most convicted about — we'll compare this to the career ladder.", type: "select", options: ["L3", "L4", "L5", "L6", "L7", "L8", "L9"] },
  { id: "hm_level_rationale", label: "Walk us through your reasoning. Why that level?", probe: "What about scope, impact, or skills needed led you there?", type: "textarea" },
];

const TRACK_QUESTIONS: Record<string, Question[]> = {
  product: [
    { id: "zero_to_one", label: "Is this a 0-to-1 build?", probe: "Building something net new, or evolving/scaling something that exists?", type: "select", options: ["Yes — fully net new", "Mostly new, some foundation exists", "Scaling/evolving an existing product", "Primarily maintenance and optimization"] },
    { id: "vision_vs_execution", label: "Do we know the solution — or do we need someone to define both vision AND execution?", probe: "This is one of the biggest leveling signals.", type: "select", options: ["We know the solution — need strong execution", "Rough direction exists — need someone to sharpen and build", "We have the problem — need someone to define solution and strategy", "We don't fully know the problem or solution — need someone to define both"] },
    { id: "specialization", label: "How niche or specialized is this role?", probe: "Could a talented product athlete ramp in 3–6 months? Or is prior experience critical?", type: "select", options: ["Agile product athlete can ramp — domain is learnable", "Some domain familiarity helpful but not required", "Prior domain experience strongly preferred", "Prior experience with this exact problem set is critical"] },
    { id: "domain_experience", label: "How much fintech or payments experience is needed?", type: "select", options: ["Not required — great product sense is enough", "Helpful but not a dealbreaker", "Preferred — fintech context accelerates ramp", "Required — regulatory/compliance/partner complexity demands it"] },
  ],
  engineering: [
    { id: "greenfield", label: "Is this a greenfield build or maintaining/extending existing systems?", type: "select", options: ["Greenfield — net new system or platform", "Mostly new with some existing foundation", "Extending / evolving existing systems", "Primarily maintaining and optimizing existing systems"] },
    { id: "tech_scope", label: "How would you describe the technical scope of this role?", type: "select", options: ["Deep specialist — expert in a narrow domain", "Full-stack contributor — breadth across the system", "Systems architect — designs across platforms", "Technical leader — sets direction, enables others"] },
    { id: "cross_functional_scope", label: "How cross-functional is this role?", type: "select", options: ["Primarily within the engineering team", "Works closely with 1–2 adjacent teams", "Significant cross-functional coordination required", "Enterprise-wide — interfaces across the entire org"] },
    { id: "domain_experience", label: "How much fintech or payments domain experience is needed?", type: "select", options: ["Not required — strong technical fundamentals are enough", "Helpful but not a dealbreaker", "Preferred — domain context accelerates ramp", "Required — regulatory or compliance complexity demands it"] },
  ],
  marketing: [
    { id: "marketing_motion", label: "Is this role primarily building the marketing function/strategy, or executing within an established one?", probe: "This is the key leveling signal for marketing roles.", type: "select", options: ["Building — strategy and function largely undefined", "Inheriting a strategy, needs significant refinement", "Executing within a defined strategy and playbook", "Optimizing an established motion — improve and scale"] },
    { id: "channel_scope", label: "What is the primary scope of this role's channel or domain ownership?", type: "select", options: ["Single channel or campaign type", "Multiple channels within a function", "Full function ownership", "Cross-functional — spans brand, growth, and product marketing"] },
    { id: "brand_vs_performance", label: "Where does this role sit on the brand-to-performance spectrum?", type: "select", options: ["Pure brand / creative", "Mostly brand with some performance", "Balanced — brand and performance equally weighted", "Mostly performance — growth, acquisition, conversion", "Pure performance / growth marketing"] },
    { id: "domain_experience", label: "How much fintech or B2B SaaS marketing experience is needed?", type: "select", options: ["Not required — strong marketing fundamentals are enough", "Helpful but not a dealbreaker", "Preferred — domain context accelerates ramp", "Required — regulated industry or B2B complexity demands it"] },
  ],
  revenue: [
    { id: "market_maturity", label: "Is this role focused on a new market/segment or an existing book of business?", probe: "This shapes whether we're hiring a builder or an optimizer.", type: "select", options: ["New market — no existing motion or pipeline", "Emerging — early signal, limited infrastructure", "Established — existing pipeline, room to grow", "Mature book — optimize and retain"] },
    { id: "gtm_definition", label: "How defined is the go-to-market motion this person will operate in?", type: "select", options: ["Fully defined playbook — execute within it", "Playbook exists but needs refinement", "Rough direction — significant building required", "Blank slate — define the motion from scratch"] },
    { id: "deal_complexity", label: "What is the nature of the deals or relationships this role manages?", type: "select", options: ["Transactional — high volume, shorter cycle", "Mixed — some complex, some transactional", "Complex — longer cycle, multi-stakeholder", "Strategic / transformational — large, long-term partnerships"] },
    { id: "domain_experience", label: "How much fintech or payments experience is needed?", type: "select", options: ["Not required — strong commercial instincts are enough", "Helpful but not a dealbreaker", "Preferred — domain context accelerates ramp", "Required — partner or regulatory complexity demands it"] },
  ],
  ga: [
    { id: "process_maturity", label: "How mature is the process or function this person is stepping into?", probe: "This is one of the biggest leveling signals for operational roles.", type: "select", options: ["Undefined — no process exists yet", "Nascent — early attempts, inconsistent", "Established but broken — needs a rebuild", "Functional — works, but has clear optimization opportunities", "Mature — well-documented, scalable, needs stewardship"] },
    { id: "primary_mode", label: "What is the primary mode of this role?", probe: "Defining vs. optimizing vs. executing is often the clearest leveling signal for G&A.", type: "select", options: ["Defining — build the function or process from scratch", "Optimizing — inherit something and make it significantly better", "Executing — operate within established systems and processes", "Mixed — some definition, mostly optimization and execution"] },
    { id: "cross_functional_scope", label: "How cross-functional is this role?", type: "select", options: ["Primarily team-internal", "Works closely with 1–2 adjacent teams", "Significant cross-functional coordination required", "Enterprise-wide — interfaces across the entire org"] },
    { id: "domain_experience", label: "Is deep domain expertise required, or is functional excellence enough?", probe: "e.g. TA experience in hypergrowth, CS experience in fintech", type: "select", options: ["Functional excellence is enough — domain is learnable", "Some domain familiarity is helpful", "Domain experience strongly preferred", "Deep domain expertise is critical to day one effectiveness"] },
  ],
};

function buildQuestions(_track: string): Question[] {
  return [
    ...Q_ROLE_SETUP,
    { id: "tap_name", label: "What's your name?", probe: "So stakeholders know who's reaching out.", type: "text" },
    { id: "search_context", label: "Any context on this search we should know going in?", probe: "Timeline pressure, internal candidates, org sensitivity, team dynamics — anything a TAP should know before the kickoff call.", type: "textarea" },
  ];
}

export default function IntakePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"family" | "questions" | "submitting" | "done">("family");
  const [jobFamily, setJobFamily] = useState("");
  const [track, setTrack] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx, phase]);

  const selectFamily = useCallback((fam: string) => {
    const t = detectTrack(fam);
    setJobFamily(fam);
    setTrack(t);
    setQuestions(buildQuestions(t));
    setAnswers({ job_family: fam });
    setIdx(0);
    setPhase("questions");
  }, []);

  const advance = useCallback(async (v: string) => {
    if (!v.trim()) return;
    const q = questions[idx];
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    setVal("");

    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      setPhase("submitting");
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hm_answers: next, job_family: jobFamily, track, tap_name: next.tap_name }),
        });
        const data = await res.json();
        if (data.success) {
          setSessionId(data.data.session_id);
          router.push(`/results/${data.data.session_id}`);
        } else {
          setError(data.error ?? "Something went wrong");
          setPhase("questions");
        }
      } catch {
        setError("Failed to submit — please try again");
        setPhase("questions");
      }
    }
  }, [idx, questions, answers, jobFamily, track, router]);

  const goBack = useCallback(() => {
    if (idx === 0) {
      setPhase("family");
      setVal("");
    } else {
      const prevIdx = idx - 1;
      const prevQ = questions[prevIdx];
      setIdx(prevIdx);
      setVal(prevQ.type !== "select" ? (answers[prevQ.id] ?? "") : "");
    }
  }, [idx, questions, answers]);

  const pct = phase === "family" ? 2 : Math.round(((idx + 1) / (questions.length + 1)) * 100);
  const q = questions[idx];

  const styles = {
    page: { minHeight: "100vh", background: "#1D1D1D", color: "#F7F7F7", fontFamily: "'DM Sans', system-ui, sans-serif", overflowY: "auto" as const },
    container: { maxWidth: 640, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column" as const },
    label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#8B5DD4", marginBottom: 16 },
    heading: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#F7F7F7", marginBottom: 12, lineHeight: 1.25 },
    probe: { fontSize: 13, color: "#787878", fontStyle: "italic" as const, marginBottom: 24, lineHeight: 1.5 },
    input: { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #3A3A3A", background: "#242424", color: "#F7F7F7", fontSize: 14, fontFamily: "inherit", outline: "none" },
    textarea: { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #3A3A3A", background: "#242424", color: "#F7F7F7", fontSize: 14, fontFamily: "inherit", outline: "none", lineHeight: 1.6, resize: "vertical" as const },
    btnPrimary: { flex: 1, padding: "13px 24px", borderRadius: 10, border: "none", background: "#6A3DB8", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
    btnSecondary: { padding: "13px 18px", borderRadius: 10, border: "1px solid #3A3A3A", background: "transparent", color: "#787878", fontSize: 14, fontFamily: "inherit", cursor: "pointer" },
    optionBtn: { padding: "14px 18px", borderRadius: 10, border: "1px solid #3A3A3A", background: "#242424", color: "#CACACA", fontSize: 14, fontFamily: "inherit", cursor: "pointer", textAlign: "left" as const, transition: "all 150ms ease" },
    familyBtn: { padding: "12px 16px", borderRadius: 10, border: "1px solid #3A3A3A", background: "#242424", color: "#CACACA", fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", textAlign: "left" as const, transition: "all 150ms ease" },
  };

  if (phase === "family") {
    return (
      <div ref={containerRef} style={styles.page}>
        <div style={styles.container}>
          <div style={styles.label}>Flex Talent · Intake</div>
          <h1 style={{ ...styles.heading, fontSize: 32, marginBottom: 8 }}>What is the Job Family for this role?</h1>
          <p style={styles.probe}>This determines which set of intake questions you'll see.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {TRACK_ORDER.map(t => (
              <div key={t}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#787878", marginBottom: 10 }}>{TRACK_LABELS[t]}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                  {[...TRACK_MAP[t]].sort().map(fam => (
                    <button key={fam} onClick={() => selectFamily(fam)} style={styles.familyBtn}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6A3DB8"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3A3A3A"; (e.currentTarget as HTMLElement).style.color = "#CACACA"; }}>
                      {fam}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 32, height: 32, border: "2px solid #3A3A3A", borderTopColor: "#6A3DB8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Analyzing with Claude...</div>
          <div style={{ fontSize: 14, color: "#787878" }}>Setting up your search. Just a moment.</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.page}>
      <div style={{ height: 3, background: "#3A3A3A" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#6A3DB8", transition: "width 0.4s ease" }} />
      </div>
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <span style={styles.label}>Flex Talent · Intake</span>
          <span style={{ fontSize: 12, color: "#555" }}>{idx + 1} / {questions.length}</span>
        </div>
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: "rgba(106,61,184,0.1)", border: "1px solid rgba(106,61,184,0.3)", color: "#8B5DD4" }}>{jobFamily}</span>
        </div>
        <div key={idx}>
          <h2 style={styles.heading}>{q.label}</h2>
          {q.probe && <p style={styles.probe}>{q.probe}</p>}

          {q.type === "select" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {q.options?.map(opt => (
                <button key={opt} onClick={() => advance(opt)} style={styles.optionBtn}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6A3DB8"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3A3A3A"; (e.currentTarget as HTMLElement).style.color = "#CACACA"; }}>
                  {opt}
                </button>
              ))}
            </div>
          ) : q.type === "textarea" ? (
            <div style={{ marginBottom: 24 }}>
              <textarea value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && val.trim()) advance(val); }}
                placeholder="Type your answer..." rows={4} style={styles.textarea} />
              <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>⌘↵ to continue</div>
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <input type="text" value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && val.trim()) advance(val); }}
                placeholder="Type your answer..." style={styles.input} />
              <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>↵ to continue</div>
            </div>
          )}

          {error && <div style={{ color: "#D0463A", fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={goBack} style={styles.btnSecondary}>← Back</button>
            {q.type !== "select" && (
              <button onClick={() => val.trim() && advance(val)} disabled={!val.trim()}
                style={{ ...styles.btnPrimary, background: val.trim() ? "#6A3DB8" : "#3A3A3A", color: val.trim() ? "#fff" : "#555", cursor: val.trim() ? "pointer" : "not-allowed" }}>
                {idx === questions.length - 1 ? "Submit →" : "Continue →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

interface Question {
  id: string;
  label: string;
  probe?: string;
  type: string;
  options?: string[];
}



const styles = {
  page: { minHeight: "100vh", background: "#1D1D1D", color: "#F7F7F7", fontFamily: "'DM Sans', system-ui, sans-serif" },
  container: { maxWidth: 600, margin: "0 auto", padding: "40px 24px" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#8B5DD4" },
  heading: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#F7F7F7", lineHeight: 1.25 },
  probe: { fontSize: 13, color: "#787878", fontStyle: "italic" as const, marginBottom: 24, lineHeight: 1.5 },
  input: { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #3A3A3A", background: "#242424", color: "#F7F7F7", fontSize: 14, fontFamily: "inherit", outline: "none" },
  textarea: { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #3A3A3A", background: "#242424", color: "#F7F7F7", fontSize: 14, fontFamily: "inherit", outline: "none", lineHeight: 1.6, resize: "vertical" as const },
  optionBtn: { padding: "14px 18px", borderRadius: 10, border: "1px solid #3A3A3A", background: "#242424", color: "#CACACA", fontSize: 14, fontFamily: "inherit", cursor: "pointer", textAlign: "left" as const, transition: "all 150ms ease" },
  btnPrimary: { flex: 1, padding: "13px 24px", borderRadius: 10, border: "none", background: "#6A3DB8", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  btnSecondary: { padding: "13px 18px", borderRadius: 10, border: "1px solid #3A3A3A", background: "transparent", color: "#787878", fontSize: 14, fontFamily: "inherit", cursor: "pointer" },
};

export default function RespondPage() {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [val, setVal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/respond/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setFormData(d.data);
        else setError(d.error === "already_submitted" ? "already_submitted" : d.error ?? "Invalid link");
      })
      .catch(() => setError("Failed to load form"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx]);

  const advance = async (v: string) => {
    if (!v.trim() || !formData) return;
    const q = formData.questions[idx];
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    setVal("");

    // If they just answered the relationship question, inject follow-up questions
    if (q.id === "relationship") {
      const followups = Object.entries({
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
      }).find(([key]) => key === v);

      if (followups) {
        const newQuestions = [
          ...formData.questions.slice(0, idx + 1),
          ...followups[1],
          ...formData.questions.slice(idx + 1),
        ];
        setFormData({ ...formData, questions: newQuestions });
      }
    }

    if (idx < formData.questions.length - 1) {
      setIdx(idx + 1);
    } else {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/respond/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: next }),
        });
        const data = await res.json();
        if (data.success) setDone(true);
        else setError(data.error ?? "Submission failed");
      } catch {
        setError("Failed to submit — please try again");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const goBack = () => {
    if (idx === 0) return;
    const prevIdx = idx - 1;
    const prevQ = formData!.questions[prevIdx];
    setIdx(prevIdx);
    setVal(prevQ.type !== "select" ? (answers[prevQ.id] ?? "") : "");
  };

  if (loading) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 28, height: 28, border: "2px solid #3A3A3A", borderTopColor: "#6A3DB8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error === "already_submitted") return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
        <h2 style={{ ...styles.heading, fontSize: 22, marginBottom: 12 }}>Already submitted</h2>
        <p style={{ fontSize: 14, color: "#787878" }}>Your response has been recorded. Thank you for your input.</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
        <h2 style={{ ...styles.heading, fontSize: 22, marginBottom: 12 }}>Link unavailable</h2>
        <p style={{ fontSize: 14, color: "#787878" }}>{error}</p>
      </div>
    </div>
  );

  if (done) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
        <h2 style={{ ...styles.heading, fontSize: 26, marginBottom: 12 }}>Response submitted</h2>
        <p style={{ fontSize: 14, color: "#787878", lineHeight: 1.6 }}>
          Your perspective on the <strong style={{ color: "#F7F7F7" }}>{formData?.job_family}</strong> role has been recorded.
          The Talent team will review all responses and follow up with next steps.
        </p>
      </div>
    </div>
  );

  if (submitting) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 28, height: 28, border: "2px solid #3A3A3A", borderTopColor: "#6A3DB8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 14, color: "#787878" }}>Submitting your response...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!formData) return null;

  const q = formData.questions[idx];
  const pct = Math.round(((idx + 1) / formData.questions.length) * 100);

  return (
    <div ref={containerRef} style={styles.page}>
      <div style={{ height: 3, background: "#3A3A3A" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#6A3DB8", transition: "width 0.4s ease" }} />
      </div>
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <span style={styles.label}>Flex Talent · Stakeholder Input</span>
          <span style={{ fontSize: 12, color: "#555" }}>{idx + 1} / {formData.questions.length}</span>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: "#CACACA", marginBottom: 12, lineHeight: 1.6 }}>
            Hi <strong style={{ color: "#F7F7F7" }}>{formData.stakeholder_name}</strong> — you've been asked to share your perspective on a role we're scoping.
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "#242424", border: "1px solid #3A3A3A", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#787878", marginBottom: 6 }}>Role</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#F7F7F7" }}>{formData.role_title ?? formData.job_family}</div>
            {formData.requester_name && (
              <div style={{ fontSize: 13, color: "#787878", marginTop: 4 }}>{formData.requester_name} is requesting your input</div>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
            Your responses are independent and confidential — only the Talent team will see individual answers. This takes about 8 minutes.
          </div>
        </div>

        <div key={idx}>
          <h2 style={{ ...styles.heading, fontSize: 24, marginBottom: 12 }}>{q.label}</h2>
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
          ) : (
            <div style={{ marginBottom: 24 }}>
              <textarea value={val} onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && val.trim()) advance(val); }}
                placeholder="Type your answer..." rows={4} style={styles.textarea} />
              <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>⌘↵ to continue</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            {idx > 0 && <button onClick={goBack} style={styles.btnSecondary}>← Back</button>}
            {q.type !== "select" && (
              <button onClick={() => val.trim() && advance(val)} disabled={!val.trim()}
                style={{ ...styles.btnPrimary, background: val.trim() ? "#6A3DB8" : "#3A3A3A", color: val.trim() ? "#fff" : "#555", cursor: val.trim() ? "pointer" : "not-allowed" }}>
                {idx === formData.questions.length - 1 ? "Submit →" : "Continue →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { IntakeSession, StakeholderRole } from "@/types";

const ROLE_LABELS: Record<StakeholderRole, string> = {
  hm_peer: "HM Peer",
  hm_lead: "HM's Lead",
  future_peer: "Future Peer",
  ic_team: "IC on Team",
  backfill_colleague: "Backfill Colleague",
};

const SEVERITY_COLORS = { high: "#D0463A", medium: "#C17F24", low: "#4A8C5C" };
const SEVERITY_BG = { high: "rgba(208,70,58,0.1)", medium: "rgba(193,127,36,0.1)", low: "rgba(74,140,92,0.1)" };

const styles = {
  page: { minHeight: "100vh", background: "#1D1D1D", color: "#F7F7F7", fontFamily: "'DM Sans', system-ui, sans-serif" },
  container: { maxWidth: 900, margin: "0 auto", padding: "40px 24px" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#8B5DD4" },
  heading: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: "#F7F7F7", lineHeight: 1.25 },
  card: { background: "#242424", border: "1px solid #3A3A3A", borderRadius: 12, padding: 24, marginBottom: 16 },
  tab: (active: boolean) => ({ padding: "10px 18px", borderRadius: 8, border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", background: active ? "#6A3DB8" : "transparent", color: active ? "#fff" : "#787878", transition: "all 150ms ease" }),
  badge: (sev: string) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: SEVERITY_BG[sev as keyof typeof SEVERITY_BG], color: SEVERITY_COLORS[sev as keyof typeof SEVERITY_COLORS], border: `1px solid ${SEVERITY_COLORS[sev as keyof typeof SEVERITY_COLORS]}33` }),
  input: { padding: "10px 14px", borderRadius: 8, border: "1px solid #3A3A3A", background: "#1D1D1D", color: "#F7F7F7", fontSize: 13, fontFamily: "inherit", outline: "none" },
  btnPrimary: { padding: "10px 20px", borderRadius: 8, border: "none", background: "#6A3DB8", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  btnSecondary: { padding: "10px 16px", borderRadius: 8, border: "1px solid #3A3A3A", background: "transparent", color: "#CACACA", fontSize: 13, fontFamily: "inherit", cursor: "pointer" },
};

const TABS = ["Brief", "Level Analysis", "Tensions", "JD Draft", "Interview Plan", "Sourcing", "Stakeholders"];

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [inviteForm, setInviteForm] = useState({ name: "", slack_user_id: "", role_type: "hm_peer" as StakeholderRole });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [synthLoading, setSynthLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSession(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const addInvite = async () => {
    if (!inviteForm.name || !inviteForm.role_type) return;
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/sessions/${id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (data.success) {
        setInviteLinks(prev => ({ ...prev, [data.data.invite_id]: data.data.form_link }));
        const refreshed = await fetch(`/api/sessions/${id}`).then(r => r.json());
        if (refreshed.success) setSession(refreshed.data);
        setInviteForm({ name: "", slack_user_id: "", role_type: "hm_peer" });
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const runSynthesis = async () => {
    setSynthLoading(true);
    try {
      const res = await fetch(`/api/sessions/${id}/synthesize`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const refreshed = await fetch(`/api/sessions/${id}`).then(r => r.json());
        if (refreshed.success) {
          setSession(refreshed.data);
          setTab(0);
        }
      } else {
        console.error("Synthesis failed:", data.error);
      }
    } catch (err) {
      console.error("Synthesis error:", err);
    } finally {
      setSynthLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 28, height: 28, border: "2px solid #3A3A3A", borderTopColor: "#6A3DB8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Session not found</div>
        <a href="/intake" style={{ color: "#6A3DB8" }}>Start new intake →</a>
      </div>
    </div>
  );

  const a = session.ai_analysis;
  const s = session.synthesis;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...styles.label, marginBottom: 8 }}>Flex Talent · TAP Brief</div>
          <h1 style={{ ...styles.heading, fontSize: 32, marginBottom: 8 }}>{session.job_family}</h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#787878" }}>Session {session.id.slice(0, 8)}</span>
            <span style={{ fontSize: 13, color: "#787878" }}>·</span>
            <span style={{ fontSize: 13, color: "#787878" }}>{session.track.toUpperCase()}</span>
            <span style={{ fontSize: 13, color: "#787878" }}>·</span>
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: "rgba(106,61,184,0.15)", border: "1px solid rgba(106,61,184,0.3)", color: "#8B5DD4" }}>{session.phase.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* Level match banner */}
        {a && (
          <div style={{ ...styles.card, borderColor: a.level_analysis.level_match ? "#4A8C5C44" : "#D0463A44", background: a.level_analysis.level_match ? "rgba(74,140,92,0.08)" : "rgba(208,70,58,0.08)", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#787878", marginBottom: 4 }}>Level Assessment</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  HM requested <span style={{ color: "#8B5DD4" }}>L{a.level_analysis.hm_requested_level}</span> · AI recommends <span style={{ color: a.level_analysis.level_match ? "#4A8C5C" : "#D0463A" }}>L{a.level_analysis.recommended_level}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: a.level_analysis.level_match ? "#4A8C5C" : "#D0463A", fontWeight: 600 }}>
                {a.level_analysis.level_match ? "✓ Aligned" : "⚠ Tension — review recommended"}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 24, borderBottom: "1px solid #3A3A3A", paddingBottom: 12 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={styles.tab(tab === i)}>{t}</button>
          ))}
        </div>

        {/* TAP Brief */}
        {tab === 0 && a && (
          <div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Executive Summary</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#CACACA" }}>{a.tap_brief.summary}</p>
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Level Signal</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#CACACA" }}>{a.tap_brief.level_signal}</p>
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Priority Questions for HM</div>
              {a.tap_brief.priority_questions.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#6A3DB8", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA", margin: 0 }}>{q}</p>
                </div>
              ))}
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Watch Items</div>
              {a.tap_brief.watch_items.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#C17F24" }}>⚠</span>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA", margin: 0 }}>{w}</p>
                </div>
              ))}
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Candidate Profile</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#CACACA" }}>{a.tap_brief.candidate_profile_notes}</p>
            </div>
            {s && (
              <div style={{ ...styles.card, borderColor: "#6A3DB844" }}>
                <div style={{ ...styles.label, marginBottom: 12 }}>TAP Private Brief (Synthesis)</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#CACACA" }}>{s.tap_private_brief}</p>
                {s.probing_questions.length > 0 && (
                  <>
                    <div style={{ ...styles.label, marginTop: 20, marginBottom: 12 }}>Probing Questions</div>
                    {s.probing_questions.map((q, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                        <span style={{ color: "#6A3DB8", fontWeight: 700 }}>{i + 1}</span>
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA", margin: 0 }}>{q}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Level Analysis */}
        {tab === 1 && a && (
          <div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Reasoning</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "#CACACA" }}>{a.level_analysis.reasoning}</p>
            </div>
            {[
              ["Scope", a.level_analysis.scope_assessment],
              ["Impact", a.level_analysis.impact_assessment],
              ["People", a.level_analysis.people_assessment],
              ["Autonomy", a.level_analysis.autonomy_assessment],
              ["Ambiguity", a.level_analysis.ambiguity_assessment],
            ].map(([label, val]) => (
              <div key={label} style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 8 }}>{label}</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA", margin: 0 }}>{val}</p>
              </div>
            ))}
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 16 }}>Attribute Signals</div>
              {Object.entries(a.level_analysis.attribute_fit).map(([attr, signal]) => (
                <div key={attr} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#8B5DD4", marginBottom: 4 }}>{attr}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: "#CACACA", margin: 0 }}>{signal}</p>
                </div>
              ))}
            </div>
            {s && (
              <div style={{ ...styles.card, borderColor: "#6A3DB844" }}>
                <div style={{ ...styles.label, marginBottom: 12 }}>Stakeholder Level Spread</div>
                {s.level_divergence_flag && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(208,70,58,0.1)", border: "1px solid #D0463A33", marginBottom: 16, fontSize: 13, color: "#D0463A" }}>
                    ⚠ Level divergence detected across stakeholders
                  </div>
                )}
                {s.level_spread.map((entry, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: i < s.level_spread.length - 1 ? "1px solid #3A3A3A" : "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{ROLE_LABELS[entry.role_type]}</div>
                      <div style={{ fontSize: 12, color: "#787878" }}>{entry.rationale_summary}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#8B5DD4", flexShrink: 0, marginLeft: 16 }}>L{entry.level_pick}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tensions */}
        {tab === 2 && a && (
          <div>
            {a.tensions.map(t => (
              <div key={t.id} style={{ ...styles.card, borderColor: `${SEVERITY_COLORS[t.severity]}33` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#F7F7F7" }}>{t.title}</div>
                  <span style={styles.badge(t.severity)}>{t.severity}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA", marginBottom: 16 }}>{t.description}</p>
                <div style={{ padding: "12px 16px", borderRadius: 8, background: "#1D1D1D", borderLeft: `3px solid ${SEVERITY_COLORS[t.severity]}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#787878", marginBottom: 6, letterSpacing: "0.1em" }}>PROBING QUESTION</div>
                  <p style={{ fontSize: 14, color: "#F7F7F7", margin: 0, lineHeight: 1.5 }}>"{t.probing_question}"</p>
                </div>
              </div>
            ))}
            {s?.tensions.map(t => (
              <div key={t.id} style={{ ...styles.card, borderColor: `${SEVERITY_COLORS[t.severity]}33` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#787878" }}>Stakeholder synthesis</span>
                    <span style={styles.badge(t.severity)}>{t.severity}</span>
                  </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA", marginBottom: 16 }}>{t.description}</p>
                <div style={{ padding: "12px 16px", borderRadius: 8, background: "#1D1D1D", borderLeft: `3px solid ${SEVERITY_COLORS[t.severity]}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#787878", marginBottom: 6, letterSpacing: "0.1em" }}>PROBING QUESTION</div>
                  <p style={{ fontSize: 14, color: "#F7F7F7", margin: 0, lineHeight: 1.5 }}>"{t.probing_question}"</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* JD Draft */}
        {tab === 3 && a && (
          <div>
            <div style={{ ...styles.card, borderColor: "#6A3DB844" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ ...styles.label, marginBottom: 4 }}>Job Description Draft</div>
                  <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, margin: 0 }}>{a.jd_draft.job_title}</h2>
                </div>
                <button onClick={() => copyToClipboard(
                  `${a.jd_draft.job_title}\n\n${a.jd_draft.about_the_role}\n\nWhat You'll Do\n${a.jd_draft.what_you_will_do.map(x => `• ${x}`).join("\n")}\n\nWhat We're Looking For\n${a.jd_draft.what_we_are_looking_for.map(x => `• ${x}`).join("\n")}\n\nNice to Have\n${a.jd_draft.nice_to_have.map(x => `• ${x}`).join("\n")}\n\n${a.jd_draft.location_statement}`,
                  "jd"
                )} style={styles.btnSecondary}>
                  {copied === "jd" ? "✓ Copied" : "Copy JD"}
                </button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...styles.label, marginBottom: 8 }}>About the Role</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#CACACA" }}>{a.jd_draft.about_the_role}</p>
              </div>
              {[
                ["What You'll Do", a.jd_draft.what_you_will_do],
                ["What We're Looking For", a.jd_draft.what_we_are_looking_for],
                ["Nice to Have", a.jd_draft.nice_to_have],
              ].map(([heading, items]) => (
                <div key={heading as string} style={{ marginBottom: 20 }}>
                  <div style={{ ...styles.label, marginBottom: 8 }}>{heading as string}</div>
                  {(items as string[]).map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                      <span style={{ color: "#6A3DB8" }}>•</span>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA", margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ ...styles.label, marginBottom: 8 }}>Location</div>
              <p style={{ fontSize: 14, color: "#CACACA" }}>{a.jd_draft.location_statement}</p>
            </div>
          </div>
        )}

        {/* Interview Plan */}
        {tab === 4 && a && (
          <div>
            <div style={{ ...styles.card, marginBottom: 24 }}>
              <div style={{ ...styles.label, marginBottom: 8 }}>Overall Notes</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#CACACA" }}>{a.interview_plan.overall_notes}</p>
            </div>
            {a.interview_plan.stages.map((stage, i) => (
              <div key={i} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#787878", marginBottom: 4 }}>Stage {i + 1}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{stage.stage_name}</div>
                    <div style={{ fontSize: 13, color: "#787878", marginTop: 4 }}>{stage.interviewer_type} · {stage.duration_minutes} min</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, justifyContent: "flex-end" }}>
                    {stage.attributes_assessed.map(attr => (
                      <span key={attr} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "rgba(106,61,184,0.15)", border: "1px solid rgba(106,61,184,0.3)", color: "#8B5DD4" }}>{attr}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#787878", marginBottom: 8, letterSpacing: "0.1em" }}>FOCUS AREAS</div>
                  {stage.focus_areas.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: "#6A3DB8" }}>→</span>
                      <span style={{ fontSize: 13, color: "#CACACA" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#787878", marginBottom: 8, letterSpacing: "0.1em" }}>SAMPLE QUESTIONS</div>
                  {stage.sample_questions.map((q, j) => (
                    <div key={j} style={{ padding: "10px 14px", borderRadius: 8, background: "#1D1D1D", marginBottom: 8, fontSize: 13, color: "#CACACA", lineHeight: 1.5 }}>"{q}"</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sourcing */}
        {tab === 5 && a && (
          <div>
            <div style={{ ...styles.card, borderColor: "#6A3DB844" }}>
              <div style={{ ...styles.label, marginBottom: 8 }}>Sourcing Thesis</div>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "#F7F7F7", fontStyle: "italic" }}>"{a.sourcing_strategy.headline}"</p>
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Outreach Angle</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#CACACA" }}>{a.sourcing_strategy.outreach_angle}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 12 }}>Target Companies</div>
                {a.sourcing_strategy.target_companies.map((c, i) => (
                  <div key={i} style={{ fontSize: 14, color: "#CACACA", padding: "6px 0", borderBottom: i < a.sourcing_strategy.target_companies.length - 1 ? "1px solid #3A3A3A" : "none" }}>{c}</div>
                ))}
              </div>
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 12 }}>Target Titles</div>
                {a.sourcing_strategy.target_titles.map((t, i) => (
                  <div key={i} style={{ fontSize: 14, color: "#CACACA", padding: "6px 0", borderBottom: i < a.sourcing_strategy.target_titles.length - 1 ? "1px solid #3A3A3A" : "none" }}>{t}</div>
                ))}
              </div>
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Search Strings</div>
              {a.sourcing_strategy.search_strings.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: "#1D1D1D", marginBottom: 8 }}>
                  <code style={{ fontSize: 12, color: "#8B5DD4", flex: 1, wordBreak: "break-all" as const }}>{s}</code>
                  <button onClick={() => copyToClipboard(s, `ss-${i}`)} style={{ ...styles.btnSecondary, marginLeft: 12, padding: "6px 12px", fontSize: 12 }}>
                    {copied === `ss-${i}` ? "✓" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
            <div style={styles.card}>
              <div style={{ ...styles.label, marginBottom: 12 }}>Channels</div>
              {a.sourcing_strategy.channels.map((ch, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: i < a.sourcing_strategy.channels.length - 1 ? "1px solid #3A3A3A" : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{ch.channel}</div>
                    <div style={{ fontSize: 13, color: "#787878" }}>{ch.rationale}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: ch.priority === "primary" ? "rgba(106,61,184,0.15)" : "rgba(255,255,255,0.05)", color: ch.priority === "primary" ? "#8B5DD4" : "#787878", border: "1px solid", borderColor: ch.priority === "primary" ? "rgba(106,61,184,0.3)" : "#3A3A3A", flexShrink: 0, marginLeft: 12 }}>{ch.priority}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholders */}
        {tab === 6 && (
          <div>
            {/* Invite form */}
            <div style={{ ...styles.card, borderColor: "#6A3DB844" }}>
              <div style={{ ...styles.label, marginBottom: 16 }}>Add Stakeholder</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#787878", marginBottom: 6 }}>Name</div>
                  <input value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="First Last" style={{ ...styles.input, width: "100%" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#787878", marginBottom: 6 }}>Role Type</div>
                  <select value={inviteForm.role_type} onChange={e => setInviteForm(p => ({ ...p, role_type: e.target.value as StakeholderRole }))}
                    style={{ ...styles.input, width: "100%" }}>
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#787878", marginBottom: 6 }}>Slack User ID <span style={{ color: "#555" }}>(optional — for auto-DM)</span></div>
                <input value={inviteForm.slack_user_id} onChange={e => setInviteForm(p => ({ ...p, slack_user_id: e.target.value }))}
                  placeholder="U0123ABCDEF" style={{ ...styles.input, width: "100%" }} />
              </div>
              <button onClick={addInvite} disabled={inviteLoading || !inviteForm.name}
                style={{ ...styles.btnPrimary, background: inviteForm.name ? "#6A3DB8" : "#3A3A3A", color: inviteForm.name ? "#fff" : "#555", cursor: inviteForm.name ? "pointer" : "not-allowed" }}>
                {inviteLoading ? "Generating link..." : "Generate Invite Link"}
              </button>
            </div>

            {/* Invite list */}
            {session.invites.length > 0 && (
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 16 }}>Invites ({session.invites.length})</div>
                {session.invites.map(inv => {
                  const link = inviteLinks[inv.id];
                  return (
                    <div key={inv.id} style={{ padding: "14px 0", borderBottom: "1px solid #3A3A3A" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{inv.name}</span>
                          <span style={{ fontSize: 12, color: "#787878", marginLeft: 10 }}>{ROLE_LABELS[inv.role_type]}</span>
                        </div>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: inv.status === "submitted" ? "rgba(74,140,92,0.15)" : "rgba(255,255,255,0.05)", color: inv.status === "submitted" ? "#4A8C5C" : "#787878", border: "1px solid", borderColor: inv.status === "submitted" ? "#4A8C5C44" : "#3A3A3A" }}>
                          {inv.status}
                        </span>
                      </div>
                      {link && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <code style={{ fontSize: 11, color: "#555", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{link}</code>
                          <button onClick={() => copyToClipboard(link, inv.id)} style={{ ...styles.btnSecondary, padding: "6px 12px", fontSize: 12, flexShrink: 0 }}>
                            {copied === inv.id ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Synthesis trigger */}
            {session.invites.some(inv => inv.status === "submitted") && !session.synthesis && (
              <div style={{ ...styles.card, borderColor: "#6A3DB844" }}>
                <div style={{ ...styles.label, marginBottom: 8 }}>Ready to Synthesize</div>
                <p style={{ fontSize: 14, color: "#CACACA", marginBottom: 16 }}>
                  {session.invites.filter(inv => inv.status === "submitted").length} of {session.invites.length} stakeholders have responded.
                  Run synthesis to surface cross-stakeholder tensions and get probing questions.
                </p>
                <button onClick={runSynthesis} disabled={synthLoading} style={styles.btnPrimary}>
                  {synthLoading ? "Synthesizing..." : "Run Synthesis →"}
                </button>
              </div>
            )}

            {session.synthesis?.slack_channel_name && (
              <div style={{ ...styles.card, borderColor: "#4A8C5C44", background: "rgba(74,140,92,0.08)" }}>
                <div style={{ fontSize: 14, color: "#4A8C5C", fontWeight: 600 }}>
                  ✓ Slack channel created: #{session.synthesis.slack_channel_name}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
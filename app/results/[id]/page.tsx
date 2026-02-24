"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { IntakeSession, StakeholderRole } from "@/types";

const ROLE_LABELS: Record<StakeholderRole, string> = {
  hiring_manager: "Hiring Manager",
  cross_functional_partner: "Cross-Functional Partner",
  key_stakeholder: "Key Stakeholder",
  department_lead: "Department Lead",
  dri: "DRI",
};

const SEVERITY_COLORS = { high: "#D0463A", medium: "#C17F24", low: "#4A8C5C" };
const SEVERITY_BG = { high: "rgba(208,70,58,0.1)", medium: "rgba(193,127,36,0.1)", low: "rgba(74,140,92,0.1)" };

const C = {
  midnightPurple: "#0E0622",
  jewelPurple: "#6A3DB8",
  flavender: "#B28CF4",
  softLilac: "#DDC6F9",
  winterWhite: "#FFFFFF",
  pageBg: "#111018",
  cardBg: "#19162A",
  cardBorder: "#2C2645",
  textPrimary: "#ECEAF2",
  textSecondary: "#9A95B0",
  textMuted: "#5C5875",
};

const styles = {
  page: { minHeight: "100vh", background: C.pageBg, color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif" },
  container: { maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.flavender },
  card: { background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 24, marginBottom: 16 },
  tab: (active: boolean) => ({ padding: "10px 18px", borderRadius: 8, border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", background: active ? C.jewelPurple : "transparent", color: active ? "#fff" : C.textSecondary, transition: "all 150ms ease" }),
  badge: (sev: string) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: SEVERITY_BG[sev as keyof typeof SEVERITY_BG], color: SEVERITY_COLORS[sev as keyof typeof SEVERITY_COLORS], border: `1px solid ${SEVERITY_COLORS[sev as keyof typeof SEVERITY_COLORS]}33` }),
  input: { padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.pageBg, color: C.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" },
  btnPrimary: { padding: "10px 20px", borderRadius: 8, border: "none", background: C.jewelPurple, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  btnSecondary: { padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: "transparent", color: C.textSecondary, fontSize: 13, fontFamily: "inherit", cursor: "pointer" },
};

const TABS = ["Brief", "Tensions", "Level Spread", "JD Draft", "Interview Plan", "Sourcing", "Stakeholders"];

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(6);
  const [inviteForm, setInviteForm] = useState({ name: "", slack_user_id: "", role_type: "hiring_manager" as StakeholderRole });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [synthLoading, setSynthLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setSession(d.data);
          if (d.data.synthesis) setTab(0);
        }
      })
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
        setInviteForm({ name: "", slack_user_id: "", role_type: "cross_functional_partner" });
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
      <div style={{ width: 28, height: 28, border: `2px solid ${C.cardBorder}`, borderTopColor: C.jewelPurple, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Session not found</div>
        <a href="/intake" style={{ color: C.jewelPurple }}>Start new intake →</a>
      </div>
    </div>
  );

  const a = session.ai_analysis;
  const s = session.synthesis;
  const jd = s?.jd_draft ?? a?.jd_draft;
  const ip = s?.interview_plan ?? a?.interview_plan;
  const ss = s?.sourcing_strategy ?? a?.sourcing_strategy;

  const phaseLabel =
    session.phase === "intake_complete" ? "Awaiting Invites" :
    session.phase === "stakeholders_invited" ? "Awaiting Responses" :
    session.phase === "synthesis_complete" ? "Analysis Ready" :
    session.phase.replace(/_/g, " ");

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Midnight Purple header bar */}
      <div style={{ background: C.midnightPurple, padding: "18px 24px", borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: C.flavender }}>
            flex<span style={{ color: C.softLilac }}>.</span> talent
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>TAP Dashboard</div>
        </div>
      </div>

      <div style={styles.container}>

        {/* Role header */}
        <div style={{ padding: "32px 0 24px" }}>
          <div style={{ ...styles.label, marginBottom: 10 }}>Active Search</div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 34, color: C.winterWhite, lineHeight: 1.2, marginBottom: 12 }}>
            {session.hm_answers?.role_title ?? session.job_family}
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
            {session.hm_answers?.reports_to && (
              <span style={{ fontSize: 13, color: C.textSecondary }}>Reports to {session.hm_answers.reports_to}</span>
            )}
            <span style={{ fontSize: 13, color: C.textMuted }}>·</span>
            <span style={{ fontSize: 13, color: C.textSecondary }}>{session.job_family}</span>
            <span style={{ fontSize: 13, color: C.textMuted }}>·</span>
            <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 99, background: "rgba(178,140,244,0.12)", border: "1px solid rgba(178,140,244,0.25)", color: C.flavender, fontWeight: 600 }}>
              {phaseLabel}
            </span>
          </div>
        </div>

        {/* Level divergence banner */}
        {s?.level_divergence_flag && (
          <div style={{ ...styles.card, borderColor: "#D0463A44", background: "rgba(208,70,58,0.07)", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "#D0463A", fontWeight: 600 }}>⚠ Level divergence detected — stakeholders are not aligned. Review Level Spread before launching.</div>
          </div>
        )}

        {/* No invites yet prompt */}
        {!s && session.invites.length === 0 && (
          <div style={{ ...styles.card, borderColor: "rgba(178,140,244,0.2)", marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>
              <strong style={{ color: C.textPrimary }}>Next step:</strong> Go to the Stakeholders tab to send intake forms to the Hiring Manager and any cross-functional stakeholders.
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 24, borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: 12 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={styles.tab(tab === i)}>{t}</button>
          ))}
        </div>

        {/* BRIEF TAB */}
        {tab === 0 && (
          <div>
            {!s ? (
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 12 }}>No Synthesis Yet</div>
                <p style={{ fontSize: 14, color: C.textSecondary }}>Once stakeholders have submitted, run synthesis from the Stakeholders tab.</p>
              </div>
            ) : (
              <>
                <div style={styles.card}>
                  <div style={{ ...styles.label, marginBottom: 12 }}>TAP Private Brief</div>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: C.textPrimary }}>{s.tap_private_brief}</p>
                </div>
                <div style={styles.card}>
                  <div style={{ ...styles.label, marginBottom: 16 }}>Probing Questions</div>
                  {s.probing_questions.map((q, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
                      <span style={{ color: C.flavender, fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <p style={{ fontSize: 14, lineHeight: 1.65, color: C.textPrimary, margin: 0 }}>{q}</p>
                    </div>
                  ))}
                </div>
                <div style={{ ...styles.card, background: C.pageBg }}>
                  <div style={{ ...styles.label, marginBottom: 12 }}>Slack Summary</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: C.textSecondary, fontStyle: "italic" }}>{s.slack_summary}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* TENSIONS TAB */}
        {tab === 1 && (
          <div>
            {!s ? (
              <div style={styles.card}>
                <p style={{ fontSize: 14, color: C.textSecondary }}>Tensions will appear here after synthesis.</p>
              </div>
            ) : s.tensions.length === 0 ? (
              <div style={styles.card}>
                <p style={{ fontSize: 14, color: "#4A8C5C" }}>✓ No major tensions detected across stakeholder responses.</p>
              </div>
            ) : (
              s.tensions.map(t => (
                <div key={t.id} style={{ ...styles.card, borderColor: `${SEVERITY_COLORS[t.severity]}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.winterWhite, flex: 1, marginRight: 16 }}>{t.title}</div>
                    <span style={styles.badge(t.severity)}>{t.severity}</span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: C.textPrimary, marginBottom: 16 }}>{t.description}</p>
                  <div style={{ padding: "12px 16px", borderRadius: 8, background: C.pageBg, borderLeft: `3px solid ${SEVERITY_COLORS[t.severity]}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 6, letterSpacing: "0.1em" }}>PROBING QUESTION</div>
                    <p style={{ fontSize: 14, color: C.winterWhite, margin: 0, lineHeight: 1.55 }}>"{t.probing_question}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* LEVEL SPREAD TAB */}
        {tab === 2 && (
          <div>
            {!s ? (
              <div style={styles.card}>
                <p style={{ fontSize: 14, color: C.textSecondary }}>Level spread will appear here after synthesis.</p>
              </div>
            ) : (
              <>
                {s.level_divergence_flag && (
                  <div style={{ ...styles.card, borderColor: "#D0463A44", background: "rgba(208,70,58,0.07)", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: "#D0463A", fontWeight: 600 }}>⚠ Divergence detected — stakeholders are not aligned on level</div>
                  </div>
                )}
                <div style={styles.card}>
                  <div style={{ ...styles.label, marginBottom: 16 }}>Level by Respondent</div>
                  {s.level_spread.map((entry, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: i < s.level_spread.length - 1 ? `1px solid ${C.cardBorder}` : "none" }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{entry.respondent}</div>
                        <div style={{ fontSize: 12, color: C.textSecondary }}>{ROLE_LABELS[entry.role_type] ?? entry.role_type}</div>
                        <div style={{ fontSize: 13, color: C.textPrimary, marginTop: 6, lineHeight: 1.5 }}>{entry.rationale_summary}</div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: C.flavender, flexShrink: 0 }}>L{entry.level_pick}</div>
                    </div>
                  ))}
                </div>
                {s.level_consensus && (
                  <div style={{ ...styles.card, borderColor: "#4A8C5C44", background: "rgba(74,140,92,0.07)" }}>
                    <div style={{ fontSize: 14, color: "#4A8C5C", fontWeight: 600 }}>✓ Consensus level: L{s.level_consensus}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* JD DRAFT TAB */}
        {tab === 3 && (
          <div>
            {!jd ? (
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 12 }}>JD Not Yet Generated</div>
                <p style={{ fontSize: 14, color: C.textSecondary }}>Run synthesis to generate the JD, interview plan, and sourcing strategy.</p>
              </div>
            ) : (
              <div style={{ ...styles.card, borderColor: "rgba(178,140,244,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ ...styles.label, marginBottom: 6 }}>Job Description Draft</div>
                    <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, margin: 0, color: C.winterWhite }}>{jd.job_title}</h2>
                  </div>
                  <button onClick={() => copyToClipboard(
                    `${jd.job_title}\n\n${jd.about_the_role}\n\nWhat You'll Do\n${jd.what_you_will_do.map(x => `• ${x}`).join("\n")}\n\nWhat We're Looking For\n${jd.what_we_are_looking_for.map(x => `• ${x}`).join("\n")}\n\nNice to Have\n${jd.nice_to_have.map(x => `• ${x}`).join("\n")}\n\n${jd.location_statement}`,
                    "jd"
                  )} style={styles.btnSecondary}>
                    {copied === "jd" ? "✓ Copied" : "Copy JD"}
                  </button>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ ...styles.label, marginBottom: 10 }}>About the Role</div>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: C.textPrimary }}>{jd.about_the_role}</p>
                </div>
                {([
                  ["What You'll Do", jd.what_you_will_do],
                  ["What We're Looking For", jd.what_we_are_looking_for],
                  ["Nice to Have", jd.nice_to_have],
                ] as [string, string[]][]).map(([heading, items]) => (
                  <div key={heading} style={{ marginBottom: 24 }}>
                    <div style={{ ...styles.label, marginBottom: 10 }}>{heading}</div>
                    {items.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <span style={{ color: C.flavender, flexShrink: 0 }}>•</span>
                        <p style={{ fontSize: 14, lineHeight: 1.65, color: C.textPrimary, margin: 0 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ ...styles.label, marginBottom: 8 }}>Location</div>
                <p style={{ fontSize: 14, color: C.textPrimary }}>{jd.location_statement}</p>
              </div>
            )}
          </div>
        )}

        {/* INTERVIEW PLAN TAB */}
        {tab === 4 && (
          <div>
            {!ip ? (
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 12 }}>Interview Plan Not Yet Generated</div>
                <p style={{ fontSize: 14, color: C.textSecondary }}>Run synthesis to generate the interview plan.</p>
              </div>
            ) : (
              <>
                <div style={{ ...styles.card, marginBottom: 24 }}>
                  <div style={{ ...styles.label, marginBottom: 8 }}>Overall Notes</div>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: C.textPrimary }}>{ip.overall_notes}</p>
                </div>
                {ip.stages.map((stage, i) => (
                  <div key={i} style={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4, letterSpacing: "0.08em" }}>STAGE {i + 1}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.winterWhite }}>{stage.stage_name}</div>
                        <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>{stage.interviewer_type} · {stage.duration_minutes} min</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, justifyContent: "flex-end" }}>
                        {stage.attributes_assessed.map(attr => (
                          <span key={attr} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "rgba(178,140,244,0.12)", border: "1px solid rgba(178,140,244,0.25)", color: C.flavender }}>{attr}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.1em" }}>FOCUS AREAS</div>
                      {stage.focus_areas.map((f, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <span style={{ color: C.flavender }}>→</span>
                          <span style={{ fontSize: 13, color: C.textPrimary }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.1em" }}>SAMPLE QUESTIONS</div>
                      {stage.sample_questions.map((q, j) => (
                        <div key={j} style={{ padding: "10px 14px", borderRadius: 8, background: C.pageBg, marginBottom: 8, fontSize: 13, color: C.textPrimary, lineHeight: 1.55 }}>"{q}"</div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* SOURCING TAB */}
        {tab === 5 && (
          <div>
            {!ss ? (
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 12 }}>Sourcing Strategy Not Yet Generated</div>
                <p style={{ fontSize: 14, color: C.textSecondary }}>Run synthesis to generate the sourcing strategy.</p>
              </div>
            ) : (
              <>
                <div style={{ ...styles.card, borderColor: "rgba(178,140,244,0.2)" }}>
                  <div style={{ ...styles.label, marginBottom: 8 }}>Sourcing Thesis</div>
                  <p style={{ fontSize: 17, lineHeight: 1.6, color: C.winterWhite, fontStyle: "italic" }}>"{ss.headline}"</p>
                </div>
                <div style={styles.card}>
                  <div style={{ ...styles.label, marginBottom: 12 }}>Outreach Angle</div>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: C.textPrimary }}>{ss.outreach_angle}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={styles.card}>
                    <div style={{ ...styles.label, marginBottom: 12 }}>Target Companies</div>
                    {ss.target_companies.map((c, i) => (
                      <div key={i} style={{ fontSize: 14, color: C.textPrimary, padding: "6px 0", borderBottom: i < ss.target_companies.length - 1 ? `1px solid ${C.cardBorder}` : "none" }}>{c}</div>
                    ))}
                  </div>
                  <div style={styles.card}>
                    <div style={{ ...styles.label, marginBottom: 12 }}>Target Titles</div>
                    {ss.target_titles.map((t, i) => (
                      <div key={i} style={{ fontSize: 14, color: C.textPrimary, padding: "6px 0", borderBottom: i < ss.target_titles.length - 1 ? `1px solid ${C.cardBorder}` : "none" }}>{t}</div>
                    ))}
                  </div>
                </div>
                <div style={styles.card}>
                  <div style={{ ...styles.label, marginBottom: 12 }}>Search Strings</div>
                  {ss.search_strings.map((str, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: C.pageBg, marginBottom: 8 }}>
                      <code style={{ fontSize: 12, color: C.flavender, flex: 1, wordBreak: "break-all" as const }}>{str}</code>
                      <button onClick={() => copyToClipboard(str, `ss-${i}`)} style={{ ...styles.btnSecondary, marginLeft: 12, padding: "6px 12px", fontSize: 12 }}>
                        {copied === `ss-${i}` ? "✓" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
                <div style={styles.card}>
                  <div style={{ ...styles.label, marginBottom: 12 }}>Channels</div>
                  {ss.channels.map((ch, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: i < ss.channels.length - 1 ? `1px solid ${C.cardBorder}` : "none" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{ch.channel}</div>
                        <div style={{ fontSize: 13, color: C.textSecondary }}>{ch.rationale}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: ch.priority === "primary" ? "rgba(178,140,244,0.12)" : "rgba(255,255,255,0.04)", color: ch.priority === "primary" ? C.flavender : C.textSecondary, border: "1px solid", borderColor: ch.priority === "primary" ? "rgba(178,140,244,0.25)" : C.cardBorder, flexShrink: 0, marginLeft: 12 }}>{ch.priority}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* STAKEHOLDERS TAB */}
        {tab === 6 && (
          <div>
            <div style={{ ...styles.card, borderColor: "rgba(178,140,244,0.2)" }}>
              <div style={{ ...styles.label, marginBottom: 16 }}>Add Stakeholder</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>Name</div>
                  <input value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="First Last" style={{ ...styles.input, width: "100%" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>Role Type</div>
                  <select value={inviteForm.role_type} onChange={e => setInviteForm(p => ({ ...p, role_type: e.target.value as StakeholderRole }))}
                    style={{ ...styles.input, width: "100%" }}>
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>Slack User ID <span style={{ color: C.textMuted }}>(optional)</span></div>
                <input value={inviteForm.slack_user_id} onChange={e => setInviteForm(p => ({ ...p, slack_user_id: e.target.value }))}
                  placeholder="U0123ABCDEF" style={{ ...styles.input, width: "100%" }} />
              </div>
              <button onClick={addInvite} disabled={inviteLoading || !inviteForm.name}
                style={{ ...styles.btnPrimary, background: inviteForm.name ? C.jewelPurple : C.cardBorder, color: inviteForm.name ? "#fff" : C.textMuted, cursor: inviteForm.name ? "pointer" : "not-allowed" }}>
                {inviteLoading ? "Generating link..." : "Generate Invite Link →"}
              </button>
            </div>

            {session.invites.length > 0 && (
              <div style={styles.card}>
                <div style={{ ...styles.label, marginBottom: 16 }}>Invites ({session.invites.length})</div>
                {session.invites.map(inv => {
                  const link = inviteLinks[inv.id];
                  return (
                    <div key={inv.id} style={{ padding: "14px 0", borderBottom: `1px solid ${C.cardBorder}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: link ? 8 : 0 }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{inv.name}</span>
                          <span style={{ fontSize: 12, color: C.textSecondary, marginLeft: 10 }}>{ROLE_LABELS[inv.role_type]}</span>
                        </div>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: inv.status === "submitted" ? "rgba(74,140,92,0.15)" : "rgba(255,255,255,0.04)", color: inv.status === "submitted" ? "#4A8C5C" : C.textSecondary, border: "1px solid", borderColor: inv.status === "submitted" ? "#4A8C5C44" : C.cardBorder }}>
                          {inv.status}
                        </span>
                      </div>
                      {link && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <code style={{ fontSize: 11, color: C.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{link}</code>
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

            {session.invites.some(inv => inv.status === "submitted") && !session.synthesis && (
              <div style={{ ...styles.card, borderColor: "rgba(178,140,244,0.2)" }}>
                <div style={{ ...styles.label, marginBottom: 8 }}>Ready to Synthesize</div>
                <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 16 }}>
                  {session.invites.filter(inv => inv.status === "submitted").length} of {session.invites.length} stakeholders have responded.
                  Run synthesis to surface tensions, generate the TAP brief, JD, interview plan, and sourcing strategy.
                </p>
                <button onClick={runSynthesis} disabled={synthLoading} style={styles.btnPrimary}>
                  {synthLoading ? "Synthesizing with Claude..." : "Run Synthesis →"}
                </button>
              </div>
            )}

            {session.synthesis && (
              <div style={{ ...styles.card, borderColor: "#4A8C5C44", background: "rgba(74,140,92,0.07)" }}>
                <div style={{ fontSize: 14, color: "#4A8C5C", fontWeight: 600 }}>✓ Synthesis complete — see Brief and Tensions tabs</div>
              </div>
            )}

            {session.slack_channel_name && (
              <div style={{ ...styles.card, borderColor: "#4A8C5C44", background: "rgba(74,140,92,0.07)" }}>
                <div style={{ fontSize: 14, color: "#4A8C5C", fontWeight: 600 }}>✓ Slack channel: #{session.slack_channel_name}</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

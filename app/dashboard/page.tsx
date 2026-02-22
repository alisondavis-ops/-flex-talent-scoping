"use client";

import { useState, useEffect } from "react";
import type { IntakeSession } from "@/types";

const styles = {
  page: { minHeight: "100vh", background: "#1D1D1D", color: "#F7F7F7", fontFamily: "'DM Sans', system-ui, sans-serif" },
  container: { maxWidth: 900, margin: "0 auto", padding: "40px 24px" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#8B5DD4" },
  heading: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: "#F7F7F7", lineHeight: 1.25 },
  card: { background: "#242424", border: "1px solid #3A3A3A", borderRadius: 12, padding: 20, marginBottom: 12, cursor: "pointer", transition: "all 150ms ease", textDecoration: "none", display: "block", color: "inherit" },
  btnPrimary: { padding: "12px 24px", borderRadius: 10, border: "none", background: "#6A3DB8", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textDecoration: "none", display: "inline-block" },
};

const PHASE_COLORS: Record<string, string> = {
  intake_complete: "#C17F24",
  stakeholders_invited: "#4A8C5C",
  synthesis_complete: "#6A3DB8",
  closed: "#555",
};

export default function DashboardPage() {
  const [sessions, setSessions] = useState<IntakeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then(r => r.json())
      .then(d => { if (d.success) setSessions(d.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 8 }}>Flex Talent</div>
            <h1 style={styles.heading}>TAP Dashboard</h1>
          </div>
          <a href="/intake" style={styles.btnPrimary}>+ New Intake</a>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#787878" }}>
            <div style={{ width: 20, height: 20, border: "2px solid #3A3A3A", borderTopColor: "#6A3DB8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Loading sessions...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, marginBottom: 12 }}>No searches yet</h2>
            <p style={{ fontSize: 14, color: "#787878", marginBottom: 24 }}>Start a new intake to run your first AI-powered role analysis.</p>
            <a href="/intake" style={styles.btnPrimary}>Start first intake →</a>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "#787878", marginBottom: 20 }}>{sessions.length} active search{sessions.length !== 1 ? "es" : ""}</div>
            {sessions.map(session => (
              <a key={session.id} href={`/results/${session.id}`} style={styles.card}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6A3DB8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3A3A3A"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{session.job_family}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: 12, color: "#787878" }}>{session.track.toUpperCase()}</span>
                      <span style={{ fontSize: 12, color: "#787878" }}>·</span>
                      <span style={{ fontSize: 12, color: "#787878" }}>Session {session.id.slice(0, 8)}</span>
                      {session.ai_analysis && (
                        <>
                          <span style={{ fontSize: 12, color: "#787878" }}>·</span>
                          <span style={{ fontSize: 12, color: "#787878" }}>
                            HM: L{session.ai_analysis.level_analysis.hm_requested_level} · AI: L{session.ai_analysis.level_analysis.recommended_level}
                            {!session.ai_analysis.level_analysis.level_match && " ⚠"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: `${PHASE_COLORS[session.phase]}22`, color: PHASE_COLORS[session.phase], border: `1px solid ${PHASE_COLORS[session.phase]}44` }}>
                      {session.phase.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: 11, color: "#555" }}>
                      {new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
                {session.invites.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #3A3A3A", display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 12, color: "#787878" }}>
                      {session.invites.filter(i => i.status === "submitted").length}/{session.invites.length} stakeholders responded
                    </span>
                    {session.synthesis && (
                      <span style={{ fontSize: 12, color: "#6A3DB8" }}>✓ Synthesis complete</span>
                    )}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
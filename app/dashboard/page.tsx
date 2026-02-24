"use client";

import { useState, useEffect } from "react";
import type { IntakeSession } from "@/types";

const C = {
  midnightPurple: "#0E0622",
  jewelPurple: "#6A3DB8",
  flavender: "#B28CF4",
  softLilac: "#DDC6F9",
  pageBg: "#111018",
  cardBg: "#1A1729",
  cardBorder: "#312C52",
  textPrimary: "#ECEAF2",
  textSecondary: "#9A95B0",
  textMuted: "#6B6585",
};

const PHASE_CONFIG: Record<string, { label: string; color: string }> = {
  intake_complete:     { label: "Awaiting Invites",   color: "#C89A2A" },
  stakeholders_invited:{ label: "Awaiting Responses", color: "#4A8C5C" },
  synthesis_complete:  { label: "Analysis Ready",     color: "#8B5DD4" },
  closed:              { label: "Closed",              color: "#5C5875" },
};

export default function DashboardPage() {
  const [sessions, setSessions] = useState<IntakeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    if (!confirm("Delete this search? This cannot be undone.")) return;
    setDeleting(sessionId);
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setDeleting(null);
  };
  useEffect(() => {
    fetch("/api/sessions")
      .then(r => r.json())
      .then(d => { if (d.success) setSessions(d.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg, color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: C.midnightPurple, padding: "18px 24px", borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: C.flavender }}>
            flex<span style={{ color: C.softLilac }}>.</span> talent
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>TAP Dashboard</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.flavender, marginBottom: 8 }}>Active Searches</div>
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: "#FFFFFF", lineHeight: 1.25, margin: 0 }}>TAP Dashboard</h1>
          </div>
          <a href="/intake" style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: C.jewelPurple, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>+ New Search</a>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.textSecondary }}>
            <div style={{ width: 20, height: 20, border: `2px solid ${C.cardBorder}`, borderTopColor: C.jewelPurple, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Loading searches...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, marginBottom: 12, color: "#FFFFFF" }}>No searches yet</h2>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 24 }}>Start a new intake to run your first AI-powered role analysis.</p>
            <a href="/intake" style={{ padding: "12px 24px", borderRadius: 10, background: C.jewelPurple, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>Start first search →</a>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>{sessions.length} active search{sessions.length !== 1 ? "es" : ""}</div>
            {sessions.map(session => {
              const phase = PHASE_CONFIG[session.phase] ?? { label: session.phase.replace(/_/g, " "), color: C.textMuted };
              return (
                <a key={session.id} href={`/results/${session.id}`}
                  style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 12, cursor: "pointer", transition: "all 150ms ease", textDecoration: "none", display: "block", color: "inherit" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.flavender; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.cardBorder; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>
                        {session.hm_answers?.role_title ?? session.job_family}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: 12, color: C.textSecondary }}>{`TAP: ${session.hm_answers?.tap_name ?? "Unknown"}`}</span>
                        <span style={{ fontSize: 12, color: C.textMuted }}>·</span>
                        <span style={{ fontSize: 12, color: C.textSecondary }}>{session.hm_answers?.hiring_id ? `Hiring ID: ${session.hm_answers.hiring_id}` : session.job_family}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                      <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 99, background: `${phase.color}25`, color: phase.color, border: `1px solid ${phase.color}66`, fontWeight: 600, letterSpacing: "0.04em" }}>
                        {phase.label}
                      </span>
                      <span style={{ fontSize: 12, color: C.textSecondary }}>
                        {new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <button onClick={e => handleDelete(e, session.id)}
  style={{ fontSize: 11, color: deleting === session.id ? C.textMuted : "#D0463A", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
  {deleting === session.id ? "Deleting..." : "Delete"}
</button>
                    </div>
                  </div>
                  {session.invites.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cardBorder}`, display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 12, color: C.textSecondary }}>
                        {session.invites.filter(i => i.status === "submitted").length}/{session.invites.length} stakeholders responded
                      </span>
                      {session.synthesis && (
                        <span style={{ fontSize: 12, color: C.flavender }}>✓ Synthesis complete</span>
                      )}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

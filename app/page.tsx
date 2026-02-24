"use client";

const styles = {
  page: { minHeight: "100vh", background: "#0D0B14", color: "#ECEAF2", fontFamily: "'DM Sans', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" },
  container: { maxWidth: 560, padding: "40px 24px", textAlign: "center" as const },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#B28CF4", marginBottom: 20, display: "block" },
  heading: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 42, color: "#F7F7F7", lineHeight: 1.2, marginBottom: 16 },
  sub: { fontSize: 16, color: "#767184", lineHeight: 1.6, marginBottom: 40 },
  btnPrimary: { display: "inline-block", padding: "14px 32px", borderRadius: 10, background: "#6A3DB8", color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: "inherit", textDecoration: "none", marginRight: 12, marginBottom: 12 },
  btnSecondary: { display: "inline-block", padding: "14px 24px", borderRadius: 10, border: "1px solid #3A3A3A", background: "transparent", color: "#ECEAF2", fontSize: 15, fontFamily: "inherit", textDecoration: "none", marginBottom: 12 },
};

export default function Home() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <span style={styles.label}>Flex Talent</span>
        <h1 style={styles.heading}>TAP Intelligence Tool</h1>
        <p style={styles.sub}>
          Proactive role scoping, level analysis, and stakeholder alignment —
          before a single JD is written.
        </p>
        <div>
          <a href="/intake" style={styles.btnPrimary}>Start new intake →</a>
          <a href="/dashboard" style={styles.btnSecondary}>TAP dashboard</a>
        </div>
      </div>
    </div>
  );
}
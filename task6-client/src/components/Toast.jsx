export default function Toast({ text }) {
  if (!text) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        background: "var(--card)",
        color: "var(--text)",
        padding: "10px 16px",
        borderRadius: 12,
        fontWeight: 800,
        zIndex: 9999,
        boxShadow: "var(--shadow)",
        maxWidth: 360,
        lineHeight: 1.25,
        border: "1px solid var(--border)",
      }}
    >
      {text}
    </div>
  );
}

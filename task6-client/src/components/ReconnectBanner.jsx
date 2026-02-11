export default function ReconnectBanner({ status, reconnectLeft }) {
  if (status !== "reconnecting") return null;

  const left = reconnectLeft ?? 0;

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #f59e0b",
        background: "#fffbeb",
        color: "#92400e",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 800 }}>Reconnecting…</div>
      <div style={{ fontWeight: 700 }}>{left > 0 ? `${left}s left` : "finalizing…"}</div>
    </div>
  );
}

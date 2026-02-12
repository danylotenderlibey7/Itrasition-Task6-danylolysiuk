export default function ReconnectBanner({ status, reconnectLeft }) {
  if (status !== "reconnecting") return null;

  const left = reconnectLeft ?? 0;

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #f59e0b",
        background: "#fffbeb",
        color: "#92400e",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        fontWeight: 700,
      }}
    >
      <div style={{ fontWeight: 900 }}>Reconnecting…</div>
      <div>{left > 0 ? `${left}s left` : "finalizing…"}</div>
    </div>
  );
}

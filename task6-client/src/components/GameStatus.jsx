function fmt(sec) {
  const s = Math.max(0, sec | 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function GameStatus({
  gameState,
  isMyTurn,
  onRequestRestart,
  iAlreadyPressed,
  rematchText,
  onBackToLobby,
  hideRematch,
  disconnectInfo,
}) {
  if (!gameState) return null;

  const isWaiting = gameState.status === "Waiting";
  const isPlaying = gameState.status === "Playing";
  const isFinished = gameState.status === "Finished";

  const winner = gameState.winner;

  const titleColor =
    isPlaying && winner == null ? "var(--primary)" : "var(--text)";

  const subColor = "var(--muted)";

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontWeight: 900, fontSize: 18, color: titleColor }}>
        {isWaiting && "Waiting for opponent…"}
        {isPlaying && winner == null && (isMyTurn ? "Your turn" : "Opponent’s turn")}
        {isFinished && winner != null && `Winner: ${winner}`}
        {isFinished && winner == null && "Draw"}
      </div>

      {!!disconnectInfo && disconnectInfo.leftSeconds > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(245, 158, 11, 0.55)",
            background: "rgba(245, 158, 11, 0.12)",
            color: "var(--text)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            fontWeight: 900,
          }}
        >
          <div>
            {disconnectInfo.playerName} disconnected
            <div style={{ color: subColor, fontWeight: 700, fontSize: 12, marginTop: 2 }}>
              Auto-finalize if they don’t return
            </div>
          </div>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
            {fmt(disconnectInfo.leftSeconds)}
          </div>
        </div>
      )}

      {isFinished && (
        <div style={{ marginTop: 14 }}>
          {!hideRematch && (
            <>
              <div style={{ fontWeight: 800, color: subColor }}>{rematchText}</div>

              <button
                onClick={onRequestRestart}
                disabled={iAlreadyPressed}
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "none",
                  background: iAlreadyPressed ? "#9ca3af" : "var(--primary)",
                  color: "white",
                  cursor: iAlreadyPressed ? "not-allowed" : "pointer",
                  fontWeight: 900,
                }}
              >
                {iAlreadyPressed ? "Waiting…" : "Play Again"}
              </button>
            </>
          )}

          <button
            onClick={onBackToLobby}
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "var(--text)",
              color: "var(--card)",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              marginLeft: hideRematch ? 0 : 10,
              fontWeight: 900,
            }}
          >
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

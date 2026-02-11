export default function GameStatus({
  gameState,
  isMyTurn,
  playerName,
  onRequestRestart,
  iAlreadyPressed,
  rematchText,
  onBackToLobby,
}) {
  if (!gameState) return null;

  const isWaiting = gameState.status === "Waiting";
  const isPlaying = gameState.status === "Playing";
  const isFinished = gameState.status === "Finished";

  const winner = gameState.winner;

  const bothPlayersPresent =
    !!(gameState.hostName && gameState.hostName.trim()) &&
    !!(gameState.guestName && gameState.guestName.trim());

  return (
    <div style={{ marginTop: 20, fontWeight: "bold" }}>
      {isWaiting && "Waiting for opponent..."}
      {isPlaying && winner == null && (isMyTurn ? "Your turn" : "Opponent’s turn")}
      {isFinished && winner != null && `Winner: ${winner}`}
      {isFinished && winner == null && "Draw"}

      {isFinished && (
        <div style={{ marginTop: 14 }}>
          {bothPlayersPresent ? (
            <>
              <div style={{ fontWeight: 400 }}>{rematchText}</div>

              <button
                onClick={onRequestRestart}
                disabled={!playerName || iAlreadyPressed}
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  cursor: !playerName || iAlreadyPressed ? "not-allowed" : "pointer",
                  opacity: !playerName || iAlreadyPressed ? 0.6 : 1,
                }}
              >
                {iAlreadyPressed ? "Waiting..." : "Play Again"}
              </button>
            </>
          ) : (
            <div style={{ marginTop: 10, fontWeight: 400, color: "#991b1b" }}>
              Opponent left. Rematch is not available.
            </div>
          )}

          <button
            onClick={onBackToLobby}
            style={{
              marginTop: 12,
              marginLeft: bothPlayersPresent ? 10 : 0,
              padding: "8px 12px",
              background: "#111827",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

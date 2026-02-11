export default function Sidebar({
  role,
  hostName,
  setHostName,
  guestName,
  setGuestName,
  sessionId,
  setSessionId,
  createSession,
  joinAsGuest,
  gameState,
  onLeave,
}) {
  const canLeave = role !== null;

  return (
    <div
      style={{
        width: 340,
        padding: 16,
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {role === null && (
        <>
          <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Host</h3>

            <input
              placeholder="Host name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />

            <button onClick={createSession} style={{ width: "100%" }}>
              Create Game
            </button>
          </div>

          <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Guest</h3>

            <input
              placeholder="Guest name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />

            <input
              placeholder="Game code"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              style={{ display: "block", marginBottom: 8, width: "100%" }}
            />

            <button onClick={joinAsGuest} style={{ width: "100%", marginBottom: 8 }}>
              Join Game
            </button>
          </div>
        </>
      )}

      {role !== null && (
        <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>You are in game</h3>

          <div>
            Role: <strong>{role}</strong>
          </div>
          <div style={{ marginTop: 6 }}>
            Session: <strong>{sessionId}</strong>
          </div>

          {canLeave && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to leave the game?")) {
                  onLeave();
                }
              }}
              style={{
                width: "100%",
                marginTop: 12,
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Leave game
            </button>
          )}
        </div>
      )}
    </div>
  );
}

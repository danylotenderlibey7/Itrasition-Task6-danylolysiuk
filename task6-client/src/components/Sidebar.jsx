export default function Sidebar({
  inGame,
  status,
  name,
  playerId,
  stats,
  onResetStats,
  sessionId,
  setSessionId,
  playNow,
  playWithFriend,
  joinByCode,
  onLeave,
  onChangeName,
}) {
  const st = stats ?? { played: 0, wins: 0, losses: 0, draws: 0 };
  const winrate = st.played > 0 ? Math.round((st.wins / st.played) * 100) : 0;

  return (
    <div
      style={{
        width: 340,
        padding: 16,
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "#fff",
      }}
    >
      {!inGame && (
        <>
          <div style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Profile</h3>

            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>Status: {status}</div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name.trim() || "—"}
              </div>

              <button
                onClick={onChangeName}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                Change
              </button>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>Stats</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Winrate: <span style={{ fontWeight: 900 }}>{winrate}%</span>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Played</div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{st.played}</div>
                </div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Wins</div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{st.wins}</div>
                </div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Losses</div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{st.losses}</div>
                </div>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Draws</div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{st.draws}</div>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 11, opacity: 0.7, wordBreak: "break-all" }}>
                PlayerId: {playerId || "—"}
              </div>

              <button
                onClick={() => {
                  if (window.confirm("Reset your local stats?")) onResetStats();
                }}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Reset stats
              </button>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Play</h3>

            <button
              onClick={playNow}
              disabled={!name.trim() || status !== "connected"}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "none",
                background: name.trim() && status === "connected" ? "#111827" : "#9ca3af",
                color: "white",
                cursor: name.trim() && status === "connected" ? "pointer" : "not-allowed",
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              Play Now
            </button>

            <button
              onClick={playWithFriend}
              disabled={!name.trim() || status !== "connected"}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: name.trim() && status === "connected" ? "pointer" : "not-allowed",
                fontWeight: 900,
              }}
            >
              Play with Friend
            </button>
          </div>

          <div style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Join by code</h3>

            <input
              placeholder="Game code"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              style={{
                display: "block",
                marginBottom: 10,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                outline: "none",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
              }}
            />

            <button
              onClick={joinByCode}
              disabled={!name.trim() || !sessionId.trim() || status !== "connected"}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                background: name.trim() && sessionId.trim() && status === "connected" ? "#2563eb" : "#9ca3af",
                color: "white",
                cursor: name.trim() && sessionId.trim() && status === "connected" ? "pointer" : "not-allowed",
                fontWeight: 900,
              }}
            >
              Join
            </button>
          </div>
        </>
      )}

      {inGame && (
        <div style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>In game</h3>

          <button
            onClick={() => {
              if (window.confirm("Leave the game and return to lobby?")) onLeave();
            }}
            style={{
              width: "100%",
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "10px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Leave game
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import GameBoard from "./components/GameBoard.jsx";
import GameStatus from "./components/GameStatus.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ReconnectBanner from "./components/ReconnectBanner.jsx";

export default function App() {
  const API_BASE = "https://localhost:7089";
  const RECONNECT_GRACE_SECONDS = 10;

  const [status, setStatus] = useState("disconnected");
  const [reconnectLeft, setReconnectLeft] = useState(null);

  const [hostName, setHostName] = useState("");
  const [guestName, setGuestName] = useState("");

  const [sessionId, setSessionId] = useState("");
  const [gameState, setGameState] = useState(null);
  const [waitingSessions, setWaitingSessions] = useState([]);

  const [role, setRole] = useState(null);
  const roleRef = useRef(null);

  const connRef = useRef(null);
  const sessionIdRef = useRef("");
  const playerNameRef = useRef("");
  const reconnectTimerRef = useRef(null);

  const playerName =
    role === "host" ? hostName.trim() : role === "guest" ? guestName.trim() : "";

  const mySymbol = role === "host" ? "X" : role === "guest" ? "O" : null;

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    sessionIdRef.current = sessionId.trim();
  }, [sessionId]);

  useEffect(() => {
    playerNameRef.current = playerName.trim();
  }, [playerName]);

  function stopReconnectTimer() {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setReconnectLeft(null);
  }

  function startReconnectTimer() {
    if (reconnectTimerRef.current) return;

    const startedAt = Date.now();
    setReconnectLeft(RECONNECT_GRACE_SECONDS);

    reconnectTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = RECONNECT_GRACE_SECONDS - elapsed;

      if (left <= 0) {
        setReconnectLeft(0);
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
        return;
      }

      setReconnectLeft(left);
    }, 250);
  }

  async function safeInvoke(method, ...args) {
    const conn = connRef.current;
    if (!conn) return false;
    if (conn.state !== signalR.HubConnectionState.Connected) return false;

    try {
      await conn.invoke(method, ...args);
      return true;
    } catch (e) {
      console.error(`invoke ${method} error`, e);
      return false;
    }
  }

  async function loadWaitingSessions() {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/waiting`);
      if (!res.ok) return;
      const data = await res.json();
      setWaitingSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hub/game`)
      .withAutomaticReconnect()
      .build();

    conn.on("SessionUpdated", (state) => {
      if (!roleRef.current) return;
      setGameState(state);
    });

    conn.onreconnecting(() => {
      setStatus("reconnecting");
      startReconnectTimer();
    });

    conn.onreconnected(async () => {
      setStatus("connected");
      stopReconnectTimer();

      const sid = sessionIdRef.current;
      const name = playerNameRef.current;

      if (sid && name) {
        await safeInvoke("Subscribe", sid, name);
      }
    });

    conn.onclose(() => {
      setStatus("disconnected");
      stopReconnectTimer();
    });

    conn
      .start()
      .then(() => {
        connRef.current = conn;
        window.conn = conn;
        setStatus("connected");
      })
      .catch((e) => {
        console.error(e);
        setStatus("error");
      });

    return () => {
      stopReconnectTimer();
      conn.stop();
    };
  }, []);

  useEffect(() => {
    if (role !== null) return;
    if (status !== "connected") return;

    loadWaitingSessions();
    const id = setInterval(loadWaitingSessions, 2000);
    return () => clearInterval(id);
  }, [role, status]);

  async function createSession() {
    const name = hostName.trim();
    if (!name) return;

    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostName: name }),
    });

    if (!res.ok) return;

    const data = await res.json();
    const sid = data.sessionId;

    setSessionId(sid);
    setRole("host");

    await safeInvoke("Subscribe", sid, name);
  }

  async function joinAsGuest() {
    const name = guestName.trim();
    const sid = sessionId.trim();
    if (!name || !sid) return;

    setRole("guest");
    await safeInvoke("Subscribe", sid, name);
    await safeInvoke("JoinSession", sid);
  }

  async function makeMove(index) {
    const sid = sessionIdRef.current;
    if (!sid) return;
    await safeInvoke("MakeMove", sid, index);
  }

  async function requestRestart() {
    const sid = sessionIdRef.current;
    if (!sid) return;
    await safeInvoke("RequestRestart", sid);
  }

  async function leaveGame() {
    const sid = sessionIdRef.current;
    if (sid) await safeInvoke("LeaveSession", sid);

    stopReconnectTimer();

    setRole(null);
    setGameState(null);
    setSessionId("");
  }

  async function backToLobby() {
    await leaveGame();
  }

  const inGame = role !== null && gameState !== null;

  const isPlaying = !!(gameState && gameState.status === "Playing");
  const isFinished = !!(gameState && gameState.status === "Finished");
  const currentTurnStr = gameState?.currentTurn?.toString();
  const isMyTurn = !!(gameState && mySymbol && currentTurnStr === mySymbol);

  const canMove = !!(
    gameState &&
      status === "connected" &&
      isPlaying &&
      gameState.winner === null &&
      isMyTurn
  );

  const iAmHost = !!(gameState && playerName && playerName === gameState.hostName);
  const iAmGuest = !!(gameState && playerName && playerName === gameState.guestName);
  const hostPressed = !!gameState?.hostWantsRevenge;
  const guestPressed = !!gameState?.guestWantsRevenge;
  const iAlreadyPressed = (iAmHost && hostPressed) || (iAmGuest && guestPressed);

  let rematchText = "";
  if (isFinished) {
    if (!hostPressed && !guestPressed) rematchText = "Rematch: waiting for both players...";
    if (hostPressed && !guestPressed) rematchText = "Host confirmed. Waiting for guest...";
    if (!hostPressed && guestPressed) rematchText = "Guest confirmed. Waiting for host...";
    if (hostPressed && guestPressed) rematchText = "Both confirmed. Restarting...";
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <Sidebar
        role={role}
        hostName={hostName}
        setHostName={setHostName}
        guestName={guestName}
        setGuestName={setGuestName}
        sessionId={sessionId}
        setSessionId={setSessionId}
        createSession={createSession}
        joinAsGuest={joinAsGuest}
        gameState={gameState}
        onLeave={leaveGame}
      />

      <div style={{ flex: 1, background: "#f3f4f6", padding: 24 }}>
        {!inGame ? (
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2 style={{ margin: 0 }}>Lobby</h2>
            <div style={{ marginTop: 6, opacity: 0.8 }}>Status: {status}</div>
            <ReconnectBanner status={status} reconnectLeft={reconnectLeft} />

            <div style={{ marginTop: 16 }}>
              {waitingSessions.length === 0 ? (
                <div style={{ opacity: 0.8 }}>No waiting games yet. Create one on the left.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {waitingSessions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => setSessionId(s.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{s.hostName}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{s.id}</div>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>click to use code</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2 style={{ margin: 0 }}>Multiplayer Tic-Tac-Toe</h2>
            <div style={{ marginTop: 6, opacity: 0.8 }}>Status: {status}</div>
            <ReconnectBanner status={status} reconnectLeft={reconnectLeft} />

            {role === "host" && hostName.trim() && sessionId.trim() && (
              <div style={{ marginTop: 12 }}>
                <strong>Game Code:</strong> {sessionId}
              </div>
            )}

            <GameStatus
              gameState={gameState}
              isMyTurn={isMyTurn}
              playerName={playerName}
              onRequestRestart={requestRestart}
              iAlreadyPressed={iAlreadyPressed}
              rematchText={rematchText}
              onBackToLobby={backToLobby}
            />

            <div style={{ position: "relative" }}>
              <GameBoard
                cells={gameState?.cells}
                winningLine={gameState?.winningLine}
                canMove={canMove}
                onMove={makeMove}
              />

              {status === "reconnecting" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 20,
                    borderRadius: 12,
                  }}
                >
                  Reconnecting...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

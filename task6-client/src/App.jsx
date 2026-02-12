import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import "./App.css";

import GameBoard from "./components/GameBoard.jsx";
import GameStatus from "./components/GameStatus.jsx";
import Toast from "./components/Toast.jsx";
import NameModal from "./components/NameModal.jsx";
import IconRail from "./components/IconRail.jsx";
import SidePanel from "./components/SidePanel.jsx";

function getOrCreatePlayerId() {
  let id = (localStorage.getItem("ttt_playerId") ?? "").trim();
  if (id) return id;

  try {
    id = crypto.randomUUID();
  } catch {
    id = "pid_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  localStorage.setItem("ttt_playerId", id);
  return id;
}

function readStats() {
  try {
    const raw = localStorage.getItem("ttt_stats");
    if (!raw) return { played: 0, wins: 0, losses: 0, draws: 0 };
    const obj = JSON.parse(raw);
    return {
      played: Number(obj.played) || 0,
      wins: Number(obj.wins) || 0,
      losses: Number(obj.losses) || 0,
      draws: Number(obj.draws) || 0,
    };
  } catch {
    return { played: 0, wins: 0, losses: 0, draws: 0 };
  }
}

function writeStats(stats) {
  localStorage.setItem("ttt_stats", JSON.stringify(stats));
}

export default function App() {
  const GRACE_SECONDS = 10;
  const AUTO_RETURN_SECONDS = 20;

  const [status, setStatus] = useState("disconnected");

  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [gameState, setGameState] = useState(null);

  const [waitingSessions, setWaitingSessions] = useState([]);
  const [playingSessions, setPlayingSessions] = useState([]);

  const [role, setRole] = useState(null);
  const roleRef = useRef(null);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [disconnectInfo, setDisconnectInfo] = useState(null);
  const dcTimerRef = useRef(null);

  const [autoReturnLeft, setAutoReturnLeft] = useState(null);
  const autoReturnTimerRef = useRef(null);
  const autoReturnDisabledRef = useRef(false);

  const connRef = useRef(null);
  const sessionIdRef = useRef("");
  const playerNameRef = useRef("");

  const [nameOpen, setNameOpen] = useState(false);

  const [playerId, setPlayerId] = useState("");
  const [stats, setStats] = useState(() => readStats());

  const prevStatusRef = useRef(null);
  const lastCountedSigRef = useRef("");

  const [panel, setPanel] = useState(null);
  const [theme, setTheme] = useState(() => (localStorage.getItem("ttt_theme") ?? "dark"));

  const playerName = name.trim();

  const mySymbol = (() => {
    if (!gameState || !playerName) return null;
    const hn = (gameState.hostName ?? "").trim();
    const gn = (gameState.guestName ?? "").trim();
    if (playerName === hn) return (gameState.hostSymbol ?? "").toString();
    if (playerName === gn) return (gameState.guestSymbol ?? "").toString();
    return null;
  })();

  useEffect(() => {
    const pid = getOrCreatePlayerId();
    setPlayerId(pid);

    const savedName = (localStorage.getItem("ttt_name") ?? "").trim();
    if (savedName) {
      setName(savedName);
      setNameOpen(false);
    } else {
      setNameOpen(true);
    }

    setStats(readStats());

    const t = (localStorage.getItem("ttt_theme") ?? "dark").trim();
    const final = t === "light" ? "light" : "dark";
    setTheme(final);
    document.documentElement.setAttribute("data-theme", final);
  }, []);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    sessionIdRef.current = sessionId.trim();
  }, [sessionId]);

  useEffect(() => {
    playerNameRef.current = playerName.trim();
  }, [playerName]);

  function showToast(text, ms = 3000) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(text);
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  }

  function saveName(n) {
    const clean = (n ?? "").trim();
    if (!clean) return;
    localStorage.setItem("ttt_name", clean);
    setName(clean);
    setNameOpen(false);
    showToast(`Hi, ${clean}!`, 1600);
  }

  function resetStats() {
    const zero = { played: 0, wins: 0, losses: 0, draws: 0 };
    writeStats(zero);
    setStats(zero);
    lastCountedSigRef.current = "";
    showToast("Stats reset", 1400);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ttt_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    showToast("Theme updated", 1200);
  }

  function timeAgo(dateStr) {
    const t = new Date(dateStr).getTime();
    if (!Number.isFinite(t)) return "";
    const diff = Date.now() - t;

    const sec = Math.floor(diff / 1000);
    if (sec < 10) return "just now";
    if (sec < 60) return `${sec}s ago`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;

    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;

    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        return true;
      } catch {
        return false;
      }
    }
  }

  function buildInviteLink(sid) {
    const base = window.location.origin + window.location.pathname;
    const url = new URL(base, window.location.origin);
    url.searchParams.set("join", sid);
    return url.toString();
  }

  async function inviteFriend() {
    if (!(role !== null) || !sessionId.trim()) {
      showToast("Start a game to share an invite link", 1600);
      return;
    }
    const sid = sessionId.trim();
    const link = buildInviteLink(sid);
    const ok = await copyText(link);
    if (ok) showToast("Invite link copied", 1800);
    else showToast("Copy failed", 1800);
  }

  function stopDcTimer() {
    if (dcTimerRef.current) clearInterval(dcTimerRef.current);
    dcTimerRef.current = null;
  }

  function startDcTimer(totalSeconds, oppName) {
    stopDcTimer();
    setDisconnectInfo({ playerName: oppName, leftSeconds: totalSeconds });

    dcTimerRef.current = setInterval(() => {
      setDisconnectInfo((prev) => {
        if (!prev) return prev;
        const next = prev.leftSeconds - 1;
        if (next <= 0) {
          stopDcTimer();
          return { ...prev, leftSeconds: 0 };
        }
        return { ...prev, leftSeconds: next };
      });
    }, 1000);
  }

  function resetDisconnectInfo() {
    stopDcTimer();
    setDisconnectInfo(null);
  }

  function stopAutoReturn() {
    if (autoReturnTimerRef.current) clearInterval(autoReturnTimerRef.current);
    autoReturnTimerRef.current = null;
    setAutoReturnLeft(null);
  }

  function disableAutoReturn() {
    autoReturnDisabledRef.current = true;
    stopAutoReturn();
  }

  function enableAutoReturn() {
    autoReturnDisabledRef.current = false;
  }

  function startAutoReturn() {
    stopAutoReturn();
    setAutoReturnLeft(AUTO_RETURN_SECONDS);

    autoReturnTimerRef.current = setInterval(() => {
      setAutoReturnLeft((prev) => {
        if (prev === null) return prev;
        const next = prev - 1;
        if (next <= 0) {
          stopAutoReturn();
          backToLobby();
          return null;
        }
        return next;
      });
    }, 1000);
  }

  // ✅ ВАЖНО: чистим refs, чтобы клиент реально "отлип" от сессии
  function forceDetachLocalSession() {
    roleRef.current = null;
    sessionIdRef.current = "";
  }

  function backToLobby() {
    disableAutoReturn();
    forceDetachLocalSession();
    resetDisconnectInfo();
    stopAutoReturn();
    enableAutoReturn();
    setRole(null);
    setGameState(null);
    setSessionId("");
  }

  useEffect(() => {
    const apiBaseUrl = "https://localhost:7089";

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hub/game`)
      .withAutomaticReconnect()
      .build();

    conn.on("SessionUpdated", (state) => {
      setGameState((prev) => {
        const prevStatus = prev?.status;
        const nextStatus = state?.status;

        if (nextStatus !== "Finished") {
          stopAutoReturn();
          enableAutoReturn();
        }

        if (nextStatus === "Waiting") resetDisconnectInfo();

        if ((prevStatus === "Playing" || prevStatus === "Finished") && nextStatus === "Waiting") {
          showToast("Opponent left the game");
          resetDisconnectInfo();
          stopAutoReturn();
          enableAutoReturn();
        }

        return state;
      });
    });

    // ✅ ЯВНЫЙ/ФИНАЛЬНЫЙ УХОД ОППОНЕНТА
    conn.on("OpponentLeft", (payload) => {
      console.log("OpponentLeft:", payload);
      if (!roleRef.current) return;
      const pn = ((payload?.playerName ?? "Opponent") + "").trim();
      showToast(`${pn} left the game`, 2200);
      backToLobby();
    });

    conn.on("OpponentDisconnected", ({ playerName, seconds }) => {
      if (!roleRef.current) return;
      const s = typeof seconds === "number" ? seconds : GRACE_SECONDS;
      showToast(`${(playerName ?? "Opponent").trim()} disconnected`, 2200);
      startDcTimer(s, (playerName ?? "").trim() || "Opponent");
    });

    conn.on("OpponentReconnected", ({ playerName }) => {
      if (!roleRef.current) return;
      showToast(`${(playerName ?? "Opponent").trim()} reconnected`, 2000);
      resetDisconnectInfo();
    });

    conn.onreconnecting(() => setStatus("reconnecting"));

    conn.onreconnected(async () => {
      setStatus("connected");
      const sid = sessionIdRef.current;
      const nm = playerNameRef.current;
      if (sid && nm) {
        try {
          await conn.invoke("Subscribe", sid, nm);
        } catch {}
      }
    });

    conn.onclose(() => setStatus("disconnected"));

    conn
      .start()
      .then(() => {
        connRef.current = conn;
        setStatus("connected");
      })
      .catch(() => setStatus("error"));

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      stopDcTimer();
      stopAutoReturn();
      conn.stop();
    };
  }, []);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const join = (url.searchParams.get("join") ?? "").trim();
      if (!join) return;

      setSessionId(join);
      showToast("Invite loaded. Click Join (or click a waiting card).", 2600);

      url.searchParams.delete("join");
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }, []);

  async function loadLobby() {
    try {
      const [wRes, pRes] = await Promise.all([
        fetch("https://localhost:7089/api/sessions/waiting"),
        fetch("https://localhost:7089/api/sessions/playing"),
      ]);

      const w = wRes.ok ? await wRes.json() : [];
      const p = pRes.ok ? await pRes.json() : [];

      setWaitingSessions(Array.isArray(w) ? w : []);
      setPlayingSessions(Array.isArray(p) ? p : []);
    } catch {
      setWaitingSessions([]);
      setPlayingSessions([]);
    }
  }

  useEffect(() => {
    if (gameState) return;
    if (status !== "connected") return;

    loadLobby();
    const id = setInterval(loadLobby, 3000);
    return () => clearInterval(id);
  }, [gameState, status]);

  async function handleQuickJoinWaiting(sid) {
    const n = name.trim();
    const s = (sid ?? "").toString().trim();

    if (nameOpen) return showToast("Enter your name first");
    if (!n) return showToast("Enter your name");
    if (!s) return showToast("No session id");
    if (status !== "connected") return showToast("Not connected yet");

    try {
      roleRef.current = "guest";
      setRole("guest");
      setSessionId(s);
      resetDisconnectInfo();
      stopAutoReturn();
      enableAutoReturn();

      const conn = connRef.current;
      if (!conn) throw new Error("No connection");

      await conn.invoke("Subscribe", s, n);
      await conn.invoke("JoinSession", s);
    } catch {
      showToast("Join failed. Maybe someone already joined.");
    }
  }

  async function playNow() {
    if (nameOpen) return showToast("Enter your name first");
    const n = name.trim();
    if (!n) return showToast("Enter your name");
    if (status !== "connected") return showToast("Not connected yet");

    try {
      const res = await fetch("https://localhost:7089/api/sessions/quickmatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: n }),
      });

      if (!res.ok) throw new Error("quickmatch failed");

      const data = await res.json();
      const sid = (data.sessionId ?? "").toString();
      const r = (data.role ?? "").toString();

      if (!sid || (r !== "host" && r !== "guest")) throw new Error("bad response");

      roleRef.current = r;
      setSessionId(sid);
      setRole(r);
      resetDisconnectInfo();
      stopAutoReturn();
      enableAutoReturn();

      const conn = connRef.current;
      if (!conn) throw new Error("No connection");

      await conn.invoke("Subscribe", sid, n);
    } catch {
      showToast("Play Now failed");
    }
  }

  async function playWithFriend() {
    if (nameOpen) return showToast("Enter your name first");
    const n = name.trim();
    if (!n) return showToast("Enter your name");
    if (status !== "connected") return showToast("Not connected yet");

    try {
      const res = await fetch("https://localhost:7089/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: n }),
      });

      if (!res.ok) throw new Error("create failed");

      const data = await res.json();
      const sid = (data.sessionId ?? "").toString();
      if (!sid) throw new Error("bad response");

      roleRef.current = "host";
      setSessionId(sid);
      setRole("host");
      resetDisconnectInfo();
      stopAutoReturn();
      enableAutoReturn();

      const conn = connRef.current;
      if (!conn) throw new Error("No connection");
      await conn.invoke("Subscribe", sid, n);

      showToast("Game created. Share the invite link.", 1800);
    } catch {
      showToast("Create game failed");
    }
  }

  async function joinByCode() {
    if (nameOpen) return showToast("Enter your name first");

    const n = name.trim();
    const sid = sessionId.trim();
    if (!n) return showToast("Enter your name");
    if (!sid) return showToast("Enter game code");
    if (status !== "connected") return showToast("Not connected yet");

    try {
      roleRef.current = "guest";
      setRole("guest");
      resetDisconnectInfo();
      stopAutoReturn();
      enableAutoReturn();

      const conn = connRef.current;
      if (!conn) throw new Error("No connection");

      await conn.invoke("Subscribe", sid, n);
      await conn.invoke("JoinSession", sid);
    } catch {
      showToast("Join failed. Check the code.");
    }
  }

  async function makeMove(index) {
    const conn = connRef.current;
    const sid = sessionIdRef.current || sessionId.trim();
    if (!conn || !sid) return;
    try {
      await conn.invoke("MakeMove", sid, index);
    } catch {}
  }

  async function requestRestart() {
    disableAutoReturn();
    const conn = connRef.current;
    const sid = sessionIdRef.current || sessionId.trim();
    if (!conn || !sid) return;
    try {
      await conn.invoke("RequestRestart", sid);
    } catch {}
  }

  // ✅ leaveGame тоже чистит refs (важно)
  async function leaveGame() {
    disableAutoReturn();

    const conn = connRef.current;
    const sid = sessionIdRef.current || sessionId.trim();

    forceDetachLocalSession();

    if (conn && sid) {
      try {
        await conn.invoke("LeaveSession", sid);
      } catch {}
    }

    resetDisconnectInfo();
    stopAutoReturn();
    enableAutoReturn();
    setRole(null);
    setGameState(null);
    setSessionId("");
  }

  function stayOnResult() {
    disableAutoReturn();
    showToast("Auto-return cancelled", 1500);
  }

  const isPlaying = gameState?.status === "Playing";
  const isFinished = gameState?.status === "Finished";
  const currentTurnStr = gameState?.currentTurn?.toString();
  const isMyTurn = !!(gameState && mySymbol && currentTurnStr === mySymbol);

  const canMove = !!(gameState && status === "connected" && isPlaying && gameState.winner === null && isMyTurn);

  const iAmHost = !!(gameState && playerName && playerName === (gameState.hostName ?? "").trim());
  const iAmGuest = !!(gameState && playerName && playerName === (gameState.guestName ?? "").trim());

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

  const opponentMissing =
    role === "host"
      ? !(gameState?.guestName ?? "").trim()
      : role === "guest"
      ? !(gameState?.hostName ?? "").trim()
      : false;

  const hideRematch = opponentMissing;

  useEffect(() => {
    if (!gameState) return;

    if (gameState.status !== "Finished") {
      stopAutoReturn();
      enableAutoReturn();
      return;
    }

    if (autoReturnDisabledRef.current) return;
    if (iAlreadyPressed) return;

    startAutoReturn();
    return () => stopAutoReturn();
  }, [gameState?.status, iAlreadyPressed]);

  useEffect(() => {
    if (!gameState) return;

    const statusNow = String(gameState.status ?? "");
    const statusPrev = String(prevStatusRef.current ?? "");
    prevStatusRef.current = statusNow;

    if (statusNow !== "Finished") return;
    if (statusPrev === "Finished") return;
    if (!playerName) return;

    const sid = (sessionIdRef.current || sessionId || "").toString().trim();

    const cellsSig = Array.isArray(gameState.cells)
      ? gameState.cells.map((c) => (c === null || c === undefined ? "_" : String(c))).join("")
      : "";

    const winSig = Array.isArray(gameState.winningLine) ? gameState.winningLine.join(",") : "";
    const winnerSig = gameState.winner == null ? "DRAW" : String(gameState.winner);

    const sig = `sid:${sid}|cells:${cellsSig}|win:${winSig}|winner:${winnerSig}`;
    if (lastCountedSigRef.current === sig) return;
    lastCountedSigRef.current = sig;

    let result = "loss";
    if (gameState.winner == null) result = "draw";
    else {
      const w = String(gameState.winner).trim();
      if (playerName && w === playerName) result = "win";
      else if (mySymbol && w === String(mySymbol)) result = "win";
      else result = "loss";
    }

    const next = { ...readStats() };
    next.played += 1;
    if (result === "win") next.wins += 1;
    if (result === "loss") next.losses += 1;
    if (result === "draw") next.draws += 1;

    writeStats(next);
    setStats(next);
  }, [gameState, playerName, mySymbol, sessionId]);

  const st = stats ?? { played: 0, wins: 0, losses: 0, draws: 0 };
  const winrate = st.played > 0 ? Math.round((st.wins / st.played) * 100) : 0;

  const panelTitle = panel === "profile" ? "Profile" : panel === "stats" ? "Stats" : "";

  return (
    <>
      <Toast text={toast} />
      <NameModal open={nameOpen} initialName={name} onSave={saveName} />

      <div className="appRoot">
        <div className="navWrap">
          <IconRail
            active={panel}
            setActive={setPanel}
            onShare={inviteFriend}
            theme={theme}
            toggleTheme={toggleTheme}
            inGame={role !== null}
          />
        </div>

        <SidePanel open={!!panel} title={panelTitle} onClose={() => setPanel(null)}>
          {panel === "profile" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                Status: {status}
              </div>

              <div className="card" style={{ background: "var(--card2)", borderRadius: 14, padding: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Name
                </div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{name.trim() || "—"}</div>

                <button
                  className="btn"
                  style={{ marginTop: 10, background: "var(--card)", borderRadius: 12 }}
                  onClick={() => {
                    if (role !== null) return showToast("You can't change name while in game", 1600);
                    setNameOpen(true);
                  }}
                >
                  Change name
                </button>

                <div className="muted" style={{ marginTop: 10, fontSize: 11, wordBreak: "break-all" }}>
                  PlayerId: {playerId}
                </div>
              </div>
            </div>
          )}

          {panel === "stats" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="card" style={{ background: "var(--card2)", borderRadius: 14, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>Stats</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Winrate: <span style={{ fontWeight: 900, color: "var(--text)" }}>{winrate}%</span>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["Played", st.played],
                    ["Wins", st.wins],
                    ["Losses", st.losses],
                    ["Draws", st.draws],
                  ].map(([label, val]) => (
                    <div key={label} className="card" style={{ background: "var(--card)", borderRadius: 14, padding: 10 }}>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {label}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>{val}</div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn"
                  style={{ marginTop: 10, background: "var(--card)" }}
                  onClick={() => {
                    if (window.confirm("Reset your local stats?")) resetStats();
                  }}
                >
                  Reset stats
                </button>
              </div>
            </div>
          )}
        </SidePanel>

        <div className="appMain">
          {!gameState ? (
            <div className="gridLobby">
              <div className="actionsCol">
                <div className="actionsBlock card">
                  <div className="actionsBlockTitle">Play</div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                    Status: {status}
                  </div>

                  <button className="btn btnPrimary" onClick={playNow} disabled={!name.trim() || status !== "connected" || role !== null}>
                    Play Now
                  </button>

                  <button className="btn" style={{ marginTop: 10 }} onClick={playWithFriend} disabled={!name.trim() || status !== "connected" || role !== null}>
                    Play with Friend
                  </button>
                </div>

                <div className="actionsBlock card">
                  <div className="actionsBlockTitle">Join by code</div>

                  <input className="input inputMono" placeholder="Game code" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />

                  <button
                    className="btn btnPrimary"
                    style={{ marginTop: 10 }}
                    onClick={joinByCode}
                    disabled={!name.trim() || !sessionId.trim() || status !== "connected" || role !== null}
                  >
                    Join
                  </button>
                </div>
              </div>

              <div className="card cardPad">
                <div className="topRow">
                  <h2 className="hTitle">Lobby</h2>
                </div>

                <div style={{ marginTop: 18 }}>
                  <h3 style={{ margin: 0 }}>Waiting Games</h3>
                  <div className="muted" style={{ marginTop: 6 }}>
                    Click a card to join instantly.
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {waitingSessions.length === 0 ? (
                      <div className="muted">No waiting games right now.</div>
                    ) : (
                      <div className="list">
                        {waitingSessions.map((s) => (
                          <div
                            key={s.id}
                            className="lobbyItem"
                            onClick={() => handleQuickJoinWaiting(s.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <div>
                              <div style={{ fontWeight: 900 }}>{(s.hostName ?? "").toString()} vs waiting...</div>
                              <div className="lobbyItemSub">Created {timeAgo(s.createdAt)}</div>
                              <div className="lobbyItemSub">{s.id}</div>
                            </div>

                            <button
                              className="smallBtn smallBtnPrimary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickJoinWaiting(s.id);
                              }}
                            >
                              Join
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <h3 style={{ margin: 0 }}>Live Games</h3>

                  <div style={{ marginTop: 12 }}>
                    {playingSessions.length === 0 ? (
                      <div className="muted">No live games.</div>
                    ) : (
                      <div className="list">
                        {playingSessions.map((s) => (
                          <div key={s.id} className="lobbyItem" style={{ background: "var(--card2)" }}>
                            <div>
                              <div style={{ fontWeight: 900 }}>
                                {(s.hostName ?? "").toString()} vs {(s.guestName ?? "").toString()}
                              </div>
                              <div className="lobbyItemSub">Playing • Created {timeAgo(s.createdAt)}</div>
                              <div className="lobbyItemSub">{s.id}</div>
                            </div>

                            <button className="smallBtn" disabled>
                              In progress
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="gridGame">
              <div className="actionsCol">
                <div className="actionsBlock card">
                  <div className="actionsBlockTitle">Game</div>

                  <div className="muted" style={{ fontSize: 12 }}>
                    Status: {status}
                  </div>

                  {role === "host" && (
                    <div style={{ marginTop: 10 }}>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Game code
                      </div>
                      <div className="input inputMono" style={{ display: "block", marginTop: 6 }}>
                        {sessionId}
                      </div>

                      <button className="btn btnPrimary" style={{ marginTop: 10 }} onClick={inviteFriend}>
                        Copy invite link
                      </button>
                    </div>
                  )}

                  <button
                    className="btn btnDanger"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      if (window.confirm("Leave the game and return to lobby?")) leaveGame();
                    }}
                  >
                    Leave game
                  </button>
                </div>
              </div>

              <div className="centerGame">
                <div className="card cardPad gameWrap">
                  {isFinished && autoReturnLeft !== null && !iAlreadyPressed && (
                    <div className="banner">
                      <div>Returning to lobby in {autoReturnLeft}s</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="smallBtn" onClick={stayOnResult}>
                          Stay
                        </button>
                        <button className="smallBtn smallBtnPrimary" onClick={backToLobby}>
                          Back now
                        </button>
                      </div>
                    </div>
                  )}

                  <GameStatus
                    gameState={gameState}
                    isMyTurn={isMyTurn}
                    onRequestRestart={requestRestart}
                    iAlreadyPressed={iAlreadyPressed}
                    rematchText={rematchText}
                    onBackToLobby={backToLobby}
                    hideRematch={hideRematch}
                    disconnectInfo={disconnectInfo}
                  />

                  <div style={{ position: "relative" }}>
                    <GameBoard cells={gameState?.cells} winningLine={gameState?.winningLine} canMove={canMove} onMove={makeMove} />

                    {status === "reconnecting" && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 900,
                          fontSize: 18,
                          borderRadius: 16,
                        }}
                      >
                        Reconnecting...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

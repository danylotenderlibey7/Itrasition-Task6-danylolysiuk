using Task6.Dtos;
using Task6.Models;
using Task6.Services.Interfaces;

namespace Task6.Services
{
    public class GameSessionsService : IGameSessionsService
    {
        private readonly Dictionary<Guid, GameSession> _sessions = new();
        private readonly object _lock = new();

        public QuickMatchResponse QuickMatch(string playerName)
        {
            playerName = (playerName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                throw new Exception("Invalid username");

            lock (_lock)
            {
                var waiting = _sessions.Values
                    .Where(s => s.Status == GameSessionStatus.Waiting)
                    .OrderBy(s => s.CreatedAt)
                    .FirstOrDefault();

                if (waiting != null)
                {
                    waiting.Join(playerName);
                    return new QuickMatchResponse
                    {
                        SessionId = waiting.Id,
                        Role = "guest"
                    };
                }

                var session = new GameSession(playerName);
                _sessions[session.Id] = session;

                return new QuickMatchResponse
                {
                    SessionId = session.Id,
                    Role = "host"
                };
            }
        }

        public Guid CreateSession(string hostName)
        {
            hostName = (hostName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(hostName))
                throw new Exception("Invalid username");

            var session = new GameSession(hostName);
            lock (_lock)
            {
                _sessions[session.Id] = session;
            }
            return session.Id;
        }

        public GameSession GetById(Guid id)
        {
            lock (_lock)
            {
                if (!_sessions.TryGetValue(id, out var session))
                    throw new Exception("Unexistent game");
                return session;
            }
        }

        public List<GameSession> GetListWaiting()
        {
            lock (_lock)
            {
                return _sessions.Values
                    .Where(s => s.Status == GameSessionStatus.Waiting)
                    .ToList();
            }
        }

        public List<GameSession> GetListPlaying()
        {
            lock (_lock)
            {
                return _sessions.Values
                    .Where(s => s.Status == GameSessionStatus.Playing)
                    .ToList();
            }
        }

        public void JoinSession(Guid sessionId, string guestName)
        {
            guestName = (guestName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(guestName))
                throw new Exception("Invalid username");

            lock (_lock)
            {
                if (!_sessions.TryGetValue(sessionId, out var session))
                    throw new Exception("Session not found");

                session.Join(guestName);
            }
        }

        public bool LeaveSession(Guid sessionId, string playerName)
        {
            playerName = (playerName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                return false;

            lock (_lock)
            {
                if (!_sessions.TryGetValue(sessionId, out var session))
                {
                    return false;
                }

                try
                {
                    var shouldDelete = session.Leave(playerName);
                    if (shouldDelete)
                    {
                        _sessions.Remove(sessionId);
                    }
                    return shouldDelete;
                }
                catch
                {
                    return false;
                }
            }
        }
        public void MakeMoveSession(Guid sessionId, string playerName, int cellIndex)
        {
            playerName = (playerName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                throw new Exception("Invalid username");

            lock (_lock)
            {
                if (!_sessions.TryGetValue(sessionId, out var session))
                    throw new Exception("Session not found");
                session.MakePlayerMove(playerName, cellIndex);
            }
        }
        public void RequestRestart(Guid sessionId, string playerName)
        {
            playerName = (playerName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                throw new Exception("Invalid username");

            lock (_lock)
            {
                if (!_sessions.TryGetValue(sessionId, out var session))
                    throw new Exception("Session not found");
                session.RequestRestart(playerName);
            }
        }

        public SessionStateDto GetSessionState(Guid sessionId)
        {
            lock (_lock)
            {
                if (!_sessions.TryGetValue(sessionId, out var session))
                    throw new Exception("Session not found");

                var cellsCopy = new PlayerSymbol?[session.Game.Board.Cells.Length];
                Array.Copy(session.Game.Board.Cells, cellsCopy, session.Game.Board.Cells.Length);

                return new SessionStateDto
                {
                    SessionId = session.Id,
                    Status = session.Status,
                    HostName = session.HostName,
                    GuestName = session.GuestName,
                    Cells = cellsCopy,
                    CurrentTurn = session.Game.CurrentTurn,
                    Winner = session.Game.Winner,
                    WinningLine = session.Game.WinningLine,
                    HostWantsRevenge = session.HostWantsRevenge,
                    GuestWantsRevenge = session.GuestWantsRevenge,
                    HostSymbol = session.HostSymbol,
                    GuestSymbol = session.GuestSymbol
                };
            }
        }
    }
}
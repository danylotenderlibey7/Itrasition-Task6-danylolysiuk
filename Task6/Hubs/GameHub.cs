using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using Task6.Dtos;
using Task6.Services.Interfaces;

namespace Task6.Hubs
{
    public class GameHub : Hub
    {
        private const int GRACE_SECONDS = 10;

        private readonly IGameSessionsService _service;
        private readonly IHubContext<GameHub> _hub;

        private static readonly ConcurrentDictionary<string, (Guid sessionId, string playerName)> _connections = new();
        private static readonly ConcurrentDictionary<string, CancellationTokenSource> _pendingDisconnects = new();

        private static string Key(Guid sessionId, string playerName)
            => $"{sessionId:N}|{playerName.Trim().ToLowerInvariant()}";

        public GameHub(IGameSessionsService service, IHubContext<GameHub> hub)
        {
            _service = service;
            _hub = hub;
        }

        public async Task Subscribe(Guid sessionId, string playerName)
        {
            playerName = (playerName ?? "").Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                throw new HubException("Invalid username");

            var key = Key(sessionId, playerName);

            if (_pendingDisconnects.TryRemove(key, out var cts))
            {
                cts.Cancel();
                cts.Dispose();

                var group = sessionId.ToString();
                await _hub.Clients.Group(group).SendAsync("OpponentReconnected", new
                {
                    playerName
                });
            }

            var g = sessionId.ToString();
            await Groups.AddToGroupAsync(Context.ConnectionId, g);
            _connections[Context.ConnectionId] = (sessionId, playerName);

            var state = _service.GetSessionState(sessionId);
            await Clients.Caller.SendAsync("SessionUpdated", state);
        }

        public async Task JoinSession(Guid sessionId)
        {
            var info = RequireBinding(sessionId);
            var group = sessionId.ToString();

            _service.JoinSession(sessionId, info.playerName);

            var state = _service.GetSessionState(sessionId);
            await _hub.Clients.Group(group).SendAsync("SessionUpdated", state);
        }

        public async Task MakeMove(Guid sessionId, int cellIndex)
        {
            var info = RequireBinding(sessionId);
            var group = sessionId.ToString();

            _service.MakeMoveSession(sessionId, info.playerName, cellIndex);

            var state = _service.GetSessionState(sessionId);
            await _hub.Clients.Group(group).SendAsync("SessionUpdated", state);
        }

        public async Task RequestRestart(Guid sessionId)
        {
            var info = RequireBinding(sessionId);
            var group = sessionId.ToString();

            _service.RequestRestart(sessionId, info.playerName);

            var state = _service.GetSessionState(sessionId);
            await _hub.Clients.Group(group).SendAsync("SessionUpdated", state);
        }
        public async Task LeaveSession(Guid sessionId)
        {
            var info = RequireBinding(sessionId);
            var group = sessionId.ToString();

            var playerName = (info.playerName ?? "").Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                throw new HubException("Invalid username");

            var key = Key(sessionId, playerName);
            if (_pendingDisconnects.TryRemove(key, out var cts))
            {
                try { cts.Cancel(); } catch { }
                cts.Dispose();
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
            _connections.TryRemove(Context.ConnectionId, out _);

            bool shouldDelete = _service.LeaveSession(sessionId, playerName);

            await _hub.Clients.Group(group).SendAsync("OpponentLeft", new
            {
                playerName
            });

            if (!shouldDelete)
            {
                var state = _service.GetSessionState(sessionId);
                await _hub.Clients.Group(group).SendAsync("SessionUpdated", state);
            }
        }
        public override Task OnDisconnectedAsync(Exception? exception)
        {
            if (_connections.TryRemove(Context.ConnectionId, out var info))
            {
                var sessionId = info.sessionId;
                var playerName = (info.playerName ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(playerName))
                {
                    var group = sessionId.ToString();
                    var key = Key(sessionId, playerName);

                    var cts = new CancellationTokenSource();

                    if (_pendingDisconnects.TryRemove(key, out var old))
                    {
                        try { old.Cancel(); } catch { }
                        old.Dispose();
                    }

                    _pendingDisconnects[key] = cts;

                    _ = _hub.Clients.Group(group).SendAsync("OpponentDisconnected", new
                    {
                        playerName,
                        seconds = GRACE_SECONDS
                    });

                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await Task.Delay(TimeSpan.FromSeconds(GRACE_SECONDS), cts.Token);

                            if (_pendingDisconnects.TryRemove(key, out var myCts))
                            {
                                myCts.Dispose();

                                bool shouldDelete = _service.LeaveSession(sessionId, playerName);

                                await _hub.Clients.Group(group).SendAsync("OpponentLeft", new
                                {
                                    playerName
                                });

                                if (!shouldDelete)
                                {
                                    var state = _service.GetSessionState(sessionId);
                                    await _hub.Clients.Group(group).SendAsync("SessionUpdated", state);
                                }
                            }
                        }
                        catch (TaskCanceledException) { }
                        catch { }
                    });
                }
            }

            return base.OnDisconnectedAsync(exception);
        }
        private (Guid sessionId, string playerName) RequireBinding(Guid sessionId)
        {
            if (!_connections.TryGetValue(Context.ConnectionId, out var info))
                throw new HubException("Not subscribed");

            if (info.sessionId != sessionId)
                throw new HubException("Invalid session binding");

            if (string.IsNullOrWhiteSpace(info.playerName))
                throw new HubException("Invalid username");

            return info;
        }
    }
}

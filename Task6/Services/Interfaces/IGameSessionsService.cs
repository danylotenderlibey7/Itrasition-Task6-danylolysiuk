using Task6.Dtos;
using Task6.Models;

namespace Task6.Services.Interfaces
{
    public interface IGameSessionsService
    {
            Guid CreateSession(string hostName);
            void JoinSession(Guid sessionId, string guestName);
            bool LeaveSession(Guid sessionId, string playerName);
            void MakeMoveSession(Guid sessionId, string playerName, int cellIndex);
            void Restart(Guid sessionId);
            void RequestRestart(Guid sessionId, string playerName);
            List<GameSession> GetListWaiting();
            SessionStateDto GetSessionState(Guid sessionId);
    }
}

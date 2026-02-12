using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Task6.Dtos;
using Task6.Hubs;
using Task6.Services;
using Task6.Services.Interfaces;

namespace Task6.Controllers
{
    [ApiController]
    [Route("api/sessions")]
    public class GameSessionsController : ControllerBase
    {
        private readonly IGameSessionsService _service;
        private readonly IHubContext<GameHub> _hub;
        public GameSessionsController(IGameSessionsService service, IHubContext<GameHub> hub)
        {
            _service = service;
            _hub = hub;
        }

        [HttpPost]
        public IActionResult CreateSession([FromBody] CreateSessionRequest request)
        {
            var sessionId = _service.CreateSession(request.HostName);
            var response = new CreateSessionResponse { SessionId = sessionId};
            return Ok(response);
        }
        [HttpGet("waiting")]
        public IActionResult GetWaitingSessions()
        {
            var sessions = _service.GetListWaiting();
            return Ok(sessions);
        }
        [HttpGet("playing")]
        public IActionResult GetPlayingSessions()
        {
            var sessions = _service.GetListPlaying();
            return Ok(sessions);
        }
        [HttpPost("{id:guid}/join")]
        public IActionResult JoinSession([FromRoute] Guid id, [FromBody] JoinSessionRequest request)
        {
            _service.JoinSession(id, request.GuestName);
            return Ok();
        }
        [HttpPost("{id:guid}/move")]
        public IActionResult MakeMoveSession([FromRoute] Guid id, [FromBody] MakeMoveRequest request)
        {
            _service.MakeMoveSession(id, request.PlayerName, request.CellIndex);
            return Ok();
        }
        [HttpPost("quickmatch")]
        public async Task<IActionResult> QuickMatch([FromBody] QuickMatchRequest request)
        {
            var resp = _service.QuickMatch(request.PlayerName);

            var state = _service.GetSessionState(resp.SessionId);
            await _hub.Clients.Group(resp.SessionId.ToString()).SendAsync("SessionUpdated", state);

            return Ok(resp);
        }

    }
}

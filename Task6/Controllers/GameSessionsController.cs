using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Task6.Dtos;
using Task6.Hubs;
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
            var hostName = (request?.HostName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(hostName))
                return BadRequest("Host name is required");

            var sessionId = _service.CreateSession(hostName);
            var response = new CreateSessionResponse { SessionId = sessionId };
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
            var guestName = (request?.GuestName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(guestName))
                return BadRequest("Guest name is required");

            try
            {
                _service.JoinSession(id, guestName);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id:guid}/move")]
        public IActionResult MakeMoveSession([FromRoute] Guid id, [FromBody] MakeMoveRequest request)
        {
            var playerName = (request?.PlayerName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                return BadRequest("Player name is required");
            if (request == null)
                return BadRequest("Invalid request");

            try
            {
                _service.MakeMoveSession(id, playerName, request.CellIndex);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("quickmatch")]
        public async Task<IActionResult> QuickMatch([FromBody] QuickMatchRequest request)
        {
            var playerName = (request?.PlayerName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                return BadRequest("Player name is required");

            try
            {
                var resp = _service.QuickMatch(playerName);
                var state = _service.GetSessionState(resp.SessionId);
                await _hub.Clients.Group(resp.SessionId.ToString()).SendAsync("SessionUpdated", state);
                return Ok(resp);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
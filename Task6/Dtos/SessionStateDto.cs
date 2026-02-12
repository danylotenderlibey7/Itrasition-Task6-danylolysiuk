using Microsoft.AspNetCore.Mvc.ModelBinding;
using Task6.Models;

namespace Task6.Dtos
{
    public class SessionStateDto
    {
        public Guid SessionId { get; set; }
        public GameSessionStatus Status { get; set; }
        public string HostName { get; set; } = string.Empty;
        public string? GuestName { get; set; }
        public PlayerSymbol?[] Cells { get; set; } = new PlayerSymbol?[9];
        public PlayerSymbol CurrentTurn { get; set; }
        public PlayerSymbol? Winner { get; set; }
        public int[]? WinningLine { get; set; }
        public bool HostWantsRevenge { get; set; } 
        public bool GuestWantsRevenge { get; set; }
        public PlayerSymbol HostSymbol { get; set; }
        public PlayerSymbol GuestSymbol { get; set; }
    }
}

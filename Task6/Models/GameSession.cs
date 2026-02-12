
using System.Reflection;

namespace Task6.Models
{
    public class GameSession
    {
        public Guid Id { get; private set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public string HostName { get; private set; } = string.Empty;
        public string? GuestName { get; private set; } 
        public GameSessionStatus Status { get; private set; } = GameSessionStatus.Waiting;
        public Game Game { get; private set; }
        public PlayerSymbol HostSymbol { get; private set; } = PlayerSymbol.X;
        public PlayerSymbol GuestSymbol { get; private set; } = PlayerSymbol.O;
        public bool HostWantsRevenge { get; set; } = false;
        public bool GuestWantsRevenge { get; set; } = false;

        public GameSession(string hostName)
        {
            Id = Guid.NewGuid();
            HostName = hostName;
            GuestName = null;
            Status = GameSessionStatus.Waiting;
            Game = new Game();
            HostSymbol = PlayerSymbol.X;
            GuestSymbol = PlayerSymbol.O;
        }
        public void MakePlayerMove(string playerName, int cellIndex)
        {
            if (Status != GameSessionStatus.Playing)
                throw new Exception("Error connection");
            if (playerName != HostName && playerName != GuestName)
                throw new Exception("Error");

            PlayerSymbol symbol;

            if (playerName == HostName)
            {
                symbol = HostSymbol;
            }
            else
            {
                symbol = GuestSymbol;
            }

            Game.MakeMove(symbol, cellIndex);

            if (Game.State == GameStatus.Finished)
                Status = GameSessionStatus.Finished;
        }

        public void Join(string guestName)
        {
            guestName = guestName.Trim();
            if (guestName == "" || guestName == HostName)
                throw new Exception("Invalid username");
            if (Status != GameSessionStatus.Waiting)
                throw new Exception("Error Status");
            if (GuestName != null)
                throw new Exception("Error username");

            GuestName = guestName;
            Status = GameSessionStatus.Playing;
        }
        public bool Leave(string playerName)
        {
            playerName = (playerName ?? "").Trim();
            if (string.IsNullOrWhiteSpace(playerName))
                throw new Exception("Invalid username");

            bool isHost = playerName == HostName;
            bool isGuest = GuestName != null && playerName == GuestName;

            if (!isHost && !isGuest)
                throw new Exception("Player not in this session");

            if (isHost)
                return true;

            GuestName = null;
            GuestWantsRevenge = false;
            HostWantsRevenge = false;

            Game = new Game();
            HostSymbol = PlayerSymbol.X;
            GuestSymbol = PlayerSymbol.O;

            Status = GameSessionStatus.Waiting;
            return false;
        }
        public void RequestRestart(string playerName)
        {
            playerName = (playerName ?? "").Trim();

            if (Status != GameSessionStatus.Finished)
                throw new Exception("Error connection");

            if (playerName == HostName)
                HostWantsRevenge = true;
            else if (playerName == GuestName)
                GuestWantsRevenge = true;
            else
                throw new Exception("Error name");

            if (HostWantsRevenge && GuestWantsRevenge)
                Restart();
        }

        public void Restart()
        {
            if (Status != GameSessionStatus.Finished)
                throw new Exception("Error connection");

            var tmp = HostSymbol;
            HostSymbol = GuestSymbol;
            GuestSymbol = tmp;

            Game = new Game();

            HostWantsRevenge = false;
            GuestWantsRevenge = false;

            if (GuestName != null)
                Status = GameSessionStatus.Playing;
            else
                Status = GameSessionStatus.Waiting;
        }
    }
}

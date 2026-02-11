using Microsoft.OpenApi.Any;
using System.Linq;

namespace Task6.Models
{
    public class Game
    {
        public Board Board { get; }
        public PlayerSymbol CurrentTurn { get; private set; }
        public GameStatus State { get; private set; }
        public PlayerSymbol? Winner { get; private set; }
        public int[]? WinningLine { get; private set; }
        public Game()
        {
            Board = new Board();
            CurrentTurn = PlayerSymbol.X;
            State = GameStatus.Active;
            Winner = null;
        }
        public void MakeMove(PlayerSymbol symbol, int cellIndex)
        {

            if (State != GameStatus.Active)
                throw new Exception("Game is finished");

            if (symbol != CurrentTurn)
                throw new Exception("Error user");

            if (cellIndex < 0 || cellIndex > 8)
                throw new Exception("Invalid cell index");

            if (Board.Cells[cellIndex] != null) 
                throw new Exception("Cell is occupied");

            bool hasEmpty = false;
            Board.Cells[cellIndex] = symbol;

            var line = GetWinningLine(symbol);
            if (line != null)
            {
                WinningLine = line;
                State = GameStatus.Finished;
                Winner = symbol;
                return;
            }

            for (int i = 0; i < Board.Cells.Length; i++)
            {
                if (Board.Cells[i] == null) 
                {
                    hasEmpty = true;
                    break;
                }
            }

            if (hasEmpty == false)
            {
                State = GameStatus.Finished;
                Winner = null;
                return;
            }

            if (symbol == PlayerSymbol.X)
                CurrentTurn = PlayerSymbol.O;
            else
                CurrentTurn = PlayerSymbol.X;
        }
        public void ForceWin(PlayerSymbol winner)
        {
            State = GameStatus.Finished;
            Winner = winner;
            WinningLine = null;
        }

        private int[]? GetWinningLine(PlayerSymbol symbol)
        {
            int[][] winPatterns = new int[][]
            {
                new[] {0, 1, 2}, new[] {3, 4, 5}, new[] {6, 7, 8},
                new[] {0, 3, 6}, new[] {1, 4, 7}, new[] {2, 5, 8},
                new[] {0, 4, 8}, new[] {2, 4, 6} 
            };

            foreach (var p in winPatterns)
            {
                if (Board.Cells[p[0]] == symbol && Board.Cells[p[1]] == symbol &&  Board.Cells[p[2]] == symbol)
                    return p;
            }
            return null;
        }

    }
}

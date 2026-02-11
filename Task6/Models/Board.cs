namespace Task6.Models
{
    public class Board
    {
        public PlayerSymbol?[] Cells { get; }
        public Board()
        {
            Cells = new PlayerSymbol?[9];
        }
    }
}

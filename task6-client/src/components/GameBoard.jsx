export default function GameBoard({ cells, winningLine, canMove, onMove }) {
  if (!cells) return null;

  return (
    <div
      style={{
        marginTop: 20,
        display: "grid",
        gridTemplateColumns: "repeat(3, 80px)",
        gap: 10,
      }}
    >
      {cells.map((cell, index) => {
        const isWinningCell = winningLine?.includes(index);

        return (
          <button
            key={index}
            disabled={!canMove || cell !== null}
            onClick={() => onMove(index)}
            style={{
              width: 80,
              height: 80,
              fontSize: 32,
              fontWeight: "bold",
              border: "2px solid #333",
              backgroundColor: isWinningCell ? "#4CAF50" : "#fff",
              color: isWinningCell ? "#fff" : "#111",
              cursor: !canMove || cell !== null ? "not-allowed" : "pointer",
              opacity: !canMove || cell !== null ? 0.6 : 1,
            }}
          >
            {cell ?? ""}
          </button>
        );
      })}
    </div>
  );
}

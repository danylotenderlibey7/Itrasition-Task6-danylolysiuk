export default function GameBoard({ cells, winningLine, canMove, onMove }) {
  if (!cells) return null;

  return (
    <div
      style={{
        marginTop: 20,
        display: "grid",
        gridTemplateColumns: "repeat(3, 92px)",
        gap: 12,
      }}
    >
      {cells.map((cell, index) => {
        const isWinningCell = winningLine?.includes(index);
        const disabled = !canMove || cell !== null;

        return (
          <button
            key={index}
            disabled={disabled}
            onClick={() => onMove(index)}
            style={{
              width: 92,
              height: 92,
              fontSize: 34,
              fontWeight: 900,
              borderRadius: 16,
              border: isWinningCell ? "2px solid #16a34a" : "2px solid #111827",
              background: isWinningCell ? "#16a34a" : "#fff",
              color: isWinningCell ? "#fff" : "#111827",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.55 : 1,
              boxShadow: disabled ? "none" : "0 10px 20px rgba(0,0,0,0.10)",
              transition: "transform 120ms ease, box-shadow 120ms ease",
              transform: disabled ? "none" : "translateY(0)",
            }}
            onMouseDown={(e) => {
              if (disabled) return;
              e.currentTarget.style.transform = "translateY(1px)";
              e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.10)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = disabled ? "none" : "0 10px 20px rgba(0,0,0,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = disabled ? "none" : "0 10px 20px rgba(0,0,0,0.10)";
            }}
          >
            {cell ?? ""}
          </button>
        );
      })}
    </div>
  );
}

export default function GameBoard({ cells, winningLine, canMove, onMove }) {
  if (!cells) return null;

  return (
    <div className="boardWrap">
      <div className="boardGrid">
        {cells.map((cell, index) => {
          const isWinningCell = winningLine?.includes(index);
          const disabled = !canMove || cell !== null;

          return (
            <button
              key={index}
              disabled={disabled}
              onClick={() => onMove(index)}
              className={`boardCell ${isWinningCell ? "boardCellWin" : ""}`}
              style={{
                opacity: disabled ? 0.55 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
              onMouseDown={(e) => {
                if (disabled) return;
                e.currentTarget.style.transform = "translateY(1px)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {cell ?? ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect } from "react";

export default function SidePanel({ open, title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        left: 96,
        top: 0,
        height: "100vh",
        width: 380,
        zIndex: 50,
        transform: open ? "translateX(0)" : "translateX(-26px)",
        opacity: open ? 1 : 0,
        transition: "transform 240ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 180ms ease",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <div
        style={{
          height: "100%",
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          color: "var(--text)",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>

          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card2)",
              color: "var(--text)",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 16, overflow: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

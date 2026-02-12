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
    <>
      <div
        onClick={() => onClose?.()}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 49,
          background: "rgba(0,0,0,0.35)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 180ms ease",
        }}
      />

      <div className="sidePanelRoot" data-open={open ? "1" : "0"}>
        <div className="sidePanelCard" onClick={(e) => e.stopPropagation()}>
          <div className="sidePanelHeader">
            <div className="sidePanelTitle">{title}</div>

            <button className="sidePanelClose" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="sidePanelBody">{children}</div>
        </div>
      </div>
    </>
  );
}

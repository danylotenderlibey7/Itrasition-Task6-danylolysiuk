import { useEffect, useMemo, useState } from "react";

export default function NameModal({ open, initialName, onSave }) {
  const [v, setV] = useState(initialName ?? "");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setV(initialName ?? "");
      setTouched(false);
    }
  }, [open, initialName]);

  const trimmed = v.trim();

  const error = useMemo(() => {
    if (!touched) return "";
    if (trimmed.length < 2) return "Name must be at least 2 chars";
    if (trimmed.length > 16) return "Name must be 16 chars or less";
    return "";
  }, [touched, trimmed]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "min(460px, 100%)",
          background: "var(--card)",
          color: "var(--text)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          padding: 18,
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18 }}>Choose your name</div>
        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
          No registration. We’ll remember it on this device.
        </div>

        <input
          autoFocus
          value={v}
          placeholder="Your name"
          onChange={(e) => setV(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setTouched(true);
              if (!error && trimmed) onSave(trimmed);
            }
          }}
          style={{
            marginTop: 14,
            width: "100%",
            padding: "12px 12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            outline: "none",
            fontSize: 14,
            background: "var(--card2)",
            color: "var(--text)",
          }}
        />

        {error && (
          <div style={{ marginTop: 8, color: "#ef4444", fontWeight: 800, fontSize: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={() => {
            setTouched(true);
            if (!error && trimmed) onSave(trimmed);
          }}
          style={{
            marginTop: 14,
            width: "100%",
            padding: "12px 12px",
            borderRadius: 12,
            border: "none",
            background: !error && trimmed ? "var(--primary)" : "#9ca3af",
            color: "white",
            cursor: !error && trimmed ? "pointer" : "not-allowed",
            fontWeight: 900,
          }}
          disabled={!!error || !trimmed}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { UserRound, BarChart3, Sun, Moon } from "lucide-react";

function RailButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`railBtn ${active ? "railBtnActive" : ""}`}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {children}
    </button>
  );
}

export default function IconRail({ active, setActive, theme, toggleTheme }) {
  const [hoverLabel, setHoverLabel] = useState("");
  const [hoverY, setHoverY] = useState(0);

  const iconSize = 30;

  const items = useMemo(
    () => [
      {
        key: "profile",
        label: "Profile",
        icon: <UserRound size={iconSize} />,
        onClick: () => setActive(active === "profile" ? null : "profile"),
      },
      {
        key: "stats",
        label: "Stats",
        icon: <BarChart3 size={iconSize} />,
        onClick: () => setActive(active === "stats" ? null : "stats"),
      },
    ],
    [active, setActive]
  );

  function onHover(label, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverLabel(label);
    setHoverY(rect.top + rect.height / 2);
  }

  function onLeave() {
    setHoverLabel("");
  }

  const tooltip =
  hoverLabel && window.innerWidth > 860 ? (
    <div
      className="railTooltip"
      style={{
        left: 96 + 18,
        top: hoverY,
        transform: "translateY(-50%)",
      }}
    >
      {hoverLabel}
      <div className="railTooltipArrow" />
    </div>
  ) : null;

  return (
    <>
      {tooltip}

      <div className="railRoot">
        <div className="railTop">
          {items.map((it) => (
            <div
              key={it.key}
              onMouseEnter={(e) => onHover(it.label, e)}
              onMouseLeave={onLeave}
            >
              <div className="railBtnWrap">
                {active === it.key && <div className="railActivePip" />}
                <RailButton active={active === it.key} onClick={it.onClick}>
                  {it.icon}
                </RailButton>
              </div>
            </div>
          ))}
        </div>

        <div className="railSep" />

        <div className="railBottom">
          <div onMouseEnter={(e) => onHover("Theme", e)} onMouseLeave={onLeave}>
            <RailButton active={false} onClick={toggleTheme}>
              {theme === "dark" ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
            </RailButton>
          </div>
        </div>
      </div>
    </>
  );
}

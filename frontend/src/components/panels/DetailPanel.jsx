import useStore from "../../store/useStore";
import { isFree, isPaid, isWheelchair, haversine, formatDistance, formatDuration } from "../../lib/geo";
import { scoreToilet, starsDisplay, scoreColor } from "../../lib/score";

export default function DetailPanel() {
  const selectedToilet = useStore((s) => s.selectedToilet);
  const clearSelection = useStore((s) => s.clearSelection);
  const userPos        = useStore((s) => s.userPos);
  const setUserPos     = useStore((s) => s.setUserPos);
  const mode           = useStore((s) => s.mode);
  const setMode        = useStore((s) => s.setMode);
  const routeInfo      = useStore((s) => s.routeInfo);
  const clearRoute     = useStore((s) => s.clearRoute);

  const t       = selectedToilet;
  const visible = !!t;
  const dist    = t && userPos ? haversine(userPos.lat, userPos.lng, t.lat, t.lon) : null;
  const score   = t ? scoreToilet(t) : 0;

  function handleRoute() {
    if (!userPos) {
      navigator.geolocation?.getCurrentPosition(
        (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {}
      );
    }
    setMode("network");
  }

  function handleClose() { clearSelection(); clearRoute(); }

  const mapsUrl = t
    ? `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lon}&travelmode=walking`
    : "#";

  const feeStr = !t ? "" : isFree(t.fee) ? "✓ Free" : isPaid(t.fee) ? `Paid${t.charge ? ` — ${t.charge}` : ""}` : "Unknown";
  const feeCls = !t ? "" : isFree(t.fee) ? "jade" : isPaid(t.fee) ? "gold" : "";
  const wcStr  = !t ? "" : isWheelchair(t.wheelchair) ? "✓ Accessible" : t.wheelchair === "no" ? "✗ Not accessible" : "Unknown";
  const wcCls  = !t ? "" : isWheelchair(t.wheelchair) ? "jade" : t.wheelchair === "no" ? "rose" : "";

  const rows = t ? [
    dist !== null && ["Distance",    formatDistance(dist), ""],
    ["Fee",          feeStr,         feeCls],
    ["Wheelchair",   wcStr,          wcCls],
    t.opening_hours           && ["Hours",       t.opening_hours,    ""],
    t.handwashing === "yes"   && ["Handwashing", "✓ Yes",            "jade"],
    t.paper === "yes"         && ["Paper",       "✓ Supplied",       "jade"],
    t.changing_table === "yes" && ["Baby change","✓ Available",       "jade"],
    t.male === "yes" && t.female === "yes" && ["Facilities", "Male & Female", ""],
    t.unisex === "yes"        && ["Facilities",  "Unisex",           ""],
  ].filter(Boolean) : [];

  return (
    <>
      <div className={`detail-panel${visible ? " visible" : ""}`}>
        {t && (
          <>
            <div className="detail-accent" />
            <div className="detail-header">
              <div>
                <div className="detail-name">{t.name}</div>
                {/* Quality score stars */}
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <span style={{ fontSize:13, color: scoreColor(score), letterSpacing:1.5 }}>
                    {starsDisplay(score)}
                  </span>
                  <span style={{ fontSize:10, color:"var(--t3)", fontFamily:"var(--font-m)" }}>
                    {score.toFixed(1)} / 5
                  </span>
                </div>
              </div>
              <button className="detail-close" onClick={handleClose}>✕</button>
            </div>
            <div className="detail-divider" />
            <div className="detail-body">
              {rows.map(([key, val, cls]) => (
                <div className="detail-row" key={key}>
                  <span className="detail-key">{key}</span>
                  <span className={`detail-val${cls ? " "+cls : ""}`}>{val}</span>
                </div>
              ))}
            </div>
            <div className="detail-actions">
              <button className="btn-primary" onClick={handleRoute}>
                {mode === "network" ? "Routing…" : "Get walking route"}
              </button>
              <a className="btn-secondary" href={mapsUrl} target="_blank" rel="noreferrer">Maps ↗</a>
            </div>
          </>
        )}
      </div>

      <div className={`route-bar${routeInfo ? " visible" : ""}`}>
        <span className="route-bar-icon">🚶</span>
        {routeInfo && <>
          <span className="route-bar-text">
            {formatDistance(routeInfo.distance)}{routeInfo.fallback ? " (est.)" : ""}
          </span>
          <span className="route-bar-detail">~{formatDuration(routeInfo.duration)}</span>
          <button className="route-bar-close" onClick={clearRoute}>✕</button>
        </>}
      </div>
    </>
  );
}

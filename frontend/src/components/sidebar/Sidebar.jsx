import useStore from "../../store/useStore";
import { haversine, formatDistance, isFree, isPaid, isWheelchair, sortByDistance } from "../../lib/geo";
import { scoreToilet, starsDisplay, scoreColor } from "../../lib/score";

const MODES = [
  { id:"markers", icon:"📍", label:"Markers" },
  { id:"heatmap", icon:"🌡",  label:"Heat"    },
  { id:"buffer",  icon:"◎",  label:"Buffer"  },
  { id:"network", icon:"↗",  label:"Route"   },
];
const HINTS = {
  markers: "Click any pin or card to see full toilet details. Nearest-first when location is on.",
  heatmap: "Density heatmap — brighter glow = higher toilet concentration.",
  buffer:  "Service-zone ring around your position or a selected toilet. Adjust the radius slider.",
  network: "Select a toilet then tap Get Route for walking directions via OSRM.",
};

export default function Sidebar() {
  const mode           = useStore((s) => s.mode);
  const setMode        = useStore((s) => s.setMode);
  const filters        = useStore((s) => s.filters);
  const setFilter      = useStore((s) => s.setFilter);
  const userPos        = useStore((s) => s.userPos);
  const selectedToilet = useStore((s) => s.selectedToilet);
  const selectToilet   = useStore((s) => s.selectToilet);
  const bufferRadius   = useStore((s) => s.bufferRadius);
  const setBufferRadius = useStore((s) => s.setBufferRadius);
  const sortBy         = useStore((s) => s.sortBy);
  const setSortBy      = useStore((s) => s.setSortBy);
  const getFiltered    = useStore((s) => s.getFiltered);

  const filtered = getFiltered();

  // Sort
  let sorted = [...filtered];
  if (sortBy === "score") {
    sorted.sort((a, b) => scoreToilet(b) - scoreToilet(a));
  } else {
    sorted = sortByDistance(filtered, userPos);
  }

  return (
    <aside className="sidebar">
      {/* Mode strip */}
      <div className="mode-strip">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn${mode === m.id ? " active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            <span className="mode-icon">{m.icon}</span>
            <span className="mode-label">{m.label}</span>
          </button>
        ))}
      </div>

      <p className="mode-hint">{HINTS[mode]}</p>

      {/* Filters */}
      <div className="filter-section">
        <span className="filter-label">Fee</span>
        <div className="chips">
          {[["all","All"],["no","✓ Free"],["yes","Paid"]].map(([val, lbl]) => (
            <button
              key={val}
              className={`chip${filters.fee === val ? (val==="yes" ? " active-gold" : " active") : ""}`}
              onClick={() => setFilter("fee", val)}
            >{lbl}</button>
          ))}
        </div>

        <span className="filter-label" style={{ marginTop: 10 }}>Accessibility</span>
        <div className="chips">
          <button className={`chip${filters.wc === "all" ? " active" : ""}`} onClick={() => setFilter("wc","all")}>All</button>
          <button className={`chip${filters.wc === "yes" ? " active-sky" : ""}`} onClick={() => setFilter("wc","yes")}>♿ Accessible</button>
          <button className={`chip${filters.access === "public" ? " active" : ""}`} onClick={() => setFilter("access","public")}>Public only</button>
        </div>

        <span className="filter-label" style={{ marginTop: 10 }}>Sort by</span>
        <div className="chips">
          <button className={`chip${sortBy === "distance" ? " active" : ""}`} onClick={() => setSortBy("distance")}>📍 Distance</button>
          <button className={`chip${sortBy === "score" ? " active" : ""}`} onClick={() => setSortBy("score")}>★ Quality</button>
        </div>
      </div>

      {/* Buffer slider */}
      {mode === "buffer" && (
        <div className="buffer-section" style={{ display:"block" }}>
          <span className="filter-label">Buffer radius</span>
          <div className="buffer-row">
            <input type="range" min={100} max={2000} step={50}
              value={bufferRadius}
              onChange={(e) => setBufferRadius(Number(e.target.value))}
            />
            <span className="buffer-val">{bufferRadius} m</span>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="results-area">
        <div className="results-meta">
          <span className="results-count">{sorted.length} results</span>
          {userPos && sortBy === "distance" && (
            <div className="sorted-tag">
              <span className="sorted-dot" /> nearest first
            </div>
          )}
          {sortBy === "score" && (
            <div className="sorted-tag" style={{ color:"var(--gold)" }}>
              <span className="sorted-dot" style={{ background:"var(--gold)" }} /> by quality
            </div>
          )}
        </div>

        {sorted.length === 0 && <div className="no-results">No toilets match your filters.</div>}

        {sorted.slice(0, 80).map((t, i) => {
          const dist      = userPos ? haversine(userPos.lat, userPos.lng, t.lat, t.lon) : null;
          const isNearest = i === 0 && userPos && sortBy === "distance";
          const isSelected = selectedToilet?.id === t.id;
          const score     = scoreToilet(t);

          return (
            <div
              key={t.id}
              className={`toilet-card${isSelected ? " selected" : ""}${isNearest ? " nearest" : ""}`}
              onClick={() => selectToilet(t)}
            >
              {isNearest && <div className="nearest-glow" />}
              <div className="card-name">{t.name}</div>
              <div className="card-meta">
                <div className="card-badges">
                  {isFree(t.fee)  && <span className="badge badge-free">FREE</span>}
                  {isPaid(t.fee)  && <span className="badge badge-paid">PAID</span>}
                  {!isFree(t.fee) && !isPaid(t.fee) && <span className="badge badge-unk">?</span>}
                  {isWheelchair(t.wheelchair) && <span className="badge badge-wc">♿</span>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:10, color: scoreColor(score), letterSpacing:1 }}>
                    {starsDisplay(score)}
                  </span>
                  {dist !== null && <span className="card-dist">{formatDistance(dist)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

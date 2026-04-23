import { useState } from "react";
import useStore from "../../store/useStore";

export default function Header() {
  const toilets    = useStore((s) => s.toilets);
  const getFiltered = useStore((s) => s.getFiltered);
  const userPos    = useStore((s) => s.userPos);
  const setUserPos = useStore((s) => s.setUserPos);
  const setSearchQuery = useStore((s) => s.setSearchQuery);

  const filtered   = getFiltered();
  const freeCount  = toilets.filter((t) => (t.fee || "").toLowerCase() === "no").length;
  const wcCount    = toilets.filter((t) =>
    ["yes","designated","limited"].includes((t.wheelchair||"").toLowerCase())
  ).length;

  function handleLocate() {
    if (userPos) { setUserPos(null); return; }
    navigator.geolocation?.getCurrentPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }

  return (
    <header className="header">
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div className="header-logo-pill">
          <div className="header-logo-icon">🚽</div>
          <div className="header-logo-text">Sabaay<span>Loo</span></div>
        </div>
        <div className="header-city">Bangkok</div>
      </div>

      <div className="header-search">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            placeholder="Search toilets, areas…"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="header-right">
        <div className="header-stats">
          <div className="hstat">
            <span className="hstat-val" style={{ color:"var(--jade)" }}>{filtered.length}</span>
            <span className="hstat-lbl">Shown</span>
          </div>
          <div className="hstat">
            <span className="hstat-val">{toilets.length}</span>
            <span className="hstat-lbl">Total</span>
          </div>
          <div className="hstat">
            <span className="hstat-val" style={{ color:"var(--jade)" }}>{freeCount}</span>
            <span className="hstat-lbl">Free</span>
          </div>
          <div className="hstat">
            <span className="hstat-val" style={{ color:"var(--sky)" }}>{wcCount}</span>
            <span className="hstat-lbl">Access.</span>
          </div>
        </div>

        <button
          className={`locate-pill${userPos ? " active" : ""}`}
          onClick={handleLocate}
        >
          <span className="locate-dot" />
          {userPos ? "Location on" : "My location"}
        </button>
      </div>
    </header>
  );
}

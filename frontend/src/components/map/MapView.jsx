import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import useStore from "../../store/useStore";
import { isFree, isPaid, isWheelchair, haversine } from "../../lib/geo";
import { fetchRoute } from "../../services/api";

const BANGKOK = [13.75, 100.52];
const BADGE_NAMES = { markers:"Markers mode", heatmap:"Heatmap view", buffer:"Buffer analysis", network:"Route mode" };

function markerColor(t) {
  if (isFree(t.fee))  return "#00c896";
  if (isPaid(t.fee))  return "#f5a623";
  return "#2e3244";
}

function makeIcon(t, selected = false) {
  const color  = markerColor(t);
  const size   = selected ? 20 : 12;
  const wc     = isWheelchair(t.wheelchair);
  const border = selected
    ? "3px solid #fff"
    : wc ? "2px solid #38b6ff" : "1.5px solid rgba(0,0,0,0.5)";
  const glow   = selected
    ? `0 0 0 4px rgba(0,200,150,0.35), 0 0 16px ${color}88`
    : wc
      ? `0 0 6px rgba(56,182,255,0.4), 0 1px 4px rgba(0,0,0,0.5)`
      : `0 0 8px ${color}55, 0 1px 3px rgba(0,0,0,0.4)`;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:${border};border-radius:50%;box-shadow:${glow};transition:all .15s;"></div>`,
    iconSize:   [size, size],
    iconAnchor: [size/2, size/2],
  });
}

export default function MapView() {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const layers      = useRef({ markers:null, heat:null, buffer:null, route:null, user:null });
  const markerObjs  = useRef({});

  const mode           = useStore((s) => s.mode);
  const getFiltered    = useStore((s) => s.getFiltered);
  const selectedToilet = useStore((s) => s.selectedToilet);
  const selectToilet   = useStore((s) => s.selectToilet);
  const userPos        = useStore((s) => s.userPos);
  const bufferRadius   = useStore((s) => s.bufferRadius);
  const setRouteInfo   = useStore((s) => s.setRouteInfo);
  const clearRoute     = useStore((s) => s.clearRoute);
  const loading        = useStore((s) => s.loading);

  // ── Init ────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(BANGKOK, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    layers.current.markers = L.layerGroup().addTo(map);
    layers.current.buffer  = L.layerGroup().addTo(map);
    layers.current.route   = L.layerGroup().addTo(map);
    mapInstance.current    = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // ── Re-render on state change ───────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const filtered = getFiltered();
    layers.current.markers.clearLayers();
    layers.current.buffer.clearLayers();
    layers.current.route.clearLayers();
    markerObjs.current = {};
    if (layers.current.heat) { map.removeLayer(layers.current.heat); layers.current.heat = null; }
    clearRoute();

    // Update badge text
    const badge = document.getElementById("map-badge-txt");
    if (badge) badge.textContent = BADGE_NAMES[mode] || mode;

    if (mode === "heatmap") {
      const pts = filtered.map((t) => [t.lat, t.lon, 1]);
      layers.current.heat = L.heatLayer(pts, {
        radius: 32, blur: 28, maxZoom: 17,
        gradient: { 0:"#1a2744", 0.25:"#0f4a6e", 0.5:"#00c896", 0.75:"#f5a623", 1.0:"#ff5f7e" },
      }).addTo(map);
      return;
    }

    filtered.forEach((t) => {
      const isSel = selectedToilet?.id === t.id;
      const m = L.marker([t.lat, t.lon], { icon: makeIcon(t, isSel) });
      m.on("click", () => {
        selectToilet(t);
        map.setView([t.lat, t.lon], Math.max(map.getZoom(), 15));
      });
      m.addTo(layers.current.markers);
      markerObjs.current[t.id] = m;
    });

    if (mode === "buffer") {
      const center = selectedToilet
        ? L.latLng(selectedToilet.lat, selectedToilet.lon)
        : userPos ? L.latLng(userPos.lat, userPos.lng) : L.latLng(...BANGKOK);
      // Outer glow ring — wide, barely-there halo for depth
      L.circle(center, {
        radius: bufferRadius * 1.05,
        color: "#00c896", weight: 10,
        fillColor: "transparent", fillOpacity: 0,
        opacity: 0.10, interactive: false,
      }).addTo(layers.current.buffer);

      // Main buffer ring — bold dashed stroke + tinted fill
      L.circle(center, {
        radius: bufferRadius,
        color: "#00c896", weight: 3,
        dashArray: "10 6",
        fillColor: "#00c896", fillOpacity: 0.15,
        opacity: 0.92,
      }).addTo(layers.current.buffer);

      // Count toilets inside buffer
      const inside = filtered.filter(
        (t) => haversine(center.lat, center.lng, t.lat, t.lon) <= bufferRadius
      );

      // Count label at centre
      L.marker(center, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:rgba(10,11,15,0.88);border:1.5px solid #00c896;border-radius:8px;padding:5px 11px;color:#00c896;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;white-space:nowrap;box-shadow:0 0 14px rgba(0,200,150,0.3);">${inside.length} toilet${inside.length !== 1 ? "s" : ""} in range</div>`,
          iconAnchor: [62, -10],
        }),
        interactive: false,
        zIndexOffset: 500,
      }).addTo(layers.current.buffer);

      // Highlighted markers inside buffer
      inside.forEach((t) => {
        L.circleMarker([t.lat, t.lon], {
          radius: 9, color: "#00c896", weight: 2.5,
          fillColor: "#00c896", fillOpacity: 0.55,
        }).addTo(layers.current.buffer).on("click", () => selectToilet(t));
      });
    }
  }, [mode, selectedToilet, getFiltered, bufferRadius, userPos]);

  // ── User marker ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (layers.current.user) { map.removeLayer(layers.current.user); layers.current.user = null; }
    if (!userPos) return;
    layers.current.user = L.marker([userPos.lat, userPos.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="user-marker" style="position:relative;transform:none"><div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center"><div class="user-ring"></div><div class="user-core"></div></div></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      }),
      zIndexOffset: 1000,
    }).addTo(map);
    map.setView([userPos.lat, userPos.lng], 15);
  }, [userPos]);

  // ── Auto-route in network mode ──────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || mode !== "network" || !selectedToilet || !userPos) return;
    layers.current.route.clearLayers();

    fetchRoute({ fromLat: userPos.lat, fromLon: userPos.lng, toLat: selectedToilet.lat, toLon: selectedToilet.lon })
      .then((r) => {
        L.polyline(r.coordinates, {
          color:"#38b6ff", weight:4, opacity:.85,
          lineCap:"round", lineJoin:"round",
        }).addTo(layers.current.route);
        setRouteInfo(r);
      })
      .catch(() => {
        const dist = haversine(userPos.lat, userPos.lng, selectedToilet.lat, selectedToilet.lon);
        L.polyline([[userPos.lat, userPos.lng],[selectedToilet.lat, selectedToilet.lon]], {
          color:"#38b6ff", weight:4, opacity:.55, dashArray:"8 5",
        }).addTo(layers.current.route);
        setRouteInfo({ distance: dist, duration: Math.ceil(dist/80)*60, fallback:true });
      });
  }, [selectedToilet, mode, userPos]);

  return (
    <>
      {loading && (
        <div className="map-loading">
          <div className="spinner" /> Loading toilets…
        </div>
      )}
      <div ref={mapRef} style={{ width:"100%", height:"100%" }} />

      {/* Map badge */}
      <div className="map-badge">
        <div className="map-badge-dot" />
        <span id="map-badge-txt">{BADGE_NAMES[mode]}</span>
      </div>

      {/* Legend */}
      {mode !== "heatmap" && (
        <div className="map-legend">
          <div className="legend-title">Map Key</div>
          <div className="legend-row"><div className="legend-dot" style={{background:"#00c896"}}/> Free</div>
          <div className="legend-row"><div className="legend-dot" style={{background:"#f5a623"}}/> Paid</div>
          <div className="legend-row"><div className="legend-dot" style={{background:"#2e3244"}}/> Unknown</div>
          <div className="legend-row"><div className="legend-dot" style={{background:"transparent",border:"2px solid #38b6ff"}}/> Accessible</div>
        </div>
      )}
    </>
  );
}

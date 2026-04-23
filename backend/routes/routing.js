import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

// ── GET /api/route?fromLat=&fromLon=&toLat=&toLon= ──────────
router.get("/", async (req, res) => {
  const { fromLat, fromLon, toLat, toLon } = req.query;
  if (!fromLat || !fromLon || !toLat || !toLon)
    return res.status(400).json({ error: "fromLat, fromLon, toLat, toLon required" });

  try {
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;

    const response = await fetch(osrmUrl, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();

    if (!data.routes?.[0]) return res.status(404).json({ error: "No route found" });

    const route = data.routes[0];
    res.json({
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: route.distance,   // metres
      duration: route.duration,   // seconds
    });
  } catch (err) {
    res.status(503).json({ error: "Routing service unavailable", detail: err.message });
  }
});

export default router;

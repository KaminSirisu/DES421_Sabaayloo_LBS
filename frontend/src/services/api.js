const BASE = "/api";

export async function fetchToilets(filters = {}) {
  const params = new URLSearchParams({ limit: 2000, ...filters });
  const res = await fetch(`${BASE}/toilets?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchNearby({ lat, lon, radius = 500, limit = 50 }) {
  const params = new URLSearchParams({ lat, lon, radius, limit });
  const res = await fetch(`${BASE}/toilets/near?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchRoute({ fromLat, fromLon, toLat, toLon }) {
  const params = new URLSearchParams({ fromLat, fromLon, toLat, toLon });
  const res = await fetch(`${BASE}/route?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

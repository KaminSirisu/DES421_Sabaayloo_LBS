export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  const mins = Math.ceil(seconds / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

export function isFree(fee) {
  return (fee || "").toLowerCase() === "no";
}

export function isPaid(fee) {
  const s = (fee || "").toLowerCase();
  return s === "yes" || /\d/.test(s) || /baht|thb|฿/.test(s);
}

export function isWheelchair(wc) {
  return ["yes", "designated", "limited"].includes((wc || "").toLowerCase());
}

/** Sort a list of toilets by distance from a position */
export function sortByDistance(toilets, pos) {
  if (!pos) return toilets;
  return [...toilets].sort(
    (a, b) =>
      haversine(pos.lat, pos.lng, a.lat, a.lon) -
      haversine(pos.lat, pos.lng, b.lat, b.lon)
  );
}

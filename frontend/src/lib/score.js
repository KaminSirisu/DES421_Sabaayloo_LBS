import { isFree, isWheelchair } from "./geo";

/**
 * Returns a 0–5 quality score based on available OSM tags.
 * Free usage: +1.5  Wheelchair: +1  Paper: +0.5
 * Handwashing: +0.5  Opening hours set: +0.5  Baby change: +0.5
 */
export function scoreToilet(t) {
  let s = 0;
  if (isFree(t.fee))                            s += 1.5;
  if (isWheelchair(t.wheelchair))               s += 1.0;
  if ((t.paper || "").toLowerCase() === "yes")  s += 0.5;
  if ((t.handwashing || "").toLowerCase() === "yes") s += 0.5;
  if (t.opening_hours)                          s += 0.5;
  if ((t.changing_table || "").toLowerCase() === "yes") s += 0.5;
  return Math.min(parseFloat(s.toFixed(1)), 5);
}

/** Returns filled/empty star string like "★★★☆☆" */
export function starsDisplay(score) {
  const full  = Math.floor(score / 1);
  const half  = score % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(empty);
}

/** Returns CSS color for a score */
export function scoreColor(score) {
  if (score >= 4) return "var(--jade)";
  if (score >= 2.5) return "var(--gold)";
  return "var(--rose)";
}

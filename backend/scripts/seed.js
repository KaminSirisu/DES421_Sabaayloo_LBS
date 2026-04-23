/**
 * Seed script — imports toilets_bangkok.json (Overpass API format) into MongoDB.
 *
 * Usage:
 *   node scripts/seed.js ./toilets.json
 *
 * Expected JSON shape (your existing OSM export):
 *   [{ "id": 1, "name": "...", "lat": 13.7, "lon": 100.5, "fee": "no", ... }, ...]
 *
 * Or GeoJSON FeatureCollection — the script handles both.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";
import Toilet from "../models/Toilet.js";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/seed.js <path-to-toilets.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(resolve(filePath), "utf-8"));

// Support both plain array and GeoJSON FeatureCollection
const items = Array.isArray(raw)
  ? raw
  : raw.features?.map((f) => ({
      ...f.properties,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    })) || [];

console.log(`📂 Found ${items.length} toilets in ${filePath}`);

await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ MongoDB connected");

// Drop existing collection for a clean seed
await Toilet.deleteMany({});
console.log("🗑️  Cleared existing toilets");

const docs = items.map((t) => ({
  name: t.name || t["name:en"] || "Public Toilet",
  location: {
    type: "Point",
    coordinates: [parseFloat(t.lon ?? t.longitude), parseFloat(t.lat ?? t.latitude)],
  },
  fee: t.fee ?? null,
  charge: t.charge ?? null,
  wheelchair: t.wheelchair ?? null,
  opening_hours: t.opening_hours ?? null,
  disposal: t.disposal ?? null,
  handwashing: t.handwashing ?? null,
  paper: t.paper ?? null,
  access: t.access ?? null,
  operator: t.operator ?? null,
  osm_id: t.id ?? null,
}));

const inserted = await Toilet.insertMany(docs, { ordered: false });
console.log(`✅ Seeded ${inserted.length} toilets`);
await mongoose.disconnect();

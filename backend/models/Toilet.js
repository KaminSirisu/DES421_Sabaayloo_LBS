import mongoose from "mongoose";

const toiletSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    // OSM fields
    fee: { type: String, default: null },        // "no" | "yes" | "2 THB" | etc.
    charge: { type: String, default: null },
    wheelchair: { type: String, default: null }, // "yes" | "no" | "designated" | "limited"
    opening_hours: { type: String, default: null },
    disposal: { type: String, default: null },
    handwashing: { type: String, default: null },
    paper: { type: String, default: null },
    access: { type: String, default: null },     // "yes" | "public" | "permissive"
    operator: { type: String, default: null },
    osm_id: { type: Number, default: null, index: true },
    // Extended OSM fields
    male:           { type: String, default: null },
    female:         { type: String, default: null },
    unisex:         { type: String, default: null },
    changing_table: { type: String, default: null },
    position:       { type: String, default: null },
  },
  { timestamps: true }
);

// 2dsphere index enables $nearSphere and $geoWithin queries
toiletSchema.index({ location: "2dsphere" });

export default mongoose.model("Toilet", toiletSchema);

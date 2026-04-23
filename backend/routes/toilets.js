import { Router } from "express";
import Toilet from "../models/Toilet.js";

const router = Router();

// ── GET /api/toilets ─────────────────────────────────────────
// Query params: fee=no|yes, wc=yes, access=public, page, limit
router.get("/", async (req, res) => {
  try {
    const { fee, wc, access, page = 1, limit = 1000 } = req.query;
    const filter = {};

    if (fee === "no") filter.fee = "no";
    if (fee === "yes") filter.$or = [
      { fee: "yes" },
      { fee: { $regex: /\d/, $options: "i" } },
      { fee: { $regex: /baht|thb|฿/i } },
    ];
    if (wc === "yes") filter.wheelchair = { $in: ["yes", "designated", "limited"] };
    if (access === "public") filter.$or = [
      ...(filter.$or || []),
      { access: { $in: ["yes", "permissive", ""] } },
      { access: null },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [toilets, total] = await Promise.all([
      Toilet.find(filter).skip(skip).limit(parseInt(limit)).lean(),
      Toilet.countDocuments(filter),
    ]);

    // Normalise to { id, name, lat, lon, ... } for frontend compat
    const data = toilets.map((t) => ({
      id: t._id,
      name: t.name,
      lat: t.location.coordinates[1],
      lon: t.location.coordinates[0],
      fee: t.fee,
      charge: t.charge,
      wheelchair: t.wheelchair,
      opening_hours: t.opening_hours,
      disposal: t.disposal,
      handwashing: t.handwashing,
      paper: t.paper,
      access: t.access,
      operator: t.operator,
      male: t.male,
      female: t.female,
      unisex: t.unisex,
      changing_table: t.changing_table,
      position: t.position,
    }));

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/toilets/near ────────────────────────────────────
// Query params: lat, lon, radius (metres, default 500), limit
router.get("/near", async (req, res) => {
  try {
    const { lat, lon, radius = 500, limit = 50 } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });

    const toilets = await Toilet.find({
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    })
      .limit(parseInt(limit))
      .lean();

    const data = toilets.map((t) => ({
      id: t._id,
      name: t.name,
      lat: t.location.coordinates[1],
      lon: t.location.coordinates[0],
      fee: t.fee,
      wheelchair: t.wheelchair,
      opening_hours: t.opening_hours,
    }));

    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/toilets/:id ────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const toilet = await Toilet.findById(req.params.id).lean();
    if (!toilet) return res.status(404).json({ error: "Not found" });
    res.json({
      id: toilet._id,
      name: toilet.name,
      lat: toilet.location.coordinates[1],
      lon: toilet.location.coordinates[0],
      ...toilet,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/toilets ───────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, lat, lon, ...rest } = req.body;
    if (!name || lat == null || lon == null)
      return res.status(400).json({ error: "name, lat, lon required" });

    const toilet = await Toilet.create({
      name,
      location: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
      ...rest,
    });
    res.status(201).json({ id: toilet._id, name: toilet.name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

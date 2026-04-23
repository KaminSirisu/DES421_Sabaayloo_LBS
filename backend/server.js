import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import toiletRoutes from "./routes/toilets.js";
import routeRoutes from "./routes/routing.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.NODE_ENV === "production" ? "https://yourdomain.com" : "*" }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use("/api/toilets", toiletRoutes);
app.use("/api/route", routeRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// ── Database ────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

# SabaayLoo 🚽

**Bangkok Toilet Finder** — React + Express + MongoDB full-stack webGIS.

A modern rebuild of the original single-file Leaflet app with a proper backend,
live database, and a clean dark-mode UI.

---

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite, Leaflet + react-leaflet, Zustand |
| Backend  | Node.js, Express 4, Mongoose |
| Database | MongoDB Atlas (free tier works fine) |
| Routing  | OSRM public API (proxied through Express) |
| Data     | OpenStreetMap via Overpass API (447 Bangkok toilets) |

---

## Quick start

### 1. Clone & install

```bash
git clone <your-repo>
cd sabaayloo
npm run install:all
npm install   # root concurrently
```

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGODB_URI to your Atlas connection string
```

### 3. Seed the database

Place `toilets_bangkok.json` (your Overpass export) in the project root, then:

```bash
npm run seed
# → Seeded 447 toilets  |  Free: 198  |  Paid: 14  |  Wheelchair: 22
```

### 4. Run dev servers

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

---

## API Reference

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/api/toilets`        | All toilets, optional `fee`/`wc`/`access` query params |
| GET    | `/api/toilets/near`   | Toilets within `radius` metres of `lat`/`lon` |
| GET    | `/api/toilets/:id`    | Single toilet by MongoDB `_id`       |
| POST   | `/api/toilets`        | Create a toilet (`name`, `lat`, `lon` required) |
| GET    | `/api/route`          | Walking route via OSRM proxy         |
| GET    | `/api/health`         | Health check                         |

### Filter examples

```
GET /api/toilets?fee=no               # Free toilets only
GET /api/toilets?wc=yes               # Wheelchair-accessible only
GET /api/toilets?fee=no&wc=yes        # Free + accessible
GET /api/toilets/near?lat=13.75&lon=100.52&radius=500
```

---

## Map modes

| Mode    | Description |
|---------|-------------|
| Map     | Standard marker view. Green = free, amber = paid, grey = unknown. Blue border = accessible. |
| Heat    | Density heatmap showing toilet coverage across Bangkok. |
| Buffer  | Service-zone circle around your position or a selected toilet. Adjust radius with slider. |
| Route   | Select a toilet → walking route drawn via OSRM. Falls back to a straight line if OSRM is unavailable. |

---

## Project structure

```
sabaayloo/
├── backend/
│   ├── models/
│   │   └── Toilet.js          # Mongoose schema + 2dsphere index
│   ├── routes/
│   │   ├── toilets.js         # CRUD + geo queries
│   │   └── routing.js         # OSRM proxy
│   ├── scripts/
│   │   └── seed.js            # Import Overpass JSON → MongoDB
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/MapView.jsx        # Leaflet map + all modes
│   │   │   ├── sidebar/Sidebar.jsx    # Filters + result list
│   │   │   ├── panels/DetailPanel.jsx # Toilet detail overlay
│   │   │   └── ui/Header.jsx          # Top bar + stats
│   │   ├── store/useStore.js   # Zustand global state
│   │   ├── services/api.js     # Fetch wrappers
│   │   ├── lib/geo.js          # Haversine + helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Full design system
│   ├── index.html
│   └── vite.config.js
│
├── toilets_bangkok.json        # OSM data (447 nodes)
└── package.json                # Root scripts
```

---

## Data

The `toilets_bangkok.json` is exported from the Overpass API:

```
[out:json];
node["amenity"="toilets"](13.5,100.3,14.0,100.9);
out body;
```

Re-run this query at https://overpass-turbo.eu to get fresh data, then re-seed.

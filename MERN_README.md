# Packet Analyzer - MERN Stack

This is the **MERN** (MongoDB, Express, React, Node.js) version of the Packet Analyzer DPI project. It provides a web dashboard to upload PCAP files, run deep packet inspection (SNI extraction, app classification), view reports and flows, and manage blocking rules.

## Stack

- **MongoDB** – Stores captures metadata, flows, analysis reports, and blocking rules
- **Express** – REST API for uploads, analysis, and CRUD
- **React** – Frontend dashboard (Vite)
- **Node.js** – Backend and DPI logic (PCAP parsing, SNI extraction, app classification)

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally (`mongodb://localhost:27017`) or set `MONGODB_URI`

## Quick start

### 1. Install dependencies

```bash
# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..
```

### 2. Start MongoDB

Ensure MongoDB is running (e.g. local install or Docker).

### 3. Run backend and frontend

**Terminal 1 – API (port 5000):**
```bash
cd server && npm run dev
```

**Terminal 2 – React (port 5173):**
```bash
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

### Optional: run both with one command (from repo root)

```bash
npm run dev
```

(Requires running `npm install` in the repo root first; see root `package.json`.)

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/captures` | List captures |
| GET | `/api/captures/:id` | Get one capture |
| POST | `/api/captures/upload` | Upload PCAP (multipart `pcap` file) |
| POST | `/api/captures/:id/analyze` | Run DPI analysis on a capture |
| GET | `/api/analysis/report/:captureId` | Get analysis report |
| GET | `/api/analysis/flows/:captureId` | Get flows for a capture |
| GET/POST | `/api/rules` | List / create blocking rules |
| PATCH/DELETE | `/api/rules/:id` | Update / delete rule |

## Environment (optional)

- `PORT` – Server port (default `5000`)
- `MONGODB_URI` – MongoDB connection string (default `mongodb://localhost:27017/packet_analyzer`)
- `CLIENT_URL` – Allowed CORS origin (default `http://localhost:5173`)

## Features (ported from C++ DPI)

- **PCAP upload** – Store and list captures
- **Packet parsing** – Ethernet, IPv4, TCP/UDP
- **SNI extraction** – TLS Client Hello inspection (HTTPS)
- **App classification** – Map SNI to app (YouTube, Facebook, etc.)
- **Blocking rules** – By IP, app type, or domain substring
- **Reports** – Packet/byte counts, forwarded/dropped, app breakdown, detected domains
- **Flows** – Per-connection view (5-tuple, app, SNI, blocked)

The original C++ code lives in `src/`, `include/`, and is documented in `README.md`. This MERN app reimplements the DPI logic in JavaScript for the web stack.

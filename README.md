# WebDrop

**Drop. Connect. Transfer.**

A browser-based peer-to-peer file transfer application — inspired by Quick Share / ShareIt, built for the web. Files move **directly between two browsers over WebRTC**; the server never sees, stores, or proxies your files.

---

## Overview

1. User A opens WebDrop and creates a room → gets a short code (e.g. `X7K92`) and a QR code.
2. User B scans the QR code (or types the code) to join from another device.
3. Both browsers exchange WebRTC signaling information through the server (Socket.IO).
4. Once connected, a direct **WebRTC DataChannel** is opened between the two browsers.
5. Files are chunked and streamed straight from Browser A to Browser B.
6. The receiver downloads the reconstructed file. The server was never involved in the transfer itself.

---

## Features

- Room creation with short, unambiguous alphanumeric codes
- QR code generation for instant joining, plus a native share-sheet button on mobile
- Real-time Socket.IO signaling (offer / answer / ICE)
- Direct WebRTC DataChannel file transfer (no server upload)
- Chunked transfer (16 KB) with backpressure handling
- Multi-file support with per-file progress, speed, and ETA
- Drag-and-drop, folder select, and clipboard paste — all feed the same send pipeline
- Cancel, reject, retry, and remove individual transfers; "clear completed" vs "clear all"
- Soft warning toast before sending very large files (>500 MB)
- Sound + browser notification when a transfer finishes
- **Host-controlled room lifecycle** (see below): accidental disconnects don't end the room, but the host can explicitly end it, lock it against new joins, or remove the other device
- Room auto-expiry (default 30 minutes) with a live countdown and in-memory cleanup
- Peer-mid-transfer-disconnect handling — active transfers are marked failed (and retryable) instead of hanging forever
- Recent-rooms shortcut list (stored only in the browser's `localStorage`, never sent to the server)
- Light-purple / white design system with a full dark mode
- Navigation is intentionally locked while inside a room (nav links disabled, tab-close confirmation) so an accidental click doesn't drop a transfer
- Responsive UI — desktop, tablet, and mobile
- Toast notifications, accessible focus states, and human-readable errors

---

## Room Lifecycle & Host Controls

Two different concepts were easy to conflate in the original spec, so here's exactly how it works:

- **A soft "Leave"** (closing the tab, a network drop, or clicking "Leave") does **not** end the room. The room stays alive for a short grace period, and if the host is the one who left, they are automatically recognized as host again if they come back (via a private token kept in that browser's `sessionStorage` — it's never shown to the other device and never leaves the browser except over the socket connection to prove identity).
- **"End room"** (host-only button) immediately destroys the room for everyone. The other device receives a clear "The host has ended this room" message and is sent home — they cannot rejoin afterwards.
- **"Lock room"** (host-only) stops new devices from joining without ending an existing session.
- **Kick** (host-only, shown next to the connected peer once both devices are present) removes the other device immediately.
- Only the room's original creator ever holds the host token, so only they see the End room / Lock / Kick controls.

---

## Demo

Run locally following [Testing Two Devices](#testing-two-devices) below, or deploy using the [Deployment](#deployment) guide.

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Socket.IO Client, WebRTC APIs, `qrcode`, Lucide React
**Backend:** Node.js, Express, Socket.IO, CORS, dotenv

No database. Room state lives in server memory for the lifetime of the room.

---

## Architecture

```
                    WEB DROP
                       │
          ┌────────────┴────────────┐
          │                         │
      FRONTEND                   BACKEND
   React + Vite              Node + Express
          │                         │
          │                     Socket.IO
          │                         │
          └────────────┬────────────┘
                       │
                   Signaling
                       │
              ┌────────┴────────┐
              │                 │
          Browser A          Browser B
              │                 │
              └──── WebRTC ────┘
                DataChannel
                     │
                  FILE DATA
```

**The most important rule in this codebase: the backend coordinates the connection; WebRTC transfers the file.** Socket.IO is used only for room management and signaling — it never carries file bytes.

---

## How WebRTC Works Here

```
Device A                Socket.IO Server              Device B
   │  createOffer()            │                          │
   ├──────── offer ───────────►│──────── offer ──────────►│
   │                           │                  createAnswer()
   │◄──────── answer ──────────│◄──────── answer ──────────┤
   │                           │                          │
   ├── ICE candidate ─────────►│── ICE candidate ─────────►│
   │◄── ICE candidate ─────────│◄── ICE candidate ─────────┤
   │                                                       │
   └─────────────── WebRTC DataChannel (P2P) ──────────────┘
```

STUN (`stun:stun.l.google.com:19302`) is used for NAT traversal during development. Some network configurations (symmetric NAT, restrictive corporate firewalls) may require a TURN server for a reliable connection — the architecture (`ICE_SERVERS` in `frontend/src/utils/constants.js`) is ready for one to be added later. WebRTC is **not guaranteed to connect on every network** without TURN.

---

## File Transfer Flow

```
File → ArrayBuffer → 16 KB chunks → RTCDataChannel → Receiver → Collect chunks → Blob → Download
```

Protocol (see `docs/API.md` for full details):

```
{ type: "file-start", fileId, name, size, mimeType }
<binary chunks...>
{ type: "file-complete", fileId }
```

The DataChannel is created with `ordered: true`, so chunks always arrive in the order they were sent — this is what guarantees correct reconstruction on the receiving side. Backpressure is handled by watching `dataChannel.bufferedAmount` and pausing sends until it drains.

---

## Project Structure

```
webdrop/
├── frontend/     React + Vite app (UI, hooks, WebRTC/services layer)
├── backend/      Node + Express + Socket.IO signaling server
└── docs/         Architecture notes and API reference
```

See inline comments in `frontend/src/hooks/useWebRTC.js` and `frontend/src/hooks/useFileTransfer.js` for the core P2P logic.

---

## Installation

> **Note on this build:** every source file has been syntax-checked, but this project was assembled in an offline sandbox without npm registry access, so `npm install` and a real `npm run dev` have **not** been run end-to-end here. Please run the install and dev-server steps below yourself and do a first two-tab test before relying on it — see [Testing Two Devices](#testing-two-devices).

```bash
git clone <this-repo>
cd webdrop
```

Install both apps:

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Environment Variables

**backend/.env**
```env
PORT=5000
CLIENT_URL=http://localhost:5173
ROOM_EXPIRY_MINUTES=30
MAX_DEVICES_PER_ROOM=2
NODE_ENV=development
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

`.env.example` files are provided in both folders. Never commit real secrets.

---

## Running Backend

```bash
cd backend
npm run dev
```

Runs on `http://localhost:5000`.

## Running Frontend

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:5173`.

---

## Testing Two Devices

**Terminal 1:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm install
npm run dev
```

- On your laptop, open `http://localhost:5173` and create a room.
- On your phone, either scan the generated QR code or open the frontend URL and join with the room code.
- For same-network local testing, your phone needs to reach your laptop's local IP (e.g. `http://192.168.x.x:5173`) rather than `localhost`, and `CLIENT_URL`/`VITE_API_URL`/`VITE_SOCKET_URL` should be updated to match. Browser security (mixed content, HTTPS requirements for camera/mic on some browsers) does not affect plain file transfer, but WebRTC connectivity can still be affected by local network/firewall configuration.

---

## Testing Checklist

- [ ] Create room
- [ ] Invalid room code
- [ ] Join room
- [ ] QR join
- [ ] Device detection
- [ ] WebRTC connection
- [ ] Connection failure
- [ ] Send image
- [ ] Send PDF
- [ ] Send multiple files
- [ ] Send large file
- [ ] Transfer progress
- [ ] Transfer cancellation
- [ ] File download
- [ ] Device disconnect
- [ ] Room expiration
- [ ] Mobile UI
- [ ] Desktop UI

---

## Deployment

```
Vercel/Netlify (Frontend) ──HTTPS──► React app ──WSS──► Render/Railway (Backend, Socket.IO) 
Browser A ◄──────────────────────── P2P WebRTC ────────────────────────► Browser B
```

- **Frontend:** Vercel or Netlify
- **Backend:** Render or Railway

Set production environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`, `CLIENT_URL`) to your deployed URLs, and use HTTPS/WSS in production. Update `CLIENT_URL` on the backend to your deployed frontend origin (never `*` in production CORS config).

---

## Limitations

- **STUN-only by default.** Most home/mobile-network pairs (including mobile-to-mobile and mobile-to-PC) will connect fine, but some networks — especially symmetric NATs common on certain carrier or corporate networks — need a TURN relay to connect at all. TURN isn't included: it needs a real hosted relay service and credentials, which is infrastructure this project doesn't provision. `ICE_SERVERS` in `frontend/src/utils/constants.js` is where you'd add one (e.g. from Twilio, Metered, or a self-hosted coturn instance) if cross-network reliability becomes an issue.
- **Exact phone models aren't detectable from the browser.** iOS Safari and Chrome never expose the specific iPhone/iPad model to a website — Apple blocks that for privacy — so WebDrop shows "iPhone · Safari" rather than "iPhone 16". Android sometimes exposes a raw model code (e.g. `SM-G991B`) via Chrome, which is shown as-is; there's no reliable way to turn that into a marketing name without a large, frequently-outdated device database.
- Rooms are capped at 2 devices to keep the WebRTC/signaling logic simple (no group/3+ peer support).
- Room state is in-memory — restarting the backend clears all active rooms.
- No end-to-end passphrase encryption layer beyond what WebRTC provides natively (DTLS-SRTP/SCTP, which already encrypts the DataChannel in transit).
- The retry button for a failed send only works while the original file is still in that browser tab's memory (i.e., the tab wasn't closed/reloaded since selecting it).

## Future Improvements

TURN server integration, password-protected rooms, transfer history, 3+ peer group rooms, resumable/pausable transfers, PWA/installable support, bandwidth throttling / low-data mode, optional end-to-end passphrase encryption, and richer in-transfer file previews.

---

## Team

Built as a college mini-project demonstrating real-time communication, WebRTC peer-to-peer networking, and full-stack engineering.

## License

MIT — see [LICENSE](./LICENSE).

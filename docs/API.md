# WebDrop — API & Socket Reference

## REST API

Base URL: `http://localhost:5000/api`

### `GET /health`
Health check.
```json
{ "success": true, "message": "WebDrop server is running" }
```

### `POST /rooms`
Create a new room.
```json
{ "success": true, "roomCode": "X7K92", "expiresAt": 1719999999999 }
```

### `GET /rooms/:roomCode`
Check whether a room exists and its current state.
```json
{ "success": true, "roomCode": "X7K92", "deviceCount": 1, "isFull": false, "expiresAt": 1719999999999 }
```

---

## Socket.IO Events

### Room lifecycle
| Event | Direction | Payload |
|---|---|---|
| `create-room` | client → server | `{ deviceName }` |
| `room-created` | server → client | `{ roomCode, expiresAt, deviceName }` |
| `join-room` | client → server | `{ roomCode, deviceName }` |
| `room-joined` | server → client | `{ roomCode, deviceName, peers: [{socketId, deviceName}] }` |
| `user-joined` | server → room | `{ socketId, deviceName }` |
| `user-left` | server → room | `{ socketId, deviceName }` |
| `leave-room` | client → server | — |
| `room-error` | server → client | `{ message, code }` |

### WebRTC signaling (relay only — no file data)
| Event | Payload |
|---|---|
| `webrtc-offer` | `{ targetSocketId, offer }` |
| `webrtc-answer` | `{ targetSocketId, answer }` |
| `webrtc-ice-candidate` | `{ targetSocketId, candidate }` |

### Connection
| Event | Payload |
|---|---|
| `peer-connected` | `{ targetSocketId }` |
| `peer-disconnected` | `{ targetSocketId }` |

---

## DataChannel File Transfer Protocol

Transferred entirely peer-to-peer over an ordered `RTCDataChannel`. One file streams fully before the next begins.

```
JSON  { type: "file-start", fileId, name, size, mimeType }
ArrayBuffer chunks (binary, 16 KB each)
JSON  { type: "file-complete", fileId }
JSON  { type: "file-cancel", fileId }   -- sent by either side at any point
```

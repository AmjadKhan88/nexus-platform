# Nexus Platform — Backend API Documentation

Version: 1.0.0
Last updated: April 22, 2026

This document describes the Nexus backend API: endpoints, request/response formats, authentication, WebSocket events (Socket.IO), error formats, environment variables, and examples.

---

## Table of contents
- Overview
- Authentication
- Error format & pagination
- REST API endpoints
  - Auth (`/api/auth`)
  - Users (`/api/users`)
  - Messages (`/api/messages`)
  - Calls (`/api/calls`)
  - Meetings (`/api/meetings`)
  - Documents (`/api/documents`)
  - Collaborations (`/api/collaborations`)
  - Deals (`/api/deals`)
  - Notifications (`/api/notifications`)
  - Payments (`/api/payments`)
- Socket.IO (real-time) events
- WebRTC signaling flow
- Environment variables (summary)
- Security & rate limiting
- Examples (curl + JS)

---

## Overview
The Nexus backend exposes a JSON REST API protected by JWT and a Socket.IO interface for real-time features (chat, presence, WebRTC signaling). All REST endpoints that require authentication expect the `Authorization: Bearer <token>` header.

Base URL (development): `http://localhost:5000`

Response envelope (successful):

```json
{
  "success": true,
  "...": "..."
}
```

Error envelope:

```json
{
  "success": false,
  "message": "Human readable message",
  "errors": {...} // optional, for validation errors
}
```

---

## Authentication

- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`
- Forgot / Reset password endpoints exist under `/api/auth` (see code for exact routes)

Authentication uses JWT. After successful login the response contains a token which the frontend stores and sends as `Authorization: Bearer <token>` for protected endpoints. Socket.IO connections include the token in `auth` on connect: e.g. `io(baseUrl, { auth: { token } })`.

Token validation is enforced in `middleware/auth.js`.

---

## Error format & pagination

- Errors return HTTP status codes (400, 401, 403, 404, 500) and the standard error JSON envelope.
- Pagination is implemented via `limit` and `skip` query parameters on list endpoints. Sorting and filters are implemented via query parameters.

---

## REST API Endpoints

Note: All endpoints under `/api` unless absolute URL shown.

### Auth (`/api/auth`)
- `POST /login` — login with credentials. Body: `{ email, password }`. Returns `{ success:true, token, user }`.
- `POST /register` — register new user. Body: `{ name, email, password, role }`.
- `POST /forgot-password` — request reset.
- `POST /reset-password` — use token to reset.

Permissions: public for register/login; protected for other profile endpoints.

---

### Users (`/api/users`)
- `GET /` — get list of users (protected). Query params: `role`, `q`, `limit`, `skip`.
- `GET /me` — get current user's profile (protected).
- `GET /:id` — get user by id (protected/public based on app policy).
- `PUT /:id` — update user (protected; role checks applied in middleware).
- `DELETE /:id` — delete user (admin/protected).

Returns user objects with fields such as `_id, name, email, avatarUrl, role, isOnline`.

---

### Messages (`/api/messages`)
- `GET /conversations` — get conversation summaries for current user.
- `GET /:userId` — get messages between current user and `userId`. Query: `limit`, `skip`.
- `POST /` — send message (REST fallback). Body: `{ receiverId, content }`.
- `DELETE /:id` — delete message.

Socket notes: primary sending uses Socket.IO (`message:send`) while REST persists messages for fallback.

---

### Calls (`/api/calls`)
(Endpoints added for call history & management.)

- `POST /initiate` — Initiate a call. Body: `{ participantId, callType }` where `callType` is `video` or `audio`. Returns `{ success:true, roomId, callRoom }`.
- `GET /history` — Get call history for current user. Query: `limit`, `skip`, `type` (audio|video).
- `GET /active` — Get active calls for current user.
- `GET /:roomId` — Get details about a call.
- `PUT /:roomId/status` — Update call status. Body: `{ status }` where status ∈ `[ringing, active, ended, missed, declined]`.
- `PUT /:roomId/leave` — Record that the user left the call; updates timestamps.
- `DELETE /:roomId` — Delete call record (owner or participant only).

Call data model: `CallRoom` contains `roomId, initiatorId, participantId, callType, status, startTime, endTime, duration`.

---

### Meetings (`/api/meetings`)
- `POST /` — Schedule a meeting. Body: `{ title, attendees, startTime, endTime, description, location }`.
- `GET /` — Get meetings for current user (organizer or attendee). Query supported.
- `PUT /:id` — Update meeting (status changes like accept/reject/cancel).
- `DELETE /:id` — Delete (soft-delete or cancel) a meeting.

Meeting schema has `meetingLink`, and new fields for `videoCallRoomId` and `hasVideoCall` when meetings include video calls.

---

### Documents (`/api/documents`)
- `POST /` — Upload document (Multer + Cloudinary). `multipart/form-data` with `file`.
- `GET /` — List user documents. Query: `filter=recent|shared|starred|trash`.
- `GET /:id` — Get document details.
- `PUT /:id` — Update document metadata.
- `DELETE /:id` — Soft delete document.
- Signature route: e.g. `POST /:id/sign` accepts signature image data for signing.

Uploads use Cloudinary via `multer-storage-cloudinary` and `backend/config/cloudinary.js`.

---

### Collaborations (`/api/collaborations`)
- `POST /` — Create collaboration request.
- `GET /` — Get collaboration requests for current user.
- `PUT /:id` — Accept/Reject collaboration request.
- `DELETE /:id` — Cancel collaboration.

---

### Deals (`/api/deals`)
- `GET /` — Retrieve deals for the current user.
- `POST /` — Create deal (entrepreneur → investor or vice versa depending on app flow).
- `PUT /:id` — Update deal status or fields.
- `DELETE /:id` — Delete deal.

Deals response includes populated references to investor/entrepreneur summarized data.

---

### Notifications (`/api/notifications`)
- `GET /` — Get notifications for current user.
- `PUT /read-all` — Mark all notifications as read.
- `PUT /:id/read` — Mark one as read.
- `DELETE /:id` — Delete a notification.

Notifications are created across the app (meetings, calls, messages, collaboration events).

---

### Payments (`/api/payments`)
- `POST /deposit` — Create Stripe PaymentIntent. Body: `{ amount, currency }`. Returns `clientSecret`.
- `POST /withdraw` — Mock withdraw endpoint.
- `POST /transfer` — Mock transfer.
- `GET /transactions` — Get transaction history.
- `POST /webhook` — Stripe webhook endpoint (raw body required). Configure `STRIPE_WEBHOOK_SECRET`.

Payments use `stripe` with secret key in `.env`.

---

## Socket.IO (real-time) events
All socket connections must authenticate using JWT. Socket auth is done via the handshake: `io(baseUrl, { auth: { token } })`.

Server-side Socket.IO middleware verifies JWT and attaches `socket.userId`.

Key events (emit/listen):

### Presence
- `user:online` — broadcast when user comes online
- `user:offline` — broadcast when user disconnects

### Chat
- `message:send` — client emits `{ receiverId, content }` to send a message.
- `message:new` — server emits to recipient with message object.
- `message:typing` — typing indicator `{ receiverId, isTyping }`.
- `message:read` — mark as read

### Notifications
- `notification:send` — server emits `notification:new` to a user's socket room.

### WebRTC Signaling / Calls
The server acts as a signaling relay (no media flows through the server). Events:

Client → Server
- `call:join` `{ roomId }` — join a Socket.IO room for call signaling
- `call:initiate` `{ targetUserId, offer, callType }` — initial call (optional; REST also creates CallRoom)
- `call:offer` `{ roomId, offer }` — send SDP offer to room
- `call:answer` `{ roomId, answer }` — send SDP answer to room
- `call:ice-candidate` `{ roomId, candidate }` — ICE candidate
- `call:reject` `{ callerId }` — reject call
- `call:end` `{ roomId, targetUserId }` — end call
- `call:toggle-media` `{ roomId, audio, video }` — toggle state

Server → Client
- `call:incoming` `{ callerId, offer, callType }` — incoming call notification
- `call:offer` `{ offer, from }` — relayed offer
- `call:answer` `{ answer, from }` — relayed answer
- `call:ice-candidate` `{ candidate, from }` — relayed ICE candidate
- `call:rejected` `{ by }` — call rejected
- `call:ended` `{ by, endedAt }` — call ended
- `call:media-toggled` `{ by, audio, video }` — media toggled
- `call:user-unavailable` `{ targetUserId }`

Notes:
- The server maps userId → socketId to route direct events.
- Use rooms for multi-party calls or to keep signaling scoped to call participants.

---

## WebRTC Signaling Flow (1:1)
1. Caller creates call via `POST /api/calls/initiate` → server creates `CallRoom` and notifies callee (notification + socket event `call:incoming`).
2. Both clients connect to Socket.IO (auth via JWT).
3. Caller and callee join the room with `call:join`.
4. Caller obtains local media and creates an SDP offer; emits `call:offer` to room.
5. Callee receives offer, sets remote description, creates answer, emits `call:answer`.
6. Both exchange `call:ice-candidate` messages until connectivity is established.
7. On hangup, emit `call:end` and update call status via REST if desired.

---

## Environment variables (summary)
Key vars are located in `backend/.env` (example):

- `PORT` — server port (default 5000)
- `MONGO_URI` — MongoDB connection
- `JWT_SECRET`, `JWT_EXPIRE` — auth
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` — email
- `CLOUDINARY_*` — uploads
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payments
- `WEBRTC_SIGNALING_SERVER` — url for client signaling
- `ICE_SERVERS` — JSON array of STUN/TURN servers

Refer to `ENV_VARIABLES_REFERENCE.md` for full details.

---

## Security & Rate Limiting
- JWT validation for protected routes and sockets.
- Rate limiter applied to `/api/` and stricter limits on `/api/auth`.
- Input sanitization via `express-mongo-sanitize` and `express-validator` where applicable.
- Helmet for headers and CORS configured with `CLIENT_URL`.

---

## Examples

### Curl — Health check
```bash
curl http://localhost:5000/api/health
```

### Curl — Initiate Call
```bash
curl -X POST http://localhost:5000/api/calls/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"participantId":"604c1f...","callType":"video"}'
```
Response:
```json
{
  "success": true,
  "roomId": "uuid-...",
  "callRoom": { ... }
}
```

### JS — Connect Socket.IO with JWT
```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000', { auth: { token } });

socket.on('connect', () => console.log('connected', socket.id));

// Listen for incoming calls
socket.on('call:incoming', (payload) => console.log('incoming', payload));
```

### JS — Basic WebRTC signaling example (high-level)
1. Join room: `socket.emit('call:join', { roomId })`
2. Caller: create offer → `socket.emit('call:offer', { roomId, offer })`
3. Callee: listen `socket.on('call:offer', ...)` → create answer → `socket.emit('call:answer', { roomId, answer })`
4. Exchange ICE via `call:ice-candidate`.

---

## Notes & Implementation details
- Socket auth middleware is at `backend/socket/socketHandler.js` (verifies JWT and attaches `socket.userId`).
- Messaging uses both Socket.IO (real-time) and REST for persistence/fallback (`/api/messages`).
- Calls are not proxied through server — only signaling messages are relayed.
- Cloudinary is used for file storage. Multer storage is configured in `middleware/upload.js`.

---

## Troubleshooting
- If clients fail to exchange video/audio, check `ICE_SERVERS` and TURN server configuration.
- Ensure `CLIENT_URL` matches frontend origin to avoid CORS issues.
- For Stripe webhook, use the raw body route `/api/payments/webhook` and configure `STRIPE_WEBHOOK_SECRET`.

---

## References
- Socket handler: `backend/socket/socketHandler.js`
- Call controller: `backend/controllers/callController.js`
- Call model: `backend/models/CallRoom.js`
- Meeting controller & model: `backend/controllers/meetingController.js`, `backend/models/Meeting.js`
- Environment variables: `backend/.env`, `ENV_VARIABLES_REFERENCE.md`

---

If you want, I can:
- Generate OpenAPI (Swagger) spec from these routes
- Create Postman collection
- Add example requests per route in this doc

Tell me which you'd like next.

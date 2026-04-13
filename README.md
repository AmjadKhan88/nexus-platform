# Nexus Backend API

> **Investor & Entrepreneur Collaboration Platform**  
> Built with **Node.js · Express · Mongoose · Socket.IO**

---

## 📁 Project Structure

```
backend/
├── server.js                  # Entry point
├── config/
│   ├── db.js                  # MongoDB connection
│   └── email.js               # Nodemailer transport
├── models/                    # Mongoose schemas
│   ├── User.js                # Entrepreneur + Investor (unified)
│   ├── Message.js
│   ├── CollaborationRequest.js
│   ├── Document.js
│   ├── Deal.js
│   ├── Meeting.js
│   ├── Transaction.js
│   └── Notification.js
├── controllers/               # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── messageController.js
│   ├── collaborationController.js
│   ├── documentController.js
│   ├── meetingController.js
│   ├── dealController.js
│   ├── paymentController.js
│   └── notificationController.js
├── routes/                    # Express routers
├── middleware/
│   ├── auth.js                # JWT protect + role guard
│   ├── upload.js              # Multer file upload
│   └── errorHandler.js
├── socket/
│   └── socketHandler.js       # Real-time chat + WebRTC signaling
└── uploads/                   # Uploaded files (gitignored)
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run in development
```bash
npm run dev
```

### 4. Run in production
```bash
npm start
```

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Token expiry (e.g. `7d`) |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password / app password |
| `STRIPE_SECRET_KEY` | Stripe sandbox secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

---

## 📡 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login (returns JWT) | ❌ |
| POST | `/logout` | Logout + mark offline | ✅ |
| GET | `/me` | Get current user | ✅ |
| POST | `/forgot-password` | Send reset email | ❌ |
| PUT | `/reset-password/:token` | Reset password | ❌ |
| POST | `/send-otp` | Send 2FA OTP | ✅ |
| POST | `/verify-otp` | Verify OTP | ✅ |

### Users — `/api/users`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get all users | ✅ |
| GET | `/entrepreneurs` | Get all entrepreneurs | ✅ |
| GET | `/investors` | Get all investors | ✅ |
| GET | `/:id` | Get user by ID | ✅ |
| PUT | `/profile` | Update own profile | ✅ |
| PUT | `/avatar` | Upload avatar image | ✅ |

### Messages — `/api/messages`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/conversations` | Get all conversations | ✅ |
| GET | `/:userId` | Get messages with a user | ✅ |
| POST | `/` | Send a message (REST) | ✅ |
| DELETE | `/:id` | Delete a message | ✅ |

### Collaborations — `/api/collaborations`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Send collaboration request | ✅ Investor |
| GET | `/` | Get requests for current user | ✅ |
| PUT | `/:id` | Accept / Reject request | ✅ Entrepreneur |
| DELETE | `/:id` | Delete request | ✅ Investor |

### Documents — `/api/documents`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Upload document | ✅ |
| GET | `/` | Get my documents | ✅ |
| GET | `/:id` | Get single document | ✅ |
| PUT | `/:id/share` | Share with another user | ✅ |
| PUT | `/:id/sign` | Add e-signature | ✅ |
| PUT | `/:id/star` | Toggle starred | ✅ |
| DELETE | `/:id` | Move to trash | ✅ |

### Meetings — `/api/meetings`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Schedule meeting | ✅ |
| GET | `/` | Get my meetings | ✅ |
| PUT | `/:id` | Update status | ✅ |
| DELETE | `/:id` | Delete meeting | ✅ |

### Deals — `/api/deals`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Create deal | ✅ Investor |
| GET | `/` | Get my deals | ✅ |
| GET | `/:id` | Get single deal | ✅ |
| PUT | `/:id` | Update deal | ✅ Investor |
| DELETE | `/:id` | Delete deal | ✅ Investor |

### Payments — `/api/payments`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/deposit` | Create Stripe PaymentIntent | ✅ |
| POST | `/withdraw` | Mock withdrawal | ✅ |
| POST | `/transfer` | Mock transfer | ✅ |
| GET | `/transactions` | Get transaction history | ✅ |
| POST | `/webhook` | Stripe webhook | ❌ |

### Notifications — `/api/notifications`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get notifications | ✅ |
| PUT | `/read-all` | Mark all as read | ✅ |
| PUT | `/:id/read` | Mark one as read | ✅ |
| DELETE | `/:id` | Delete notification | ✅ |

---

## 🔌 Socket.IO Events

Connect with JWT:
```js
const socket = io('http://localhost:5000', {
  auth: { token: 'your_jwt_token' }
});
```

### Chat Events
| Event (emit) | Payload | Description |
|---|---|---|
| `message:send` | `{ receiverId, content }` | Send a message |
| `message:typing` | `{ receiverId, isTyping }` | Typing indicator |
| `message:read` | `{ senderId }` | Mark messages as read |

| Event (listen) | Payload | Description |
|---|---|---|
| `message:new` | Message object | New message received |
| `message:typing` | `{ senderId, isTyping }` | Partner is typing |
| `message:read` | `{ by: userId }` | Messages read by partner |

### Video/Audio Call Events (WebRTC Signaling)
| Event (emit) | Payload | Description |
|---|---|---|
| `call:initiate` | `{ targetUserId, offer, callType }` | Start a call |
| `call:answer` | `{ callerId, answer }` | Answer a call |
| `call:ice-candidate` | `{ targetUserId, candidate }` | Exchange ICE candidates |
| `call:reject` | `{ callerId }` | Reject incoming call |
| `call:end` | `{ targetUserId }` | End call |
| `call:toggle-media` | `{ targetUserId, audio, video }` | Toggle mute/camera |

| Event (listen) | Payload | Description |
|---|---|---|
| `call:incoming` | `{ callerId, offer, callType }` | Incoming call |
| `call:answered` | `{ answer }` | Call was answered |
| `call:rejected` | `{ by }` | Call was rejected |
| `call:ended` | `{ by }` | Call ended |
| `call:user-unavailable` | `{ targetUserId }` | Target user offline |

### Presence Events
| Event (listen) | Payload | Description |
|---|---|---|
| `user:online` | `{ userId }` | User came online |
| `user:offline` | `{ userId }` | User went offline |

---

## 🔗 Frontend Integration

Update your `AuthContext.tsx` to call the real API:

```ts
// Replace mock login with:
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role }),
});
const data = await response.json();
localStorage.setItem('token', data.token);
```

For protected calls, send the JWT in the Authorization header:
```ts
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

---

## 🛡️ Security Features

- **bcrypt** password hashing (salt rounds: 12)
- **JWT** authentication with expiry
- **Role-based access control** (investor / entrepreneur)
- **Rate limiting** (100 req/15min global, 20 req/15min on auth)
- **Helmet** HTTP security headers
- **express-mongo-sanitize** NoSQL injection prevention
- **Multer** file type + size validation
- **2FA mock** via OTP email (Nodemailer)

---

## 🚢 Deployment

**Backend → Render / Railway / Heroku**
```bash
# Set environment variables in dashboard
# Build command: npm install
# Start command: npm start
```

**Frontend → Vercel**
```bash
# Set VITE_API_URL=https://your-backend.onrender.com in Vercel env vars
```

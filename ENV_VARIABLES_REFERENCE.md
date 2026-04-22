# 📌 Environment Variables Summary

## Quick Reference - All Required & Optional Environment Variables

---

## Backend Environment Variables

### File: `backend/.env`

```env
# ═══════════════════════════════════════════════════════════════════════
# CORE SERVER CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

NODE_ENV=development                    # development | production
PORT=5000                              # Backend server port
CLIENT_URL=http://localhost:5173       # Frontend URL for CORS

# ───────────────────────────────────────────────────────────────────────
# DATABASE
# ───────────────────────────────────────────────────────────────────────

MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
# Local: mongodb://localhost:27017
# Cloud (Atlas): mongodb+srv://username:password@cluster.mongodb.net

# ───────────────────────────────────────────────────────────────────────
# AUTHENTICATION (JWT)
# ───────────────────────────────────────────────────────────────────────

JWT_SECRET=your_super_secret_jwt_key_generate_with_openssl
# Generate: openssl rand -base64 32
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# ───────────────────────────────────────────────────────────────────────
# EMAIL SERVICE (Nodemailer)
# ───────────────────────────────────────────────────────────────────────

EMAIL_HOST=smtp.gmail.com              # Your SMTP host
EMAIL_PORT=587                         # Usually 587 for TLS, 465 for SSL
EMAIL_USER=your_email@gmail.com        # Sender email
EMAIL_PASS=your_app_password           # Gmail App Password (not regular password)
EMAIL_FROM=Nexus Platform <noreply@nexus.com>  # From header

# Setup for Gmail:
# 1. Enable 2FA on Google Account
# 2. Go to: myaccount.google.com/apppasswords
# 3. Generate app password for Mail

# ───────────────────────────────────────────────────────────────────────
# FILE UPLOADS (Cloudinary)
# ───────────────────────────────────────────────────────────────────────

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key_numbers
CLOUDINARY_API_SECRET=your_api_secret

# Setup:
# 1. Sign up at https://cloudinary.com/
# 2. Get credentials from Dashboard
# 3. Free tier: 25 GB storage, unlimited bandwidth

# ───────────────────────────────────────────────────────────────────────
# PAYMENTS (Stripe)
# ───────────────────────────────────────────────────────────────────────

STRIPE_SECRET_KEY=sk_test_XXXX          # Secret key (never share)
STRIPE_WEBHOOK_SECRET=whsec_XXXX        # Webhook signing secret

# Setup:
# 1. Create account at https://dashboard.stripe.com
# 2. Get API keys from Developers > API Keys
# 3. Use sk_test_* for development
# 4. Create webhook endpoint for payments

# ───────────────────────────────────────────────────────────────────────
# VIDEO & AUDIO CALLS (WebRTC)
# ───────────────────────────────────────────────────────────────────────

WEBRTC_SIGNALING_SERVER=http://localhost:5000
# URL of this server for WebRTC signaling
# Production: https://api.yoursite.com

ICE_SERVERS=["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302"]
# STUN servers for NAT traversal (free, Google)
# Add more for reliability: stun2, stun3, stun4

# Optional: TURN Server (for better connectivity through restrictive networks)
TURN_SERVER_URL=turn:your-turn-server.com
TURN_SERVER_USERNAME=username
TURN_SERVER_PASSWORD=password
TURN_SERVER_PORT=3478

# Recommendation:
# - Development: Use free Google STUN servers
# - Production: Set up TURN server or use Twilio

# ───────────────────────────────────────────────────────────────────────
# CALL CONFIGURATION
# ───────────────────────────────────────────────────────────────────────

MAX_CALL_PARTICIPANTS=2                # Max users per call room
CALL_TIMEOUT_SECONDS=3600              # Call auto-hangup after 1 hour
CALL_RING_TIMEOUT_SECONDS=60           # Ringing timeout before missed

# ═══════════════════════════════════════════════════════════════════════
```

---

## Frontend Environment Variables

### File: `frontend/.env.local`

```env
# ═══════════════════════════════════════════════════════════════════════
# FRONTEND CONFIGURATION (Vite)
# ═══════════════════════════════════════════════════════════════════════

# Note: Prefix with VITE_ for Vite to expose to client

# ───────────────────────────────────────────────────────────────────────
# API CONFIGURATION
# ───────────────────────────────────────────────────────────────────────

VITE_API_URL=http://localhost:5000     # Backend API URL
# Production: https://api.yoursite.com

# ───────────────────────────────────────────────────────────────────────
# VIDEO & AUDIO CALLS (WebRTC)
# ───────────────────────────────────────────────────────────────────────

VITE_WEBRTC_ENABLED=true               # Enable/disable WebRTC feature

VITE_ICE_SERVERS=["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302","stun:stun2.l.google.com:19302"]
# Same as backend for consistency

# Optional TURN Server
VITE_TURN_SERVER=turn:your-turn-server.com
VITE_TURN_USERNAME=username
VITE_TURN_PASSWORD=password

# ───────────────────────────────────────────────────────────────────────
# CALL TIMING & LIMITS
# ───────────────────────────────────────────────────────────────────────

VITE_MAX_CALL_PARTICIPANTS=2           # Max users per call
VITE_CALL_TIMEOUT_MS=3600000           # 1 hour in milliseconds
VITE_CALL_RING_TIMEOUT_MS=60000        # 60 seconds in milliseconds

# ───────────────────────────────────────────────────────────────────────
# MEDIA SETTINGS (Video/Audio)
# ───────────────────────────────────────────────────────────────────────

VITE_DEFAULT_AUDIO_ENABLED=true        # Start call with audio on
VITE_DEFAULT_VIDEO_ENABLED=true        # Start call with video on

VITE_VIDEO_WIDTH=1280                  # Video resolution width
VITE_VIDEO_HEIGHT=720                  # Video resolution height
VITE_VIDEO_FRAMERATE=30                # Frames per second

# Quality presets:
# HD: 1280x720 @ 30fps
# FHD: 1920x1080 @ 30fps
# SD: 640x480 @ 24fps

# ───────────────────────────────────────────────────────────────────────
# DEBUG & DEVELOPMENT
# ───────────────────────────────────────────────────────────────────────

VITE_ENV=development                   # development | production
# Controls console logging and error handling

# ═══════════════════════════════════════════════════════════════════════
```

---

## Environment Variables Checklist

### Required for Development

- [x] `MONGO_URI` - Database connection
- [x] `JWT_SECRET` - Authentication
- [x] `CLIENT_URL` - CORS configuration
- [x] `VITE_API_URL` - Frontend API connection
- [x] `CLOUDINARY_*` - File uploads
- [x] `EMAIL_*` - Email sending
- [x] `STRIPE_*` - Payment processing
- [x] `ICE_SERVERS` - WebRTC connectivity

### Optional but Recommended

- [ ] `TURN_SERVER_*` - Better WebRTC connectivity
- [ ] `STRIPE_PUBLIC_KEY` - Frontend payment integration
- [ ] `LOG_LEVEL` - Debug logging

### For Production Deployment

- [ ] Update `CLIENT_URL` to production domain
- [ ] Change `NODE_ENV` to "production"
- [ ] Generate new `JWT_SECRET` (secure)
- [ ] Set up TURN server or use service
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Use secure SMTP server
- [ ] Set rate limiting

---

## How to Generate Secrets

### JWT Secret (Secure Random String)

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[System.Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256})) 

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Service Setup Links

| Service | Setup URL | Free Tier |
|---------|-----------|-----------|
| MongoDB | https://www.mongodb.com/cloud | ✅ 512MB |
| Cloudinary | https://cloudinary.com/users/register/free | ✅ 25GB |
| Stripe | https://dashboard.stripe.com/register | ✅ Free testing |
| Gmail SMTP | https://myaccount.google.com/apppasswords | ✅ 15,000/day |
| Google STUN | Built-in | ✅ Free |
| Twilio TURN | https://www.twilio.com | 💰 Paid |

---

## Validation & Testing

### Test Environment Variables

```bash
# Backend
cd backend
npm run dev
# Look for: "✅ MongoDB Connected"
# "🚀 Nexus server running on port 5000"

# Frontend (in new terminal)
cd frontend
npm run dev
# Should connect to http://localhost:5173
```

### Quick Test API

```bash
# Health check
curl http://localhost:5000/api/health

# Should respond with:
# {"success":true,"message":"Nexus API is running",...}
```

---

## Troubleshooting Variables

### Issue: "MongoDB connection error"
- Check `MONGO_URI` format
- Verify network access (Atlas)
- Test connection string

### Issue: "CORS errors"
- Ensure `CLIENT_URL` matches frontend URL
- Update CORS in production

### Issue: "Email not sending"
- Check `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- For Gmail: Use App Password, not regular password
- Enable "Less secure app access"

### Issue: "WebRTC no audio/video"
- Check `ICE_SERVERS` - should have at least 1 STUN
- For production: Add TURN server
- Check browser permissions

---

## Updated: April 22, 2026
**Version**: 1.0.0 - Video Call Ready ✅

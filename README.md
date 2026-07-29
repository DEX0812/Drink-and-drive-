# 🛡️ DriveSafe Platform

**Production-Ready On-Demand Personal Driver Service — Uber-like system for users who need a safe, professional driver.**

> *"Too intoxicated to drive? Own a car but can't drive? Let a certified professional driver take the wheel — in your own vehicle."*

---

## 📐 Architecture Overview

```
┌─────────────────┐     Socket.io     ┌──────────────────────┐
│  Rider App      │◄─────────────────►│                      │
│  (Expo/RN)      │   REST API        │   Backend            │
├─────────────────┤◄─────────────────►│   Node.js + Express  │◄──► PostgreSQL
│  Driver App     │   WebSockets      │   Socket.io Server   │      (Prisma ORM)
│  (Expo/RN)      │◄─────────────────►│                      │
├─────────────────┤     REST API      └──────────────────────┘
│  Admin Panel    │◄─────────────────►         ▲
│  (Next.js)      │   Socket.io Live             │
└─────────────────┘                    Stripe (Payments)
```

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Rider App** | React Native (Expo) | Cross-platform rider mobile app |
| **Driver App** | React Native (Expo) | Cross-platform driver mobile app |
| **Admin** | Next.js 15 + Tailwind | Operations Center & Driver Management |
| **Backend** | Node.js (Express) | REST API + WebSocket server |
| **Database** | PostgreSQL + Prisma | Robust data modeling |
| **Maps** | OpenStreetMap (OSRM) | Zero-cost mapping & routing |
| **Real-Time** | Socket.io | Live GPS tracking & ride events |
| **Payments** | Stripe (Sandbox) | Secure payment processing |
| **Auth** | JWT (jsonwebtoken) | Role-based access |

---

## ✨ Feature Matrix

### 👤 Rider Features
- ✅ Register / Login with JWT authentication
- ✅ Request driver with GPS pickup/dropoff
- ✅ Three service types: **Intoxicated Safe Ride**, **Need a Driver**, **Standard Hailing**
- ✅ Real-time driver tracking on map
- ✅ Fare estimation before booking
- ✅ Ride status: Searching → Assigned → Arriving → Ongoing → Completed
- ✅ Payment flow (Stripe sandbox)
- ✅ Driver rating & review system
- ✅ SOS emergency button

### 🚘 Driver Features
- ✅ Driver registration with license & experience
- ✅ Manual transmission certification flag
- ✅ Online / Offline toggle from Dashboard
- ✅ Real-time ride request notifications (Socket.io)
- ✅ 30-second countdown auto-reject timer
- ✅ Accept / Reject requests with API call
- ✅ Active trip navigation with phase transitions
- ✅ Trip summary with earnings

### 🧠 Intelligent Matching
- ✅ Haversine distance-based nearest driver matching
- ✅ Transmission qualification check (MANUAL/AUTO)
- ✅ Optimistic locking — prevents double-accepts
- ✅ Fallback to REQUESTED queue if no driver nearby

### 🏛️ Admin Operations Center
- ✅ Live KPI dashboard (active rides, online drivers, revenue)
- ✅ Real-time driver location map (Leaflet + Socket.io)
- ✅ Driver verification queue (Approve / Reject pending applications)
- ✅ Ride history table with search & status filter

### 🔐 Security
- ✅ JWT with role-based access (RIDER / DRIVER / ADMIN)
- ✅ Password hashing (bcryptjs)
- ✅ Rate limiting (100 req/15min global, 20 req/15min auth)
- ✅ Input validation on critical endpoints
- ✅ Optimistic locking on ride acceptance

---

## 🚀 QUICK START

### Prerequisites
- Node.js v18+
- Docker Desktop (for PostgreSQL)
- Expo Go app (on mobile) for testing rider/driver apps

### One-Click Launch (Windows)
```cmd
# Double-click or run:
Start-DriveSafe.bat
```
This automatically:
1. Starts PostgreSQL via Docker
2. Installs dependencies
3. Runs Prisma migrations
4. Launches **4 separate terminal windows**: Backend, Admin, Rider, Driver

---

### Manual Setup

#### 1. Start Database
```bash
docker-compose up -d
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment
The backend `.env` is pre-configured. Verify `packages/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drivesafe"
JWT_SECRET="drivesafe-super-secret-jwt-key-change-in-production"
STRIPE_SECRET_KEY="sk_test_your_stripe_key_here"
PORT=4000
```

#### 4. Run Database Migrations
```bash
npm run db:migrate
```

#### 5. Start All Services (separate terminals)
```bash
# Terminal 1 — Backend API
npm run backend:dev

# Terminal 2 — Admin Dashboard
npm run admin:dev

# Terminal 3 — Rider App
npm run rider:dev

# Terminal 4 — Driver App  
npm run driver:dev
```

#### 6. Access the Platform
| Service | URL |
|---|---|
| **Admin Dashboard** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **Health Check** | http://localhost:4000/health |
| **Rider/Driver** | Scan QR in Expo Go |

---

## 📡 API Reference

### Auth
```
POST /api/auth/register    — Register user (RIDER or DRIVER)
POST /api/auth/login       — Login, returns JWT token
```

### Rides
```
GET  /api/rides/estimate   — Get fare estimate (query: pickupLat, pickupLng, dropoffLat, dropoffLng, type)
POST /api/rides/request    — Create a new ride request
GET  /api/rides/history    — Get user's ride history
GET  /api/rides/:id        — Get specific ride details
POST /api/rides/cancel     — Cancel a ride
POST /api/rides/rate       — Rate a completed ride (1-5)
```

### Driver
```
GET  /api/driver/profile   — Get driver profile + today's stats
POST /api/driver/status    — Toggle online/offline { isOnline: bool }
GET  /api/driver/requests  — Get available ride requests sorted by distance
POST /api/driver/accept    — Accept a ride { rideId }
POST /api/driver/complete  — Mark as "arrived at pickup" (ONGOING)
POST /api/driver/finish    — Mark drop-off complete (COMPLETED)
```

### Payments
```
POST /api/payments/create-intent  — Create Stripe payment intent
POST /api/payments/webhook        — Stripe webhook handler
```

### Admin (No auth required for internal use)
```
GET   /api/admin/metrics             — Live KPIs
GET   /api/admin/drivers             — All driver profiles
PATCH /api/admin/drivers/:id/verify  — Approve/Reject driver { status }
GET   /api/admin/rides               — All rides history
```

---

## 🗄️ Database Schema

```
User          — id, email, password, name, role (RIDER/DRIVER/ADMIN)
Vehicle       — id, ownerId, model, transmission (MANUAL/AUTO), licensePlate
DriverProfile — driverId, licenseNumber, experienceYears, manualCertified, isOnline, lastLocationLat/Lng, rating, status
Ride          — id, riderId, driverId, type, status, pickupLat/Lng, dropoffLat/Lng, price, distance, serviceLevel
Payment       — id, rideId, amount, status, transactionId
Review        — id, rideId, fromUserId, toUserId, rating, comment
```

---

## 🏛️ Project Structure

```
Drink-and-drive-/
├── apps/
│   ├── rider/          # Rider Mobile App (Expo + React Native)
│   │   └── src/
│   │       └── screens/
│   │           ├── Auth/       — Login, Register
│   │           ├── Home/       — Map + BookingBottomSheet
│   │           └── Ride/       — RideActive, PaymentRating
│   ├── driver/         # Driver Mobile App (Expo + React Native)
│   │   └── src/
│   │       └── screens/
│   │           ├── Auth/       — Login, Register
│   │           ├── Dashboard/  — Online toggle, stats
│   │           └── Ride/       — IncomingRequest, ActiveTrip, TripSummary
│   └── admin/          # Next.js Admin Dashboard
│       ├── app/
│       │   ├── page.tsx        — Live metrics + map
│       │   ├── drivers/        — Driver management
│       │   └── rides/          — Ride history
│       └── components/
│           └── RealTimeMap.tsx — Leaflet live tracking
└── packages/
    ├── backend/         # Express + Socket.io API Server
    │   └── src/
    │       ├── controllers/    — auth, ride, driver, payment, vehicle
    │       ├── routes/         — all route files
    │       ├── middleware/      — JWT auth
    │       └── utils/          — prisma client, OSRM
    ├── db/              # Prisma Schema + Migrations
    │   └── prisma/
    │       └── schema.prisma
    └── shared/          # Cross-App Hooks, Components, Theme
        └── src/
            ├── api/            — Axios client + interceptors
            ├── hooks/          — useAuth, useRideTracking, useLocationStreamer
            ├── components/     — Core UI (Button, Card, Input, Heading)
            └── theme/          — Design tokens, ThemeProvider
```

---

## 🧪 Testing Scenarios

1. **Full Ride Flow**
   - Register as RIDER → Request a "Safe Ride Home"
   - Register as DRIVER → Go online → See incoming request
   - Driver accepts → Both see live tracking
   - Driver finishes → Rider rates & pays

2. **Driver Matching**
   - Multiple drivers online → nearest one gets the request
   - Manual car → only manual-certified drivers receive request

3. **Admin Operations**
   - New driver registers → appears in PENDING queue
   - Admin approves → driver can go online

---

## 💼 Portfolio Summary

*"Built a production-ready real-time Uber-like personal driver platform with live GPS location tracking, Haversine geospatial matching, room-based WebSocket architecture (Socket.io), JWT role-based auth, Stripe payment integration, Prisma ORM, and a premium React Native + Next.js admin dashboard."*

---

## ⚖️ License

Open-source for educational and portfolio purposes.
**Built with DriveSafe Engineering Team.**

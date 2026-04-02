# 🏙️ DriveSafe Platform

**Premium Transportation Ecosystem for Professional Driver-Hiring & Ride-Hailing.**

DriveSafe is a high-performance, full-stack transportation platform built on a 100% free/open-source stack. Optimized for high-end "Urban Flux" aesthetics, it bridges the gap between luxury service and urban utility.

## 📐 Platform Architecture

```mermaid
graph TD
    A[Rider App - Expo] -->|Socket.io| B[Backend Server - Node.js]
    C[Driver App - Expo] -->|Socket.io| B
    D[Admin Dashboard - Next.js] -->|REST API| B
    B -->|Prisma| E[(PostgreSQL DB)]
    B -->|Stripe API| F[Payments Sandbox]
    A -->|OpenStreetMap| G[OSM Map Tiles]
    C -->|OpenStreetMap| G
```

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Mobile** | React Native (Expo) | Cross-platform Rider & Driver apps |
| **Web** | Next.js (Tailwind) | Admin & Dispatch Dashboard |
| **Backend** | Node.js (Express) | Scalable REST & WebSocket Server |
| **Database** | PostgreSQL + Prisma | Robust data modeling & migrations |
| **Maps** | OpenStreetMap (OSRM) | Zero-cost mapping & routing |
| **Payments** | Stripe (Sandbox) | Secure transaction processing |
| **Real-time** | Socket.io | Live GPS tracking & mission updates |

---

## ✨ Feature Matrix

### 1. Dual-Purpose Logic
Seamlessly switch between **Standard Ride-Hailing** (driver's car) and **Professional Hiring** (your car).

### 2. Transmission Matching
The platform strictly enforces qualification checks. If a user has a **Manual Transmission** vehicle, only certified manual drivers receive the request.

### 3. "Urban Flux" UI
- ** Moody Obsidian & Stark White** high-contrast themes.
- **Micro-animations** for mission state transitions.
- **Stark Typography** (Google Fonts: Inter & Roboto).

### 4. Safety & Trust
- **SOS Button**: High-exposure emergency shortcut on all active-trip screens.
- **Rating Integrity**: Post-trip ratings atomically update the driver's global average.
- **Stripe Sandbox**: Secure payment intent flow with webhook verification.

---

## 🚀 Quick Start Guide

### One-Click Launch (Windows)
We've provided a master script to bootstrap the entire platform from scratch:
- **Double-click** `Start-DriveSafe.bat` (Standard CMD)
- OR **Run** `.\Start-DriveSafe.ps1` (PowerShell)

*This will automatically install dependencies, sync the database, and launch all services in separate terminals.*

---

### Manual Installation & Boot
If you prefer manual control:

### 1. Prerequisites
- **Node.js**: v18+
- **Docker**: For running PostgreSQL locally.
- **Expo Go**: For mobile testing.

### 2. Environment Configuration
Create a `.env` in `packages/backend`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drivesafe"
JWT_SECRET="your-secure-secret-key"
STRIPE_SECRET_KEY="sk_test_your_key"
```

### 3. Installation & Boot
```bash
# 1. Install dependencies
npm install

# 2. Build shared packages
cd packages/shared && npm run build

# 3. Initialize Database
cd ../backend
npx prisma migrate dev --name init

# 4. Start Platform (In separate terminals)
npm run dev:backend
npm run dev:rider
npm run dev:driver
npm run dev:admin
```

---

## 🏛️ Project Structure
```text
├── apps/
│   ├── rider/          # Rider Mobile App (Expo)
│   ├── driver/         # Driver Mobile App (Expo)
│   └── admin/          # Management Dashboard (Next.js)
├── packages/
│   ├── backend/        # Express Server & Prisma Logic
│   └── shared/         # Common Hooks, API Client, & Theme
└── README.md           # This primary documentation
```

---

## ⚖️ License
This project is open-source and intended for educational and research purposes in the field of agentic coding and transportation systems.

**Built with pride by the DriveSafe Engineering Team.**

# VEAYOS Homoeopathy ClinicalOS

<div align="center">
  <img src="public/logo.png" alt="VEAYOS Homoeopathy Logo" width="160" />
  <h3>Production-Grade Homoeopathy Clinical Practice OS & Classical Repertory Engine</h3>
  <p>Clean Standalone Architecture: Frontend PWA + Dedicated Express.js REST API Backend</p>
</div>

---

## 🏛️ Project Architecture & Repository Separation

The system is architected as two decoupled, production-grade standalone projects that can be deployed, tested, and maintained independently or orchestrated together:

| Component | Standalone Directory | Dedicated GitHub Repository | Primary Tech Stack |
| :--- | :--- | :--- | :--- |
| **Frontend PWA** | [`frontend/`](file:///home/ayush/Desktop/DEV/PWA/frontend) | [ayush60728/veayos-clinicalos-frontend](https://github.com/ayush60728/veayos-clinicalos-frontend) | React 19, Vite 7, Tailwind CSS, PWA, Firebase SDK |
| **Backend API** | [`backend/`](file:///home/ayush/Desktop/DEV/PWA/backend) | [ayush60728/veayos-clinicalos-backend](https://github.com/ayush60728/veayos-clinicalos-backend) | Node.js 20, Express, JWT, Firebase Admin SDK, Gemini AI, Aisensy |
| **Fullstack Workspace** | Root Directory | [ayush60728/veayos-clinicalos](https://github.com/ayush60728/veayos-clinicalos) | Docker Compose, Concurrently, Unified Test Runner |

---

## 🌟 Key Capabilities

### 1. Frontend PWA (`frontend/`)
- **React 19 & Vite 7 Architecture**: Sub-second HMR with optimized tree-shaking production build.
- **Official VEAYOS Branding**: High-resolution company logos across letterhead, navigation, login, and print layouts.
- **PWA Ready**: Offline caching, installable manifest (`manifest.json`), service worker (`sw.js`), and responsive clinical vector icons.
- **Clinical Modules**:
  - Live Queue Management with automatic token issuance (`T-1001`).
  - Patient Intake Registry with 5 mandatory clinical fields and phone duplicate lookup.
  - Classical Kentian Repertory totality scoring and potency selection (6C, 30C, 200C, 1M, 10M, LM).
  - 8.0 cm (80mm) blank letterhead reservation for pre-printed clinical stationery.
  - Multi-device Cloud Firestore sync with seamless offline fallback.
- **Configurable Backend Integration**: `apiService.js` resolves `VITE_API_URL` (configurable via `.env`, defaulting to backend URL in dev).

### 2. Backend API (`backend/`)
- **Strict 2-Account Whitelist Access Control**:
  - **Dr. V. P. Dixit** (`vpdixit75@gmail.com`) — Senior Homoeopath & Medical Director
  - **Dr. Ved Prakash** (`ved@veayos.com`) — Consultant Homoeopath & Operations Lead
  - Non-whitelisted accounts are strictly rejected with HTTP `403 Forbidden`.
- **Google OAuth Verification**: Validates Google ID tokens and checks credentials against the whitelist before issuing JWTs (`7d` expiry).
- **Gemini AI Repertory Proxy**: Server-side proxy keeping Gemini API keys secure with classical Kentian fallback.
- **Aisensy WhatsApp Gateway**: Dispatches formatted prescriptions and appointment reminders with strict opt-out compliance.
- **Firebase Admin SDK**: Server-side Cloud Firestore integration with in-memory fallback.
- **Production CORS**: Configurable frontend origins (`FRONTEND_URL` / `CORS_ORIGIN`) supporting localhost and deployed domains.

---

## 🚀 Getting Started

### 1. Running the Full Stack (Root Workspace)

Install all dependencies:
```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

Run both frontend and backend concurrently:
```bash
npm run dev
```
- Frontend will open at `http://localhost:5173`
- Backend API will listen at `http://localhost:5000`

### 2. Running Standalone Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 3. Running Standalone Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

---

## 🧪 Testing & Verification

Each project has its own dedicated automated verification suite:

```bash
# Run all workspace tests (master verification)
npm test

# Run only frontend verification suite (10 test suites)
npm run test:frontend
# OR: cd frontend && npm test

# Run only backend verification suite (25 test assertions)
npm run test:backend
# OR: cd backend && npm test
```

---

## 🐳 Docker Deployment

Run the complete multi-container stack with Docker Compose:
```bash
docker compose up --build
```
- Frontend Nginx Web Server: `http://localhost:8080`
- Backend Express API Server: `http://localhost:5000`
- Integrated healthchecks and automatic service dependency resolution.

Or build and run each independently:
```bash
# Standalone Backend Docker Container
docker build -t veayos-backend backend/
docker run -p 5000:5000 --env-file backend/.env veayos-backend

# Standalone Frontend Docker Container
docker build -t veayos-frontend frontend/
docker run -p 80:80 veayos-frontend
```

---

## 📦 Dedicated Git Repositories

Each subproject has been prepared and published as an independent GitHub repository:
- **Frontend PWA**: https://github.com/ayush60728/veayos-clinicalos-frontend
- **Backend API**: https://github.com/ayush60728/veayos-clinicalos-backend
- **Fullstack Workspace**: https://github.com/ayush60728/veayos-clinicalos

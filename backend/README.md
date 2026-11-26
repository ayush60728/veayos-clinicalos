# 🩺 VEAYOS Homoeopathy ClinicalOS — Backend API Service

[![Backend CI](https://img.shields.io/badge/Backend%20API-Pass-green.svg)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)

Production-grade RESTful API service for **VEAYOS Homoeopathy ClinicalOS**. Provides practitioner authentication with strict 2-account whitelist enforcement, secure server-side Gemini AI repertory proxying, live clinic patient queue management, and Aisensy WhatsApp messaging gateway.

---

## 🚀 Architecture Highlights

- **Completely Standalone**: Independent package descriptor, scripts, Docker container, and native automated verification tests without any frontend dependencies.
- **Strict 2-Practitioner Whitelist Access Control**:
  - `Dr. V. P. Dixit` (`vpdixit75@gmail.com`)
  - `Dr. Ved Prakash` (`ved@veayos.com`)
  - All unauthorized logins or Google tokens are rejected with HTTP 403.
- **Server-Side AI Repertory Proxy**: Routes classical Kentian symptom analysis securely to Google Gemini without exposing client-side API keys.
- **Configurable Production CORS**: Whitelist specific frontend origins via `CORS_ORIGIN` (e.g. `http://localhost:5173,https://veayos-clinicalos-pwa.web.app`).
- **Production Containerization**: Hardened Dockerfile with Alpine base, non-root user (`USER node`), and built-in container health check.

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── config/             # Constants & Firebase Admin credentials
│   ├── middleware/         # JWT verification & whitelist auth guards
│   ├── routes/             # REST API routers (auth, repertory, queue, etc.)
│   ├── services/           # Backend business logic & data persistence
│   ├── app.js              # Express app setup, CORS, and route binding
│   └── server.js           # Server listen entrypoint (default port 5000)
├── test/
│   └── backend.test.js     # Native Node.js test runner suite (25 tests)
├── .dockerignore           # Docker build exclusions
├── .env.example            # Backend environment template
├── Dockerfile              # Hardened production Node.js 20 Alpine container
├── Procfile                # Heroku / Dokku deployment
├── railway.json            # Railway deployment configuration
├── render.yaml             # Render Blueprint infrastructure-as-code
└── package.json            # Independent backend dependencies and scripts
```

---

## 🛠️ Quick Start (Standalone)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Key configuration parameters:
| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port for API listener | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `production` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | `http://localhost:5173,...` |
| `JWT_SECRET` | Secret key used to sign practitioner JWT session tokens | *(change for production)* |
| `WHITELIST_ACCOUNTS` | Strict practitioner email whitelist | `vpdixit75@gmail.com,ved@veayos.com` |
| `GEMINI_API_KEY` | Server-side Gemini API key for repertory analysis | *(optional)* |
| `AISENSY_API_KEY` | Aisensy WhatsApp gateway API key | *(optional)* |

### 3. Start Development Server
```bash
npm run dev
```
Runs at `http://localhost:5000` with automatic file reloading (`node --watch`).

### 4. Run Automated Tests
```bash
npm test
```
Executes native Node.js automated test runner covering all 25 API test cases.

---

## 📡 REST API Specification

### Health & Metadata
- `GET /api/health` — System health status, uptime, and whitelist metadata
- `GET /api/v1/health` — API v1 specification

### Authentication (Strict Whitelist)
- `GET /api/v1/auth/whitelist` — List approved practitioners
- `POST /api/v1/auth/login` — Direct email login with role selection
- `POST /api/v1/auth/google` — Google OAuth credential validation
- `POST /api/v1/auth/verify` — Validate existing JWT session token
- `GET /api/v1/auth/me` — Return current practitioner profile (requires Bearer token)

### Classical Homoeopathy & Repertorization
- `POST /api/v1/repertory/analyze` — Kentian repertory totality analysis (accepts location, sensation, modalities, concomitants)

### Patients & Live Queue
- `GET /api/v1/patients` — List/search patients
- `POST /api/v1/patients` — Register new patient intake
- `GET /api/v1/queue` — Fetch live waiting queue
- `POST /api/v1/queue` — Dispatch patient to live queue with token (e.g. `T-101`)
- `POST /api/v1/queue/:id/status` — Update queue status (`waiting`, `in-consultation`, `completed`)

### Prescriptions & Diagnostics
- `POST /api/v1/prescriptions` — Save finalized prescription and auto-resolve queue item
- `GET /api/v1/tests` — Retrieve diagnostic test catalog
- `GET /api/v1/medicines` — Search homoeopathic remedies

### Aisensy WhatsApp Gateway
- `POST /api/v1/whatsapp/send` — Dispatch prescription or reminder to patient
- `POST /api/v1/whatsapp/test` — Validate Aisensy credentials

---

## 🚢 Deployment Blueprints

### Option A: Docker Container
```bash
# Build image
docker build -t veayos-clinicalos-backend .

# Run container
docker run -d -p 5000:5000 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://veayos-clinicalos-pwa.web.app \
  --name veayos-api veayos-clinicalos-backend
```

### Option B: Render (Blueprint)
The included `render.yaml` allows 1-click infrastructure deployment on Render:
1. Connect your GitHub repository to Render.
2. Select "Blueprints" and point to `backend/render.yaml`.
3. Set your production secrets (`GEMINI_API_KEY`, `AISENSY_API_KEY`).

### Option C: Google Cloud Run
```bash
gcloud run deploy veayos-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=8080
```

---

## 📦 Pushing to a Separate GitHub Repository (Polyrepo)

To publish this backend as its own dedicated GitHub repository:

```bash
cd backend
git init
git add .
git commit -m "feat: initial commit for VEAYOS Homoeopathy ClinicalOS Backend API"
git branch -M main
git remote add origin https://github.com/<YOUR_ORGANIZATION>/veayos-clinicalos-backend.git
git push -u origin main
```

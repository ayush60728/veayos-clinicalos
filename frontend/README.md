# 🩺 VEAYOS Homoeopathy ClinicalOS — Frontend PWA

[![Frontend CI](https://img.shields.io/badge/Frontend%20PWA-Pass-teal.svg)](#)
[![Vite](https://img.shields.io/badge/Vite-7.x-purple.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

Production-grade Progressive Web Application (PWA) client for **VEAYOS Homoeopathy ClinicalOS**. Designed for classical homoeopathic practitioners with Kentian repertorization, live clinic queue management, multi-format prescription generation (80mm blank letterpad reservation & digital letterhead), and automated Aisensy WhatsApp delivery.

---

## 🚀 Architecture Highlights

- **Completely Standalone**: Independent package descriptor, build pipeline, Docker container, and automated verification tests without any cross-directory dependency bleed.
- **Configurable Backend Integration**: Automatically points to the dedicated Node.js backend via `VITE_API_URL`. When unset in local dev, seamlessly proxies through Vite dev server to `http://localhost:5000`.
- **PWA Ready**: Offline caching with Service Worker (`public/sw.js`), Web App Manifest (`public/manifest.json`), and adaptive icons.
- **Production Deployable**: Includes production configurations for **Firebase Hosting**, **Vercel**, **Netlify**, and **Docker / Nginx**.

---

## 📁 Directory Structure

```
frontend/
├── dist/                   # Production build distribution bundle
├── public/                 # Static assets, PWA manifest, service worker, clinical icons & logos
│   ├── assets/             # Vector & high-res branding assets
│   ├── icons/              # PWA launcher icons (192x192, 512x512)
│   ├── logo.png            # High-resolution VEAYOS company logo
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker for offline asset caching
├── src/
│   ├── components/         # Clinical UI components (DoctorWorkspace, LiveQueue, PrintModal, etc.)
│   ├── services/           # Frontend service layer (apiService, authService, storageService, etc.)
│   ├── App.jsx             # Main application layout and routing
│   ├── index.css           # Global Tailwind CSS & 80mm letterpad print stylesheets
│   └── main.jsx            # Application entrypoint
├── test/
│   └── frontend.test.mjs   # Standalone deep automated verification suite (10 suites)
├── .env.example            # Environment variables template
├── Dockerfile              # Multi-stage production container (Node 20 Alpine -> Nginx Alpine)
├── nginx.conf              # Production Nginx reverse proxy, gzip, and SPA routing config
├── firebase.json           # Firebase Hosting configuration with security headers & caching
├── vercel.json             # Vercel deployment configuration
├── netlify.toml            # Netlify deployment configuration
├── package.json            # Independent frontend dependencies and scripts
└── vite.config.js          # Vite build and dev server configuration
```

---

## 🛠️ Quick Start (Standalone)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Key variables:
- `VITE_API_URL`: URL of the backend API (e.g., `http://localhost:5000` in dev, or `https://api.veayos-clinicalos.com` in production). Leave blank to use Vite's dev proxy.
- `VITE_FIREBASE_*`: Optional Firebase Cloud Firestore sync credentials.

### 3. Start Development Server
```bash
npm run dev
```
Runs at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Generates optimized distribution assets in `dist/`.

### 5. Run Automated Tests
```bash
npm test
```
Executes all 10 frontend verification test suites.

---

## 🚢 Deployment Blueprints

### Option A: Docker (Production Container with Nginx)
```bash
# Build Docker image
docker build -t veayos-clinicalos-frontend .

# Run container on port 80
docker run -d -p 80:80 --name veayos-pwa veayos-clinicalos-frontend
```

### Option B: Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Option C: Vercel / Netlify
Push this directory to GitHub and import it into Vercel or Netlify. The included `vercel.json` and `netlify.toml` automatically configure SPA rewrites and caching headers.

---

## 📦 Pushing to a Separate GitHub Repository (Polyrepo)

To publish this frontend as its own dedicated GitHub repository:

```bash
cd frontend
git init
git add .
git commit -m "feat: initial commit for VEAYOS Homoeopathy ClinicalOS Frontend PWA"
git branch -M main
git remote add origin https://github.com/<YOUR_ORGANIZATION>/veayos-clinicalos-frontend.git
git push -u origin main
```

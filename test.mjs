/**
 * Master Automated Verification Suite for VEAYOS Homoeopathy ClinicalOS
 * Validates the complete production separation into standalone Frontend PWA and Backend API.
 * Confirms independent package descriptors, Docker configurations, deployment setups,
 * zero dependency bleed, and executes both test suites end-to-end.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

console.log('🧪 Starting Master Full-Stack Verification Suite for VEAYOS Homoeopathy ClinicalOS...\n');

// 1. Verify Clean Architecture Separation
console.log('1. Verifying Clean Architecture Separation (frontend/ vs backend/)...');
assert(existsSync('frontend'), 'frontend/ directory must exist');
assert(existsSync('backend'), 'backend/ directory must exist');

assert(existsSync('frontend/package.json'), 'frontend/package.json must exist');
assert(existsSync('backend/package.json'), 'backend/package.json must exist');

const frontendPkg = JSON.parse(readFileSync('frontend/package.json', 'utf8'));
const backendPkg = JSON.parse(readFileSync('backend/package.json', 'utf8'));

// Independent package names
assert.equal(frontendPkg.name, 'veayos-clinicalos-frontend');
assert.equal(backendPkg.name, 'veayos-clinicalos-backend');

// Independent scripts check
assert(frontendPkg.scripts.dev, 'frontend must have dev script');
assert(frontendPkg.scripts.build, 'frontend must have build script');
assert(frontendPkg.scripts.test, 'frontend must have test script');

assert(backendPkg.scripts.dev, 'backend must have dev script');
assert(backendPkg.scripts.start, 'backend must have start script');
assert(backendPkg.scripts.test, 'backend must have test script');

// Zero Cross-Directory Bleed Check
assert(!JSON.stringify(frontendPkg.scripts).includes('cd backend'), 'frontend scripts must not invoke cd backend');
assert(!JSON.stringify(backendPkg.scripts).includes('cd frontend'), 'backend scripts must not invoke cd frontend');
assert(!existsSync('frontend/backend'), 'frontend must not contain nested backend directory');
assert(!existsSync('backend/frontend'), 'backend must not contain nested frontend directory');

console.log('   ✓ Frontend and Backend have cleanly separated independent package descriptors.');

// 2. Verify Independent Environment Configuration
console.log('2. Verifying Independent Environment Configuration (.env.example, .env)...');
assert(existsSync('frontend/.env.example'), 'frontend/.env.example must exist');
assert(existsSync('backend/.env.example'), 'backend/.env.example must exist');

const frontendEnv = readFileSync('frontend/.env.example', 'utf8');
const backendEnv = readFileSync('backend/.env.example', 'utf8');

assert(frontendEnv.includes('VITE_API_URL'), 'frontend/.env.example must specify VITE_API_URL');
assert(backendEnv.includes('CORS_ORIGIN'), 'backend/.env.example must specify CORS_ORIGIN');
assert(backendEnv.includes('WHITELIST_ACCOUNTS'), 'backend/.env.example must specify WHITELIST_ACCOUNTS');
assert(backendEnv.includes('JWT_SECRET'), 'backend/.env.example must specify JWT_SECRET');

console.log('   ✓ Both frontend and backend have dedicated environment templates with CORS and VITE_API_URL.');

// 3. Verify Docker Containerization & Multi-Platform Deployment Configs
console.log('3. Verifying Docker Containerization & Deployment Configurations...');
assert(existsSync('frontend/Dockerfile'), 'frontend/Dockerfile must exist');
assert(existsSync('frontend/.dockerignore'), 'frontend/.dockerignore must exist');
assert(existsSync('frontend/nginx.conf'), 'frontend/nginx.conf must exist');
assert(existsSync('frontend/firebase.json'), 'frontend/firebase.json must exist');
assert(existsSync('frontend/.firebaserc'), 'frontend/.firebaserc must exist');
assert(existsSync('frontend/vercel.json'), 'frontend/vercel.json must exist');
assert(existsSync('frontend/netlify.toml'), 'frontend/netlify.toml must exist');

assert(existsSync('backend/Dockerfile'), 'backend/Dockerfile must exist');
assert(existsSync('backend/.dockerignore'), 'backend/.dockerignore must exist');
assert(existsSync('backend/render.yaml'), 'backend/render.yaml must exist');
assert(existsSync('backend/railway.json'), 'backend/railway.json must exist');
assert(existsSync('backend/Procfile'), 'backend/Procfile must exist');

assert(existsSync('docker-compose.yml'), 'Root docker-compose.yml must exist');
const composeContent = readFileSync('docker-compose.yml', 'utf8');
assert(composeContent.includes('backend:'), 'docker-compose must define backend service');
assert(composeContent.includes('frontend:'), 'docker-compose must define frontend service');

assert(existsSync('scripts/split-to-separate-repos.sh'), 'scripts/split-to-separate-repos.sh must exist');
const scriptStat = statSync('scripts/split-to-separate-repos.sh');
assert(Boolean(scriptStat.mode & 0o111), 'scripts/split-to-separate-repos.sh must be executable');

console.log('   ✓ Dockerfiles, Nginx, Firebase, Vercel, Netlify, Render, Railway, and Compose verified.');

// 4. Verify Frontend API Service Client Connection & Dynamic VITE_API_URL
console.log('4. Verifying Frontend apiService & Dynamic VITE_API_URL Resolution...');
const apiServiceSrc = readFileSync('frontend/src/services/apiService.js', 'utf8');
assert(apiServiceSrc.includes('VITE_API_URL'), 'apiService.js must reference VITE_API_URL');
assert(apiServiceSrc.includes('getApiBaseUrl'), 'apiService.js must export getApiBaseUrl');
assert(apiServiceSrc.includes('getHealthUrl'), 'apiService.js must export getHealthUrl');

const geminiSrc = readFileSync('frontend/src/services/geminiService.js', 'utf8');
assert(geminiSrc.includes("import { apiService } from './apiService.js'"), 'geminiService must route through apiService');
assert(!geminiSrc.includes("fetch('/api/v1/repertory/analyze'"), 'geminiService must not use raw same-origin fetch');

const aisensySrc = readFileSync('frontend/src/services/aisensyService.js', 'utf8');
assert(aisensySrc.includes("import { apiService } from './apiService.js'"), 'aisensyService must route through apiService');
assert(!aisensySrc.includes("fetch('/api/v1/whatsapp/send'"), 'aisensyService must not use raw same-origin fetch');

const viteConfigSrc = readFileSync('frontend/vite.config.js', 'utf8');
assert(viteConfigSrc.includes("'/api':"), 'vite.config.js must configure dev proxy for /api');

const backendAppSrc = readFileSync('backend/src/app.js', 'utf8');
assert(backendAppSrc.includes('getAllowedOrigins'), 'backend app.js must dynamically resolve CORS origins');

console.log('   ✓ Frontend API client connection, services integration, and dynamic VITE_API_URL configuration verified.');

// 5. Run Standalone Frontend Automated Test Suite
console.log('5. Executing Standalone Frontend Test Suite (frontend/test/frontend.test.mjs)...');
const frontendTestRun = spawnSync('node', ['test/frontend.test.mjs'], {
  cwd: './frontend',
  stdio: 'inherit'
});
assert.equal(frontendTestRun.status, 0, 'Frontend test suite must pass 100%');
console.log('   ✓ Frontend test suite passed flawlessly.');

// 6. Run Standalone Backend Automated Test Suite
console.log('6. Executing Standalone Backend Test Suite (backend/test/backend.test.js)...');
const backendTestRun = spawnSync('node', ['--test', 'test/**/*.test.js'], {
  cwd: './backend',
  stdio: 'inherit'
});
assert.equal(backendTestRun.status, 0, 'Backend test suite must pass 100%');
console.log('   ✓ Backend test suite passed flawlessly.');

// 7. Verify Production Build Outputs
console.log('7. Verifying Frontend Production Build Assets...');
assert(existsSync('frontend/dist/index.html'), 'frontend/dist/index.html must exist');
assert(existsSync('frontend/dist/manifest.json'), 'frontend/dist/manifest.json must exist');
assert(existsSync('frontend/dist/sw.js'), 'frontend/dist/sw.js must exist');
console.log('   ✓ Frontend production build distribution bundle verified.');

// 8. Live Frontend-to-Backend End-to-End Interoperability Test
console.log('8. Verifying Live Seamless Interoperability Between Frontend & Backend...');
const backendApp = (await import('./backend/src/app.js')).default;
let liveServer;
let livePort;

await new Promise((resolve) => {
  liveServer = backendApp.listen(0, '127.0.0.1', () => {
    livePort = liveServer.address().port;
    resolve();
  });
});

try {
  // Point VITE_API_URL to the live backend server
  process.env.VITE_API_URL = `http://127.0.0.1:${livePort}`;
  
  // Polyfill localStorage in Node.js environment if needed
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (key) => store.get(key) || null,
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear()
    };
  }

  const { apiService, getApiBaseUrl, getHealthUrl } = await import('./frontend/src/services/apiService.js');
  
  assert.equal(getApiBaseUrl(), `http://127.0.0.1:${livePort}/api/v1`);
  assert.equal(getHealthUrl(), `http://127.0.0.1:${livePort}/api/health`);

  // 8.1 Backend Health Check via apiService
  const healthRes = await apiService.checkHealth();
  assert.equal(healthRes.status, 'healthy');
  assert.equal(healthRes.whitelistEnforced, true);

  // 8.2 Whitelist Practitioner Login & JWT Issuance
  const loginRes = await apiService.loginWithEmail('vpdixit75@gmail.com', 'doctor');
  assert.equal(loginRes.success, true);
  assert(loginRes.token);
  assert.equal(loginRes.user.email, 'vpdixit75@gmail.com');
  assert.equal(apiService.getToken(), loginRes.token);

  // 8.3 Whitelist Access Control: Unauthorized Account Rejection
  let unauthorizedBlocked = false;
  try {
    await apiService.loginWithEmail('unauthorized@attacker.com', 'doctor');
  } catch (err) {
    unauthorizedBlocked = true;
    assert.equal(err.status, 403);
  }
  assert(unauthorizedBlocked, 'Unauthorized login attempt must return HTTP 403');

  // 8.4 Server-Side AI Repertory Proxying
  const repertoryRes = await apiService.analyzeRepertory({
    location: 'Epigastrium and stomach',
    sensation: 'Severe burning and acid reflux',
    modalitiesWorse: 'Spicy rich foods, coffee, late night work',
    concomitants: 'Ineffectual urging for stool, irritability'
  });
  assert.equal(repertoryRes.success, true);
  assert(Array.isArray(repertoryRes.data.remedies));
  assert.equal(repertoryRes.data.remedies[0].remedy, 'Nux Vomica');

  // 8.5 Queue & Prescriptions REST Operations
  const queueRes = await apiService.addToQueue({
    patientName: 'Test Live Patient',
    phone: '+91 99887 76655',
    chiefComplaint: 'Acute seasonal allergic rhinitis'
  });
  assert.equal(queueRes.success, true);
  assert(queueRes.item.tokenNumber > 0);

  const activeQueue = await apiService.getQueue();
  assert(activeQueue.count > 0);

  // 8.6 WhatsApp Prescription Dispatch via Backend
  const waRes = await apiService.sendWhatsApp({
    patient: {
      id: 'P-TEST',
      name: 'Test Live Patient',
      phone: '+91 99887 76655',
      consentWhatsApp: true
    },
    prescription: {
      id: 'RX-TEST-001',
      doctorName: 'Dr. V. P. Dixit',
      medicines: [{ remedy: 'Allium Cepa', dosage: '4 globules', frequency: 'TDS' }]
    }
  });
  assert.equal(waRes.success, true);
  assert(waRes.message.includes('dispatched via WhatsApp'));

  console.log('   ✓ Live Frontend apiService communicates seamlessly with Backend API.');
} finally {
  delete process.env.VITE_API_URL;
  await new Promise((resolve) => liveServer.close(resolve));
}

console.log('\n🎉 ALL MASTER PRODUCTION SEPARATION VERIFICATION CHECKS PASSED!\n');
process.exit(0);

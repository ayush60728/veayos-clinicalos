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

const viteConfigSrc = readFileSync('frontend/vite.config.js', 'utf8');
assert(viteConfigSrc.includes("'/api':"), 'vite.config.js must configure dev proxy for /api');

console.log('   ✓ Frontend API client connection and dynamic VITE_API_URL configuration verified.');

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

console.log('\n🎉 ALL MASTER PRODUCTION SEPARATION VERIFICATION CHECKS PASSED!\n');
process.exit(0);

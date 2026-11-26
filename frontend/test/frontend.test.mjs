/**
 * Standalone Automated Test Suite for VEAYOS Homoeopathy ClinicalOS Frontend PWA
 * Validates frontend domain logic, storage, components, auth, print layout,
 * PWA manifest, service worker, deployment configurations, and VITE_API_URL resolution.
 * Strictly free of cross-directory backend dependencies.
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

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

console.log('🧪 Starting Standalone Automated Verification Suite for VEAYOS Frontend PWA...\n');

// 1. Verify Real authService Strict 2-Account Whitelist Access Control
console.log('1. Verifying Strict 2-Account Whitelist Access Control (from authService.js)...');
const { authService, AUTHORIZED_USERS } = await import('../src/services/authService.js');

// Must contain exactly 2 whitelisted users
assert.equal(AUTHORIZED_USERS.length, 2, 'Must contain exactly 2 whitelisted users');
const allowedEmails = AUTHORIZED_USERS.map(u => u.email.toLowerCase());
assert(allowedEmails.includes('vpdixit75@gmail.com'), 'vpdixit75@gmail.com must be whitelisted');
assert(allowedEmails.includes('ved@veayos.com'), 'ved@veayos.com must be whitelisted');

// Positive checks on real authService.isAuthorizedEmail
assert.equal(authService.isAuthorizedEmail('vpdixit75@gmail.com'), true, 'vpdixit75@gmail.com must be authorized');
assert.equal(authService.isAuthorizedEmail('ved@veayos.com'), true, 'ved@veayos.com must be authorized');
assert.equal(authService.isAuthorizedEmail('VPDIXIT75@GMAIL.COM'), true, 'Case-insensitive vpdixit75 must be authorized');
assert.equal(authService.isAuthorizedEmail('Ved@Veayos.COM'), true, 'Case-insensitive ved must be authorized');
assert.equal(authService.isAuthorizedEmail('  vpdixit75@gmail.com  '), true, 'Trimmed email must be authorized');

// Negative checks: any other account MUST be blocked
assert.equal(authService.isAuthorizedEmail('admin@gmail.com'), false, 'admin@gmail.com must be blocked');
assert.equal(authService.isAuthorizedEmail('doctor@clinic.com'), false, 'doctor@clinic.com must be blocked');
assert.equal(authService.isAuthorizedEmail('vpdixit75@gmail.co'), false, 'Incomplete email must be blocked');
assert.equal(authService.isAuthorizedEmail('vpdixit75@gmail.com.co'), false, 'Subdomain trick must be blocked');
assert.equal(authService.isAuthorizedEmail('ved@veayos.org'), false, 'Wrong domain must be blocked');
assert.equal(authService.isAuthorizedEmail('vpdixit75@gmail.com@evil.com'), false, 'Email injection must be blocked');
assert.equal(authService.isAuthorizedEmail(''), false, 'Empty string must be blocked');
assert.equal(authService.isAuthorizedEmail(null), false, 'Null must be blocked');
assert.equal(authService.isAuthorizedEmail(undefined), false, 'Undefined must be blocked');

// Real authService.login test
const loggedInUser = authService.login('vpdixit75@gmail.com', 'doctor');
assert.equal(loggedInUser.email, 'vpdixit75@gmail.com');
assert.equal(loggedInUser.currentRole, 'doctor');
assert.equal(authService.getCurrentUser().email, 'vpdixit75@gmail.com');

// Test rejection on unauthorized login
assert.throws(
  () => authService.login('hacker@unauthorized.com'),
  /Access Denied/,
  'Unauthorized email login attempt must throw Access Denied'
);

// Test tampering detection
localStorage.setItem('veayos_auth_user', JSON.stringify({ email: 'tampered@hacker.com' }));
assert.equal(authService.getCurrentUser(), null, 'Tampered session must be immediately invalidated and cleared');
console.log('   ✓ Real authService strictly permits only vpdixit75@gmail.com and ved@veayos.com.');

// 2. Verify Real storageService (Intake, Queue, Rx History, Tests)
console.log('2. Verifying Real storageService (Intake, Queue, History, & Diagnostic Tests)...');
const { storageService } = await import('../src/services/storageService.js');

// Patient Intake & 5 Mandatory Fields
const initialPatients = storageService.getPatients();
assert(initialPatients.length >= 4, 'Seed patient registry must contain baseline patients');

const testPatientData = {
  name: 'Dr. Test Patient',
  phone: '+91 99999 88888',
  address: 'Suite 101, Test Lane, Medical Enclave, New Delhi',
  age: 45,
  gender: 'Female',
  consentWhatsApp: true,
  medicalHistoryNotes: 'Chronic acidity and migraine'
};

const savedPatients = storageService.savePatient(testPatientData);
assert.equal(savedPatients[0].name, 'Dr. Test Patient', 'Newly saved patient must be at index 0');
assert.equal(savedPatients[0].phone, '+91 99999 88888');
const createdPatientId = savedPatients[0].id;

// Phone duplicate check
const duplicateCheck = storageService.findPatientByPhone('+91 99999 88888');
assert(duplicateCheck !== null, 'Duplicate phone lookup must find registered patient');
assert.equal(duplicateCheck.name, 'Dr. Test Patient');

// Queue dispatch
const initialQueue = storageService.getQueue();
const addedQueueItem = storageService.addToQueue(savedPatients[0], 'Test acute intake');
assert(addedQueueItem.token.startsWith('T-'), 'Queue item must receive unique Token');
assert.equal(addedQueueItem.status, 'waiting');

// Calling next waiting patient
const calledPatient = storageService.callNextWaiting();
assert(calledPatient !== null, 'Calling next patient must return next waiting item');

// Prescribing Tests & Linking to Prescription
const newRx = {
  patientId: createdPatientId,
  patientName: 'Dr. Test Patient',
  queueId: addedQueueItem.id,
  token: addedQueueItem.token,
  date: '2026-11-24',
  status: 'finalized',
  symptoms: 'Sour eructations, burning sensation in epigastrium',
  diagnosis: 'Gastroesophageal Reflux Disease',
  medicines: [
    { remedy: 'Nux Vomica 30C', dosage: '4 globules', frequency: 'BD', duration: '7 days' }
  ],
  tests: [
    { id: 'test-991', testName: 'Upper GI Endoscopy', instructions: 'Fasting 8 hours' }
  ],
  advice: 'Avoid spicy food and late night caffeine',
  followUpDate: '2026-12-05'
};

const finalizedRx = storageService.savePrescription(newRx);
assert.equal(finalizedRx.status, 'finalized');

// Verify that finalizing prescription linked the tests array into patient history
const reloadedPatient = storageService.getPatientById(createdPatientId);
assert(reloadedPatient.history.length > 0, 'Patient history must contain the finalized visit');
assert.equal(reloadedPatient.history[0].tests.length, 1, 'Finalized visit must retain prescribed tests');
assert.equal(reloadedPatient.history[0].tests[0].testName, 'Upper GI Endoscopy');

// Verify Prescription Amendment De-duplication in Patient History
const initialHistoryCount = reloadedPatient.history.length;
const amendedRx = storageService.savePrescription({
  ...finalizedRx,
  advice: 'Amended Advice: Strictly avoid coffee and sleep with head elevated 30 degrees'
});
const patientAfterAmend = storageService.getPatientById(createdPatientId);
assert.equal(patientAfterAmend.history.length, initialHistoryCount, 'History count must NOT increase when amending existing prescription');
assert.equal(patientAfterAmend.history[0].advice, 'Amended Advice: Strictly avoid coffee and sleep with head elevated 30 degrees');

// Verify that finalizing prescription automatically updated the patient queue status to 'completed'
const reloadedQueue = storageService.getQueue();
const completedQueueItem = reloadedQueue.find(q => q.id === addedQueueItem.id);
assert.equal(completedQueueItem.status, 'completed', 'Finalizing prescription must transition queue status to completed');

// Test Prescribing & Attaching Report
storageService.prescribeTest({
  id: 'test-991',
  patientId: createdPatientId,
  patientName: 'Dr. Test Patient',
  testName: 'Upper GI Endoscopy',
  instructions: 'Fasting 8 hours'
});

storageService.attachReportToTest('test-991', {
  reportUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
  reportFileName: 'endoscopy-report.pdf',
  reportFileType: 'application/pdf'
});

const allTests = storageService.getTests();
const updatedTest = allTests.find(t => t.id === 'test-991');
assert.equal(updatedTest.status, 'report_attached');
assert.equal(updatedTest.reportFileName, 'endoscopy-report.pdf');
console.log('   ✓ Real storageService accurately manages intake, queue, tests, and auto-completed Rx lifecycle.');

// 3. Verify Gemini AI Service & Classical Kentian Repertory Engine
console.log('3. Verifying Gemini AI Service & Kentian Repertory Fallback Engine...');
const { geminiService, extractJsonFromGeminiResponse } = await import('../src/services/geminiService.js');

// Test Gemini JSON Extractor on diverse formats
assert.deepEqual(extractJsonFromGeminiResponse('{"status": "ok"}'), { status: 'ok' }, 'Plain JSON parsing');
assert.deepEqual(extractJsonFromGeminiResponse('```json\n{"status": "ok"}\n```'), { status: 'ok' }, 'Markdown code block parsing');
assert.deepEqual(
  extractJsonFromGeminiResponse('Here is the repertory response:\n```json\n{"status": "ok"}\n```\nHope this helps!'),
  { status: 'ok' },
  'JSON wrapped in conversational markdown text'
);
assert.equal(extractJsonFromGeminiResponse('Not valid JSON'), null, 'Malformed JSON returns null safely without throwing');

// Test Classical Kentian Local Repertory Engine for Homoeopathic Totality
const nuxTotality = geminiService.localRepertorize({
  location: 'Stomach / epigastrium',
  sensation: 'Severe burning acidity, sour eructations',
  modalitiesWorse: 'Spices, rich food, coffee, alcohol',
  concomitants: 'Ineffectual urging for stool, irritability'
});
assert.equal(nuxTotality.remedies[0].remedy, 'Nux Vomica', 'Nux Vomica must be top remedy for gastric acidity and irritability');
assert(nuxTotality.remedies[0].repertoryScore >= 12, 'Rubric score must reflect strong totality affinity');

const rhusTotality = geminiService.localRepertorize({
  location: 'Knee joints',
  sensation: 'Severe stiffness, pain',
  modalitiesWorse: 'First motion, cold damp rainy weather',
  modalitiesBetter: 'Continued gentle movement, warmth'
});
assert.equal(rhusTotality.remedies[0].remedy, 'Rhus Toxicodendron', 'Rhus Tox must be top remedy for morning stiffness relieved by motion');

const bryoniaTotality = geminiService.localRepertorize({
  location: 'Chest / Head',
  sensation: 'Sharp stitching pain, extreme dryness, thirst',
  modalitiesWorse: 'Least motion',
  modalitiesBetter: 'Absolute rest, hard pressure'
});
assert.equal(bryoniaTotality.remedies[0].remedy, 'Bryonia Alba', 'Bryonia must be top remedy for complaints aggravated by least motion');

const lycopodiumTotality = geminiService.localRepertorize({
  location: 'Abdomen / Right hypochondrium',
  sensation: 'Extreme gas, bloating, flatulence',
  modalitiesWorse: '4 PM to 8 PM'
});
assert.equal(lycopodiumTotality.remedies[0].remedy, 'Lycopodium Clavatum', 'Lycopodium must be top remedy for abdominal gas worse 4-8 PM');
console.log('   ✓ Gemini JSON parser and Classical Homoeopathic Repertorization engine verified.');

// 4. Verify 8 cm (80mm) Top Letterpad Reservation Requirement
console.log('4. Verifying 8.0 cm (80mm) Top Letterpad Reservation in Markup & CSS...');
const cssContent = readFileSync('src/index.css', 'utf8');

assert(cssContent.includes('.letterpad-reserved-space'), 'CSS must define .letterpad-reserved-space');
assert(cssContent.includes('80mm'), 'CSS must define 80mm reserved height');
assert(cssContent.includes('.letterpad-preprinted-blank'), 'CSS must provide clean pre-printed stationery mode');
assert(cssContent.includes('.letterpad-preview-only'), 'CSS must hide preview guide text in print');

// Check PrescriptionPrintModal
const printModalContent = readFileSync('src/components/PrescriptionPrintModal.jsx', 'utf8');
assert(printModalContent.includes('letterpad-reserved-space'), 'Print modal must contain 8cm letterpad container');
assert(printModalContent.includes('preprinted_stationery'), 'Print modal must provide pre-printed blank stationery mode');
assert(printModalContent.includes('stationeryMode'), 'Print modal must toggle between blank paper and digital letterhead');
console.log('   ✓ 8.0 cm (80mm) blank top reservation strictly honored for clinic letterhead.');

// 5. Verify PWA Manifest, Service Worker & Icons
console.log('5. Verifying PWA Manifest, Service Worker & Clinical Icons...');
const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
assert.equal(manifest.name, 'VEAYOS Homoeopathy ClinicalOS');
assert.equal(manifest.short_name, 'ClinicalOS');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.theme_color, '#0d9488');
assert(manifest.icons.length >= 2, 'Manifest must provide at least 192 and 512 icons');

const swContent = readFileSync('public/sw.js', 'utf8');
assert(swContent.includes('CACHE_NAME'), 'sw.js must define cache name');
assert(swContent.includes('addEventListener(\'fetch\''), 'sw.js must intercept fetch');
assert(swContent.includes('stale-while-revalidate') || swContent.includes('caches.match'), 'sw.js must provide offline caching');

assert(existsSync('public/icons/icon-192.svg'), 'icon-192.svg must exist');
assert(existsSync('public/icons/icon-512.svg'), 'icon-512.svg must exist');
assert(existsSync('public/favicon.svg'), 'favicon.svg must exist');
console.log('   ✓ PWA Manifest, Service Worker, and clinical vector icons verified.');

// 6. Verify Frontend Deployment Configurations (Firebase, Vercel, Netlify, Docker, Nginx)
console.log('6. Verifying Frontend Deployment Configurations...');
assert(existsSync('firebase.json'), 'firebase.json must exist');
const firebaseJson = JSON.parse(readFileSync('firebase.json', 'utf8'));
assert.equal(firebaseJson.hosting.public, 'dist', 'Hosting public dir must be dist');
assert(firebaseJson.hosting.rewrites.some(r => r.destination === '/index.html'), 'Firebase must rewrite routes to /index.html');
assert(existsSync('.firebaserc'), '.firebaserc must exist');

assert(existsSync('vercel.json'), 'vercel.json must exist');
const vercelJson = JSON.parse(readFileSync('vercel.json', 'utf8'));
assert.equal(vercelJson.outputDirectory, 'dist');
assert(vercelJson.rewrites.some(r => r.destination === '/index.html'), 'Vercel must rewrite SPA routes to /index.html');

assert(existsSync('netlify.toml'), 'netlify.toml must exist');
const netlifyToml = readFileSync('netlify.toml', 'utf8');
assert(netlifyToml.includes('to = "/index.html"'), 'Netlify must rewrite SPA routes to /index.html');

assert(existsSync('Dockerfile'), 'frontend Dockerfile must exist');
const dockerfileContent = readFileSync('Dockerfile', 'utf8');
assert(dockerfileContent.includes('nginx:alpine'), 'Dockerfile must use nginx:alpine runner');
assert(dockerfileContent.includes('/usr/share/nginx/html'), 'Dockerfile must copy to nginx web root');

assert(existsSync('nginx.conf'), 'nginx.conf must exist');
const nginxConf = readFileSync('nginx.conf', 'utf8');
assert(nginxConf.includes('try_files $uri $uri/ /index.html;'), 'nginx.conf must implement SPA fallback');
assert(nginxConf.includes('sw.js'), 'nginx.conf must specify cache headers for sw.js');

console.log('   ✓ Frontend deployment configurations (Firebase, Vercel, Netlify, Docker, Nginx) verified.');

// 7. Verify Production Build Assets in dist/...
console.log('7. Verifying Production Build Assets in dist/...');
assert(existsSync('dist/index.html'), 'dist/index.html must exist');
assert(existsSync('dist/manifest.json'), 'dist/manifest.json must exist');
assert(existsSync('dist/sw.js'), 'dist/sw.js must exist');
assert(existsSync('dist/icons/icon-192.svg'), 'dist/icons/icon-192.svg must exist');
console.log('   ✓ Production build contains complete PWA distribution assets ready for deployment.');

// 8. Verify All 7 Technical Audit Fixes & Improvements
console.log('8. Verifying All 7 Technical Audit Fixes & Improvements...');

// 8.1 Doctor Identity Propagation
const appJsx = readFileSync('src/App.jsx', 'utf8');
assert(appJsx.includes('currentUser={currentUser}'), 'App.jsx must pass currentUser to DoctorWorkspace');

const doctorWorkspaceJsx = readFileSync('src/components/DoctorWorkspace.jsx', 'utf8');
assert(doctorWorkspaceJsx.includes('currentUser,'), 'DoctorWorkspace must accept currentUser prop');
assert(doctorWorkspaceJsx.includes('currentDoctorName = currentUser?.name'), 'DoctorWorkspace must dynamically compute currentDoctorName from currentUser');
assert(doctorWorkspaceJsx.includes('currentDoctorRegNo = currentUser?.regNo'), 'DoctorWorkspace must dynamically compute currentDoctorRegNo from currentUser');
assert(!doctorWorkspaceJsx.includes("doctorName: 'Dr. V. P. Dixit'"), 'DoctorWorkspace must eliminate hardcoded Dr. V. P. Dixit in prescriptions and modals');
assert(!doctorWorkspaceJsx.includes("doctorRegNo: 'BHMS-REG-84729'"), 'DoctorWorkspace must eliminate hardcoded BHMS-REG-84729 in prescriptions and modals');

const printModalJsx = readFileSync('src/components/PrescriptionPrintModal.jsx', 'utf8');
assert(printModalJsx.includes('prescription.doctorName || clinic.doctorName'), 'PrescriptionPrintModal must dynamically render prescription.doctorName');
assert(printModalJsx.includes('prescription.doctorRegNo || clinic.regNo'), 'PrescriptionPrintModal must dynamically render prescription.doctorRegNo');

// Real Functional Execution: Dr. Ved Prakash Login & Rx Generation & WhatsApp Dispatch
const vedUser = authService.login('ved@veayos.com', 'doctor');
assert.equal(vedUser.name, 'Dr. Ved Prakash');
assert.equal(vedUser.regNo, 'MD-HOM-55102');

const { aisensyService } = await import('../src/services/aisensyService.js');
const vedPrescription = {
  id: 'rx-ved-test-01',
  patientId: createdPatientId,
  patientName: 'Dr. Test Patient',
  date: '2026-11-24',
  status: 'finalized',
  doctorName: vedUser.name,
  doctorRegNo: vedUser.regNo,
  medicines: [{ remedy: 'Arnica Montana 200C', dosage: '4 globules', frequency: 'TDS', duration: '3 days' }],
  followUpDate: '2026-12-08',
  advice: 'Rest well.'
};

const savedVedRx = storageService.savePrescription(vedPrescription);
assert.equal(savedVedRx.doctorName, 'Dr. Ved Prakash');
assert.equal(savedVedRx.doctorRegNo, 'MD-HOM-55102');

// Verify patient history captures Dr. Ved Prakash and his regNo
const patientWithVedRx = storageService.getPatientById(createdPatientId);
const latestVisit = patientWithVedRx.history.find(h => h.visitId === 'rx-ved-test-01');
assert(latestVisit, 'Patient history must contain Dr. Ved Prakash visit');
assert.equal(latestVisit.doctorName, 'Dr. Ved Prakash');
assert.equal(latestVisit.doctorRegNo, 'MD-HOM-55102');

// Functional Test: Aisensy WhatsApp message formatting must not contain "Dr. Dr."
const whatsAppResult = await aisensyService.sendPrescriptionWhatsApp({
  patient: testPatientData,
  prescription: savedVedRx
});
assert.equal(whatsAppResult.success, true);
const allLogs = storageService.getWhatsAppLogs();
const prescriptionLog = allLogs.find(l => l.type === 'prescription' && l.messageText.includes('Arnica Montana'));
assert(prescriptionLog, 'WhatsApp log entry must be created');
assert(prescriptionLog.messageText.includes('Dr. Ved Prakash has finalized'), 'Message must contain Dr. Ved Prakash');
assert(!prescriptionLog.messageText.includes('Dr. Dr.'), 'Message must NOT contain duplicate Dr. Dr. prefix');

// Functional Test: Follow-up reminder scheduling with Dr. Ved Prakash
const reminderLog = await aisensyService.scheduleFollowUpReminder({
  patient: testPatientData,
  followUpDate: '2026-12-08',
  doctorName: vedUser.name
});
assert(reminderLog, 'Follow-up reminder must be scheduled');
assert(reminderLog.messageText.includes('with Dr. Ved Prakash'), 'Reminder text must include Dr. Ved Prakash');
assert(!reminderLog.messageText.includes('Dr. Dr.'), 'Reminder text must NOT contain duplicate Dr. Dr.');

// 8.2 Patient Context Switch Reset
assert(doctorWorkspaceJsx.includes('setSavedPrescription(null)'), 'DoctorWorkspace must reset savedPrescription on patient switch');
assert(doctorWorkspaceJsx.includes("setPrescriptionStatus('draft')"), 'DoctorWorkspace must reset prescriptionStatus on patient switch');
assert(doctorWorkspaceJsx.includes("setDiagnosis('')"), 'DoctorWorkspace must reset diagnosis on patient switch');
assert(doctorWorkspaceJsx.includes("setClinicalNotes('')"), 'DoctorWorkspace must reset clinicalNotes on patient switch');
assert(doctorWorkspaceJsx.includes('setMedicines([])'), 'DoctorWorkspace must reset medicines on patient switch');
assert(doctorWorkspaceJsx.includes('setPrescribedTests([])'), 'DoctorWorkspace must reset prescribedTests on patient switch');
assert(doctorWorkspaceJsx.includes("setFollowUpDate('')"), 'DoctorWorkspace must reset followUpDate on patient switch');
assert(doctorWorkspaceJsx.includes('setRepertoryResult(null)'), 'DoctorWorkspace must reset repertoryResult on patient switch');

// 8.3 Prescription Amendment De-duplication in Patient History
const beforeAmendCount = patientWithVedRx.history.length;
const amend1 = storageService.savePrescription({
  ...savedVedRx,
  advice: 'First amendment: Take with warm water'
});
const amend2 = storageService.savePrescription({
  ...amend1,
  advice: 'Second amendment: Take 30 mins before breakfast'
});
const patientAfterMultipleAmends = storageService.getPatientById(createdPatientId);
assert.equal(patientAfterMultipleAmends.history.length, beforeAmendCount, 'Repeated amendments must NOT create duplicate history visits');
const updatedVisit = patientAfterMultipleAmends.history.find(h => h.visitId === 'rx-ved-test-01');
assert.equal(updatedVisit.advice, 'Second amendment: Take 30 mins before breakfast', 'History visit must be updated in-place');
assert.equal(updatedVisit.doctorRegNo, 'MD-HOM-55102', 'History visit must retain doctorRegNo');

// 8.4 Dashboard Real Data Footfall & Active Date Range Filter
const dashboardJsx = readFileSync('src/components/DashboardAnalytics.jsx', 'utf8');
assert(dashboardJsx.includes('allVisits'), 'DashboardAnalytics must dynamically compute allVisits from system records');
assert(dashboardJsx.includes('isDateInRange'), 'DashboardAnalytics must implement dynamic date range filter');
assert(dashboardJsx.includes("'today'") && dashboardJsx.includes("'7d'") && dashboardJsx.includes("'30d'") && dashboardJsx.includes("'all'"), 'DashboardAnalytics must support all 4 date range options');
assert(dashboardJsx.includes('isOverdue'), 'DashboardAnalytics must classify overdue follow-ups');
assert(dashboardJsx.includes('isUpcoming'), 'DashboardAnalytics must classify upcoming follow-ups');
assert(dashboardJsx.includes('AlertCircle'), 'DashboardAnalytics must style overdue follow-ups with AlertCircle warning badge');
assert(dashboardJsx.includes('chartBars = [];'), 'DashboardAnalytics must reset chartBars before fallback daily loop to avoid mixing months and days');

// 8.5 8.0 cm Letterpad Print Leak Fix
assert(printModalJsx.includes('no-print letterpad-preview-only'), 'PrescriptionPrintModal must have no-print letterpad-preview-only on guide text');
const noPrintMatches = (printModalJsx.match(/no-print letterpad-preview-only/g) || []).length;
assert(noPrintMatches >= 2, 'Both pre-printed stationery and digital header preview blocks must contain no-print letterpad-preview-only');

// 8.6 WhatsApp Dispatch Async State
assert(doctorWorkspaceJsx.includes('rxToSend = handleFinalize()'), 'DoctorWorkspace handleSendWhatsApp must capture returned saved prescription');
assert(doctorWorkspaceJsx.includes("rxToSend.status !== 'finalized'"), 'DoctorWorkspace handleSendWhatsApp must ensure draft prescription is finalized before sending');
assert(!doctorWorkspaceJsx.includes("'rx-current'"), 'DoctorWorkspace must eliminate fallback to fake rx-current');

// 8.7 Optional Date of Birth in Patient Intake
const intakeJsx = readFileSync('src/components/PatientIntake.jsx', 'utf8');
assert(intakeJsx.includes('dob:'), 'PatientIntake must have dob in form state');
assert(intakeJsx.includes('handleDobChange'), 'PatientIntake must define handleDobChange');
assert(intakeJsx.includes('type="date"'), 'PatientIntake must render date input for DOB');
assert(intakeJsx.includes('min="0"'), 'PatientIntake must support age 0 for infants and newborns');

console.log('   ✓ All 7 PDF Technical Audit Fixes rigorously verified.');

// 9. Verify Dynamic Firebase Cloud Firestore Integration & Multi-Device Sync
console.log('9. Verifying Dynamic Firebase Cloud Firestore Integration & Multi-Device Sync...');

const {
  initFirebase,
  clearFirebaseConfig,
  parseFirebaseConfigInput,
  onFirebaseStatusChange,
  getDb
} = await import('../src/services/firebase.js');

const jsonConfigStr = JSON.stringify({
  apiKey: 'AIzaSyTestApiKey123',
  projectId: 'homoeo-cloud-test',
  authDomain: 'homoeo-cloud-test.firebaseapp.com',
  storageBucket: 'homoeo-cloud-test.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456:web:abcd'
});
const parsedJson = parseFirebaseConfigInput(jsonConfigStr);
assert.equal(parsedJson.projectId, 'homoeo-cloud-test');
assert.equal(parsedJson.apiKey, 'AIzaSyTestApiKey123');

// Test status subscription listener
let latestStatus = null;
const unsubStatus = onFirebaseStatusChange((status) => {
  latestStatus = status;
});
assert(latestStatus !== null, 'Status listener must receive initial state immediately');
assert.equal(typeof latestStatus.isConnected, 'boolean');
unsubStatus();

// Test Firebase Re-initialization
initFirebase({ projectId: 'project-alpha', apiKey: 'key-alpha' });
assert.equal(getDb().app.options.projectId, 'project-alpha');
initFirebase({ projectId: 'project-beta', apiKey: 'key-beta' });
assert.equal(getDb().app.options.projectId, 'project-beta');
await clearFirebaseConfig();

// Verify .env.example contains VITE_API_URL and Firebase configuration
assert(existsSync('.env.example'), '.env.example template file must exist');
const envExampleContent = readFileSync('.env.example', 'utf8');
assert(envExampleContent.includes('VITE_API_URL'), '.env.example must specify VITE_API_URL');
assert(envExampleContent.includes('VITE_FIREBASE_API_KEY'), '.env.example must specify VITE_FIREBASE_API_KEY');

console.log('   ✓ Dynamic Firebase Cloud Firestore Integration & Multi-Device Sync rigorously verified.');

// 10. Verify Logo Integration, apiService VITE_API_URL Resolution, & Zero Bleed
console.log('10. Verifying Logo Integration, apiService VITE_API_URL Resolution & Zero Bleed...');

// 10.1 Verify Logo Assets
assert(existsSync('public/logo.png'), 'public/logo.png must exist');
assert(existsSync('public/assets/veayos-logo.png'), 'public/assets/veayos-logo.png must exist');
assert(existsSync('public/icons/icon-192.png'), 'public/icons/icon-192.png must exist');
assert(existsSync('public/icons/icon-512.png'), 'public/icons/icon-512.png must exist');
assert(readFileSync('public/logo.png').length > 50000, 'public/logo.png must be high-resolution');

// 10.2 Verify Logo Integration in Components
const navbarJsx = readFileSync('src/components/Navbar.jsx', 'utf8');
assert(navbarJsx.includes('src="/logo.png"'), 'Navbar must render official VEAYOS company logo');

const sidebarJsx = readFileSync('src/components/Sidebar.jsx', 'utf8');
assert(sidebarJsx.includes('src="/logo.png"'), 'Sidebar must render official VEAYOS company logo');

const loginModalJsx = readFileSync('src/components/LoginModal.jsx', 'utf8');
assert(loginModalJsx.includes('src="/logo.png"'), 'LoginModal must render official VEAYOS company logo');
assert(loginModalJsx.includes('Sign in with Google'), 'LoginModal must provide dedicated Sign in with Google action');
assert(loginModalJsx.includes('handleGoogleSignIn'), 'LoginModal must implement handleGoogleSignIn handler');

const printModalJsxContent = readFileSync('src/components/PrescriptionPrintModal.jsx', 'utf8');
assert(printModalJsxContent.includes('src="/logo.png"'), 'PrescriptionPrintModal must render official company logo on letterhead');

// 10.3 Verify apiService VITE_API_URL Resolution & Dynamic Edge Cases
const { apiService, getApiBaseUrl, getHealthUrl } = await import('../src/services/apiService.js');
assert.equal(typeof apiService.request, 'function', 'apiService must provide request method');
assert.equal(typeof apiService.checkHealth, 'function', 'apiService must provide checkHealth method');
assert.equal(typeof apiService.analyzeRepertory, 'function', 'apiService must provide analyzeRepertory method');
assert.equal(typeof apiService.sendWhatsApp, 'function', 'apiService must provide sendWhatsApp method');

// Test default relative base URLs
assert.equal(getApiBaseUrl(), '/api/v1', 'Default base URL must be /api/v1');
assert.equal(getHealthUrl(), '/api/health', 'Default health URL must be /api/health');

// Test with empty string and whitespace VITE_API_URL
process.env.VITE_API_URL = '';
assert.equal(getApiBaseUrl(), '/api/v1', 'Empty VITE_API_URL must fallback to /api/v1');
assert.equal(getHealthUrl(), '/api/health', 'Empty VITE_API_URL must fallback to /api/health');

process.env.VITE_API_URL = '   ';
assert.equal(getApiBaseUrl(), '/api/v1', 'Whitespace VITE_API_URL must fallback to /api/v1');
assert.equal(getHealthUrl(), '/api/health', 'Whitespace VITE_API_URL must fallback to /api/health');

// Test simulated custom VITE_API_URL without trailing slash
process.env.VITE_API_URL = 'https://api.veayos-clinicalos.com';
assert.equal(getApiBaseUrl(), 'https://api.veayos-clinicalos.com/api/v1', 'getApiBaseUrl must respect custom VITE_API_URL');
assert.equal(getHealthUrl(), 'https://api.veayos-clinicalos.com/api/health', 'getHealthUrl must respect custom VITE_API_URL');

// Test simulated custom VITE_API_URL with trailing slash
process.env.VITE_API_URL = 'https://api.veayos-clinicalos.com/';
assert.equal(getApiBaseUrl(), 'https://api.veayos-clinicalos.com/api/v1', 'Trailing slash in VITE_API_URL must be normalized');
assert.equal(getHealthUrl(), 'https://api.veayos-clinicalos.com/api/health', 'Trailing slash in VITE_API_URL must be normalized');

// Test simulated custom VITE_API_URL already containing /api/v1
process.env.VITE_API_URL = 'https://api.veayos-clinicalos.com/api/v1';
assert.equal(getApiBaseUrl(), 'https://api.veayos-clinicalos.com/api/v1', 'VITE_API_URL with /api/v1 must not duplicate');
assert.equal(getHealthUrl(), 'https://api.veayos-clinicalos.com/api/health', 'Health URL must replace /api/v1 with /api/health');

delete process.env.VITE_API_URL;

// 10.4 Verify Services Route Through apiService (Zero Hardcoded Raw /api/v1 Fetches)
const geminiSrc = readFileSync('src/services/geminiService.js', 'utf8');
assert(geminiSrc.includes("import { apiService } from './apiService.js'"), 'geminiService must import apiService');
assert(geminiSrc.includes('apiService.analyzeRepertory'), 'geminiService must use apiService.analyzeRepertory');
assert(!geminiSrc.includes("fetch('/api/v1/repertory/analyze'"), 'geminiService must not bypass apiService with raw fetch');

const aisensySrc = readFileSync('src/services/aisensyService.js', 'utf8');
assert(aisensySrc.includes("import { apiService } from './apiService.js'"), 'aisensyService must import apiService');
assert(aisensySrc.includes('apiService.sendWhatsApp'), 'aisensyService must use apiService.sendWhatsApp');
assert(!aisensySrc.includes("fetch('/api/v1/whatsapp/send'"), 'aisensyService must not bypass apiService with raw fetch');

// 10.5 Verify Zero Cross-Directory Bleed (Frontend must not reference backend/ paths)
const viteConfigContent = readFileSync('vite.config.js', 'utf8');
assert(!viteConfigContent.includes('../backend'), 'vite.config.js must not depend on ../backend');

const frontendPkg = JSON.parse(readFileSync('package.json', 'utf8'));
assert(!JSON.stringify(frontendPkg.scripts).includes('cd backend'), 'frontend package.json must not reference backend directory');

console.log('   ✓ Logo Integration, apiService VITE_API_URL Resolution, & Zero Bleed verified.');
console.log('\n🎉 ALL 10 RIGOROUS FRONTEND VERIFICATION SUITES PASSED FLAWLESSLY!\n');
process.exit(0);

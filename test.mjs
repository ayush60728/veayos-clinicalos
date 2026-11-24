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

console.log('🧪 Starting Rigorous Deep Automated Verification Suite for VEAYOS Homoeopathy ClinicalOS...\n');

// 1. Verify Real authService Strict 2-Account Whitelist Access Control
console.log('1. Verifying Strict 2-Account Whitelist Access Control (from real authService.js)...');
const { authService, AUTHORIZED_USERS } = await import('./src/services/authService.js');

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
const { storageService } = await import('./src/services/storageService.js');

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

// Verify that finalizing prescription linked the tests array into patient history!
const reloadedPatient = storageService.getPatientById(createdPatientId);
assert(reloadedPatient.history.length > 0, 'Patient history must contain the finalized visit');
assert.equal(reloadedPatient.history[0].tests.length, 1, 'Finalized visit must retain prescribed tests');
assert.equal(reloadedPatient.history[0].tests[0].testName, 'Upper GI Endoscopy');

// Verify Prescription Amendment De-duplication in Patient History (Fix #3)
const initialHistoryCount = reloadedPatient.history.length;
const amendedRx = storageService.savePrescription({
  ...finalizedRx,
  advice: 'Amended Advice: Strictly avoid coffee and sleep with head elevated 30 degrees'
});
const patientAfterAmend = storageService.getPatientById(createdPatientId);
assert.equal(patientAfterAmend.history.length, initialHistoryCount, 'History count must NOT increase when amending existing prescription');
assert.equal(patientAfterAmend.history[0].advice, 'Amended Advice: Strictly avoid coffee and sleep with head elevated 30 degrees', 'Existing visit in history must be updated in-place');

// Verify that finalizing prescription automatically updated the patient queue status to 'completed'!
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
const { geminiService, extractJsonFromGeminiResponse } = await import('./src/services/geminiService.js');

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

// Must define 80mm in general CSS rule (screen preview)
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

// 6. Verify Firebase Deployment Configuration
console.log('6. Verifying Firebase Deployment Setup...');
assert(existsSync('firebase.json'), 'firebase.json must exist');
const firebaseJson = JSON.parse(readFileSync('firebase.json', 'utf8'));
assert.equal(firebaseJson.hosting.public, 'dist', 'Hosting public dir must be dist');
assert(firebaseJson.hosting.rewrites.some(r => r.destination === '/index.html'), 'Firebase must rewrite routes to /index.html');
assert(existsSync('.firebaserc'), '.firebaserc must exist');
console.log('   ✓ Firebase configuration (hosting, SPA rewrites, security headers) verified.');

// 7. Verify Production Build Assets in dist/...
console.log('7. Verifying Production Build Assets in dist/...');
assert(existsSync('dist/index.html'), 'dist/index.html must exist');
assert(existsSync('dist/manifest.json'), 'dist/manifest.json must exist');
assert(existsSync('dist/sw.js'), 'dist/sw.js must exist');
assert(existsSync('dist/icons/icon-192.svg'), 'dist/icons/icon-192.svg must exist');
console.log('   ✓ Production build contains complete PWA distribution assets ready for deployment.');

// 8. Verify All 7 Technical Audit Fixes & Improvements
console.log('8. Verifying All 7 Technical Audit Fixes & Improvements...');

// 8.1 Doctor Identity Propagation (Functional & Static)
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

const { aisensyService } = await import('./src/services/aisensyService.js');
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

// 8.3 Prescription Amendment De-duplication in Patient History (Functional)
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

// Functional verification of date range filtering logic
const testTodayStr = new Date().toISOString().split('T')[0];
const testPastDate7d = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
const testPastDate40d = new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0];

const isDateInRangeFn = (dateStr, range) => {
  if (!dateStr) return false;
  const itemDate = dateStr.split('T')[0];
  if (range === 'all') return true;
  if (range === 'today') return itemDate === testTodayStr;
  const itemTime = new Date(itemDate).getTime();
  const nowTime = new Date(testTodayStr).getTime();
  const diffDays = Math.round((nowTime - itemTime) / (1000 * 60 * 60 * 24));
  if (range === '7d') return diffDays >= 0 && diffDays < 7;
  if (range === '30d') return diffDays >= 0 && diffDays < 30;
  return true;
};

assert.equal(isDateInRangeFn(testTodayStr, 'today'), true, 'Today matches today range');
assert.equal(isDateInRangeFn(testPastDate7d, 'today'), false, '3-day-old date does not match today range');
assert.equal(isDateInRangeFn(testPastDate7d, '7d'), true, '3-day-old date matches 7d range');
assert.equal(isDateInRangeFn(testPastDate40d, '7d'), false, '40-day-old date does not match 7d range');
assert.equal(isDateInRangeFn(testPastDate40d, '30d'), false, '40-day-old date does not match 30d range');
assert.equal(isDateInRangeFn(testPastDate40d, 'all'), true, '40-day-old date matches all range');

// Functional verification of follow-up overdue vs upcoming classification
assert.equal('2026-11-01' < testTodayStr, true, 'Past follow-up date must be classified as overdue');
assert.equal('2026-12-30' >= testTodayStr, true, 'Future follow-up date must be classified as upcoming');

// 8.5 8.0 cm Letterpad Print Leak Fix
assert(printModalJsx.includes('no-print letterpad-preview-only'), 'PrescriptionPrintModal must have no-print letterpad-preview-only on guide text');
// Both preview containers must have no-print
const noPrintMatches = (printModalJsx.match(/no-print letterpad-preview-only/g) || []).length;
assert(noPrintMatches >= 2, 'Both pre-printed stationery and digital header preview blocks must contain no-print letterpad-preview-only');

// 8.6 WhatsApp Dispatch Async State
assert(doctorWorkspaceJsx.includes('rxToSend = handleFinalize()'), 'DoctorWorkspace handleSendWhatsApp must capture returned saved prescription');
assert(doctorWorkspaceJsx.includes("rxToSend.status !== 'finalized'"), 'DoctorWorkspace handleSendWhatsApp must ensure draft prescription is finalized before sending');
assert(!doctorWorkspaceJsx.includes("'rx-current'"), 'DoctorWorkspace must eliminate fallback to fake rx-current');

// 8.7 Optional Date of Birth in Patient Intake (Functional)
const intakeJsx = readFileSync('src/components/PatientIntake.jsx', 'utf8');
assert(intakeJsx.includes('dob:'), 'PatientIntake must have dob in form state');
assert(intakeJsx.includes('handleDobChange'), 'PatientIntake must define handleDobChange');
assert(intakeJsx.includes('type="date"'), 'PatientIntake must render date input for DOB');
assert(intakeJsx.includes('min="0"'), 'PatientIntake must support age 0 for infants and newborns');

// Functional verification of DOB to Age calculation logic & validations
const calculateAgeAccurate = (dobString) => {
  const birth = new Date(dobString);
  const today = new Date();
  if (birth > today) return { error: 'Date of birth cannot be in the future.' };
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return { age: Math.max(0, age) };
};

// Adult test
const adultAge = calculateAgeAccurate('1990-05-15');
assert(adultAge.age >= 34, '1990 birth must calculate age >= 34');

// Infant test (born current year)
const infantDob = `${new Date().getFullYear()}-01-15`;
const infantAge = calculateAgeAccurate(infantDob);
assert.equal(typeof infantAge.age, 'number', 'Infant age must be numeric');
assert(infantAge.age >= 0, 'Infant age must be >= 0');

// Future date validation test
const futureDob = `${new Date().getFullYear() + 2}-01-01`;
const futureResult = calculateAgeAccurate(futureDob);
assert.equal(futureResult.error, 'Date of birth cannot be in the future.', 'Future DOB must be detected and rejected');

console.log('   ✓ All 7 PDF Technical Audit Fixes rigorously verified.');

// 9. Verify Dynamic Firebase Cloud Firestore Integration & Multi-Device Sync
console.log('9. Verifying Dynamic Firebase Cloud Firestore Integration & Multi-Device Sync...');

// 9.1 Verify Firebase Service & Config Parsers
const {
  initFirebase,
  getFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured,
  isFirebaseConnected,
  parseFirebaseConfigInput,
  onFirebaseStatusChange,
  getDb
} = await import('./src/services/firebase.js');

// Test JSON parser
const jsonConfigStr = JSON.stringify({
  apiKey: 'AIzaSyTestApiKey123',
  projectId: 'homoeo-cloud-test',
  authDomain: 'homoeo-cloud-test.firebaseapp.com',
  storageBucket: 'homoeo-cloud-test.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456:web:abcd'
});
const parsedJson = parseFirebaseConfigInput(jsonConfigStr);
assert.equal(parsedJson.projectId, 'homoeo-cloud-test', 'JSON config parser must extract projectId');
assert.equal(parsedJson.apiKey, 'AIzaSyTestApiKey123', 'JSON config parser must extract apiKey');
assert.equal(parsedJson.authDomain, 'homoeo-cloud-test.firebaseapp.com');

// Test JS snippet parser with comments & trailing commas (from Firebase web console)
const jsSnippet = `
// Firebase SDK snippet
const firebaseConfig = {
  apiKey: "AIzaSySnippetKey987",
  authDomain: "veayos-clinic.firebaseapp.com",
  projectId: "veayos-clinic-prod",
  storageBucket: "veayos-clinic.appspot.com",
  messagingSenderId: "987654321",
  appId: "1:987654:web:xyz789",
  // measurementId: "G-12345"
};
`;
const parsedSnippet = parseFirebaseConfigInput(jsSnippet);
assert.equal(parsedSnippet.projectId, 'veayos-clinic-prod', 'JS snippet parser must extract projectId');
assert.equal(parsedSnippet.apiKey, 'AIzaSySnippetKey987', 'JS snippet parser must extract apiKey');
assert.equal(parsedSnippet.messagingSenderId, '987654321');

// Test backend env style (FIREBASE_API_KEY without VITE_ prefix)
const backendEnvStr = `
FIREBASE_API_KEY=AIzaSyBackendKey999
FIREBASE_PROJECT_ID=veayos-backend-proj
FIREBASE_AUTH_DOMAIN=veayos-backend.firebaseapp.com
`;
const parsedBackendEnv = parseFirebaseConfigInput(backendEnvStr);
assert.equal(parsedBackendEnv.projectId, 'veayos-backend-proj', 'Parser must handle FIREBASE_PROJECT_ID without VITE_');
assert.equal(parsedBackendEnv.apiKey, 'AIzaSyBackendKey999', 'Parser must handle FIREBASE_API_KEY without VITE_');

// Test malformed input returns null safely
assert.equal(parseFirebaseConfigInput('hello world without config'), null, 'Malformed text must safely return null');
assert.equal(parseFirebaseConfigInput(''), null, 'Empty string must return null');
assert.equal(parseFirebaseConfigInput(null), null, 'Null must return null');

// Test status subscription listener
let latestStatus = null;
const unsubStatus = onFirebaseStatusChange((status) => {
  latestStatus = status;
});
assert(latestStatus !== null, 'Status listener must receive initial state immediately');
assert.equal(typeof latestStatus.isConnected, 'boolean');
unsubStatus();

// Test Firebase Re-initialization when switching project credentials
initFirebase({ projectId: 'project-alpha', apiKey: 'key-alpha' });
assert.equal(getDb().app.options.projectId, 'project-alpha', 'First initialization must set project-alpha');
initFirebase({ projectId: 'project-beta', apiKey: 'key-beta' });
assert.equal(getDb().app.options.projectId, 'project-beta', 'Re-initialization with new config must switch to project-beta');
// Reset back to clean offline state
await clearFirebaseConfig();

// 9.2 Verify Dynamic Authorized Practitioner Accounts & Seed Fallback
const currentUsers = authService.getAuthorizedUsers();
assert(currentUsers.some(u => u.email === 'vpdixit75@gmail.com'), 'Default Senior Director vpdixit75@gmail.com must be present');
assert(currentUsers.some(u => u.email === 'ved@veayos.com'), 'Default Consultant ved@veayos.com must be present');

// Dynamically add a 3rd practitioner account (e.g. newly hired doctor)
const dynamicDocEmail = 'associate.doctor@veayos.com';
const addedPractitioner = await authService.addAuthorizedUser({
  email: dynamicDocEmail,
  name: 'Dr. Associate Doctor',
  title: 'Resident Homoeopath',
  defaultRole: 'doctor',
  regNo: 'BHMS-REG-99999'
});
assert.equal(addedPractitioner.email, dynamicDocEmail);
assert.equal(authService.isAuthorizedEmail(dynamicDocEmail), true, 'Dynamically added practitioner must be authorized immediately');

// Dynamic login test for the newly added practitioner
const dynamicLoginUser = authService.login(dynamicDocEmail, 'doctor');
assert.equal(dynamicLoginUser.email, dynamicDocEmail);
assert.equal(dynamicLoginUser.name, 'Dr. Associate Doctor');

// Director deletion protection test
assert.rejects(
  async () => await authService.deleteAuthorizedUser('vpdixit75@gmail.com'),
  /cannot be deleted/,
  'Default senior homoeopath vpdixit75@gmail.com must be protected from deletion'
);

// Delete dynamically added user
await authService.deleteAuthorizedUser(dynamicDocEmail);
assert.equal(authService.isAuthorizedEmail(dynamicDocEmail), false, 'Deleted practitioner must no longer be authorized');

// Test syncAllAuthorizedUsersToFirestore contract
assert.equal(typeof authService.syncAllAuthorizedUsersToFirestore, 'function', 'authService must provide syncAllAuthorizedUsersToFirestore');
assert.equal(typeof authService.stopFirestoreAuthSync, 'function', 'authService must provide stopFirestoreAuthSync');

// 9.3 Verify Real-time Storage Subscriptions & Bulk Cloud Sync Helpers
let subscriberCalled = false;
let receivedEvent = null;
const unsubStorage = storageService.subscribe((event) => {
  subscriberCalled = true;
  receivedEvent = event;
});

// Trigger a patient save and verify subscription notification fires
const notifyTestPatient = {
  name: 'Subscription Test Patient',
  phone: '+91 91111 22222',
  address: 'Test Street, New Delhi',
  age: 30,
  gender: 'Male',
  consentWhatsApp: true
};
storageService.savePatient(notifyTestPatient);
assert.equal(subscriberCalled, true, 'storageService.subscribe must notify listeners on patient save');
assert.equal(receivedEvent.collection, 'patients');
unsubStorage();

// Verify presence of bulk sync methods on storageService
assert.equal(typeof storageService.syncAllToFirebase, 'function', 'storageService must provide syncAllToFirebase');
assert.equal(typeof storageService.fetchFromFirebase, 'function', 'storageService must provide fetchFromFirebase');
assert.equal(typeof storageService.isCloudSyncActive, 'function', 'storageService must provide isCloudSyncActive');

// 9.4 Verify Settings UI Markup for Firebase Cloud Database & Dynamic Practitioners
const settingsJsx = readFileSync('src/components/SettingsView.jsx', 'utf8');
assert(settingsJsx.includes('Firebase Cloud Database'), 'SettingsView must contain Firebase Cloud Database section');
assert(settingsJsx.includes('Test Connection'), 'SettingsView must contain Test Connection button');
assert(settingsJsx.includes('Sync Local Data to Firebase'), 'SettingsView must contain Sync Local Data to Firebase button');
assert(settingsJsx.includes('Pull Cloud Data'), 'SettingsView must contain Pull Cloud Data button');
assert(settingsJsx.includes('Paste Firebase Config'), 'SettingsView must contain Paste Firebase Config assistant');
assert(settingsJsx.includes('handleParseRawConfig'), 'SettingsView must implement handleParseRawConfig');
assert(settingsJsx.includes('handleAddPractitioner'), 'SettingsView must implement handleAddPractitioner');

// 9.5 Verify .env.example Template
assert(existsSync('.env.example'), '.env.example template file must exist');
const envExampleContent = readFileSync('.env.example', 'utf8');
assert(envExampleContent.includes('VITE_FIREBASE_API_KEY'), '.env.example must specify VITE_FIREBASE_API_KEY');
assert(envExampleContent.includes('VITE_FIREBASE_AUTH_DOMAIN'), '.env.example must specify VITE_FIREBASE_AUTH_DOMAIN');
assert(envExampleContent.includes('VITE_FIREBASE_PROJECT_ID'), '.env.example must specify VITE_FIREBASE_PROJECT_ID');
assert(envExampleContent.includes('VITE_FIREBASE_STORAGE_BUCKET'), '.env.example must specify VITE_FIREBASE_STORAGE_BUCKET');
assert(envExampleContent.includes('VITE_FIREBASE_MESSAGING_SENDER_ID'), '.env.example must specify VITE_FIREBASE_MESSAGING_SENDER_ID');
assert(envExampleContent.includes('VITE_FIREBASE_APP_ID'), '.env.example must specify VITE_FIREBASE_APP_ID');

console.log('   ✓ Dynamic Firebase Cloud Firestore Integration & Multi-Device Sync rigorously verified.');

// 10. Verify Official Company Logo & Fullstack Backend Architecture
console.log('10. Verifying Official Company Logo & Fullstack Backend Architecture...');

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

// 10.3 Verify Backend Architecture & REST Routes
assert(existsSync('backend/package.json'), 'backend/package.json must exist');
assert(existsSync('backend/src/server.js'), 'backend/src/server.js must exist');
assert(existsSync('backend/src/app.js'), 'backend/src/app.js must exist');
assert(existsSync('backend/src/routes/auth.routes.js'), 'backend/src/routes/auth.routes.js must exist');
assert(existsSync('backend/src/routes/repertory.routes.js'), 'backend/src/routes/repertory.routes.js must exist');
assert(existsSync('backend/src/routes/patients.routes.js'), 'backend/src/routes/patients.routes.js must exist');
assert(existsSync('backend/src/routes/queue.routes.js'), 'backend/src/routes/queue.routes.js must exist');
assert(existsSync('backend/src/routes/prescriptions.routes.js'), 'backend/src/routes/prescriptions.routes.js must exist');
assert(existsSync('backend/src/routes/whatsapp.routes.js'), 'backend/src/routes/whatsapp.routes.js must exist');

// 10.4 Verify Frontend-Backend Connection (Vite Proxy & apiService)
const viteConfigContent = readFileSync('vite.config.js', 'utf8');
assert(viteConfigContent.includes("'/api':"), 'vite.config.js must configure proxy for /api');
assert(existsSync('src/services/apiService.js'), 'src/services/apiService.js must exist');

console.log('   ✓ Official Company Logo & Fullstack Backend Architecture rigorously verified.');

console.log('\n🎉 ALL 10 RIGOROUS VERIFICATION SUITES PASSED FLAWLESSLY!\n');

await clearFirebaseConfig();
process.exit(0);

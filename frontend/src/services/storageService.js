/**
 * Central Data Storage & State Persistence Service
 * Stores Patients, Live Queue, Prescriptions, Tests, Medicine Presets, Settings, and Audit Trail.
 * Pre-seeded with realistic clinic data.
 *
 * Fully integrated with Firebase Cloud Firestore for real-time dynamic sync across
 * devices, with automatic fallback to localStorage for 100% offline functionality.
 */

import { getDb, isFirebaseConnected, onFirebaseStatusChange } from './firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { authService } from './authService.js';

const STORAGE_KEYS = {
  PATIENTS: 'veayos_clinicalos_patients',
  QUEUE: 'veayos_clinicalos_queue',
  PRESCRIPTIONS: 'veayos_clinicalos_prescriptions',
  MEDICINE_PRESETS: 'veayos_clinicalos_medicine_presets',
  TESTS: 'veayos_clinicalos_tests',
  AISENSY_SETTINGS: 'veayos_clinicalos_aisensy',
  CLINIC_SETTINGS: 'veayos_clinicalos_clinic_settings',
  AUDIT_LOGS: 'veayos_clinicalos_audit_logs',
  WHATSAPP_LOGS: 'veayos_clinicalos_whatsapp_logs'
};

// Seed Medicine Presets for Homoeopathy
const INITIAL_MEDICINE_PRESETS = [
  {
    id: 'med-1',
    name: 'Arnica Montana',
    potency: '200C',
    potencies: ['30C', '200C', '1M', 'Q'],
    category: 'Acute / Trauma',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '5 days',
    instructions: 'Dissolve in mouth 15 mins before meals'
  },
  {
    name: 'Nux Vomica',
    id: 'med-2',
    potency: '30C',
    potencies: ['6C', '30C', '200C', '1M'],
    category: 'Digestive / Constitutional',
    dosage: '4 globules or 5 drops in water',
    frequency: 'BD (Twice daily)',
    duration: '7 days',
    instructions: 'Take 1 dose at bedtime and 1 early morning'
  },
  {
    name: 'Bryonia Alba',
    id: 'med-3',
    potency: '30C',
    potencies: ['30C', '200C', '1M'],
    category: 'Respiratory / Musculoskeletal',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '5 days',
    instructions: 'Take with warm water'
  },
  {
    name: 'Rhus Toxicodendron',
    id: 'med-4',
    potency: '200C',
    potencies: ['30C', '200C', '1M'],
    category: 'Musculoskeletal',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '7 days',
    instructions: 'Take morning and evening'
  },
  {
    name: 'Lycopodium Clavatum',
    id: 'med-5',
    potency: '200C',
    potencies: ['30C', '200C', '1M'],
    category: 'Hepatic / Digestive',
    dosage: '4 globules',
    frequency: 'OD (Once daily, empty stomach)',
    duration: '14 days',
    instructions: 'Take early morning before breakfast'
  },
  {
    name: 'Arsenicum Album',
    id: 'med-6',
    potency: '30C',
    potencies: ['30C', '200C'],
    category: 'Constitutional',
    dosage: '4 globules',
    frequency: 'TDS (3 times daily)',
    duration: '3 days',
    instructions: 'Sip with small amount of warm water'
  },
  {
    name: 'Pulsatilla Pratensis',
    id: 'med-7',
    potency: '30C',
    potencies: ['30C', '200C', '1M'],
    category: 'Constitutional',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '10 days',
    instructions: 'Take 30 mins before food'
  },
  {
    name: 'Belladonna',
    id: 'med-8',
    potency: '30C',
    potencies: ['30C', '200C'],
    category: 'Acute / Febrile',
    dosage: '4 globules',
    frequency: 'Every 3 hours SOS',
    duration: '2 days',
    instructions: 'Discontinue when fever drops'
  },
  {
    name: 'Thuja Occidentalis',
    id: 'med-9',
    potency: '200C',
    potencies: ['30C', '200C', '1M'],
    category: 'Sycotic / Skin',
    dosage: '4 globules',
    frequency: 'Weekly (1 dose every Sunday)',
    duration: '4 weeks',
    instructions: 'Single dose in the morning'
  },
  {
    name: 'Calcarea Carbonica',
    id: 'med-10',
    potency: '200C',
    potencies: ['30C', '200C', '1M'],
    category: 'Constitutional',
    dosage: '4 globules',
    frequency: 'OD (Once daily)',
    duration: '14 days',
    instructions: 'Early morning empty stomach'
  }
];

// Seed Patients
const INITIAL_PATIENTS = [
  {
    id: 'pt-101',
    name: 'Rajesh Sharma',
    phone: '+91 98201 45872',
    address: '402, Green Valley Apts, Sector 14, Noida, UP',
    age: 42,
    gender: 'Male',
    email: 'rajesh.sharma@example.com',
    occupation: 'Software Engineer',
    emergencyContact: '+91 98201 45873 (Wife)',
    referralSource: 'Dr. Dixit Reference',
    consentWhatsApp: true,
    medicalHistoryNotes: 'Chronic acidity, GERD for 3 years. Chilly patient, high work stress, sedentary life.',
    createdAt: '2026-11-01T09:30:00Z',
    history: [
      {
        visitId: 'vis-1001',
        date: '2026-11-01',
        token: 'T-01',
        doctorName: 'Dr. V. P. Dixit',
        symptoms: 'Sour eructations, burning epigastric pain worse 2 hours after food, ineffectual urging for stool.',
        diagnosis: 'Non-ulcer Dyspepsia & Irritable Bowel tendencies',
        medicines: [
          {
            remedy: 'Nux Vomica 30C',
            dosage: '4 globules',
            frequency: 'BD (Morning & Bedtime)',
            duration: '10 days',
            instructions: 'Empty stomach before tea'
          }
        ],
        advice: 'Avoid late dinner and spicy food. Walk 30 minutes daily.',
        followUpDate: '2026-11-15'
      }
    ]
  },
  {
    id: 'pt-102',
    name: 'Ananya Deshmukh',
    phone: '+91 94220 18493',
    address: 'Flat 12-B, Rosewood Towers, Pune, Maharashtra',
    age: 29,
    gender: 'Female',
    email: 'ananya.d@example.com',
    occupation: 'Architect',
    emergencyContact: '+91 94220 18490 (Father)',
    referralSource: 'Clinic Website',
    consentWhatsApp: true,
    medicalHistoryNotes: 'Migraine with aura since college. Mild anxiety before deadlines.',
    createdAt: '2026-11-10T11:00:00Z',
    history: []
  },
  {
    id: 'pt-103',
    name: 'Vikramaditya Rao',
    phone: '+91 98450 71234',
    address: 'Plot 77, Indiranagar 1st Stage, Bengaluru, Karnataka',
    age: 58,
    gender: 'Male',
    email: 'vikram.rao@example.com',
    occupation: 'Retired Bank Manager',
    emergencyContact: '+91 98450 71239 (Son)',
    referralSource: 'Word of mouth',
    consentWhatsApp: true,
    medicalHistoryNotes: 'Bilateral knee osteoarthritis, morning stiffness for 45 minutes.',
    createdAt: '2026-11-18T10:15:00Z',
    history: [
      {
        visitId: 'vis-1002',
        date: '2026-11-18',
        token: 'T-04',
        doctorName: 'Dr. Ved Prakash',
        symptoms: 'Knee stiffness on getting out of bed, easing after walking a few steps. Worse in rainy weather.',
        diagnosis: 'Bilateral Knee Osteoarthritis',
        medicines: [
          {
            remedy: 'Rhus Toxicodendron 200C',
            dosage: '4 globules',
            frequency: 'BD',
            duration: '14 days',
            instructions: 'Take after gentle warm water gargle'
          }
        ],
        advice: 'Avoid sitting on floor. Warm sesame oil application.',
        followUpDate: '2026-12-02'
      }
    ]
  },
  {
    id: 'pt-104',
    name: 'Sunita Mehra',
    phone: '+91 97110 33421',
    address: 'B-6, Kailash Colony, Greater Kailash, New Delhi',
    age: 36,
    gender: 'Female',
    email: 'sunita.mehra@example.com',
    occupation: 'Teacher',
    emergencyContact: '+91 97110 33425 (Husband)',
    referralSource: 'Friend',
    consentWhatsApp: true,
    medicalHistoryNotes: 'Recurrent allergic rhinitis, sneezing fits in morning air.',
    createdAt: '2026-11-24T08:45:00Z',
    history: []
  }
];

// Seed Live Queue for today
const INITIAL_QUEUE = [
  {
    id: 'q-1',
    token: 'T-101',
    patientId: 'pt-101',
    patientName: 'Rajesh Sharma',
    age: 42,
    gender: 'Male',
    phone: '+91 98201 45872',
    arrivalTime: '09:15 AM',
    status: 'in_consultation', // 'waiting' | 'called' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show'
    notes: 'Follow-up consultation for chronic GERD & gastric burning'
  },
  {
    id: 'q-2',
    token: 'T-102',
    patientId: 'pt-102',
    patientName: 'Ananya Deshmukh',
    age: 29,
    gender: 'Female',
    phone: '+91 94220 18493',
    arrivalTime: '09:35 AM',
    status: 'waiting',
    notes: 'New registration - severe right-sided migraine headaches'
  },
  {
    id: 'q-3',
    token: 'T-103',
    patientId: 'pt-103',
    patientName: 'Vikramaditya Rao',
    age: 58,
    gender: 'Male',
    phone: '+91 98450 71234',
    arrivalTime: '09:50 AM',
    status: 'waiting',
    notes: 'Review of knee stiffness and report verification'
  },
  {
    id: 'q-4',
    token: 'T-104',
    patientId: 'pt-104',
    patientName: 'Sunita Mehra',
    age: 36,
    gender: 'Female',
    phone: '+91 97110 33421',
    arrivalTime: '10:05 AM',
    status: 'waiting',
    notes: 'Morning sneezing attacks and water nasal discharge'
  }
];

// Async Cloud Sync Helper: write a doc to Firestore without blocking synchronous UI
async function syncDocToFirestore(collectionName, docId, data) {
  try {
    if (!docId) return;
    const db = getDb();
    if (!db || !isFirebaseConnected()) return;
    const ref = doc(db, collectionName, String(docId));
    const cleaned = JSON.parse(JSON.stringify(data));
    await Promise.race([
      setDoc(ref, cleaned, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 2500))
    ]);
  } catch (err) {
    console.warn(`Firestore sync error for ${collectionName}/${docId}:`, err.message || err);
  }
}

// Async Cloud Sync Helper: delete a doc from Firestore
async function deleteDocFromFirestore(collectionName, docId) {
  try {
    if (!docId) return;
    const db = getDb();
    if (!db || !isFirebaseConnected()) return;
    const ref = doc(db, collectionName, String(docId));
    await Promise.race([
      deleteDoc(ref),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Delete timeout')), 2500))
    ]);
  } catch (err) {
    console.warn(`Firestore delete error for ${collectionName}/${docId}:`, err.message || err);
  }
}

// Subscription subscribers set
const changeSubscribers = new Set();
let activeFirestoreUnsubscribers = [];

function notifySubscribers(collectionName, data) {
  changeSubscribers.forEach(cb => {
    try {
      cb({ collection: collectionName, data });
    } catch (e) {
      console.error('Subscriber callback error:', e);
    }
  });
}

export const storageService = {
  // Subscribe to real-time updates (from Firestore or local writes)
  subscribe(callback) {
    changeSubscribers.add(callback);
    return () => changeSubscribers.delete(callback);
  },

  isCloudSyncActive() {
    return isFirebaseConnected();
  },

  // --- PATIENTS ---
  getPatients() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
        return INITIAL_PATIENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PATIENTS;
    }
  },

  getPatientById(id) {
    const list = this.getPatients();
    return list.find(p => p.id === id) || null;
  },

  findPatientByPhone(phone) {
    if (!phone) return null;
    const clean = phone.replace(/[^0-9]/g, '');
    const list = this.getPatients();
    return list.find(p => p.phone.replace(/[^0-9]/g, '').endsWith(clean.slice(-10))) || null;
  },

  savePatient(patientData) {
    const list = this.getPatients();
    let updated;
    let savedItem;
    if (patientData.id) {
      savedItem = { ...patientData, updatedAt: new Date().toISOString() };
      // Keep saved patient at head so callers accessing index 0 always get the target
      updated = [savedItem, ...list.filter(p => p.id !== patientData.id)];
    } else {
      savedItem = {
        ...patientData,
        id: `pt-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        history: patientData.history || []
      };
      updated = [savedItem, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));

    // Cloud Firestore Sync
    syncDocToFirestore('patients', savedItem.id, savedItem);
    notifySubscribers('patients', updated);

    return updated;
  },

  // --- QUEUE ---
  getQueue() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(INITIAL_QUEUE));
        return INITIAL_QUEUE;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_QUEUE;
    }
  },

  addToQueue(patient, notes = '') {
    const queue = this.getQueue();
    // Generate next token number
    const maxTokenNum = queue.reduce((max, item) => {
      const num = parseInt(item.token.replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);

    const token = `T-${maxTokenNum + 1}`;
    const now = new Date();
    const arrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const queueItem = {
      id: `q-${Date.now()}`,
      token,
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      arrivalTime,
      status: 'waiting',
      notes: notes || 'General homoeopathy consultation'
    };

    const updated = [...queue, queueItem];
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updated));
    this.addAuditLog('Staff / Reception', `Added patient ${patient.name} (Token ${token}) to Live Queue.`);

    // Cloud Firestore Sync
    syncDocToFirestore('queue', queueItem.id, queueItem);
    notifySubscribers('queue', updated);

    return queueItem;
  },

  updateQueueStatus(queueId, newStatus) {
    const queue = this.getQueue();
    const item = queue.find(q => q.id === queueId);
    if (!item) return queue;

    item.status = newStatus;
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    this.addAuditLog('Doctor / Staff', `Updated queue item ${item.token} (${item.patientName}) to ${newStatus}.`);

    // Cloud Firestore Sync
    syncDocToFirestore('queue', item.id, item);
    notifySubscribers('queue', queue);

    return queue;
  },

  // Call Next Waiting Patient
  callNextWaiting() {
    const queue = this.getQueue();
    const nextWaiting = queue.find(q => q.status === 'waiting');
    if (nextWaiting) {
      nextWaiting.status = 'called';
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      this.addAuditLog('Doctor', `Called next patient ${nextWaiting.patientName} (Token ${nextWaiting.token}).`);

      // Cloud Firestore Sync
      syncDocToFirestore('queue', nextWaiting.id, nextWaiting);
      notifySubscribers('queue', queue);
    }
    return nextWaiting;
  },

  // --- MEDICINE PRESETS ---
  getMedicinePresets() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDICINE_PRESETS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.MEDICINE_PRESETS, JSON.stringify(INITIAL_MEDICINE_PRESETS));
        return INITIAL_MEDICINE_PRESETS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_MEDICINE_PRESETS;
    }
  },

  saveMedicinePreset(preset) {
    const presets = this.getMedicinePresets();
    let updated;
    let targetPreset;
    if (preset.id) {
      targetPreset = { ...preset };
      updated = presets.map(p => p.id === preset.id ? { ...p, ...preset } : p);
    } else {
      targetPreset = {
        ...preset,
        id: `med-${Date.now().toString().slice(-5)}`
      };
      updated = [targetPreset, ...presets];
    }
    localStorage.setItem(STORAGE_KEYS.MEDICINE_PRESETS, JSON.stringify(updated));

    // Cloud Firestore Sync
    syncDocToFirestore('medicine_presets', targetPreset.id, targetPreset);
    notifySubscribers('medicine_presets', updated);

    return updated;
  },

  deleteMedicinePreset(id) {
    const presets = this.getMedicinePresets();
    const updated = presets.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEDICINE_PRESETS, JSON.stringify(updated));

    // Cloud Firestore Sync
    deleteDocFromFirestore('medicine_presets', id);
    notifySubscribers('medicine_presets', updated);

    return updated;
  },

  // --- PRESCRIPTIONS ---
  getPrescriptions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePrescription(rxData) {
    const list = this.getPrescriptions();
    const now = new Date().toISOString();
    let savedRx;

    if (rxData.id) {
      savedRx = {
        ...rxData,
        updatedAt: now,
        version: (rxData.version || 1) + (rxData.status === 'finalized' ? 1 : 0)
      };
      const updated = list.map(rx => rx.id === rxData.id ? savedRx : rx);
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
    } else {
      savedRx = {
        ...rxData,
        id: `rx-${Date.now().toString().slice(-6)}`,
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify([savedRx, ...list]));
    }

    // Cloud Firestore Sync for prescription
    syncDocToFirestore('prescriptions', savedRx.id, savedRx);

    // If prescription is finalized, link to patient history!
    if (savedRx.status === 'finalized') {
      const patients = this.getPatients();
      const patient = patients.find(p => p.id === savedRx.patientId);
      if (patient) {
        if (!patient.history) patient.history = [];
        const visitEntry = {
          visitId: savedRx.id,
          date: savedRx.date || new Date().toISOString().split('T')[0],
          token: savedRx.token || 'Rx',
          doctorName: savedRx.doctorName || this.getClinicSettings().doctorName || 'Dr. V. P. Dixit',
          doctorRegNo: savedRx.doctorRegNo || this.getClinicSettings().regNo || 'BHMS-REG-84729',
          symptoms: savedRx.symptoms || '',
          diagnosis: savedRx.diagnosis || '',
          medicines: savedRx.medicines || [],
          tests: savedRx.tests || [],
          advice: savedRx.advice || '',
          followUpDate: savedRx.followUpDate || ''
        };

        const existingVisitIndex = patient.history.findIndex(h => h.visitId === savedRx.id);
        if (existingVisitIndex !== -1) {
          patient.history[existingVisitIndex] = {
            ...patient.history[existingVisitIndex],
            ...visitEntry
          };
        } else {
          patient.history.unshift(visitEntry);
        }
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

        // Sync patient with updated history to Firestore
        syncDocToFirestore('patients', patient.id, patient);
        notifySubscribers('patients', patients);
      }

      // Automatically transition active queue item to 'completed'
      const queue = this.getQueue();
      const matchingQueueItem = queue.find(q =>
        (savedRx.queueId && q.id === savedRx.queueId) ||
        (q.patientId === savedRx.patientId && (q.status === 'in_consultation' || q.status === 'called' || q.status === 'waiting'))
      );
      if (matchingQueueItem) {
        matchingQueueItem.status = 'completed';
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));

        // Sync completed queue item to Firestore
        syncDocToFirestore('queue', matchingQueueItem.id, matchingQueueItem);
        notifySubscribers('queue', queue);
      }
    }

    this.addAuditLog(
      savedRx.doctorName || 'Doctor',
      `${savedRx.status === 'finalized' ? 'Finalized' : 'Saved draft'} prescription for patient ${savedRx.patientName}.`
    );

    notifySubscribers('prescriptions', this.getPrescriptions());
    return savedRx;
  },

  // --- LAB TESTS & REPORT ATTACHMENTS ---
  getTests() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  prescribeTest(testData) {
    const tests = this.getTests();
    const newTest = {
      id: `test-${Date.now().toString().slice(-5)}`,
      status: 'prescribed',
      prescribedDate: new Date().toISOString().split('T')[0],
      ...testData
    };
    const updated = [newTest, ...tests];
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(updated));
    this.addAuditLog('Doctor', `Prescribed test '${newTest.testName}' for patient.`);

    // Cloud Firestore Sync
    syncDocToFirestore('tests', newTest.id, newTest);
    notifySubscribers('tests', updated);

    return newTest;
  },

  attachReportToTest(testId, { reportUrl, reportFileName, reportFileType }) {
    const tests = this.getTests();
    const item = tests.find(t => t.id === testId);
    if (item) {
      item.reportUrl = reportUrl;
      item.reportFileName = reportFileName;
      item.reportFileType = reportFileType;
      item.status = 'report_attached';
      item.uploadedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
      this.addAuditLog('Staff / Doctor', `Attached report '${reportFileName}' to test ID ${testId}.`);

      // Cloud Firestore Sync for test
      syncDocToFirestore('tests', testId, item);

      // Synchronize attached report status into patient history visit records
      if (item.patientId) {
        const patients = this.getPatients();
        const pt = patients.find(p => p.id === item.patientId);
        if (pt && pt.history) {
          pt.history.forEach(visit => {
            if (visit.tests) {
              const visitTest = visit.tests.find(t => t.id === testId || t.testName === item.testName);
              if (visitTest) {
                visitTest.reportUrl = reportUrl;
                visitTest.reportFileName = reportFileName;
                visitTest.status = 'report_attached';
              }
            }
          });
          localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

          // Sync updated patient history to Firestore
          syncDocToFirestore('patients', pt.id, pt);
          notifySubscribers('patients', patients);
        }
      }
      notifySubscribers('tests', tests);
    }
    return tests;
  },

  // --- CLINIC & LETTERPAD SETTINGS ---
  getClinicSettings() {
    const defaults = {
      clinicName: 'VEAYOS Homoeopathic Clinic & Research Centre',
      doctorName: 'Dr. V. P. Dixit',
      qualifications: 'B.H.M.S., M.D. (Hom.), Senior Homoeopathic Consultant',
      regNo: 'BHMS-REG-84729 / CCH Delhi',
      phone: '+91 98112 34567 / 011-26895431',
      email: 'consult@veayosclinic.com',
      address: 'Suite 204, Clinical Excellence Block, Metro Pillar 42, South Ext II, New Delhi 110049',
      letterpadHeaderImage: null,
      signatureStampImage: null,
      disclaimer: 'Homoeopathic medicine is customised to your individual totality. Keep medicines away from strong scents, camphor, and sunlight. Dissolve globules in a clean dry mouth.'
    };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLINIC_SETTINGS);
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch {
      return defaults;
    }
  },

  saveClinicSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.CLINIC_SETTINGS, JSON.stringify(settings));
    this.addAuditLog('Admin', 'Updated clinic profile & prescription letterpad settings.');

    // Cloud Firestore Sync
    syncDocToFirestore('clinic_settings', 'general', settings);
    notifySubscribers('clinic_settings', settings);

    return settings;
  },

  // --- AISENSY / WHATSAPP SETTINGS & LOGS ---
  getAisensySettings() {
    const defaults = {
      apiKey: '',
      senderNumber: '+91 98112 34567',
      campaignName: 'prescription_share_v1',
      reminderCampaign: 'followup_reminder_v1',
      reminderDaysBefore: 1,
      isConnected: false
    };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AISENSY_SETTINGS);
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch {
      return defaults;
    }
  },

  saveAisensySettings(settings) {
    localStorage.setItem(STORAGE_KEYS.AISENSY_SETTINGS, JSON.stringify(settings));
    this.addAuditLog('Admin', 'Updated Aisensy WhatsApp configuration.');

    // Cloud Firestore Sync
    syncDocToFirestore('aisensy_settings', 'config', settings);

    return settings;
  },

  getWhatsAppLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WHATSAPP_LOGS);
      return data ? JSON.parse(data) : [
        {
          id: 'wa-1',
          patientName: 'Rajesh Sharma',
          phone: '+91 98201 45872',
          type: 'prescription',
          status: 'delivered',
          timestamp: '2026-11-01 10:45 AM',
          messageText: 'Dear Rajesh Sharma, Dr. V. P. Dixit has finalized your Homoeopathy prescription. View PDF: https://veayos.app/rx/vis-1001'
        },
        {
          id: 'wa-2',
          patientName: 'Rajesh Sharma',
          phone: '+91 98201 45872',
          type: 'followup_reminder',
          status: 'sent',
          timestamp: '2026-11-14 09:00 AM',
          messageText: 'Reminder: Your follow-up appointment with Dr. Dixit is scheduled for tomorrow (15 Nov). Reply YES to confirm.'
        }
      ];
    } catch {
      return [];
    }
  },

  logWhatsAppMessage(logEntry) {
    const logs = this.getWhatsAppLogs();
    const newEntry = {
      id: `wa-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      ...logEntry
    };
    const updated = [newEntry, ...logs];
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(updated));

    // Cloud Firestore Sync
    syncDocToFirestore('whatsapp_logs', newEntry.id, newEntry);
    notifySubscribers('whatsapp_logs', updated);

    return newEntry;
  },

  // --- AUDIT TRAIL ---
  getAuditLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [
        {
          id: 'audit-1',
          timestamp: '2026-11-24 09:15 AM',
          user: 'vpdixit75@gmail.com',
          action: 'System Sign In',
          details: 'Authorized access granted for Senior Homoeopath.'
        },
        {
          id: 'audit-2',
          timestamp: '2026-11-24 09:16 AM',
          user: 'Staff',
          action: 'Intake Registration',
          details: 'Patient Rajesh Sharma registered with 5 mandatory fields.'
        }
      ];
    } catch {
      return [];
    }
  },

  addAuditLog(user, action, details = '') {
    const logs = this.getAuditLogs();
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      user,
      action,
      details
    };
    const updated = [newLog, ...logs.slice(0, 99)]; // Keep latest 100
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));

    // Cloud Firestore Sync
    syncDocToFirestore('audit_trail', newLog.id, newLog);
    notifySubscribers('audit_logs', updated);

    return newLog;
  },

  // --- BULK CLOUD SYNC & REALTIME LISTENERS ---

  // Bulk upload all local database collections to Cloud Firestore
  async syncAllToFirebase() {
    const db = getDb();
    if (!db || !isFirebaseConnected()) {
      throw new Error('Firebase is not connected. Please enter valid Firebase credentials in Settings first.');
    }

    let count = 0;

    // 1. Sync all authorized users (including default and dynamic doctors)
    await authService.syncAllAuthorizedUsersToFirestore();
    count += authService.getAuthorizedUsers().length;

    // 2. Sync patients
    const patients = this.getPatients();
    for (const p of patients) {
      if (p.id) {
        await setDoc(doc(db, 'patients', String(p.id)), JSON.parse(JSON.stringify(p)), { merge: true });
        count++;
      }
    }

    // 3. Sync live queue
    const queue = this.getQueue();
    for (const q of queue) {
      if (q.id) {
        await setDoc(doc(db, 'queue', String(q.id)), JSON.parse(JSON.stringify(q)), { merge: true });
        count++;
      }
    }

    // 4. Sync prescriptions
    const prescriptions = this.getPrescriptions();
    for (const rx of prescriptions) {
      if (rx.id) {
        await setDoc(doc(db, 'prescriptions', String(rx.id)), JSON.parse(JSON.stringify(rx)), { merge: true });
        count++;
      }
    }

    // 5. Sync diagnostic tests
    const tests = this.getTests();
    for (const t of tests) {
      if (t.id) {
        await setDoc(doc(db, 'tests', String(t.id)), JSON.parse(JSON.stringify(t)), { merge: true });
        count++;
      }
    }

    // 6. Sync medicine presets
    const presets = this.getMedicinePresets();
    for (const m of presets) {
      if (m.id) {
        await setDoc(doc(db, 'medicine_presets', String(m.id)), JSON.parse(JSON.stringify(m)), { merge: true });
        count++;
      }
    }

    // 7. Sync clinic settings
    const clinic = this.getClinicSettings();
    await setDoc(doc(db, 'clinic_settings', 'general'), JSON.parse(JSON.stringify(clinic)), { merge: true });
    count++;

    // 8. Sync audit trail
    const auditLogs = this.getAuditLogs();
    for (const log of auditLogs.slice(0, 50)) {
      if (log.id) {
        await setDoc(doc(db, 'audit_trail', String(log.id)), JSON.parse(JSON.stringify(log)), { merge: true });
        count++;
      }
    }

    // 9. Sync whatsapp logs
    const waLogs = this.getWhatsAppLogs();
    for (const wa of waLogs.slice(0, 50)) {
      if (wa.id) {
        await setDoc(doc(db, 'whatsapp_logs', String(wa.id)), JSON.parse(JSON.stringify(wa)), { merge: true });
        count++;
      }
    }

    this.addAuditLog('Admin', `Synced ${count} clinical records to Cloud Firestore.`);
    return { success: true, count };
  },

  // Pull all collections from Cloud Firestore into local cache
  async fetchFromFirebase() {
    const db = getDb();
    if (!db || !isFirebaseConnected()) {
      throw new Error('Firebase is not connected.');
    }

    // Pull authorized users
    await authService.fetchAuthorizedUsersFromFirestore();

    // Pull patients
    const ptSnap = await getDocs(collection(db, 'patients'));
    if (!ptSnap.empty) {
      const pts = ptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(pts));
    }

    // Pull queue
    const qSnap = await getDocs(collection(db, 'queue'));
    if (!qSnap.empty) {
      const q = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(q));
    }

    // Pull prescriptions
    const rxSnap = await getDocs(collection(db, 'prescriptions'));
    if (!rxSnap.empty) {
      const rx = rxSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(rx));
    }

    // Pull tests
    const testSnap = await getDocs(collection(db, 'tests'));
    if (!testSnap.empty) {
      const tests = testSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
    }

    // Pull presets
    const medSnap = await getDocs(collection(db, 'medicine_presets'));
    if (!medSnap.empty) {
      const presets = medSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem(STORAGE_KEYS.MEDICINE_PRESETS, JSON.stringify(presets));
    }

    // Pull clinic settings
    const clinicDoc = await getDoc(doc(db, 'clinic_settings', 'general'));
    if (clinicDoc.exists()) {
      localStorage.setItem(STORAGE_KEYS.CLINIC_SETTINGS, JSON.stringify(clinicDoc.data()));
    }

    // Pull audit trail
    const auditSnap = await getDocs(collection(db, 'audit_trail'));
    if (!auditSnap.empty) {
      const audit = auditSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(audit));
    }

    // Pull whatsapp logs
    const waSnap = await getDocs(collection(db, 'whatsapp_logs'));
    if (!waSnap.empty) {
      const wa = waSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(wa));
    }

    notifySubscribers('all', null);
    return { success: true };
  },

  // Initialize real-time Cloud Firestore listeners
  initFirestoreListeners() {
    this.stopFirestoreListeners();

    const db = getDb();
    if (!db || !isFirebaseConnected()) return;

    const collectionsToSync = [
      { name: 'patients', key: STORAGE_KEYS.PATIENTS, initialSeed: INITIAL_PATIENTS },
      { name: 'queue', key: STORAGE_KEYS.QUEUE, initialSeed: INITIAL_QUEUE },
      { name: 'prescriptions', key: STORAGE_KEYS.PRESCRIPTIONS, initialSeed: [] },
      { name: 'tests', key: STORAGE_KEYS.TESTS, initialSeed: [] },
      { name: 'medicine_presets', key: STORAGE_KEYS.MEDICINE_PRESETS, initialSeed: INITIAL_MEDICINE_PRESETS },
      { name: 'audit_trail', key: STORAGE_KEYS.AUDIT_LOGS, initialSeed: [] },
      { name: 'whatsapp_logs', key: STORAGE_KEYS.WHATSAPP_LOGS, initialSeed: [] }
    ];

    const hasReceivedInitialSnapshot = {};

    collectionsToSync.forEach(({ name, key, initialSeed }) => {
      try {
        hasReceivedInitialSnapshot[name] = false;
        const unsub = onSnapshot(collection(db, name), async (snapshot) => {
          if (!hasReceivedInitialSnapshot[name]) {
            hasReceivedInitialSnapshot[name] = true;
            // On first snapshot from Firestore:
            if (snapshot.empty) {
              // Brand new Firestore collection: auto-seed with local/initial data
              let localData = [];
              try {
                const stored = localStorage.getItem(key);
                if (stored) localData = JSON.parse(stored);
              } catch {}
              if (!localData || localData.length === 0) {
                localData = initialSeed || [];
              }
              if (Array.isArray(localData) && localData.length > 0) {
                for (const item of localData) {
                  const itemId = item.id || `doc-${Date.now()}`;
                  try {
                    await setDoc(doc(db, name, String(itemId)), JSON.parse(JSON.stringify(item)), { merge: true });
                  } catch {}
                }
                return;
              }
            }
          }

          // Normal sync (first snapshot with data or subsequent snapshots)
          const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          localStorage.setItem(key, JSON.stringify(items));
          notifySubscribers(name, items);
        }, (err) => {
          console.warn(`Firestore real-time listener warning (${name}):`, err);
        });
        activeFirestoreUnsubscribers.push(unsub);
      } catch (e) {
        console.warn(`Could not attach Firestore listener for ${name}:`, e);
      }
    });

    // Clinic settings listener
    try {
      const unsubClinic = onSnapshot(doc(db, 'clinic_settings', 'general'), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          localStorage.setItem(STORAGE_KEYS.CLINIC_SETTINGS, JSON.stringify(data));
          notifySubscribers('clinic_settings', data);
        } else {
          // If Firestore clinic_settings doc doesn't exist, auto-seed with local settings
          const currentSettings = storageService.getClinicSettings();
          try {
            await setDoc(doc(db, 'clinic_settings', 'general'), JSON.parse(JSON.stringify(currentSettings)), { merge: true });
          } catch {}
        }
      }, (err) => console.warn('Clinic settings listener warning:', err));
      activeFirestoreUnsubscribers.push(unsubClinic);
    } catch (e) {}
  },

  stopFirestoreListeners() {
    activeFirestoreUnsubscribers.forEach(unsub => {
      try { unsub(); } catch {}
    });
    activeFirestoreUnsubscribers = [];
  }
};

// Wire automatic Firestore sync when Firebase connects/disconnects in browser
if (typeof window !== 'undefined') {
  onFirebaseStatusChange(({ isConnected }) => {
    if (isConnected) {
      storageService.initFirestoreListeners();
      authService.initFirestoreAuthSync();
    } else {
      storageService.stopFirestoreListeners();
      authService.stopFirestoreAuthSync();
    }
  });
}

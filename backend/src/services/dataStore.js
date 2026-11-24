/**
 * In-Memory Data Store for ClinicalOS
 * Provides full REST persistence for Patients, Queue, Prescriptions, Tests, Medicines, Settings, and Logs.
 */

import { AUTHORIZED_USERS, WHITELIST_EMAILS, DEFAULT_CLINIC_SETTINGS, DEFAULT_AISENSY_SETTINGS } from '../config/constants.js';

class DataStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.authorizedUsers = [...AUTHORIZED_USERS];
    this.clinicSettings = { ...DEFAULT_CLINIC_SETTINGS };
    this.aisensySettings = { ...DEFAULT_AISENSY_SETTINGS };
    this.whatsappLogs = [];
    this.auditLogs = [];

    this.medicines = [
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
        id: 'med-2',
        name: 'Nux Vomica',
        potency: '30C',
        potencies: ['6C', '30C', '200C', '1M'],
        category: 'Digestive / Constitutional',
        dosage: '4 globules or 5 drops in water',
        frequency: 'BD (Twice daily)',
        duration: '7 days',
        instructions: 'Take 1 dose at bedtime and 1 early morning'
      },
      {
        id: 'med-3',
        name: 'Bryonia Alba',
        potency: '30C',
        potencies: ['30C', '200C'],
        category: 'Acute / Respiratory',
        dosage: '4 globules',
        frequency: 'TDS (3 times daily)',
        duration: '5 days',
        instructions: 'Take with warm water'
      },
      {
        id: 'med-4',
        name: 'Rhus Toxicodendron',
        potency: '200C',
        potencies: ['30C', '200C', '1M'],
        category: 'Musculoskeletal',
        dosage: '4 globules',
        frequency: 'BD (Twice daily)',
        duration: '10 days',
        instructions: 'Continue gentle movement'
      },
      {
        id: 'med-5',
        name: 'Lycopodium Clavatum',
        potency: '200C',
        potencies: ['30C', '200C', '1M'],
        category: 'Deep Constitutional',
        dosage: '4 globules',
        frequency: 'OD (Once daily)',
        duration: '14 days',
        instructions: 'Take 1 dose at 4 PM on empty stomach'
      }
    ];

    this.patients = [
      {
        id: 'P-1001',
        name: 'Sunita Sharma',
        age: 42,
        gender: 'Female',
        phone: '+91 98711 22334',
        email: 'sunita.sharma@example.com',
        address: 'C-4/12, Malviya Nagar, New Delhi',
        chiefComplaint: 'Chronic migraine headaches, throbbing pain right side, worse from sun and noise',
        symptoms: {
          location: 'Right temporal and frontal region radiating to occiput',
          sensation: 'Throbbing, hammering pain with sensation of head bursting',
          modalitiesWorse: 'Bright light, noise, sun heat, mental exertion',
          modalitiesBetter: 'Dark quiet room, hard pressure, cold compress',
          concomitants: 'Nausea, visual aura, extreme irritability',
          mentals: 'Fastidious, anxious about health and work deadlines'
        },
        constitutionalNotes: 'Chilly, craves warm food, thirsty for small sips',
        allergies: 'Penicillin, dust mites',
        consentWhatsApp: true,
        registeredAt: '2025-01-10T09:30:00.000Z',
        lastVisitAt: '2025-01-10T10:15:00.000Z',
        visitCount: 1
      },
      {
        id: 'P-1002',
        name: 'Rajesh Verma',
        age: 38,
        gender: 'Male',
        phone: '+91 98102 33445',
        email: 'rajesh.v@example.com',
        address: 'B-210, Sector 15, Noida',
        chiefComplaint: 'Severe lumbar spine stiffness and knee joint pain, aggravated after morning wake-up',
        symptoms: {
          location: 'Lumbar region, bilateral knees',
          sensation: 'Stiffness, bruised aching pain',
          modalitiesWorse: 'First movement after rest, damp rainy weather, cold drafts',
          modalitiesBetter: 'Continued gentle walking, warm fomentation',
          concomitants: 'Restlessness in bed at night, needs to shift position',
          mentals: 'Impatient, restless, anxious'
        },
        constitutionalNotes: 'Chilly patient, aggravated in monsoon',
        allergies: 'None',
        consentWhatsApp: true,
        registeredAt: '2025-01-12T11:00:00.000Z',
        lastVisitAt: '2025-01-12T11:45:00.000Z',
        visitCount: 1
      }
    ];

    this.queue = [
      {
        id: 'Q-01',
        tokenNumber: 1,
        patientId: 'P-1001',
        patientName: 'Sunita Sharma',
        phone: '+91 98711 22334',
        age: 42,
        gender: 'Female',
        chiefComplaint: 'Migraine with throbbing right sided headache',
        status: 'waiting', // waiting | in-consultation | completed | cancelled
        priority: 'normal',
        registeredAt: new Date(Date.now() - 35 * 60000).toISOString(),
        waitingDurationMinutes: 35
      },
      {
        id: 'Q-02',
        tokenNumber: 2,
        patientId: 'P-1002',
        patientName: 'Rajesh Verma',
        phone: '+91 98102 33445',
        age: 38,
        gender: 'Male',
        chiefComplaint: 'Lumbar stiffness and knee pain worse on rest',
        status: 'waiting',
        priority: 'normal',
        registeredAt: new Date(Date.now() - 15 * 60000).toISOString(),
        waitingDurationMinutes: 15
      }
    ];

    this.prescriptions = [
      {
        id: 'RX-2025-001',
        patientId: 'P-1001',
        patientName: 'Sunita Sharma',
        doctorName: 'Dr. V. P. Dixit',
        doctorRegNo: 'BHMS-REG-84729',
        date: '2025-01-10T10:15:00.000Z',
        diagnosis: 'Right-sided Hemicrania (Migraine)',
        totalitySummary: 'Right temporal throbbing pain, worse noise/sun, better dark pressure. Chilly, fastidious.',
        repertoryRemedySelected: 'Belladonna',
        medicines: [
          {
            remedy: 'Belladonna',
            potency: '200C',
            dosage: '4 globules',
            frequency: 'TDS (3 times daily)',
            duration: '3 days',
            instructions: 'Take during acute attacks every 3 hours if needed'
          },
          {
            remedy: 'Natrum Muriaticum',
            potency: '1M',
            dosage: '4 globules',
            frequency: 'OD (Once weekly)',
            duration: '4 weeks',
            instructions: 'Constitutional dose on Sunday morning empty stomach'
          }
        ],
        dietaryRegimen: 'Avoid direct bright sunlight without sunglasses. Reduce aged cheese and caffeine. Stay hydrated.',
        followUpDate: '2025-01-25',
        sentViaWhatsApp: true,
        whatsappSentAt: '2025-01-10T10:20:00.000Z'
      }
    ];

    this.tests = [
      {
        id: 'TEST-101',
        patientId: 'P-1001',
        patientName: 'Sunita Sharma',
        testName: 'Complete Blood Count (CBC) & Serum Ferritin',
        status: 'completed', // pending | sample-collected | completed
        orderedDate: '2025-01-10',
        reportDate: '2025-01-11',
        labName: 'Dr. Lal PathLabs',
        summaryFindings: 'Hemoglobin 12.8 g/dL (Normal), Ferritin 45 ng/mL (Normal). No evidence of anemia.',
        isNormal: true,
        notes: 'Rule out iron deficiency as a headache trigger'
      }
    ];
  }

  // --- Auth & Whitelist ---
  isAuthorized(email) {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return WHITELIST_EMAILS.includes(clean);
  }

  getAuthorizedUser(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return this.authorizedUsers.find(u => u.email.toLowerCase() === clean) || null;
  }

  // --- Patients ---
  getPatients() {
    return this.patients;
  }

  getPatient(id) {
    return this.patients.find(p => p.id === id) || null;
  }

  createPatient(data) {
    const id = data.id || `P-${1000 + this.patients.length + 1}`;
    const newPatient = {
      ...data,
      id,
      consentWhatsApp: data.consentWhatsApp !== false,
      registeredAt: data.registeredAt || new Date().toISOString(),
      visitCount: data.visitCount || 1
    };
    this.patients.unshift(newPatient);
    return newPatient;
  }

  updatePatient(id, data) {
    const idx = this.patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.patients[idx] = { ...this.patients[idx], ...data };
    return this.patients[idx];
  }

  deletePatient(id) {
    const idx = this.patients.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.patients.splice(idx, 1);
    return true;
  }

  // --- Queue ---
  getQueue() {
    return this.queue;
  }

  addToQueue(data) {
    const nextToken = this.queue.reduce((max, q) => Math.max(max, q.tokenNumber || 0), 0) + 1;
    const id = data.id || `Q-${String(nextToken).padStart(2, '0')}`;
    const item = {
      ...data,
      id,
      tokenNumber: nextToken,
      status: data.status || 'waiting',
      priority: data.priority || 'normal',
      registeredAt: data.registeredAt || new Date().toISOString()
    };
    this.queue.push(item);
    return item;
  }

  updateQueueItem(id, data) {
    const idx = this.queue.findIndex(q => q.id === id);
    if (idx === -1) return null;
    this.queue[idx] = { ...this.queue[idx], ...data };
    return this.queue[idx];
  }

  updateQueueStatus(id, status) {
    return this.updateQueueItem(id, { status, updatedAt: new Date().toISOString() });
  }

  removeFromQueue(id) {
    const idx = this.queue.findIndex(q => q.id === id);
    if (idx === -1) return false;
    this.queue.splice(idx, 1);
    return true;
  }

  // --- Prescriptions ---
  getPrescriptions() {
    return this.prescriptions;
  }

  getPrescription(id) {
    return this.prescriptions.find(p => p.id === id) || null;
  }

  savePrescription(data) {
    const id = data.id || `RX-${new Date().getFullYear()}-${String(this.prescriptions.length + 1).padStart(3, '0')}`;
    const newRx = {
      ...data,
      id,
      date: data.date || new Date().toISOString()
    };
    
    // Check if prescription already exists to update or push
    const existingIdx = this.prescriptions.findIndex(p => p.id === id);
    if (existingIdx !== -1) {
      this.prescriptions[existingIdx] = newRx;
    } else {
      this.prescriptions.unshift(newRx);
    }

    // If patient is in queue, auto-update queue status to completed
    if (data.patientId) {
      const qItem = this.queue.find(q => q.patientId === data.patientId && q.status !== 'completed');
      if (qItem) {
        qItem.status = 'completed';
        qItem.completedAt = new Date().toISOString();
      }
    }

    return newRx;
  }

  updatePrescription(id, data) {
    const idx = this.prescriptions.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.prescriptions[idx] = { ...this.prescriptions[idx], ...data };
    return this.prescriptions[idx];
  }

  // --- Tests ---
  getTests() {
    return this.tests;
  }

  createTest(data) {
    const id = data.id || `TEST-${100 + this.tests.length + 1}`;
    const newTest = {
      ...data,
      id,
      status: data.status || 'pending',
      orderedDate: data.orderedDate || new Date().toISOString().split('T')[0]
    };
    this.tests.unshift(newTest);
    return newTest;
  }

  updateTest(id, data) {
    const idx = this.tests.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.tests[idx] = { ...this.tests[idx], ...data };
    return this.tests[idx];
  }

  deleteTest(id) {
    const idx = this.tests.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.tests.splice(idx, 1);
    return true;
  }

  // --- Medicines ---
  getMedicines() {
    return this.medicines;
  }

  createMedicine(data) {
    const id = data.id || `med-${this.medicines.length + 1}`;
    const newMed = { ...data, id };
    this.medicines.push(newMed);
    return newMed;
  }

  updateMedicine(id, data) {
    const idx = this.medicines.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.medicines[idx] = { ...this.medicines[idx], ...data };
    return this.medicines[idx];
  }

  deleteMedicine(id) {
    const idx = this.medicines.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.medicines.splice(idx, 1);
    return true;
  }

  // --- Settings ---
  getClinicSettings() {
    return this.clinicSettings;
  }

  updateClinicSettings(settings) {
    this.clinicSettings = { ...this.clinicSettings, ...settings };
    return this.clinicSettings;
  }

  getAisensySettings() {
    return this.aisensySettings;
  }

  updateAisensySettings(settings) {
    this.aisensySettings = { ...this.aisensySettings, ...settings };
    return this.aisensySettings;
  }

  // --- WhatsApp & Audit Logs ---
  getWhatsAppLogs() {
    return this.whatsappLogs;
  }

  addWhatsAppLog(log) {
    const entry = {
      ...log,
      id: `WA-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.whatsappLogs.unshift(entry);
    return entry;
  }
}

export const dataStore = new DataStore();

/**
 * Comprehensive Automated Test Suite for VEAYOS Homoeopathy ClinicalOS Backend
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { dataStore } from '../src/services/dataStore.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('VEAYOS Backend API Verification Suite', () => {
  
  // 1. Health Checks
  describe('1. System Health & Metadata', () => {
    it('GET /api/health should return status healthy and metadata', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'healthy');
      assert.equal(data.whitelistEnforced, true);
      assert.deepEqual(data.whitelistedPractitioners, ['vpdixit75@gmail.com', 'ved@veayos.com']);
    });

    it('GET /api/v1/health should match version 1 specification', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.service, 'VEAYOS Homoeopathy ClinicalOS API');
    });

    it('OPTIONS /api/health should return valid CORS headers for allowed origins', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET'
        }
      });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    });
  });

  // 2. Strict Whitelist Authentication & Google Sign-In
  describe('2. Strict 2-Account Whitelist & Google Sign-In', () => {
    let dixitToken = '';

    it('GET /api/v1/auth/whitelist should list only 2 approved practitioners', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/whitelist`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.count, 2);
      const emails = data.users.map(u => u.email);
      assert(emails.includes('vpdixit75@gmail.com'));
      assert(emails.includes('ved@veayos.com'));
    });

    it('POST /api/v1/auth/login should allow Dr. V. P. Dixit (vpdixit75@gmail.com)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vpdixit75@gmail.com', role: 'doctor' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.email, 'vpdixit75@gmail.com');
      assert(data.token && typeof data.token === 'string');
      dixitToken = data.token;
    });

    it('POST /api/v1/auth/login should allow Dr. Ved Prakash (ved@veayos.com)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ved@veayos.com', role: 'admin' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.email, 'ved@veayos.com');
      assert.equal(data.user.currentRole, 'admin');
    });

    it('POST /api/v1/auth/login should STRICTLY REJECT unauthorized accounts with 403', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'hacker@clinic.com' })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert(data.error.includes('Access Denied'));
    });

    it('POST /api/v1/auth/google should authenticate valid whitelisted Google account', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vpdixit75@gmail.com' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.email, 'vpdixit75@gmail.com');
      assert.equal(data.user.authProvider, 'google');
      assert(data.token);
    });

    it('POST /api/v1/auth/google should REJECT non-whitelisted Google account with 403', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'random.google.user@gmail.com' })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert(data.error.includes('Access Denied'));
    });

    it('POST /api/v1/auth/verify should validate valid JWT token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dixitToken}`
        }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, true);
      assert.equal(data.user.email, 'vpdixit75@gmail.com');
    });

    it('GET /api/v1/auth/me should return authenticated doctor profile', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${dixitToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.user.name, 'Dr. V. P. Dixit');
    });
  });

  // 3. Gemini AI & Kentian Repertory Proxy
  describe('3. Repertory Proxy & Classical Homoeopathy Engine', () => {
    it('POST /api/v1/repertory/analyze should return ranked remedies and totality analysis', async () => {
      const payload = {
        location: 'Right knee and lumbar spine',
        sensation: 'Severe stiffness and bruised pain',
        modalitiesWorse: 'First movement after rest, cold damp weather',
        modalitiesBetter: 'Continued gentle movement, warm heat',
        concomitants: 'Restlessness in bed at night',
        mentals: 'Restless, irritable',
        patientAge: '45',
        patientGender: 'Male'
      };

      const res = await fetch(`${baseUrl}/api/v1/repertory/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert(data.data.totalityAnalysis);
      assert(Array.isArray(data.data.remedies));
      assert(data.data.remedies.length > 0);

      // Verify top candidate is Rhus Toxicodendron due to keynote modalities
      const topRemedy = data.data.remedies[0];
      assert.equal(topRemedy.remedy, 'Rhus Toxicodendron');
      assert(topRemedy.repertoryScore >= 10);
      assert(topRemedy.dosage);
      assert(topRemedy.instructions);
    });
  });

  // 4. Clinical Endpoints: Patients
  describe('4. Patients REST Endpoints', () => {
    let createdPatientId;

    it('GET /api/v1/patients should return list of patients', async () => {
      const res = await fetch(`${baseUrl}/api/v1/patients`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert(data.count >= 2);
    });

    it('POST /api/v1/patients should register a new patient', async () => {
      const newPatient = {
        name: 'Amit Patel',
        age: 29,
        gender: 'Male',
        phone: '+91 98991 22334',
        chiefComplaint: 'Gastric bloating, heartburn after spicy food'
      };

      const res = await fetch(`${baseUrl}/api/v1/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.patient.name, 'Amit Patel');
      createdPatientId = data.patient.id;
    });

    it('PUT /api/v1/patients/:id should update patient records', async () => {
      const res = await fetch(`${baseUrl}/api/v1/patients/${createdPatientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ constitutionalNotes: 'Thirsty, chilly' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.patient.constitutionalNotes, 'Thirsty, chilly');
    });
  });

  // 5. Clinical Endpoints: Live Queue
  describe('5. Live Queue Management', () => {
    let queueItemId;

    it('GET /api/v1/queue should list waiting patients with waitingCount', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert(typeof data.waitingCount === 'number');
    });

    it('POST /api/v1/queue should append a patient to queue with auto-token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Kavita Roy',
          phone: '+91 98110 55443',
          chiefComplaint: 'Chronic eczema, intense itching'
        })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert(data.item.tokenNumber > 0);
      queueItemId = data.item.id;
    });

    it('POST /api/v1/queue/:id/status should update queue status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/${queueItemId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-consultation' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.item.status, 'in-consultation');
    });
  });

  // 6. Clinical Endpoints: Prescriptions
  describe('6. Prescriptions Lifecycle', () => {
    it('POST /api/v1/prescriptions should save prescription and auto-resolve queue item', async () => {
      const rxData = {
        patientId: 'P-1002',
        patientName: 'Rajesh Verma',
        doctorName: 'Dr. V. P. Dixit',
        diagnosis: 'Lumbar Spondylosis & Gonarthritis',
        medicines: [
          {
            remedy: 'Rhus Toxicodendron',
            potency: '200C',
            dosage: '4 globules',
            frequency: 'BD',
            duration: '10 days'
          }
        ]
      };

      const res = await fetch(`${baseUrl}/api/v1/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rxData)
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.prescription.patientName, 'Rajesh Verma');

      // Verify patient Q-02 was marked completed
      const qRes = await fetch(`${baseUrl}/api/v1/queue`);
      const qData = await qRes.json();
      const p2Queue = qData.queue.find(q => q.patientId === 'P-1002');
      assert.equal(p2Queue.status, 'completed');
    });
  });

  // 7. Clinical Endpoints: Tests & Medicines
  describe('7. Tests & Medicine Presets', () => {
    it('GET /api/v1/tests should return diagnostic tests', async () => {
      const res = await fetch(`${baseUrl}/api/v1/tests`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert(data.tests.length > 0);
    });

    it('GET /api/v1/medicines should search medicines by keyword', async () => {
      const res = await fetch(`${baseUrl}/api/v1/medicines?search=Arnica`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.medicines[0].name, 'Arnica Montana');
    });
  });

  // 8. Settings & WhatsApp Gateway
  describe('8. Settings & Aisensy WhatsApp Gateway', () => {
    it('GET /api/v1/settings should return clinic & aisensy config', async () => {
      const res = await fetch(`${baseUrl}/api/v1/settings`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.clinic.doctorName, 'Dr. V. P. Dixit');
      assert(data.clinic.clinicName.includes('VEAYOS'));
    });

    it('POST /api/v1/whatsapp/test should validate Aisensy API key length', async () => {
      const res = await fetch(`${baseUrl}/api/v1/whatsapp/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'ai_prod_key_9988776655' })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('POST /api/v1/whatsapp/send should dispatch and log message', async () => {
      const payload = {
        patient: {
          id: 'P-1001',
          name: 'Sunita Sharma',
          phone: '+919871122334',
          consentWhatsApp: true
        },
        prescription: {
          id: 'RX-2025-001',
          doctorName: 'Dr. V. P. Dixit',
          medicines: [{ remedy: 'Belladonna', dosage: '4 globules', frequency: 'TDS' }]
        }
      };

      const res = await fetch(`${baseUrl}/api/v1/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.log.gateway, 'Aisensy');

      // Verify log was recorded
      const logRes = await fetch(`${baseUrl}/api/v1/whatsapp/logs`);
      const logData = await logRes.json();
      assert(logData.logs.length > 0);
    });

    it('POST /api/v1/whatsapp/send should REJECT when patient opted out of WhatsApp', async () => {
      const payload = {
        patient: {
          id: 'P-1099',
          name: 'No WhatsApp Patient',
          phone: '+919999988888',
          consentWhatsApp: false
        }
      };

      const res = await fetch(`${baseUrl}/api/v1/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert(data.error.includes('opted out'));
    });
  });

});

/**
 * Prescriptions REST API Routes
 */

import { Router } from 'express';
import { dataStore } from '../services/dataStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

// GET /api/v1/prescriptions
router.get('/', (req, res) => {
  const { patientId } = req.query;
  let list = dataStore.getPrescriptions();
  if (patientId) {
    list = list.filter(rx => rx.patientId === patientId);
  }
  res.json({ success: true, count: list.length, prescriptions: list });
});

// GET /api/v1/prescriptions/:id
router.get('/:id', (req, res) => {
  const rx = dataStore.getPrescription(req.params.id);
  if (!rx) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  res.json({ success: true, prescription: rx });
});

// POST /api/v1/prescriptions
router.post('/', (req, res) => {
  const { patientName, medicines } = req.body;
  if (!patientName) {
    return res.status(400).json({ success: false, error: 'Patient name is required.' });
  }
  const prescription = dataStore.savePrescription(req.body);
  res.status(201).json({ success: true, prescription });
});

// PUT /api/v1/prescriptions/:id
router.put('/:id', (req, res) => {
  const updated = dataStore.updatePrescription(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Prescription not found' });
  }
  res.json({ success: true, prescription: updated });
});

export default router;

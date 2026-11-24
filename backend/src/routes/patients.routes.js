/**
 * Patients Clinical REST API Routes
 */

import { Router } from 'express';
import { dataStore } from '../services/dataStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

// GET /api/v1/patients
router.get('/', (req, res) => {
  const { search } = req.query;
  let list = dataStore.getPatients();
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.phone && p.phone.includes(q)) || 
      (p.id && p.id.toLowerCase().includes(q))
    );
  }
  res.json({ success: true, count: list.length, patients: list });
});

// GET /api/v1/patients/:id
router.get('/:id', (req, res) => {
  const patient = dataStore.getPatient(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, patient });
});

// POST /api/v1/patients
router.post('/', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required.' });
  }
  const patient = dataStore.createPatient(req.body);
  res.status(201).json({ success: true, patient });
});

// PUT /api/v1/patients/:id
router.put('/:id', (req, res) => {
  const updated = dataStore.updatePatient(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, patient: updated });
});

// DELETE /api/v1/patients/:id
router.delete('/:id', (req, res) => {
  const deleted = dataStore.deletePatient(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, message: 'Patient deleted successfully' });
});

export default router;

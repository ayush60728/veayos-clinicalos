/**
 * Lab & Diagnostic Tests REST API Routes
 */

import { Router } from 'express';
import { dataStore } from '../services/dataStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

// GET /api/v1/tests
router.get('/', (req, res) => {
  const { patientId } = req.query;
  let list = dataStore.getTests();
  if (patientId) {
    list = list.filter(t => t.patientId === patientId);
  }
  res.json({ success: true, count: list.length, tests: list });
});

// POST /api/v1/tests
router.post('/', (req, res) => {
  const { testName, patientName } = req.body;
  if (!testName || !patientName) {
    return res.status(400).json({ success: false, error: 'testName and patientName are required.' });
  }
  const test = dataStore.createTest(req.body);
  res.status(201).json({ success: true, test });
});

// PUT /api/v1/tests/:id
router.put('/:id', (req, res) => {
  const updated = dataStore.updateTest(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Test record not found' });
  }
  res.json({ success: true, test: updated });
});

// DELETE /api/v1/tests/:id
router.delete('/:id', (req, res) => {
  const deleted = dataStore.deleteTest(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Test record not found' });
  }
  res.json({ success: true, message: 'Test record deleted' });
});

export default router;

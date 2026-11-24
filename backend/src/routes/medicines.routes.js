/**
 * Homoeopathy Medicines Library & Presets REST API Routes
 */

import { Router } from 'express';
import { dataStore } from '../services/dataStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

// GET /api/v1/medicines
router.get('/', (req, res) => {
  const { search } = req.query;
  let list = dataStore.getMedicines();
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(m => m.name.toLowerCase().includes(q) || (m.category && m.category.toLowerCase().includes(q)));
  }
  res.json({ success: true, count: list.length, medicines: list });
});

// POST /api/v1/medicines
router.post('/', (req, res) => {
  const { name, potency } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Medicine name is required.' });
  }
  const medicine = dataStore.createMedicine(req.body);
  res.status(201).json({ success: true, medicine });
});

// PUT /api/v1/medicines/:id
router.put('/:id', (req, res) => {
  const updated = dataStore.updateMedicine(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Medicine not found' });
  }
  res.json({ success: true, medicine: updated });
});

// DELETE /api/v1/medicines/:id
router.delete('/:id', (req, res) => {
  const deleted = dataStore.deleteMedicine(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Medicine not found' });
  }
  res.json({ success: true, message: 'Medicine deleted successfully' });
});

export default router;

/**
 * Live Queue REST API Routes
 */

import { Router } from 'express';
import { dataStore } from '../services/dataStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

// GET /api/v1/queue
router.get('/', (req, res) => {
  const { status } = req.query;
  let queue = dataStore.getQueue();
  if (status) {
    queue = queue.filter(q => q.status === status);
  }
  const waitingCount = queue.filter(q => q.status === 'waiting').length;
  res.json({
    success: true,
    count: queue.length,
    waitingCount,
    queue
  });
});

// POST /api/v1/queue
router.post('/', (req, res) => {
  const { patientName, phone } = req.body;
  if (!patientName || !phone) {
    return res.status(400).json({ success: false, error: 'Patient name and phone are required.' });
  }
  const item = dataStore.addToQueue(req.body);
  res.status(201).json({ success: true, item });
});

// PUT /api/v1/queue/:id
router.put('/:id', (req, res) => {
  const updated = dataStore.updateQueueItem(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Queue item not found' });
  }
  res.json({ success: true, item: updated });
});

// POST /api/v1/queue/:id/status
router.post('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required.' });
  }
  const updated = dataStore.updateQueueStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Queue item not found' });
  }
  res.json({ success: true, item: updated });
});

// DELETE /api/v1/queue/:id
router.delete('/:id', (req, res) => {
  const removed = dataStore.removeFromQueue(req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Queue item not found' });
  }
  res.json({ success: true, message: 'Queue item removed' });
});

export default router;

/**
 * Clinic & Aisensy Settings REST API Routes
 */

import { Router } from 'express';
import { dataStore } from '../services/dataStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

// GET /api/v1/settings
router.get('/', (req, res) => {
  res.json({
    success: true,
    clinic: dataStore.getClinicSettings(),
    aisensy: {
      ...dataStore.getAisensySettings(),
      apiKeyConfigured: Boolean(dataStore.getAisensySettings().apiKey || process.env.AISENSY_API_KEY)
    }
  });
});

// PUT /api/v1/settings/clinic
router.put('/clinic', (req, res) => {
  const updated = dataStore.updateClinicSettings(req.body);
  res.json({ success: true, clinic: updated });
});

// PUT /api/v1/settings/aisensy
router.put('/aisensy', (req, res) => {
  const updated = dataStore.updateAisensySettings(req.body);
  res.json({
    success: true,
    aisensy: {
      ...updated,
      apiKeyConfigured: Boolean(updated.apiKey || process.env.AISENSY_API_KEY)
    }
  });
});

export default router;

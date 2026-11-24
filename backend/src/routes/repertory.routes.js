/**
 * Gemini AI Repertory Proxy Routes
 * Endpoint: POST /api/v1/repertory/analyze
 * Protects Gemini API keys on server side and handles classical Kentian analysis.
 */

import { Router } from 'express';
import { analyzeSymptomsWithGeminiOrFallback } from '../services/repertoryService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/analyze', optionalAuth, async (req, res) => {
  try {
    const {
      location = '',
      sensation = '',
      modalitiesWorse = '',
      modalitiesBetter = '',
      concomitants = '',
      mentals = '',
      freeNotes = '',
      patientAge = '',
      patientGender = '',
      model
    } = req.body;

    const customKey = req.headers['x-gemini-key'] || req.body.apiKey || null;

    const result = await analyzeSymptomsWithGeminiOrFallback({
      location,
      sensation,
      modalitiesWorse,
      modalitiesBetter,
      concomitants,
      mentals,
      freeNotes,
      patientAge,
      patientGender,
      customApiKey: customKey,
      model: model || 'gemini-1.5-flash'
    });

    return res.status(200).json({
      success: true,
      source: result.source,
      data: result.data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Repertorization error: ${err.message}`
    });
  }
});

export default router;

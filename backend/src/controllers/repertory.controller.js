/**
 * Gemini AI Repertory Analysis Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { analyzeSymptomsWithGeminiOrFallback } from '../services/repertoryService.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const repertoryController = {
  /**
   * POST /api/v1/repertory/analyze
   * Analyzes symptom totality using Gemini AI or classical Kentian fallback engine
   */
  async analyze(req, res) {
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

      logger.info('Performing repertory symptom totality analysis...');

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

      return apiResponse.success(res, {
        source: result.source,
        data: result.data
      }, 'Repertorization totality analysis complete');
    } catch (err) {
      logger.error('Repertorization error:', err);
      return apiResponse.error(res, `Repertorization error: ${err.message}`, 500);
    }
  }
};

export default repertoryController;

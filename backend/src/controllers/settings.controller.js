/**
 * Clinic & Integration Settings Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const settingsController = {
  /**
   * GET /api/v1/settings
   * Retrieve clinic details and gateway configuration status
   */
  getSettings(req, res) {
    return apiResponse.success(res, {
      clinic: dataStore.getClinicSettings(),
      aisensy: {
        ...dataStore.getAisensySettings(),
        apiKeyConfigured: Boolean(dataStore.getAisensySettings().apiKey || process.env.AISENSY_API_KEY)
      }
    });
  },

  /**
   * PUT /api/v1/settings/clinic
   * Update clinic branding, doctor info, address, and prescription disclaimer
   */
  updateClinic(req, res) {
    const updated = dataStore.updateClinicSettings(req.body);
    logger.info('Clinic settings updated');
    return apiResponse.success(res, { clinic: updated }, 'Clinic settings updated successfully');
  },

  /**
   * PUT /api/v1/settings/aisensy
   * Update Aisensy WhatsApp gateway campaign settings
   */
  updateAisensy(req, res) {
    const updated = dataStore.updateAisensySettings(req.body);
    logger.info('Aisensy WhatsApp settings updated');
    return apiResponse.success(res, {
      aisensy: {
        ...updated,
        apiKeyConfigured: Boolean(updated.apiKey || process.env.AISENSY_API_KEY)
      }
    }, 'Aisensy settings updated successfully');
  }
};

export default settingsController;

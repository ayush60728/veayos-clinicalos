/**
 * Prescriptions Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const prescriptionsController = {
  /**
   * GET /api/v1/prescriptions
   * List prescriptions with optional patientId filter
   */
  getAll(req, res) {
    const { patientId } = req.query;
    let list = dataStore.getPrescriptions();

    if (patientId) {
      list = list.filter(rx => rx.patientId === patientId);
    }

    return apiResponse.success(res, {
      count: list.length,
      prescriptions: list
    });
  },

  /**
   * GET /api/v1/prescriptions/:id
   * Retrieve single prescription
   */
  getById(req, res) {
    const rx = dataStore.getPrescription(req.params.id);
    if (!rx) {
      return apiResponse.error(res, 'Prescription not found', 404);
    }
    return apiResponse.success(res, { prescription: rx });
  },

  /**
   * POST /api/v1/prescriptions
   * Create prescription and auto-resolve queue entry
   */
  create(req, res) {
    const { patientName } = req.body;
    if (!patientName) {
      return apiResponse.error(res, 'Patient name is required.', 400);
    }
    const prescription = dataStore.savePrescription(req.body);
    logger.info(`Prescription finalized: ${prescription.id} for ${patientName}`);
    return apiResponse.success(res, { prescription }, 'Prescription saved successfully', 201);
  },

  /**
   * PUT /api/v1/prescriptions/:id
   * Update prescription
   */
  update(req, res) {
    const updated = dataStore.updatePrescription(req.params.id, req.body);
    if (!updated) {
      return apiResponse.error(res, 'Prescription not found', 404);
    }
    logger.info(`Prescription updated: ${req.params.id}`);
    return apiResponse.success(res, { prescription: updated }, 'Prescription updated successfully');
  }
};

export default prescriptionsController;

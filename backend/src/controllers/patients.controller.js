/**
 * Patients Clinical Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const patientsController = {
  /**
   * GET /api/v1/patients
   * List all registered patients with optional search
   */
  getAll(req, res) {
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

    return apiResponse.success(res, {
      count: list.length,
      patients: list
    });
  },

  /**
   * GET /api/v1/patients/:id
   * Retrieve single patient by ID
   */
  getById(req, res) {
    const patient = dataStore.getPatient(req.params.id);
    if (!patient) {
      return apiResponse.error(res, 'Patient not found', 404);
    }
    return apiResponse.success(res, { patient });
  },

  /**
   * POST /api/v1/patients
   * Register a new patient
   */
  create(req, res) {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return apiResponse.error(res, 'Name and phone are required.', 400);
    }
    const patient = dataStore.createPatient(req.body);
    logger.info(`Patient created: ${patient.id} - ${patient.name}`);
    return apiResponse.success(res, { patient }, 'Patient registered successfully', 201);
  },

  /**
   * PUT /api/v1/patients/:id
   * Update existing patient
   */
  update(req, res) {
    const updated = dataStore.updatePatient(req.params.id, req.body);
    if (!updated) {
      return apiResponse.error(res, 'Patient not found', 404);
    }
    logger.info(`Patient updated: ${req.params.id}`);
    return apiResponse.success(res, { patient: updated }, 'Patient updated successfully');
  },

  /**
   * DELETE /api/v1/patients/:id
   * Remove patient record
   */
  delete(req, res) {
    const deleted = dataStore.deletePatient(req.params.id);
    if (!deleted) {
      return apiResponse.error(res, 'Patient not found', 404);
    }
    logger.info(`Patient deleted: ${req.params.id}`);
    return apiResponse.success(res, {}, 'Patient deleted successfully');
  }
};

export default patientsController;

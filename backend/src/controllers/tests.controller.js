/**
 * Diagnostic & Lab Tests Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const testsController = {
  /**
   * GET /api/v1/tests
   * List lab tests with optional patientId filter
   */
  getAll(req, res) {
    const { patientId } = req.query;
    let list = dataStore.getTests();

    if (patientId) {
      list = list.filter(t => t.patientId === patientId);
    }

    return apiResponse.success(res, {
      count: list.length,
      tests: list
    });
  },

  /**
   * POST /api/v1/tests
   * Record a new diagnostic test
   */
  create(req, res) {
    const { testName, patientName } = req.body;
    if (!testName || !patientName) {
      return apiResponse.error(res, 'testName and patientName are required.', 400);
    }
    const test = dataStore.createTest(req.body);
    logger.info(`Diagnostic test created: ${test.id} - ${testName}`);
    return apiResponse.success(res, { test }, 'Test recorded successfully', 201);
  },

  /**
   * PUT /api/v1/tests/:id
   * Update diagnostic test details or result values
   */
  update(req, res) {
    const updated = dataStore.updateTest(req.params.id, req.body);
    if (!updated) {
      return apiResponse.error(res, 'Test record not found', 404);
    }
    return apiResponse.success(res, { test: updated }, 'Test record updated successfully');
  },

  /**
   * DELETE /api/v1/tests/:id
   * Remove diagnostic test record
   */
  delete(req, res) {
    const deleted = dataStore.deleteTest(req.params.id);
    if (!deleted) {
      return apiResponse.error(res, 'Test record not found', 404);
    }
    logger.info(`Test deleted: ${req.params.id}`);
    return apiResponse.success(res, {}, 'Test record deleted');
  }
};

export default testsController;

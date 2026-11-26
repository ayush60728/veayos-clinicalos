/**
 * Medicines Library Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const medicinesController = {
  /**
   * GET /api/v1/medicines
   * Search and filter homoeopathic medicines library
   */
  getAll(req, res) {
    const { search } = req.query;
    let list = dataStore.getMedicines();

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q))
      );
    }

    return apiResponse.success(res, {
      count: list.length,
      medicines: list
    });
  },

  /**
   * POST /api/v1/medicines
   * Add a new medicine preset
   */
  create(req, res) {
    const { name, potency } = req.body;
    if (!name) {
      return apiResponse.error(res, 'Medicine name is required.', 400);
    }
    const medicine = dataStore.createMedicine(req.body);
    logger.info(`Medicine created: ${medicine.id} - ${name}`);
    return apiResponse.success(res, { medicine }, 'Medicine added successfully', 201);
  },

  /**
   * PUT /api/v1/medicines/:id
   * Update existing medicine preset
   */
  update(req, res) {
    const updated = dataStore.updateMedicine(req.params.id, req.body);
    if (!updated) {
      return apiResponse.error(res, 'Medicine not found', 404);
    }
    return apiResponse.success(res, { medicine: updated }, 'Medicine updated successfully');
  },

  /**
   * DELETE /api/v1/medicines/:id
   * Remove medicine preset
   */
  delete(req, res) {
    const deleted = dataStore.deleteMedicine(req.params.id);
    if (!deleted) {
      return apiResponse.error(res, 'Medicine not found', 404);
    }
    logger.info(`Medicine deleted: ${req.params.id}`);
    return apiResponse.success(res, {}, 'Medicine deleted successfully');
  }
};

export default medicinesController;

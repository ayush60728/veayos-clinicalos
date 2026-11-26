/**
 * Live Queue Controller for VEAYOS Homoeopathy ClinicalOS
 */

import { dataStore } from '../services/dataStore.js';
import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

export const queueController = {
  /**
   * GET /api/v1/queue
   * List clinic queue items with optional status filter
   */
  getQueue(req, res) {
    const { status } = req.query;
    let queue = dataStore.getQueue();

    if (status) {
      queue = queue.filter(q => q.status === status);
    }

    const waitingCount = queue.filter(q => q.status === 'waiting').length;

    return apiResponse.success(res, {
      count: queue.length,
      waitingCount,
      queue
    });
  },

  /**
   * POST /api/v1/queue
   * Add patient to live queue with auto token generation
   */
  addToQueue(req, res) {
    const { patientName, phone } = req.body;
    if (!patientName || !phone) {
      return apiResponse.error(res, 'Patient name and phone are required.', 400);
    }
    const item = dataStore.addToQueue(req.body);
    logger.info(`Queue item added: Token #${item.tokenNumber} for ${patientName}`);
    return apiResponse.success(res, { item }, 'Patient added to queue successfully', 201);
  },

  /**
   * PUT /api/v1/queue/:id
   * Update queue item details
   */
  updateQueueItem(req, res) {
    const updated = dataStore.updateQueueItem(req.params.id, req.body);
    if (!updated) {
      return apiResponse.error(res, 'Queue item not found', 404);
    }
    return apiResponse.success(res, { item: updated }, 'Queue item updated successfully');
  },

  /**
   * POST /api/v1/queue/:id/status
   * Advance or modify queue status (e.g. in-consultation, completed, cancelled)
   */
  updateStatus(req, res) {
    const { status } = req.body;
    if (!status) {
      return apiResponse.error(res, 'Status is required.', 400);
    }
    const updated = dataStore.updateQueueStatus(req.params.id, status);
    if (!updated) {
      return apiResponse.error(res, 'Queue item not found', 404);
    }
    logger.info(`Queue item status changed: ${req.params.id} -> ${status}`);
    return apiResponse.success(res, { item: updated }, 'Queue status updated successfully');
  },

  /**
   * DELETE /api/v1/queue/:id
   * Remove item from queue
   */
  removeFromQueue(req, res) {
    const removed = dataStore.removeFromQueue(req.params.id);
    if (!removed) {
      return apiResponse.error(res, 'Queue item not found', 404);
    }
    logger.info(`Queue item removed: ${req.params.id}`);
    return apiResponse.success(res, {}, 'Queue item removed');
  }
};

export default queueController;

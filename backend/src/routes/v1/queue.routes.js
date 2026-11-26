/**
 * Version 1 Live Queue REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { queueController } from '../../controllers/queue.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateQueueEntry, validateQueueStatus } from '../../validators/queue.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const queueRouter = Router();
queueRouter.use(optionalAuth);

queueRouter.get('/', asyncHandler(queueController.getQueue));
queueRouter.post('/', validate(validateQueueEntry), asyncHandler(queueController.addToQueue));
queueRouter.put('/:id', asyncHandler(queueController.updateQueueItem));
queueRouter.post('/:id/status', validate(validateQueueStatus), asyncHandler(queueController.updateStatus));
queueRouter.delete('/:id', asyncHandler(queueController.removeFromQueue));

export default queueRouter;

/**
 * Version 1 Prescriptions REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { prescriptionsController } from '../../controllers/prescriptions.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validatePrescription } from '../../validators/prescriptions.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const prescriptionsRouter = Router();
prescriptionsRouter.use(optionalAuth);

prescriptionsRouter.get('/', asyncHandler(prescriptionsController.getAll));
prescriptionsRouter.get('/:id', asyncHandler(prescriptionsController.getById));
prescriptionsRouter.post('/', validate(validatePrescription), asyncHandler(prescriptionsController.create));
prescriptionsRouter.put('/:id', asyncHandler(prescriptionsController.update));

export default prescriptionsRouter;

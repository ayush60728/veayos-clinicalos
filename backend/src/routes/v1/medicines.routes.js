/**
 * Version 1 Medicines Library REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { medicinesController } from '../../controllers/medicines.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateMedicine } from '../../validators/medicines.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const medicinesRouter = Router();
medicinesRouter.use(optionalAuth);

medicinesRouter.get('/', asyncHandler(medicinesController.getAll));
medicinesRouter.post('/', validate(validateMedicine), asyncHandler(medicinesController.create));
medicinesRouter.put('/:id', asyncHandler(medicinesController.update));
medicinesRouter.delete('/:id', asyncHandler(medicinesController.delete));

export default medicinesRouter;

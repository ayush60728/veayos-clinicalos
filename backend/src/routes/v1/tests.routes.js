/**
 * Version 1 Diagnostic Tests REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { testsController } from '../../controllers/tests.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateTest } from '../../validators/tests.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const testsRouter = Router();
testsRouter.use(optionalAuth);

testsRouter.get('/', asyncHandler(testsController.getAll));
testsRouter.post('/', validate(validateTest), asyncHandler(testsController.create));
testsRouter.put('/:id', asyncHandler(testsController.update));
testsRouter.delete('/:id', asyncHandler(testsController.delete));

export default testsRouter;

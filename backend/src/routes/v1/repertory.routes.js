/**
 * Version 1 Gemini AI Repertory REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { repertoryController } from '../../controllers/repertory.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateRepertory } from '../../validators/repertory.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const repertoryRouter = Router();

repertoryRouter.post('/analyze', optionalAuth, validate(validateRepertory), asyncHandler(repertoryController.analyze));

export default repertoryRouter;

/**
 * Version 1 Authentication Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { authController } from '../../controllers/auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateLogin, validateGoogleAuth } from '../../validators/auth.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.get('/whitelist', asyncHandler(authController.getWhitelist));
authRouter.post('/google', validate(validateGoogleAuth), asyncHandler(authController.googleAuth));
authRouter.post('/login', validate(validateLogin), asyncHandler(authController.login));
authRouter.post('/verify', asyncHandler(authController.verify));
authRouter.get('/me', requireAuth, asyncHandler(authController.getMe));

export default authRouter;

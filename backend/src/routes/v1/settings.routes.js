/**
 * Version 1 Settings REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { settingsController } from '../../controllers/settings.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const settingsRouter = Router();
settingsRouter.use(optionalAuth);

settingsRouter.get('/', asyncHandler(settingsController.getSettings));
settingsRouter.put('/clinic', asyncHandler(settingsController.updateClinic));
settingsRouter.put('/aisensy', asyncHandler(settingsController.updateAisensy));

export default settingsRouter;

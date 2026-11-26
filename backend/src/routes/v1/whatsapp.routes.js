/**
 * Version 1 WhatsApp & Aisensy Gateway REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { whatsappController } from '../../controllers/whatsapp.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validateWhatsAppSend } from '../../validators/whatsapp.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const whatsappRouter = Router();
whatsappRouter.use(optionalAuth);

whatsappRouter.get('/logs', asyncHandler(whatsappController.getLogs));
whatsappRouter.post('/test', asyncHandler(whatsappController.testConnection));
whatsappRouter.post('/send', validate(validateWhatsAppSend), asyncHandler(whatsappController.sendMessage));

export default whatsappRouter;

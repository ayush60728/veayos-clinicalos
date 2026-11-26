/**
 * Central API Version 1 Router for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import authRouter from './auth.routes.js';
import patientsRouter from './patients.routes.js';
import queueRouter from './queue.routes.js';
import prescriptionsRouter from './prescriptions.routes.js';
import testsRouter from './tests.routes.js';
import medicinesRouter from './medicines.routes.js';
import repertoryRouter from './repertory.routes.js';
import whatsappRouter from './whatsapp.routes.js';
import settingsRouter from './settings.routes.js';

export const v1Router = Router();

// Version 1 Health Check
v1Router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VEAYOS Homoeopathy ClinicalOS API',
    version: '1.0.0',
    whitelistEnforced: true,
    whitelistedPractitioners: ['vpdixit75@gmail.com', 'ved@veayos.com'],
    timestamp: new Date().toISOString()
  });
});

// Mount Submodules
v1Router.use('/auth', authRouter);
v1Router.use('/patients', patientsRouter);
v1Router.use('/queue', queueRouter);
v1Router.use('/prescriptions', prescriptionsRouter);
v1Router.use('/tests', testsRouter);
v1Router.use('/medicines', medicinesRouter);
v1Router.use('/repertory', repertoryRouter);
v1Router.use('/whatsapp', whatsappRouter);
v1Router.use('/settings', settingsRouter);

export default v1Router;

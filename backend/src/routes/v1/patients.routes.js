/**
 * Version 1 Patients REST API Routes for VEAYOS Homoeopathy ClinicalOS
 */

import { Router } from 'express';
import { patientsController } from '../../controllers/patients.controller.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { validatePatientIntake, validatePatientUpdate } from '../../validators/patients.validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const patientsRouter = Router();
patientsRouter.use(optionalAuth);

patientsRouter.get('/', asyncHandler(patientsController.getAll));
patientsRouter.get('/:id', asyncHandler(patientsController.getById));
patientsRouter.post('/', validate(validatePatientIntake), asyncHandler(patientsController.create));
patientsRouter.put('/:id', validate(validatePatientUpdate), asyncHandler(patientsController.update));
patientsRouter.delete('/:id', asyncHandler(patientsController.delete));

export default patientsRouter;

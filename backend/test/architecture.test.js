/**
 * Architectural & 3-Layer Structure Test Suite for VEAYOS Homoeopathy ClinicalOS Backend
 * Validates controllers, validators, utils, middleware, and routes.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { authController } from '../src/controllers/auth.controller.js';
import { patientsController } from '../src/controllers/patients.controller.js';
import { queueController } from '../src/controllers/queue.controller.js';
import { prescriptionsController } from '../src/controllers/prescriptions.controller.js';
import { testsController } from '../src/controllers/tests.controller.js';
import { medicinesController } from '../src/controllers/medicines.controller.js';
import { repertoryController } from '../src/controllers/repertory.controller.js';
import { whatsappController } from '../src/controllers/whatsapp.controller.js';
import { settingsController } from '../src/controllers/settings.controller.js';

import { validateLogin, validateGoogleAuth } from '../src/validators/auth.validator.js';
import { validatePatientIntake } from '../src/validators/patients.validator.js';
import { validateQueueEntry, validateQueueStatus } from '../src/validators/queue.validator.js';
import { validatePrescription } from '../src/validators/prescriptions.validator.js';
import { validateTest } from '../src/validators/tests.validator.js';
import { validateMedicine } from '../src/validators/medicines.validator.js';
import { validateWhatsAppTest, validateWhatsAppSend } from '../src/validators/whatsapp.validator.js';
import { validateRepertory } from '../src/validators/repertory.validator.js';

import { apiResponse, successResponse, errorResponse } from '../src/utils/apiResponse.js';
import { AppError } from '../src/utils/appError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';
import { logger } from '../src/utils/logger.js';
import { config } from '../src/config/env.js';
import { validate } from '../src/middleware/validate.js';
import { notFoundHandler, errorHandler } from '../src/middleware/error-handler.js';

describe('Architectural 3-Layer Verification Suite', () => {

  describe('1. Enterprise Controllers Integrity', () => {
    it('authController should expose required handler methods', () => {
      assert(typeof authController.getWhitelist === 'function');
      assert(typeof authController.googleAuth === 'function');
      assert(typeof authController.login === 'function');
      assert(typeof authController.verify === 'function');
      assert(typeof authController.getMe === 'function');
    });

    it('patientsController should expose required handler methods', () => {
      assert(typeof patientsController.getAll === 'function');
      assert(typeof patientsController.getById === 'function');
      assert(typeof patientsController.create === 'function');
      assert(typeof patientsController.update === 'function');
      assert(typeof patientsController.delete === 'function');
    });

    it('queueController should expose required handler methods', () => {
      assert(typeof queueController.getQueue === 'function');
      assert(typeof queueController.addToQueue === 'function');
      assert(typeof queueController.updateQueueItem === 'function');
      assert(typeof queueController.updateStatus === 'function');
      assert(typeof queueController.removeFromQueue === 'function');
    });

    it('prescriptionsController should expose required handler methods', () => {
      assert(typeof prescriptionsController.getAll === 'function');
      assert(typeof prescriptionsController.getById === 'function');
      assert(typeof prescriptionsController.create === 'function');
      assert(typeof prescriptionsController.update === 'function');
    });

    it('testsController should expose required handler methods', () => {
      assert(typeof testsController.getAll === 'function');
      assert(typeof testsController.create === 'function');
      assert(typeof testsController.update === 'function');
      assert(typeof testsController.delete === 'function');
    });

    it('medicinesController should expose required handler methods', () => {
      assert(typeof medicinesController.getAll === 'function');
      assert(typeof medicinesController.create === 'function');
      assert(typeof medicinesController.update === 'function');
      assert(typeof medicinesController.delete === 'function');
    });

    it('repertoryController should expose analyze method', () => {
      assert(typeof repertoryController.analyze === 'function');
    });

    it('whatsappController should expose required handler methods', () => {
      assert(typeof whatsappController.getLogs === 'function');
      assert(typeof whatsappController.testConnection === 'function');
      assert(typeof whatsappController.sendMessage === 'function');
    });

    it('settingsController should expose required handler methods', () => {
      assert(typeof settingsController.getSettings === 'function');
      assert(typeof settingsController.updateClinic === 'function');
      assert(typeof settingsController.updateAisensy === 'function');
    });
  });

  describe('2. Dedicated Input Validators', () => {
    it('validateLogin should reject empty email and pass valid email', () => {
      assert.equal(validateLogin({}).valid, false);
      assert.equal(validateLogin({ email: '' }).valid, false);
      assert.equal(validateLogin({ email: 'vpdixit75@gmail.com' }).valid, true);
    });

    it('validateGoogleAuth should reject missing token/email and pass valid payload', () => {
      assert.equal(validateGoogleAuth({}).valid, false);
      assert.equal(validateGoogleAuth({ email: 'ved@veayos.com' }).valid, true);
      assert.equal(validateGoogleAuth({ credential: 'mock.google.token' }).valid, true);
    });

    it('validatePatientIntake should require name and phone', () => {
      assert.equal(validatePatientIntake({}).valid, false);
      assert.equal(validatePatientIntake({ name: 'Rahul' }).valid, false);
      assert.equal(validatePatientIntake({ phone: '+919999999999' }).valid, false);
      assert.equal(validatePatientIntake({ name: 'Rahul', phone: '+919999999999' }).valid, true);
    });

    it('validateQueueEntry should require patientName and phone', () => {
      assert.equal(validateQueueEntry({}).valid, false);
      assert.equal(validateQueueEntry({ patientName: 'Sita' }).valid, false);
      assert.equal(validateQueueEntry({ patientName: 'Sita', phone: '+919876543210' }).valid, true);
    });

    it('validateQueueStatus should require status', () => {
      assert.equal(validateQueueStatus({}).valid, false);
      assert.equal(validateQueueStatus({ status: 'completed' }).valid, true);
    });

    it('validatePrescription should require patientName', () => {
      assert.equal(validatePrescription({}).valid, false);
      assert.equal(validatePrescription({ patientName: 'Geeta' }).valid, true);
    });

    it('validateTest should require testName and patientName', () => {
      assert.equal(validateTest({}).valid, false);
      assert.equal(validateTest({ testName: 'CBC' }).valid, false);
      assert.equal(validateTest({ testName: 'CBC', patientName: 'Anil' }).valid, true);
    });

    it('validateMedicine should require name', () => {
      assert.equal(validateMedicine({}).valid, false);
      assert.equal(validateMedicine({ name: 'Aconitum Napellus' }).valid, true);
    });

    it('validateWhatsAppSend should require patient with phone', () => {
      assert.equal(validateWhatsAppSend({}).valid, false);
      assert.equal(validateWhatsAppSend({ patient: {} }).valid, false);
      assert.equal(validateWhatsAppSend({ patient: { phone: '+919811234567' } }).valid, true);
    });

    it('validateRepertory should accept symptom payload object', () => {
      assert.equal(validateRepertory({ location: 'head' }).valid, true);
    });
  });

  describe('3. Standardized Utils & Middleware', () => {
    it('apiResponse.success and apiResponse.error should format responses correctly', () => {
      let mockResStatus = 200;
      let mockResBody = null;
      const mockRes = {
        status(s) { mockResStatus = s; return this; },
        json(b) { mockResBody = b; return this; }
      };

      apiResponse.success(mockRes, { item: 'sample' }, 'Created', 201);
      assert.equal(mockResStatus, 201);
      assert.equal(mockResBody.success, true);
      assert.equal(mockResBody.item, 'sample');
      assert.equal(mockResBody.message, 'Created');

      apiResponse.error(mockRes, 'Custom error message', 400);
      assert.equal(mockResStatus, 400);
      assert.equal(mockResBody.success, false);
      assert.equal(mockResBody.error, 'Custom error message');
    });

    it('AppError should encapsulate status, code, and details', () => {
      const err = new AppError(404, 'NOT_FOUND', 'Record missing', [{ field: 'id' }]);
      assert.equal(err.status, 404);
      assert.equal(err.code, 'NOT_FOUND');
      assert.equal(err.message, 'Record missing');
      assert.equal(err.details.length, 1);
    });

    it('asyncHandler should catch promise rejections and forward to next()', async () => {
      let errorForwarded = null;
      const failingHandler = async () => {
        throw new Error('Async error thrown');
      };
      const wrapped = asyncHandler(failingHandler);

      await new Promise((resolve) => {
        wrapped({}, {}, (err) => {
          errorForwarded = err;
          resolve();
        });
      });

      assert(errorForwarded);
      assert.equal(errorForwarded.message, 'Async error thrown');
    });

    it('validate middleware should pass on valid input and reject on invalid', () => {
      const middleware = validate((data) => {
        return !data.testField ? { valid: false, error: 'testField is required' } : { valid: true };
      });

      let nextCalled = false;
      const mockReqValid = { body: { testField: 'value' } };
      middleware(mockReqValid, {}, () => { nextCalled = true; });
      assert.equal(nextCalled, true);

      let rejectedStatus = null;
      let rejectedBody = null;
      const mockRes = {
        status(s) { rejectedStatus = s; return this; },
        json(b) { rejectedBody = b; return this; }
      };
      const mockReqInvalid = { body: {} };
      middleware(mockReqInvalid, mockRes, () => {});
      assert.equal(rejectedStatus, 400);
      assert.equal(rejectedBody.success, false);
      assert.equal(rejectedBody.error, 'testField is required');
    });

    it('notFoundHandler and errorHandler should return structured JSON', () => {
      let status = null;
      let body = null;
      const mockRes = {
        status(s) { status = s; return this; },
        json(b) { body = b; return this; },
        headersSent: false
      };

      notFoundHandler({ originalUrl: '/api/v1/unknown' }, mockRes, () => {});
      assert.equal(status, 404);
      assert.equal(body.success, false);
      assert(body.error.includes('/api/v1/unknown'));

      errorHandler(new Error('Server boom'), { method: 'GET', originalUrl: '/test' }, mockRes, () => {});
      assert.equal(status, 500);
      assert.equal(body.success, false);
      assert.equal(body.error, 'Server boom');
    });

    it('logger methods should execute cleanly without runtime exceptions', () => {
      assert.doesNotThrow(() => {
        logger.info('Test info logging', { component: 'architecture.test' });
        logger.debug('Test debug logging');
        logger.warn('Test warn logging');
        logger.error('Test error logging', new Error('Test err'));
      });
    });

    it('config should provide structured environment properties', () => {
      assert(typeof config.port === 'number');
      assert(typeof config.nodeEnv === 'string');
      assert(typeof config.jwtSecret === 'string');
      assert(typeof config.jwtExpiresIn === 'string');
    });
  });

});

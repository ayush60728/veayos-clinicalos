/**
 * Input Validation Middleware for VEAYOS Homoeopathy ClinicalOS
 * Executes validation schemas and halts invalid requests before reaching controllers.
 */

import { AppError } from '../utils/appError.js';

export function validate(validatorOrSchema, property = 'body') {
  return (req, res, next) => {
    const data = req[property] || {};
    let result;

    if (typeof validatorOrSchema === 'function') {
      result = validatorOrSchema(data, req);
    } else if (validatorOrSchema && typeof validatorOrSchema.validate === 'function') {
      result = validatorOrSchema.validate(data, req);
    } else {
      return next();
    }

    if (result && result.valid === false) {
      const status = result.status || 400;
      const errorMsg = result.error || result.message || 'Validation error';
      const responsePayload = {
        success: false,
        error: errorMsg
      };
      if (result.message) {
        responsePayload.message = result.message;
      }
      if (result.details?.length) {
        responsePayload.details = result.details;
      }
      return res.status(status).json(responsePayload);
    }

    next();
  };
}

export default validate;

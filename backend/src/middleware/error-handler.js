/**
 * Error Handling Middleware for VEAYOS Homoeopathy ClinicalOS
 */

import { logger } from '../config/logger.js';
import { AppError } from '../utils/appError.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `API route '${req.originalUrl}' not found.`
  });
}

export function errorHandler(err, req, res, next) {
  logger.error(`Request error at ${req.method} ${req.originalUrl}:`, err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  const responsePayload = {
    success: false,
    error: message
  };

  if (err.details && Array.isArray(err.details) && err.details.length > 0) {
    responsePayload.details = err.details;
  }

  return res.status(status).json(responsePayload);
}

export default {
  notFoundHandler,
  errorHandler
};

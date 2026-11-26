/**
 * Standardized Application Error for VEAYOS Homoeopathy ClinicalOS
 */

export class AppError extends Error {
  constructor(status = 500, code = 'INTERNAL_ERROR', message = 'Internal Server Error', details = []) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export default AppError;

/**
 * Standardized API Response Helper for VEAYOS Homoeopathy ClinicalOS
 */

export function successResponse(res, data = {}, message = 'Operation successful', status = 200) {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return res.status(status).json({
      success: true,
      message,
      ...data
    });
  }
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

export function errorResponse(res, error = 'An error occurred', status = 500, details = null) {
  const errMessage = typeof error === 'string' ? error : (error?.message || 'Internal Server Error');
  const body = {
    success: false,
    error: errMessage
  };
  if (details) body.details = details;
  return res.status(status).json(body);
}

export const apiResponse = {
  success: successResponse,
  error: errorResponse
};

export default apiResponse;

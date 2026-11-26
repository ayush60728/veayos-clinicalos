/**
 * Async Route Handler Wrapper for Express Controllers
 */

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export default asyncHandler;

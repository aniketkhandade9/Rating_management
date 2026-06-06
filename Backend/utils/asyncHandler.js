/**
 * Wraps an async route handler so unhandled rejections
 * are forwarded to Express's global error handler automatically —
 * eliminating try/catch boilerplate in every controller.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

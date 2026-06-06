const jwt      = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('Authentication required.', 401));

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('Invalid or expired token.', 401));
  }
};

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : next(new AppError(`Access restricted to: ${roles.join(', ')}.`, 403));

module.exports = { authenticate, authorize };

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const { signup, login, changePassword, getMe } = require('../controllers/authController');
const { authenticate }   = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');

// ─── Validation rules ─────────────────────────────────────────────────────────

const signupRules = [
  body('name')
    .trim()
    .isLength({ min: 20, max: 60 })
    .withMessage('Name must be between 20 and 60 characters.'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('address')
    .trim()
    .isLength({ max: 400 })
    .withMessage('Address must be at most 400 characters.'),

  body('password')
    .isLength({ min: 8, max: 16 })
    .withMessage('Password must be 8–16 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter.')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one special character.'),

  body('role')
    .optional()
    .isIn(['user', 'store_owner'])
    .withMessage('Role must be either user or store_owner.'),

  body('storeName')
    .if(body('role').equals('store_owner'))
    .trim()
    .isLength({ min: 20, max: 60 })
    .withMessage('Store name must be between 20 and 60 characters.'),

  body('storeEmail')
    .if(body('role').equals('store_owner'))
    .trim()
    .isEmail()
    .withMessage('Please enter a valid store email address.')
    .normalizeEmail(),

  body('storeAddress')
    .if(body('role').equals('store_owner'))
    .trim()
    .isLength({ min: 1, max: 400 })
    .withMessage('Store address must be between 1 and 400 characters.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8, max: 16 })
    .withMessage('New password must be 8–16 characters.')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter.')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('New password must contain at least one special character.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/auth/signup
 * @access Public
 * @desc   Normal user self-registration
 */
router.post('/signup', signupRules, handleValidation, signup);

/**
 * @route  POST /api/auth/login
 * @access Public
 * @desc   Single login endpoint for all roles
 */
router.post('/login', loginRules, handleValidation, login);

/**
 * @route  PUT /api/auth/change-password
 * @access Private (any authenticated user)
 * @desc   Change own password
 */
router.put('/change-password', authenticate, changePasswordRules, handleValidation, changePassword);

/**
 * @route  GET /api/auth/me
 * @access Private (any authenticated user)
 * @desc   Get own profile
 */
router.get('/me', authenticate, getMe);

module.exports = router;

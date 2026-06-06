const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const {
  getDashboard,
  createUser,
  getUsers,
  getUserById,
  createStore,
  getStores,
  getStoreOwners,
  getStoreRequests,
  approveStoreRequest,
  rejectStoreRequest,
  deleteUser,
  changeUserRole,
} = require('../controllers/adminController');

const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation }        = require('../middleware/validate');

// All admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// ─── Validation rules ─────────────────────────────────────────────────────────

const createUserRules = [
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
    .isIn(['admin', 'user', 'store_owner'])
    .withMessage('Role must be admin, user, or store_owner.'),
];

const createStoreRules = [
  body('name')
    .trim()
    .isLength({ min: 20, max: 60 })
    .withMessage('Store name must be between 20 and 60 characters.'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required.')
    .isLength({ max: 400 })
    .withMessage('Address must be at most 400 characters.'),

  body('ownerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ownerId must be a valid integer.'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/admin/dashboard
 * @desc   Admin dashboard stats
 */
router.get('/dashboard', getDashboard);

/**
 * @route  POST /api/admin/users
 * @desc   Create a new user (admin / normal / store_owner)
 */
router.post('/users', createUserRules, handleValidation, createUser);

/**
 * @route  GET /api/admin/users
 * @desc   List all users with filters & sorting
 */
router.get('/users', getUsers);

/**
 * @route  GET /api/admin/users/:id
 * @desc   Get single user details
 */
router.get('/users/:id', getUserById);

/**
 * @route  POST /api/admin/stores
 * @desc   Create a new store
 */
router.post('/stores', createStoreRules, handleValidation, createStore);

/**
 * @route  GET /api/admin/stores
 * @desc   List all stores with avg rating, filters & sorting
 */
router.get('/stores', getStores);

/**
 * @route  GET /api/admin/store-owners
 * @desc   List all store_owner users (for dropdowns)
 */
router.get('/store-owners', getStoreOwners);

/**
 * @route  GET /api/admin/requests
 * @desc   List all store requests
 */
router.get('/requests', getStoreRequests);

/**
 * @route  POST /api/admin/requests/:id/approve
 * @desc   Approve a store request and create the store
 */
router.post('/requests/:id/approve', approveStoreRequest);

/**
 * @route  POST /api/admin/requests/:id/reject
 * @desc   Reject a store request
 */
router.post('/requests/:id/reject', rejectStoreRequest);

/**
 * @route  DELETE /api/admin/users/:id
 * @desc   Delete a user
 */
router.delete('/users/:id', deleteUser);

/**
 * @route  PUT /api/admin/users/:id/role
 * @desc   Change user role
 */
router.put('/users/:id/role', changeUserRole);

module.exports = router;

const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const { getStores, submitRating, updateRating } = require('../controllers/userController');
const { authenticate, authorize }               = require('../middleware/auth');
const { handleValidation }                      = require('../middleware/validate');

// All user routes require authentication and user role
router.use(authenticate, authorize('user'));

// ─── Validation rules ─────────────────────────────────────────────────────────

const ratingBodyRules = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),
];

const submitRatingRules = [
  body('storeId')
    .isInt({ min: 1 })
    .withMessage('storeId must be a valid integer.'),
  ...ratingBodyRules,
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/user/stores
 * @desc   List all stores with avg rating and the user's own rating
 * @query  name, address, sortBy, sortOrder
 */
router.get('/stores', getStores);

/**
 * @route  POST /api/user/ratings
 * @desc   Submit a new rating for a store
 */
router.post('/ratings', submitRatingRules, handleValidation, submitRating);

/**
 * @route  PUT /api/user/ratings/:storeId
 * @desc   Update an existing rating for a store
 */
router.put('/ratings/:storeId', ratingBodyRules, handleValidation, updateRating);

module.exports = router;

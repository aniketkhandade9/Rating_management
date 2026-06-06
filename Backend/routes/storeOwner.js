const express = require('express');
const router  = express.Router();

const { getDashboard, submitStoreRequest, getStoreRequests } = require('../controllers/storeOwnerController');
const { authenticate, authorize }   = require('../middleware/auth');

// All store-owner routes require authentication and store_owner role
router.use(authenticate, authorize('store_owner'));

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route  GET /api/store-owner/dashboard
 * @desc   Store owner dashboard: store info, avg rating, list of raters
 */
router.get('/dashboard', getDashboard);

/**
 * @route  POST /api/store-owner/requests
 * @desc   Submit a request to add/link a new store
 */
router.post('/requests', submitStoreRequest);

/**
 * @route  GET /api/store-owner/requests
 * @desc   Get list of submitted store requests
 */
router.get('/requests', getStoreRequests);

module.exports = router;

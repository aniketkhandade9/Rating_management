const db           = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError     = require('../utils/AppError');

exports.getDashboard = asyncHandler(async (req, res) => {
  const { id: ownerId } = req.user;

  const [stores] = await db.query(
    `SELECT s.id, s.name, s.email, s.address,
            ROUND(AVG(r.rating), 2) AS averageRating,
            COUNT(r.id)             AS totalRatings
     FROM   stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE  s.owner_id = ?
     GROUP BY s.id, s.name, s.email, s.address`,
     [ownerId]
  );

  if (!stores.length) {
    return res.json({ success: true, message: 'No store linked to your account yet.', data: { stores: [] } });
  }

  const storeIds = stores.map((s) => s.id);

  const [raters] = await db.query(
    `SELECT r.store_id,
            u.id         AS userId,
            u.name       AS userName,
            u.email      AS userEmail,
            r.rating,
            r.updated_at AS ratedAt
     FROM   ratings r
     JOIN   users   u ON u.id = r.user_id
     WHERE  r.store_id IN (?)
     ORDER BY r.updated_at DESC`,
    [storeIds]
  );

  // Group raters under their respective store
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, { ...s, raters: [] }]));
  raters.forEach(({ store_id, ...rater }) => storeMap[store_id]?.raters.push(rater));

  res.json({ success: true, data: { stores: Object.values(storeMap) } });
});

exports.submitStoreRequest = asyncHandler(async (req, res, next) => {
  const { id: ownerId } = req.user;
  const { storeName, storeEmail, storeAddress } = req.body;

  if (!storeName || storeName.trim().length < 20 || storeName.trim().length > 60) {
    return next(new AppError('Store name must be between 20 and 60 characters.', 400));
  }
  if (!storeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail)) {
    return next(new AppError('Please enter a valid email address.', 400));
  }
  if (!storeAddress || storeAddress.trim().length === 0 || storeAddress.length > 400) {
    return next(new AppError('Address must be between 1 and 400 characters.', 400));
  }

  // Check if store email is already registered in stores or pending store_requests
  const [existingStores] = await db.query('SELECT id FROM stores WHERE email = ?', [storeEmail]);
  if (existingStores.length) {
    return next(new AppError('Store email is already registered.', 409));
  }

  const [existingReqs] = await db.query(
    "SELECT id FROM store_requests WHERE store_email = ? AND status = 'pending'",
    [storeEmail]
  );
  if (existingReqs.length) {
    return next(new AppError('A pending request for this store email already exists.', 409));
  }

  await db.query(
    'INSERT INTO store_requests (owner_id, store_name, store_email, store_address, status) VALUES (?, ?, ?, ?, ?)',
    [ownerId, storeName, storeEmail, storeAddress, 'pending']
  );

  res.status(201).json({ success: true, message: 'Store request submitted successfully.' });
});

exports.getStoreRequests = asyncHandler(async (req, res) => {
  const { id: ownerId } = req.user;
  const [rows] = await db.query(
    'SELECT id, store_name, store_email, store_address, status, created_at FROM store_requests WHERE owner_id = ? ORDER BY created_at DESC',
    [ownerId]
  );
  res.json({ success: true, data: rows });
});

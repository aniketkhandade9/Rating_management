const db           = require('../config/db');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { safeCol, safeOrder } = require('../utils/queryHelpers');

const SORT_COLS = ['name', 'address', 'averageRating'];

exports.getStores = asyncHandler(async (req, res) => {
  const { id: userId }                   = req.user;
  const { name, address, sortBy, sortOrder } = req.query;

  const where  = [];
  const params = [userId];

  if (name)    { where.push('s.name    LIKE ?'); params.push(`%${name}%`);    }
  if (address) { where.push('s.address LIKE ?'); params.push(`%${address}%`); }

  const col      = safeCol(sortBy, SORT_COLS);
  const order    = safeOrder(sortOrder);
  const sortExpr = col === 'averageRating' ? 'averageRating' : `s.${col}`;

  const [rows] = await db.query(
    `SELECT  s.id,
             s.name,
             s.address,
             ROUND(AVG(r.rating), 2) AS averageRating,
             COUNT(r.id)             AS totalRatings,
             my_r.rating             AS userRating
     FROM    stores s
     LEFT JOIN ratings r    ON r.store_id    = s.id
     LEFT JOIN ratings my_r ON my_r.store_id = s.id
                           AND my_r.user_id  = ?
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY s.id, s.name, s.address, my_r.rating
     ORDER BY ${sortExpr} ${order}`,
    params
  );

  res.json({ success: true, data: rows });
});

exports.submitRating = asyncHandler(async (req, res, next) => {
  const { id: userId }    = req.user;
  const { storeId, rating } = req.body;

  const [[store]] = await db.query('SELECT id FROM stores WHERE id = ?', [storeId]);
  if (!store) return next(new AppError('Store not found.', 404));

  const [existing] = await db.query(
    'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
    [userId, storeId]
  );
  if (existing.length) return next(new AppError('Already rated. Use PUT to update.', 409));

  await db.query('INSERT INTO ratings (store_id, user_id, rating) VALUES (?, ?, ?)', [storeId, userId, rating]);
  res.status(201).json({ success: true, message: 'Rating submitted.' });
});

exports.updateRating = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { storeId }    = req.params;
  const { rating }     = req.body;

  const [existing] = await db.query(
    'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
    [userId, storeId]
  );
  if (!existing.length) return next(new AppError('No rating found. Use POST to submit.', 404));

  await db.query('UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?', [rating, userId, storeId]);
  res.json({ success: true, message: 'Rating updated.' });
});

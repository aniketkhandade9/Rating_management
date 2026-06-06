const bcrypt       = require('bcryptjs');
const db           = require('../config/db');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { safeCol, safeOrder } = require('../utils/queryHelpers');

const USER_SORT_COLS  = ['name', 'email', 'address', 'role', 'created_at'];
const STORE_SORT_COLS = ['name', 'email', 'address', 'averageRating', 'created_at'];

// ─── Dashboard ────────────────────────────────────────────────────────────────

exports.getDashboard = asyncHandler(async (req, res) => {
  const [usersRes, storesRes, ratingsRes] = await Promise.all([
    db.query('SELECT COUNT(*) AS totalUsers   FROM users'),
    db.query('SELECT COUNT(*) AS totalStores  FROM stores'),
    db.query('SELECT COUNT(*) AS totalRatings FROM ratings'),
  ]);

  const totalUsers = usersRes[0][0].totalUsers;
  const totalStores = storesRes[0][0].totalStores;
  const totalRatings = ratingsRes[0][0].totalRatings;

  res.json({ success: true, data: { totalUsers, totalStores, totalRatings } });
});

// ─── Users ────────────────────────────────────────────────────────────────────

exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, address, role } = req.body;

  if (role === 'admin' && req.user.email !== 'admin@ratingmanagement.com') {
    return next(new AppError('Only the super administrator can assign the admin role.', 403));
  }

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return next(new AppError('Email already registered.', 409));

  const hash = await bcrypt.hash(password, 12);
  const [{ insertId }] = await db.query(
    'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, hash, address, role]
  );

  res.status(201).json({ success: true, message: 'User created.', userId: insertId });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const { name, email, address, role, sortBy, sortOrder } = req.query;

  const where  = [];
  const params = [];

  if (name)    { where.push('u.name    LIKE ?'); params.push(`%${name}%`);    }
  if (email)   { where.push('u.email   LIKE ?'); params.push(`%${email}%`);   }
  if (address) { where.push('u.address LIKE ?'); params.push(`%${address}%`); }
  if (role)    { where.push('u.role = ?');        params.push(role);           }

  const col   = safeCol(sortBy, USER_SORT_COLS);
  const order = safeOrder(sortOrder);

  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
            (SELECT ROUND(AVG(r.rating), 2)
             FROM stores s
             JOIN ratings r ON r.store_id = s.id
             WHERE s.owner_id = u.id) AS averageRating
     FROM   users u
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY u.${col} ${order}`,
    params
  );

  res.json({ success: true, data: rows });
});

exports.getUserById = asyncHandler(async (req, res, next) => {
  const [[user]] = await db.query(
    `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
            (SELECT ROUND(AVG(r.rating), 2)
             FROM stores s
             JOIN ratings r ON r.store_id = s.id
             WHERE s.owner_id = u.id) AS averageRating
     FROM   users u
     WHERE  u.id = ?`,
    [req.params.id]
  );
  if (!user) return next(new AppError('User not found.', 404));

  if (user.role === 'store_owner') {
    const [stores] = await db.query(
      `SELECT s.id, s.name, s.address,
              ROUND(AVG(r.rating), 2) AS averageRating,
              COUNT(r.id)             AS totalRatings
       FROM   stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE  s.owner_id = ?
       GROUP BY s.id, s.name, s.address`,
      [user.id]
    );
    user.stores = stores;
  }

  res.json({ success: true, data: user });
});

// ─── Stores ───────────────────────────────────────────────────────────────────

exports.createStore = asyncHandler(async (req, res, next) => {
  const { name, email, address, ownerId } = req.body;

  const [existing] = await db.query('SELECT id FROM stores WHERE email = ?', [email]);
  if (existing.length) return next(new AppError('Store email already registered.', 409));

  if (ownerId) {
    const [[owner]] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'store_owner'",
      [ownerId]
    );
    if (!owner) return next(new AppError('ownerId must reference a store_owner user.', 400));
  }

  const [{ insertId }] = await db.query(
    'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
    [name, email, address, ownerId || null]
  );

  res.status(201).json({ success: true, message: 'Store created.', storeId: insertId });
});

exports.getStores = asyncHandler(async (req, res) => {
  const { name, email, address, sortBy, sortOrder } = req.query;

  const where  = [];
  const params = [];

  if (name)    { where.push('s.name    LIKE ?'); params.push(`%${name}%`);    }
  if (email)   { where.push('s.email   LIKE ?'); params.push(`%${email}%`);   }
  if (address) { where.push('s.address LIKE ?'); params.push(`%${address}%`); }

  const col      = safeCol(sortBy, STORE_SORT_COLS);
  const order    = safeOrder(sortOrder);
  const sortExpr = col === 'averageRating' ? 'averageRating' : `s.${col}`;

  const [rows] = await db.query(
    `SELECT  s.id, s.name, s.email, s.address, s.owner_id,
             u.name                  AS ownerName,
             ROUND(AVG(r.rating), 2) AS averageRating,
             COUNT(r.id)             AS totalRatings
     FROM    stores s
     LEFT JOIN users   u ON u.id       = s.owner_id
     LEFT JOIN ratings r ON r.store_id = s.id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY s.id, s.name, s.email, s.address, s.owner_id, u.name
     ORDER BY ${sortExpr} ${order}`,
    params
  );

  res.json({ success: true, data: rows });
});

exports.getStoreOwners = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, name, email FROM users WHERE role = 'store_owner' ORDER BY name"
  );
  res.json({ success: true, data: rows });
});

// ─── Store Requests ──────────────────────────────────────────────────────────

exports.getStoreRequests = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT r.id, r.store_name, r.store_email, r.store_address, r.status, r.created_at, r.owner_id,
           u.name AS ownerName, u.email AS ownerEmail
    FROM   store_requests r
    JOIN   users u ON u.id = r.owner_id
    ORDER BY r.created_at DESC
  `);
  res.json({ success: true, data: rows });
});

exports.approveStoreRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const [[request]] = await db.query('SELECT * FROM store_requests WHERE id = ?', [id]);
  if (!request) return next(new AppError('Store request not found.', 404));
  if (request.status !== 'pending') return next(new AppError('Request has already been processed.', 400));

  // Check if store email is already registered in stores table
  const [existingStores] = await db.query('SELECT id FROM stores WHERE email = ?', [request.store_email]);
  if (existingStores.length) {
    await db.query("UPDATE store_requests SET status = 'rejected' WHERE id = ?", [id]);
    return next(new AppError('Store email is already registered in stores.', 409));
  }

  // Transaction to create store and update request status
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    await conn.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [request.store_name, request.store_email, request.store_address, request.owner_id]
    );

    await conn.query("UPDATE store_requests SET status = 'approved' WHERE id = ?", [id]);

    await conn.commit();
    res.json({ success: true, message: 'Store request approved and store created.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

exports.rejectStoreRequest = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const [[request]] = await db.query('SELECT id, status FROM store_requests WHERE id = ?', [id]);
  if (!request) return next(new AppError('Store request not found.', 404));
  if (request.status !== 'pending') return next(new AppError('Request has already been processed.', 400));

  await db.query("UPDATE store_requests SET status = 'rejected' WHERE id = ?", [id]);
  res.json({ success: true, message: 'Store request rejected.' });
});

// ─── User Management (Delete / Change Role) ──────────────────────────────────

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return next(new AppError('You cannot delete your own admin account.', 400));
  }

  const [[user]] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
  if (!user) return next(new AppError('User not found.', 404));

  if (user.role === 'admin' && req.user.email !== 'admin@ratingmanagement.com') {
    return next(new AppError('Only the super administrator can delete other administrator accounts.', 403));
  }

  await db.query('DELETE FROM users WHERE id = ?', [id]);
  res.json({ success: true, message: 'User deleted successfully.' });
});

exports.changeUserRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user', 'store_owner'].includes(role)) {
    return next(new AppError('Role must be admin, user, or store_owner.', 400));
  }

  if (parseInt(id) === req.user.id) {
    return next(new AppError('You cannot change your own role.', 400));
  }

  const [[user]] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
  if (!user) return next(new AppError('User not found.', 404));

  if ((user.role === 'admin' || role === 'admin') && req.user.email !== 'admin@ratingmanagement.com') {
    return next(new AppError('Only the super administrator can assign or remove the admin role.', 403));
  }

  await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  res.json({ success: true, message: 'User role updated successfully.' });
});

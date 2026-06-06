const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const db           = require('../config/db');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = ({ id, email, role, name }) =>
  jwt.sign({ id, email, role, name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = ({ id, name, email, address, role }) => ({ id, name, email, address, role });

// ─────────────────────────────────────────────────────────────────────────────

exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, address, role, storeName, storeEmail, storeAddress } = req.body;

  const targetRole = (role === 'store_owner' || role === 'user') ? role : 'user';

  const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser.length) return next(new AppError('Email is already registered.', 409));

  if (targetRole === 'store_owner') {
    const [existingStore] = await db.query('SELECT id FROM stores WHERE email = ?', [storeEmail]);
    if (existingStore.length) return next(new AppError('Store email is already registered.', 409));
  }

  const hash = await bcrypt.hash(password, 12);
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [{ insertId }] = await conn.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, address, targetRole]
    );

    if (targetRole === 'store_owner') {
      await conn.query(
        'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
        [storeName, storeEmail, storeAddress, insertId]
      );
    }

    await conn.commit();

    const user = { id: insertId, name, email, address, role: targetRole };
    res.status(201).json({
      success: true,
      message: 'Account and store created successfully.',
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  res.json({ success: true, message: 'Login successful.', token: signToken(user), user: publicUser(user) });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const [[row]] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

  if (!row) return next(new AppError('User not found.', 404));
  if (!(await bcrypt.compare(currentPassword, row.password))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  await db.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(newPassword, 12), req.user.id]);
  res.json({ success: true, message: 'Password updated.' });
});

exports.getMe = asyncHandler(async (req, res, next) => {
  const [[user]] = await db.query(
    'SELECT id, name, email, address, role, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) return next(new AppError('User not found.', 404));
  res.json({ success: true, user });
});

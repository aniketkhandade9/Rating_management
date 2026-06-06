/**
 * Whitelisted sort column and direction helpers.
 * Prevents SQL injection via ORDER BY clauses.
 */
const safeCol   = (col, allowed, fallback = 'name') => allowed.includes(col) ? col : fallback;
const safeOrder = (order) => order === 'desc' ? 'DESC' : 'ASC';

module.exports = { safeCol, safeOrder };

const db   = require('./config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('Admin@1234', 12);
  await db.query(
    "UPDATE users SET password = ? WHERE email = 'admin@ratingmanagement.com'",
    [hash]
  );
  console.log('✅ Admin password set to: Admin@1234');
  process.exit(0);
})();

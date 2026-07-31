const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });

  try {
    const [columns] = await conn.query("SHOW COLUMNS FROM events LIKE 'postal_code'");
    if (!columns.length) {
      await conn.query("ALTER TABLE events ADD COLUMN postal_code VARCHAR(20) DEFAULT NULL AFTER venue_name");
      console.log('Added postal_code column to events');
    } else {
      console.log('postal_code column already exists');
    }

    await conn.query("UPDATE events SET postal_code = '018956' WHERE postal_code IS NULL AND title = 'Community Tech Meetup'");
    await conn.query("UPDATE events SET postal_code = '238859' WHERE postal_code IS NULL AND title = 'Weekend Art Fair'");

    console.log('Updated existing seeded event rows with postal codes');
  } finally {
    await conn.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

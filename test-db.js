const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'event_finder'
        });
        
        console.log('✅ Database connected successfully!');
        console.log(`📊 Database: ${process.env.DB_NAME}`);
        
        // Test query
        const [rows] = await connection.query('SELECT * FROM users');
        console.log(`👥 Users found: ${rows.length}`);
        rows.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) [${user.role}]`);
        });
        
        await connection.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 The database "event_finder" does not exist. Create it first.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('💡 MySQL is not running or port is wrong.');
        }
    }
}

testConnection();
require('dotenv').config();

// Auto-detect environment based on available variables
const isProduction = process.env.MYSQLHOST || process.env.DATABASE_URL;

module.exports = {
    development: {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'kuran1925',
        database: process.env.DB_NAME || 'tagihan_db',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    },
    test: {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'kuran1925',
        database: process.env.DB_NAME_TEST || 'tagihan_db_test',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql'
    },
    production: {
        username: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE || 'railway',
        host: process.env.MYSQLHOST,
        port: process.env.MYSQLPORT || 3306,
        dialect: 'mysql',
        dialectOptions: {
            ssl: process.env.MYSQLHOST ? {
                require: true,
                rejectUnauthorized: false
            } : undefined
        },
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
};
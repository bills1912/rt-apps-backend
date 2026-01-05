require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'kuran1925',
        database: process.env.DB_NAME || 'tagihan_db',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
    },
    test: {
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'kuran1925',
        database: process.env.DB_NAME_TEST || 'tagihan_db_test',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres'
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false
    }
};

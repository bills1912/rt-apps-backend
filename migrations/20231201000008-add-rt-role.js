'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Migration ini tidak perlu mengubah tabel karena kolom 'role' sudah ada
        // Tapi kita bisa menambahkan constraint untuk memastikan nilai role yang valid
        
        // Optional: Add check constraint for role values
        await queryInterface.sequelize.query(`
            ALTER TABLE users 
            MODIFY COLUMN role VARCHAR(255) 
            DEFAULT 'user' 
            CHECK (role IN ('user', 'admin', 'rt'))
        `);
    },

    async down(queryInterface, Sequelize) {
        // Remove the constraint
        await queryInterface.sequelize.query(`
            ALTER TABLE users 
            MODIFY COLUMN role VARCHAR(255) 
            DEFAULT 'user'
        `);
    }
};
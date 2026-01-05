'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const hashedPassword = bcrypt.hashSync('password123', 10);

        await queryInterface.bulkInsert('users', [
            // Admin (Bendahara RT)
            {
                name: 'Bendahara RT',
                kk: '1234567890123456',
                email: 'bendahara@rt.com',
                password: hashedPassword,
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Warga 1
            {
                name: 'Ahmad Sudrajat',
                kk: '3201010101010001',
                email: 'ahmad@gmail.com',
                password: hashedPassword,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Warga 2
            {
                name: 'Budi Santoso',
                kk: '3201010101010002',
                email: 'budi@gmail.com',
                password: hashedPassword,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Warga 3
            {
                name: 'Citra Dewi',
                kk: '3201010101010003',
                email: 'citra@gmail.com',
                password: hashedPassword,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Warga 4
            {
                name: 'Dedi Kurniawan',
                kk: '3201010101010004',
                email: 'dedi@gmail.com',
                password: hashedPassword,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Warga 5
            {
                name: 'Eka Putri',
                kk: '3201010101010005',
                email: 'eka@gmail.com',
                password: hashedPassword,
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', null, {});
    }
};

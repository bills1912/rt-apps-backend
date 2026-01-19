'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('data_warga', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            nama: {
                type: Sequelize.STRING,
                allowNull: false
            },
            alamat: {
                type: Sequelize.STRING,
                allowNull: false
            },
            // Payment status for each month (JSON object)
            // Format: { "January": true, "February": false, ... }
            paymentStatus: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: {}
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes
        await queryInterface.addIndex('data_warga', ['userId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('data_warga');
    }
};


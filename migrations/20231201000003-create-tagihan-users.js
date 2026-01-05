'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tagihan_users', {
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
            tagihanId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tagihan',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            tagihanSnapshot: {
                type: Sequelize.JSON,
                allowNull: true
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'processing'
            },
            paidAt: {
                type: Sequelize.DATE,
                allowNull: true
            },
            userInfo: {
                type: Sequelize.JSON,
                allowNull: true
            },
            adminReply: {
                type: Sequelize.JSON,
                allowNull: true
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

        // Add indexes for better query performance
        await queryInterface.addIndex('tagihan_users', ['userId']);
        await queryInterface.addIndex('tagihan_users', ['tagihanId']);
        await queryInterface.addIndex('tagihan_users', ['status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tagihan_users');
    }
};

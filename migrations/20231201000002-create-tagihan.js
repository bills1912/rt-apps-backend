'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tagihan', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            tagihanName: {
                type: Sequelize.STRING,
                allowNull: true
            },
            tagihanDescription: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            tagihanDate: {
                type: Sequelize.DATE,
                allowNull: false
            },
            totalPrice: {
                type: Sequelize.DOUBLE,
                allowNull: false,
                defaultValue: 0
            },
            items: {
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
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tagihan');
    }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notification_deletes', {
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
            notificationId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'notifications',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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

        // Add indexes and unique constraint
        await queryInterface.addIndex('notification_deletes', ['userId']);
        await queryInterface.addIndex('notification_deletes', ['notificationId']);
        await queryInterface.addIndex('notification_deletes', ['userId', 'notificationId'], {
            unique: true,
            name: 'notification_deletes_user_notification_unique'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('notification_deletes');
    }
};

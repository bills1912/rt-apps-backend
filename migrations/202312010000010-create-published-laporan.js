'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('published_laporan', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            periode: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Format: YYYY-MM'
            },
            publishedBy: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            publishedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

        // Add unique constraint
        await queryInterface.addIndex('published_laporan', ['periode'], {
            unique: true,
            name: 'published_laporan_periode_unique'
        });

        // Add index for publishedBy
        await queryInterface.addIndex('published_laporan', ['publishedBy']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('published_laporan');
    }
};
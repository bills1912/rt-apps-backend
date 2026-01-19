'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('laporan_keuangan', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            tanggal: {
                type: Sequelize.DATE,
                allowNull: false
            },
            jenisTransaksi: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'pemasukan/pengeluaran'
            },
            kategori: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Iuran Warga/Sampah/Keamanan/Kebersihan/Lainnya'
            },
            pihakKetiga: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Nama pihak ketiga (tukang sampah, hansip, dll)'
            },
            jumlah: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            keterangan: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            periode: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Format: YYYY-MM (contoh: 2025-01)'
            },
            buktiTransaksi: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Array of image URLs'
            },
            createdBy: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
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
        await queryInterface.addIndex('laporan_keuangan', ['periode']);
        await queryInterface.addIndex('laporan_keuangan', ['jenisTransaksi']);
        await queryInterface.addIndex('laporan_keuangan', ['createdBy']);
        await queryInterface.addIndex('laporan_keuangan', ['tanggal']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('laporan_keuangan');
    }
};
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class LaporanKeuangan extends Model {
        static associate(models) {
            LaporanKeuangan.belongsTo(models.User, { 
                foreignKey: 'createdBy', 
                as: 'creator' 
            });
        }
    }
    LaporanKeuangan.init({
        tanggal: {
            type: DataTypes.DATE,
            allowNull: false
        },
        jenisTransaksi: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['pemasukan', 'pengeluaran']]
            }
        },
        kategori: {
            type: DataTypes.STRING,
            allowNull: false
        },
        pihakKetiga: {
            type: DataTypes.STRING,
            allowNull: true
        },
        jumlah: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0
        },
        keterangan: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        periode: {
            type: DataTypes.STRING,
            allowNull: false
        },
        buktiTransaksi: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'LaporanKeuangan',
        tableName: 'laporan_keuangan',
        timestamps: true
    });
    return LaporanKeuangan;
};
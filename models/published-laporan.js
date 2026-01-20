'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class PublishedLaporan extends Model {
        static associate(models) {
            PublishedLaporan.belongsTo(models.User, { 
                foreignKey: 'publishedBy', 
                as: 'publisher' 
            });
        }
    }
    PublishedLaporan.init({
        periode: {
            type: DataTypes.STRING,
            allowNull: false
        },
        publishedBy: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'PublishedLaporan',
        tableName: 'published_laporan',
        timestamps: true
    });
    return PublishedLaporan;
};
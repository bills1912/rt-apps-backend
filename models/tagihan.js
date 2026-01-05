'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Tagihan extends Model {
        static associate(models) {
            Tagihan.hasMany(models.TagihanUser, { foreignKey: 'tagihanId', as: 'tagihanUsers' });
        }
    }
    Tagihan.init({
        tagihanName: DataTypes.STRING,
        tagihanDescription: DataTypes.TEXT,
        tagihanDate: DataTypes.DATE,
        totalPrice: DataTypes.DOUBLE,
        items: DataTypes.JSON // Storing items as JSON array
    }, {
        sequelize,
        modelName: 'Tagihan',
        tableName: 'tagihan',
        timestamps: true
    });
    return Tagihan;
};

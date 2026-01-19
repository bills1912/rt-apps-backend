'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class DataWarga extends Model {
        static associate(models) {
            DataWarga.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }
    DataWarga.init({
        userId: DataTypes.INTEGER,
        nama: DataTypes.STRING,
        alamat: DataTypes.STRING,
        paymentStatus: {
            type: DataTypes.JSON,
            defaultValue: {
                January: false,
                February: false,
                March: false,
                April: false,
                May: false,
                June: false,
                July: false,
                August: false,
                September: false,
                October: false,
                November: false,
                December: false
            }
        }
    }, {
        sequelize,
        modelName: 'DataWarga',
        tableName: 'data_warga',
        timestamps: true
    });
    return DataWarga;
};
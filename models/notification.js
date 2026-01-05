'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Notification extends Model {
        static associate(models) {
            // define association here
        }
    }
    Notification.init({
        title: DataTypes.STRING,
        message: DataTypes.TEXT,
        type: DataTypes.STRING,
        isGlobal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        forRole: DataTypes.STRING,
        tagihanId: DataTypes.INTEGER,
        userId: DataTypes.INTEGER // Optional, if specific to user
    }, {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true
    });
    return Notification;
};

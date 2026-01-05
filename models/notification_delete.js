'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class NotificationDelete extends Model {
        static associate(models) {
            // define association here
        }
    }
    NotificationDelete.init({
        userId: DataTypes.INTEGER,
        notificationId: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'NotificationDelete',
        tableName: 'notification_deletes',
        timestamps: true
    });
    return NotificationDelete;
};

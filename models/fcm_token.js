'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class FcmToken extends Model {
        static associate(models) {
            FcmToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        }
    }
    FcmToken.init({
        userId: DataTypes.INTEGER,
        token: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'FcmToken',
        tableName: 'fcm_tokens',
        timestamps: true
    });
    return FcmToken;
};

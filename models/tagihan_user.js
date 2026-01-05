'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class TagihanUser extends Model {
        static associate(models) {
            TagihanUser.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            TagihanUser.belongsTo(models.Tagihan, { foreignKey: 'tagihanId', as: 'tagihanDetail' });
        }
    }
    TagihanUser.init({
        userId: DataTypes.INTEGER,
        tagihanId: DataTypes.INTEGER,
        tagihanSnapshot: DataTypes.JSON, // Copy of tagihan data at creation
        status: {
            type: DataTypes.STRING,
            defaultValue: 'processing'
        },
        paidAt: DataTypes.DATE,
        userInfo: DataTypes.JSON, // Array of payment attempts
        adminReply: DataTypes.JSON // Array of admin replies
    }, {
        sequelize,
        modelName: 'TagihanUser',
        tableName: 'tagihan_users',
        timestamps: true
    });
    return TagihanUser;
};

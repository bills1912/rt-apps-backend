
const { Notification, NotificationDelete } = require("../models");
const { formatCreatedAt } = require("../utils/time");
const { Op } = require("sequelize");

module.exports = class NotificationController {
    static async findAll(req, res) {
        try {
            const { user } = req

            let data = []
            if (user.role == 'user') {
                // Get deleted notifications first
                const deletedNotifications = await NotificationDelete.findAll({
                    where: { userId: user.id }
                });

                const deletedIds = deletedNotifications.map((d) => d.notificationId);

                // Run the OR query
                const notifications = await Notification.findAll({
                    where: {
                        [Op.or]: [
                            { isGlobal: true },
                            { userId: user.id }
                        ],
                        id: { [Op.notIn]: deletedIds }
                    },
                    order: [['createdAt', 'DESC']]
                });

                data = notifications.map(doc => {
                    const d = doc.toJSON();
                    return {
                        ...d,
                        createdAt: formatCreatedAt(d, 'createdAt')
                    }
                });
            }
            return res.status(200).json({ data })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async delete(req, res) {
        try {
            const { user, params } = req
            const { id } = params
            const payload = {
                notificationId: id,
                userId: user.id
            }
            await NotificationDelete.create(payload)
            return res.status(200).json({ data: 'success' })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }
}

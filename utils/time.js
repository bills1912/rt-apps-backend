
const dayjs = require("dayjs");

module.exports = class TimeUtils {
    static formatCreatedAt(data, column_name = 'createdAt') {
        const value = data[column_name];

        if (!value) return null;

        // If it's already a Date object or string (Sequelize/MySQL)
        if (value instanceof Date || typeof value === 'string') {
            return dayjs(value).toDate();
        }

        // If it's a Firestore Timestamp
        if (value._seconds) {
            const timestampMs = value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6);
            return dayjs(timestampMs).add(7, 'hours').toDate();
        }

        return dayjs(value).toDate();
    }
}

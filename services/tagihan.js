const { Tagihan, TagihanUser } = require("../models");
const { formatCreatedAt } = require("../utils/time");

module.exports = class TagihanService {
    static async findOneById(id) {
        try {
            const tagihan = await Tagihan.findByPk(id)
            if (!tagihan) {
                return null
            }
            return tagihan.toJSON()
        } catch (error) {
            return null
        }
    }

    static async findTagihanUserOneById(id) {
        try {
            const tagihanUser = await TagihanUser.findByPk(id, {
                include: ['tagihanDetail']
            })

            if (!tagihanUser) {
                return null
            }

            let data = tagihanUser.toJSON()

            // Map snapshot or relation to 'tagihan' field
            data.tagihan = data.tagihanSnapshot || data.tagihanDetail

            // Parse JSON strings safely
            if (data.tagihan && typeof data.tagihan === 'string') {
                try {
                    data.tagihan = JSON.parse(data.tagihan);
                } catch (e) {
                    console.error('Failed to parse tagihanSnapshot in service', e);
                }
            }

            // Parse userInfo safely
            if (data.userInfo) {
                if (typeof data.userInfo === 'string') {
                    try {
                        data.userInfo = JSON.parse(data.userInfo);
                    } catch (e) {
                        console.error('Failed to parse userInfo in service', e);
                        data.userInfo = [];
                    }
                }
                // Ensure it's an array
                if (!Array.isArray(data.userInfo)) {
                    data.userInfo = [];
                }
            } else {
                data.userInfo = [];
            }

            // Parse adminReply safely
            if (data.adminReply) {
                if (typeof data.adminReply === 'string') {
                    try {
                        data.adminReply = JSON.parse(data.adminReply);
                    } catch (e) {
                        console.error('Failed to parse adminReply in service', e);
                        data.adminReply = [];
                    }
                }
                // Ensure it's an array
                if (!Array.isArray(data.adminReply)) {
                    data.adminReply = [];
                }
            } else {
                data.adminReply = [];
            }

            data.paidAt = formatCreatedAt(data, 'paidAt')
            if (data.tagihan) {
                data.tagihan.tagihanDate = formatCreatedAt(data.tagihan, 'tagihanDate')
            }

            // Format dates in userInfo
            if (Array.isArray(data.userInfo)) {
                data.userInfo.forEach((d) => {
                    if (d && d.date) {
                        d.date = formatCreatedAt(d, 'date')
                    }
                })
            }

            // Format dates in adminReply
            if (Array.isArray(data.adminReply)) {
                data.adminReply.forEach((d) => {
                    if (d && d.date) {
                        d.date = formatCreatedAt(d, 'date')
                    }
                })
            }

            return data
        } catch (error) {
            console.log('Error in findTagihanUserOneById:', error)
            return null
        }
    }
}
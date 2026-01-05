
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

            // Map snapshot or relation to 'tagihan' field to match old structure
            data.tagihan = data.tagihanSnapshot || data.tagihanDetail

            if (data.tagihan && typeof data.tagihan === 'string') {
                try {
                    data.tagihan = JSON.parse(data.tagihan);
                } catch (e) {
                    console.error('Failed to parse tagihanSnapshot in service', e);
                }
            }

            data.paidAt = formatCreatedAt(data, 'paidAt')
            if (data.tagihan) {
                data.tagihan.tagihanDate = formatCreatedAt(data.tagihan, 'tagihanDate')
            }

            if (data.userInfo && Array.isArray(data.userInfo)) {
                data.userInfo.forEach((d) => {
                    d.date = formatCreatedAt(d, 'date')
                })
            }

            return data
        } catch (error) {
            console.log(error)
            return null
        }
    }
}

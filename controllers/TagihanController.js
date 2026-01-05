
const dayjs = require("dayjs");
const { admin } = require("../utils/firebase");
const { Tagihan, TagihanUser, Notification, FcmToken, User } = require("../models");
const TagihanService = require("../services/tagihan");
const { formatCreatedAt } = require("../utils/time");
// const sharp = require('sharp');
const { create } = require("../utils/imgur");
const { Op } = require("sequelize");

module.exports = class TagihanController {
    static async create(req, res) {
        try {
            const { body } = req
            const { items, tagihanDate, tagihanName, tagihanDescription } = body
            let totalPrice = 0;
            items.forEach((i) => {
                totalPrice += i.price
            })
            const payload = {
                items,
                tagihanDate: dayjs(tagihanDate).toDate(),
                totalPrice,
                tagihanName,
                tagihanDescription
            }
            const data = await Tagihan.create(payload)

            const payloadNotification = {
                tagihanId: data.id,
                forRole: 'user',
                isGlobal: true,
                type: 'created',
                title: 'Tagihan Baru',
                message: `Tagihan Baru untuk bulan ${dayjs(tagihanDate).format('MMMM')} sudah terbit`
            }

            await Notification.create(payloadNotification)
            const tokens = await FcmToken.findAll()

            const notificationData = {
                title: payloadNotification.title,
                body: payloadNotification.message
            }


            const promises = tokens.map(t => {
                console.log('Send Notif to:' + t.token);
                return admin.messaging().send({
                    token: t.token,
                    android: {
                        priority: 'high'
                    },
                    data: notificationData,
                    notification: {
                        title: 'Tagihan Baru',
                        body: 'Ada tagihan baru nih, dicek dulu yuk'
                    }
                })
            })

            const promise = await Promise.allSettled(promises)
            console.log(promise);

            return res.status(201).json({
                data
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async findAll(req, res) {
        try {
            const { user } = req
            let tagihan = await Tagihan.findAll({
                order: [['tagihanDate', 'DESC']]
            })

            tagihan = tagihan.map(t => {
                const data = t.toJSON();
                return {
                    ...data,
                    tagihanDate: formatCreatedAt(data, 'tagihanDate'),
                    tagihanName: data.tagihanName ?? `Tagihan ${dayjs(data.tagihanDate).format('MMMM')} `,
                    tagihanDescription: data.tagihanDescription ?? 'Tidak ada deskripsi'
                }
            })

            if (user.role == 'user') {
                const tagihanUsers = await TagihanUser.findAll({
                    where: { userId: user.id }
                })

                tagihan = tagihan.map((t) => {
                    return {
                        ...t,
                        isPaid: false
                    }
                })

                let latestTagihanUnpaid;
                let latestTagihanPaid;

                if (tagihanUsers.length > 0) {
                    tagihanUsers.forEach((d) => {
                        const data = d.toJSON()
                        const isPaid = tagihan.findIndex((t) => t.id == data.tagihanId)
                        if (isPaid != -1) {
                            tagihan[isPaid].isPaid = true
                        }
                    })

                    for (const t of tagihan) {
                        if (t.isPaid) {
                            latestTagihanPaid = t;
                        } else {
                            latestTagihanUnpaid = t;
                            break;
                        }
                    }

                }
                if (!latestTagihanPaid) latestTagihanPaid = tagihan[0]

                if (!latestTagihanUnpaid) latestTagihanUnpaid = tagihan[0]
                tagihan = [latestTagihanPaid, latestTagihanUnpaid]
            }

            return res.status(200).json({
                data: tagihan
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async findOne(req, res) {
        try {
            const { params } = req
            const { id } = params
            const tagihan = await TagihanService.findOneById(id)
            console.log({ tagihan });
            if (!tagihan) {
                return res.status(404).json({
                    error: 'data not found'
                })
            }
            tagihan.tagihanDate = formatCreatedAt(tagihan, 'tagihanDate')
            tagihan.tagihanName = tagihan.tagihanName ?? `Tagihan ${dayjs(tagihan.tagihanDate).format('MMMM')} `
            tagihan.tagihanDescription = tagihan.tagihanDescription ?? 'Tidak ada deskripsi'
            return res.status(200).json({
                data: tagihan
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async pay(req, res) {
        try {
            const { body, user } = req
            const { tagihanId, description } = body
            let { images } = body
            images = Array.isArray(images) ? images : [images];
            const tagihan = await TagihanService.findOneById(tagihanId)


            const imgLink = await create(images[0])

            const userInfo =
            {
                date: dayjs().toDate(),
                transferProof: [imgLink],
                description
            }

            const payload = {
                tagihanId: tagihan.id,
                tagihanSnapshot: tagihan,
                userInfo: [userInfo],
                status: 'processing',
                userId: user.id,
                adminReply: [],
                paidAt: dayjs().toDate()
            }

            const tagihanUser = await TagihanUser.create(payload)

            return res.status(201).json({
                data: tagihanUser
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async findAllTagihanUser(req, res) {
        try {
            const { user } = req
            const statuses = ['processing', 'need_to_fix'];

            const whereClause = {
                status: { [Op.in]: statuses }
            }

            if (user.role == 'user') {
                whereClause.userId = user.id
            }

            const tagihanUsers = await TagihanUser.findAll({
                where: whereClause,
                include: [
                    { model: Tagihan, as: 'tagihanDetail' },
                    { model: User, as: 'user' }
                ]
            })

            let tagihan = tagihanUsers.map(doc => {
                const data = doc.toJSON();
                return {
                    id: data.id,
                    ...data,
                    tagihan: data.tagihanSnapshot || data.tagihanDetail, // Fallback to relation if snapshot missing
                    paidAt: formatCreatedAt(data, 'paidAt')
                }
            })

            tagihan = tagihan.map((t) => {
                if (t.tagihan) {
                    if (typeof t.tagihan === 'string') {
                        try {
                            t.tagihan = JSON.parse(t.tagihan);
                        } catch (e) {
                            console.error('Failed to parse tagihanSnapshot', e);
                        }
                    }
                    t.tagihan.tagihanDate = formatCreatedAt(t.tagihan, 'tagihanDate')
                    t.tagihan.tagihanName = t.tagihan.tagihanName ?? `Tagihan ${dayjs(t.tagihan.tagihanDate).format('MMMM')} `
                    t.tagihan.tagihanDescription = t.tagihan.tagihanDescription ?? 'Tidak ada deskripsi'
                }

                if (t.userInfo) {
                    if (typeof t.userInfo === 'string') {
                        try {
                            t.userInfo = JSON.parse(t.userInfo);
                        } catch (e) {
                            console.error('Failed to parse userInfo', e);
                        }
                    }
                    if (Array.isArray(t.userInfo)) {
                        t.userInfo = t.userInfo.map((tu) => {
                            tu.date = formatCreatedAt(tu, 'date')
                            if (tu.transferProof && Array.isArray(tu.transferProof)) {
                                tu.transferProof = tu.transferProof.map(url => {
                                    if (url && typeof url === 'string' && url.startsWith('/public')) {
                                        return `${req.protocol}://${req.get('host')}${url}`;
                                    }
                                    return url;
                                })
                            }
                            return tu
                        })
                    }
                }

                if (t.adminReply) {
                    if (typeof t.adminReply === 'string') {
                        try {
                            t.adminReply = JSON.parse(t.adminReply);
                        } catch (e) {
                            console.error('Failed to parse adminReply', e);
                        }
                    }
                    if (Array.isArray(t.adminReply)) {
                        t.adminReply = t.adminReply.map((tu) => {
                            tu.date = formatCreatedAt(tu, 'date')
                            if (tu.images && Array.isArray(tu.images)) {
                                tu.images = tu.images.map(url => {
                                    if (url && typeof url === 'string' && url.startsWith('/public')) {
                                        return `${req.protocol}://${req.get('host')}${url}`;
                                    }
                                    return url;
                                })
                            }
                            return tu
                        })
                    }
                }
                return t
            })

            console.log(tagihan);
            res.status(200).json({
                data: tagihan
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    }

    static async findOneTagihanUser(req, res) {
        try {
            const { params } = req
            const { id } = params
            const tagihan = await TagihanService.findTagihanUserOneById(id)
            console.log({ tagihan });
            if (!tagihan) {
                return res.status(404).json({
                    error: 'data not found'
                })
            }
            if (tagihan.tagihan) {
                if (typeof tagihan.tagihan === 'string') {
                    try {
                        tagihan.tagihan = JSON.parse(tagihan.tagihan);
                    } catch (e) {
                        console.error('Failed to parse tagihanSnapshot', e);
                    }
                }
                tagihan.tagihan.tagihanName = tagihan.tagihan.tagihanName ?? `Tagihan ${dayjs(tagihan.tagihan.tagihanDate).format('MMMM')} `
                tagihan.tagihan.tagihanDescription = tagihan.tagihan.tagihanDescription ?? 'Tidak ada deskripsi'
            }

            if (tagihan.userInfo) {
                if (typeof tagihan.userInfo === 'string') {
                    try {
                        tagihan.userInfo = JSON.parse(tagihan.userInfo);
                    } catch (e) {
                        console.error('Failed to parse userInfo', e);
                    }
                }
                if (Array.isArray(tagihan.userInfo)) {
                    tagihan.userInfo = tagihan.userInfo.map((tu) => {
                        tu.date = formatCreatedAt(tu, 'date')
                        if (tu.transferProof && Array.isArray(tu.transferProof)) {
                            tu.transferProof = tu.transferProof.map(url => {
                                if (url && typeof url === 'string' && url.startsWith('/public')) {
                                    return `${req.protocol}://${req.get('host')}${url}`;
                                }
                                return url;
                            })
                        }
                        return tu
                    })
                }
            }

            if (tagihan.adminReply) {
                if (typeof tagihan.adminReply === 'string') {
                    try {
                        tagihan.adminReply = JSON.parse(tagihan.adminReply);
                    } catch (e) {
                        console.error('Failed to parse adminReply', e);
                    }
                }
                if (Array.isArray(tagihan.adminReply)) {
                    tagihan.adminReply = tagihan.adminReply.map((tu) => {
                        tu.date = formatCreatedAt(tu, 'date')
                        if (tu.images && Array.isArray(tu.images)) {
                            tu.images = tu.images.map(url => {
                                if (url && typeof url === 'string' && url.startsWith('/public')) {
                                    return `${req.protocol}://${req.get('host')}${url}`;
                                }
                                return url;
                            })
                        }
                        return tu
                    })
                }
            }

            return res.status(200).json({
                data: tagihan
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async updateTagihanUser(req, res) {
        try {
            const { params, body } = req
            const { id } = params
            const { status, description } = body
            const { images } = body
            let imagesAdmin = [];

            const tagihan = await TagihanService.findTagihanUserOneById(id)
            if (!tagihan) {
                return res.status(404).json({
                    error: 'data not found'
                })
            }

            let adminReply = tagihan.adminReply || []
            const adminReplyPayload = {
                description: description ?? null,
                images: imagesAdmin,
                date: dayjs().toDate()
            }
            if (images) {
                imagesAdmin = images && Array.isArray(images) ? images : [images];
                adminReplyPayload.images = imagesAdmin
            }
            if (description) {
                adminReplyPayload.note = description
            }

            adminReply = [adminReplyPayload]

            await TagihanUser.update({
                status,
                adminReply
            }, {
                where: { id }
            })

            return res.status(200).json({
                data: 'success'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async updateTagihanUserByUser(req, res) {
        try {
            const { params, body } = req
            const { id } = params
            const { description } = body
            let { images } = body
            images = Array.isArray(images) ? images : [images];

            const imgLink = await create(images[0])

            const userInfo =
            {
                date: dayjs().toDate(),
                transferProof: [imgLink],
                description
            }

            const tagihan = await TagihanService.findTagihanUserOneById(id)
            if (!tagihan) {
                return res.status(404).json({
                    error: 'data not found'
                })
            }

            const currentUserInfo = tagihan.userInfo || []

            await TagihanUser.update({
                userInfo: [...currentUserInfo, userInfo],
                status: 'processing'
            }, {
                where: { id }
            })

            return res.status(200).json({
                data: 'success'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    }

    static async findAllTagihanUserHistory(req, res) {
        try {
            const { user, query } = req
            const { month } = query
            const statuses = ['verified'];

            const whereClause = {
                status: { [Op.in]: statuses }
            }

            if (user.role == 'user') {
                whereClause.userId = user.id
            }

            const tagihanUsers = await TagihanUser.findAll({
                where: whereClause,
                include: [
                    { model: Tagihan, as: 'tagihanDetail' }
                ]
            })

            let tagihan = tagihanUsers.map(doc => {
                const data = doc.toJSON();
                return {
                    id: data.id,
                    ...data,
                    tagihan: data.tagihanSnapshot || data.tagihanDetail,
                    paidAt: formatCreatedAt(data, 'paidAt')
                }
            })

            if (month) {
                tagihan = tagihan.filter((t) => {
                    const tagihanMonth = dayjs(t.tagihan.tagihanDate).format('MMMM');
                    return tagihanMonth.toLowerCase() === month.toLowerCase();
                });
            }

            tagihan = tagihan.map((t) => {
                if (t.tagihan) {
                    if (typeof t.tagihan === 'string') {
                        try {
                            t.tagihan = JSON.parse(t.tagihan);
                        } catch (e) {
                            console.error('Failed to parse tagihanSnapshot', e);
                        }
                    }
                    t.tagihan.tagihanDate = formatCreatedAt(t.tagihan, 'tagihanDate')
                    t.tagihan.tagihanName = t.tagihan.tagihanName ?? `Tagihan ${dayjs(t.tagihan.tagihanDate).format('MMMM')} `
                    t.tagihan.tagihanDescription = t.tagihan.tagihanDescription ?? 'Tidak ada deskripsi'
                }

                if (t.userInfo) {
                    if (typeof t.userInfo === 'string') {
                        try {
                            t.userInfo = JSON.parse(t.userInfo);
                        } catch (e) {
                            console.error('Failed to parse userInfo', e);
                        }
                    }
                    if (Array.isArray(t.userInfo) && t.userInfo.length) {
                        const tempUserInfo = t.userInfo[t.userInfo.length - 1]
                        tempUserInfo.date = formatCreatedAt(tempUserInfo, 'date')
                        if (tempUserInfo.transferProof && Array.isArray(tempUserInfo.transferProof)) {
                            tempUserInfo.transferProof = tempUserInfo.transferProof.map(url => {
                                if (url && typeof url === 'string' && url.startsWith('/public')) {
                                    return `${req.protocol}://${req.get('host')}${url}`;
                                }
                                return url;
                            })
                        }
                        t.userInfo = [tempUserInfo]
                    }
                }

                if (t.adminReply) {
                    if (typeof t.adminReply === 'string') {
                        try {
                            t.adminReply = JSON.parse(t.adminReply);
                        } catch (e) {
                            console.error('Failed to parse adminReply', e);
                        }
                    }
                    if (Array.isArray(t.adminReply) && t.adminReply.length) {
                        const tempAdminReply = t.adminReply[t.adminReply.length - 1]
                        tempAdminReply.date = formatCreatedAt(tempAdminReply, 'date')
                        if (tempAdminReply.images && Array.isArray(tempAdminReply.images)) {
                            tempAdminReply.images = tempAdminReply.images.map(url => {
                                if (url && typeof url === 'string' && url.startsWith('/public')) {
                                    return `${req.protocol}://${req.get('host')}${url}`;
                                }
                                return url;
                            })
                        }
                        t.adminReply = [tempAdminReply]
                    }
                }

                return t
            })

            console.log(tagihan);
            res.status(200).json({
                data: tagihan
            })

        } catch (error) {
            console.log(error);
            res.status(500).json({ error })
        }
    }
}

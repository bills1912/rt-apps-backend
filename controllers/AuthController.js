
const bcrypt = require('bcrypt')
const AuthUtils = require("../utils/auth")
const logger = require("../utils/logger")
const { User, FcmToken } = require('../models')
const UserService = require('../services/user')
const dayjs = require('dayjs')
const { formatCreatedAt } = require('../utils/time')

module.exports = class AuthController {
    static async signUp(req, res) {
        try {
            const { body } = req
            const { kk, password, name } = body

            const userExist = await User.findOne({ where: { kk } })
            if (userExist) {
                return res.status(400).json({ error: 'Account with the same KK already exist' })
            }

            const payload = {
                kk,
                password: bcrypt.hashSync(password, 10),
                name,
                role: 'user'
            }

            const user = await User.create(payload)

            return res.status(201).json({
                data: user
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error })
        }
    }

    static async login(req, res) {
        const { body } = req
        const { kk, password, fcmToken } = body
        try {
            const user = await UserService.findOneByKk(kk)
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400)
                    .json({
                        error: 'Invalid account'
                    })
            }
            if (fcmToken) {
                await FcmToken.create({
                    userId: user.id,
                    token: fcmToken
                })
            }

            const userData = user.toJSON();
            delete userData.password

            return res.status(200)
                .json({
                    data: {
                        token: AuthUtils.encodeToken(user.id),
                        user: userData
                    }
                })
        } catch (error) {
            console.log(error);
            return res.status(500)
                .json({
                    error
                })
        }
    }

    static async me(req, res) {
        const { user } = req
        try {
            return res.status(200)
                .json({ user })
        } catch (error) {
            logger.error(error)
            return res.status(500)
                .json({ error })
        }
    }
}

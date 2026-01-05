
const { User } = require("../models")

module.exports = class UserService {


    static async findOneByKk(kk) {
        try {
            const user = await User.findOne({ where: { kk } })
            return user
        } catch (error) {
            return null
        }
    }

    static async findOneById(id) {
        try {
            const user = await User.findByPk(id)

            if (!user) {
                return null
            }

            const userData = user.toJSON()
            delete userData.password

            return userData
        } catch (error) {
            return null
        }
    }
}

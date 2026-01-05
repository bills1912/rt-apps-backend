const jwt = require('jsonwebtoken')
require('dotenv').config()
module.exports = class AuthUtils {
    static encodeToken(id) {
        return jwt.sign({
            id
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        })
    }
}
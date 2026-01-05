const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { findOneById } = require('../services/user');


const authenticated =  async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if(!token) {
            return res.status(401)
            .json({
                error: 'No token provided!'
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const tokenUser = await findOneById(decoded.id)
        console.log({tokenUser});
        if(!tokenUser) {
            return res.status(401)
            .json({
                error: 'Invalid credentials'
            })
        }
        req.user = tokenUser
        next()
    } catch (error) {
        logger.error('Auth Middleware Error:' + error)
        return res.status(401)
        .json({
            error: 'Authentication Failed'
        })
    }
}

module.exports = authenticated
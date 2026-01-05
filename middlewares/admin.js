const adminMiddleware = async (req, res, next) => {
    if(!req.user || (req.user.level != 'admin' && req.user.level != 'operator')) {
        return res.status(400)
        .json({
            error: {
                message: 'Unauthorized Routes',
            code: 400,
            title: 'Unauthorized'
            }
        })
    }
    next()
}
module.exports = adminMiddleware
const { validationResult } = require('express-validator')
const payloadValidation = async (req, res, next) => {
    const errs = validationResult(req)
    if (!errs.isEmpty()) {
        const errObj = {
            code: 400,
            title: 'BAD_REQUEST',
            message:''
        }
        errs.array().forEach((e, i) => {
            errObj.message += `\t${i + 1}. ${e.msg}`
        });
        return res.status(400)
            .json({
                error: errObj
            })
    }
    next()
}
module.exports = payloadValidation
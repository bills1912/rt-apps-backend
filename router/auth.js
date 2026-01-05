const express = require('express')
const Controller = require('../controllers/AuthController')
const validator = require('express-validator')
const authenticated = require('../middlewares/auth')
const router = express.Router()
const payloadValidation = require('../middlewares/payload-validation')
const { body } = require('express-validator')


router.post('/register', [
    body('kk').notEmpty().withMessage('KK required').isNumeric().withMessage('KK must be numeric'),
    body('password').notEmpty().withMessage('Password required'),
    body('name').notEmpty().withMessage('name required')
], payloadValidation, Controller.signUp)

router.post('/login', [
    body('kk').notEmpty().withMessage('KK required'),
    body('password').notEmpty().withMessage('Password required')
], payloadValidation, Controller.login)


router.use(authenticated)
router.get('/me', Controller.me)
module.exports = router
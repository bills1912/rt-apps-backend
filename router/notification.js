const express = require('express')
const Controller = require('../controllers/NotificationController')
const validator = require('express-validator')
const authenticated = require('../middlewares/auth')
const router = express.Router()
const payloadValidation = require('../middlewares/payload-validation')
const {body} = require('express-validator')


router.use(authenticated)
router.get('/', Controller.findAll)
router.delete('/:id', Controller.delete)
module.exports = router
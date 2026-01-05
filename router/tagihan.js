const express = require('express')
const Controller = require('../controllers/TagihanController')
const validator = require('express-validator')
const authenticated = require('../middlewares/auth')
const router = express.Router()
const payloadValidation = require('../middlewares/payload-validation')
const {body} = require('express-validator')
const storage = require('../utils/storage')

router.use(authenticated)

router.get('/', Controller.findAll)

router.get('/tagihan-user', Controller.findAllTagihanUser)
router.get('/tagihan-user-history', Controller.findAllTagihanUserHistory)

router.get('/tagihan-user/:id', Controller.findOneTagihanUser)
// router.put('/tagihan-user/:id', storage.none(), [])
router.put('/tagihan-user/by-user/:id', storage.none(), [
    body('images').custom((value) => {
      if (!value) throw new Error('images required');
      const images = Array.isArray(value) ? value : [value];
      if (images.length < 1) throw new Error('images must have at least 1 image');
      return true;
    }),
    body('description').notEmpty().withMessage('description required'),
], payloadValidation, Controller.updateTagihanUserByUser)

router.put('/tagihan-user/:id', storage.none(), [
    body('status').notEmpty().withMessage('status required'),
], payloadValidation, Controller.updateTagihanUser)

router.get('/:id', Controller.findOne)

router.post('/', [
    body('items').notEmpty().withMessage('items required').isArray({min: 1}).withMessage('minimal 1 item'),
    body('tagihanDate').notEmpty().withMessage('tagihanDate required'),
    body('tagihanName').notEmpty().withMessage('tagihanName required'),
    body('tagihanDescription').notEmpty().withMessage('tagihanDescription required'),
], payloadValidation, Controller.create)

router.post('/pay', storage.none(), [
    body('images').custom((value) => {
      if (!value) throw new Error('images required');
      const images = Array.isArray(value) ? value : [value];
      if (images.length < 1) throw new Error('images must have at least 1 image');
      return true;
    }),
    body('tagihanId').notEmpty().withMessage('tagihanId required'),
    body('description').notEmpty().withMessage('description required'),
], payloadValidation, Controller.pay)

module.exports = router
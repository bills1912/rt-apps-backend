const express = require('express');
const Controller = require('../controllers/DataWargaController');
const authenticated = require('../middlewares/auth');
const { body } = require('express-validator');
const payloadValidation = require('../middlewares/payload-validation');
const router = express.Router();

router.use(authenticated);

// Get all warga with payment status
router.get('/', Controller.getAllWarga);

// Get payment statistics
router.get('/stats', Controller.getPaymentStats);

// Sync warga data from users table
router.post('/sync', Controller.syncWargaData);

// Update payment status for specific month
router.put('/:id/payment-status', [
    body('month').notEmpty().withMessage('Month is required')
        .isIn(['January', 'February', 'March', 'April', 'May', 'June', 
               'July', 'August', 'September', 'October', 'November', 'December'])
        .withMessage('Invalid month'),
    body('status').notEmpty().withMessage('Status is required')
        .isBoolean().withMessage('Status must be boolean')
], payloadValidation, Controller.updatePaymentStatus);

// Update warga address
router.put('/:id/address', [
    body('alamat').notEmpty().withMessage('Alamat is required')
], payloadValidation, Controller.updateWargaAddress);

module.exports = router;
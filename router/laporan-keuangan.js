const express = require('express');
const Controller = require('../controllers/LaporanKeuanganController');
const authenticated = require('../middlewares/auth');
const { body } = require('express-validator');
const payloadValidation = require('../middlewares/payload-validation');
const router = express.Router();

router.use(authenticated);

// Get all laporan (with optional filters)
router.get('/', Controller.getAll);

// Get summary by periode
router.get('/summary', Controller.getSummary);

// Get available periods
router.get('/periods', Controller.getPeriods);

// Get by ID
router.get('/:id', Controller.getById);

// Create laporan
router.post('/', [
    body('tanggal').notEmpty().withMessage('Tanggal is required')
        .isISO8601().withMessage('Invalid date format'),
    body('jenisTransaksi').notEmpty().withMessage('Jenis transaksi is required')
        .isIn(['pemasukan', 'pengeluaran']).withMessage('Invalid jenis transaksi'),
    body('kategori').notEmpty().withMessage('Kategori is required'),
    body('jumlah').notEmpty().withMessage('Jumlah is required')
        .isNumeric().withMessage('Jumlah must be numeric')
], payloadValidation, Controller.create);

// Update laporan
router.put('/:id', [
    body('tanggal').optional().isISO8601().withMessage('Invalid date format'),
    body('jenisTransaksi').optional()
        .isIn(['pemasukan', 'pengeluaran']).withMessage('Invalid jenis transaksi'),
    body('jumlah').optional().isNumeric().withMessage('Jumlah must be numeric')
], payloadValidation, Controller.update);

// Delete laporan
router.delete('/:id', Controller.delete);

module.exports = router;
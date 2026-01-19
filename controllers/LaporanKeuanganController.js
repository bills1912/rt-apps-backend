const { LaporanKeuangan, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const PDFDocument = require('pdfkit');

module.exports = class LaporanKeuanganController {
    // Create laporan keuangan
    static async create(req, res) {
        try {
            const { user } = req;
            const { 
                tanggal, 
                jenisTransaksi, 
                kategori, 
                pihakKetiga, 
                jumlah, 
                keterangan,
                periode 
            } = req.body;

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can create financial report' });
            }

            const payload = {
                tanggal: dayjs(tanggal).toDate(),
                jenisTransaksi,
                kategori,
                pihakKetiga,
                jumlah: parseFloat(jumlah),
                keterangan,
                periode: periode || dayjs(tanggal).format('YYYY-MM'),
                buktiTransaksi: [],
                createdBy: user.id
            };

            const laporan = await LaporanKeuangan.create(payload);

            return res.status(201).json({
                message: 'Laporan keuangan berhasil dibuat',
                data: laporan
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get all laporan (with filter by periode)
    static async getAll(req, res) {
        try {
            const { user } = req;
            const { periode, jenisTransaksi } = req.query;

            if (user.role !== 'admin' && user.role !== 'rt' && user.role !== 'user') {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            const whereClause = {};
            if (periode) {
                whereClause.periode = periode;
            }
            if (jenisTransaksi) {
                whereClause.jenisTransaksi = jenisTransaksi;
            }

            const laporan = await LaporanKeuangan.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'role']
                    }
                ],
                order: [['tanggal', 'DESC']]
            });

            console.log(`📊 Found ${laporan.length} laporan records for periode: ${periode || 'all'}`);

            return res.status(200).json({ data: laporan });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get summary by periode
    static async getSummary(req, res) {
        try {
            const { user } = req;
            const { periode } = req.query;

            if (!['admin', 'rt', 'user'].includes(user.role)) {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            const whereClause = periode ? { periode } : {};

            const laporan = await LaporanKeuangan.findAll({
                where: whereClause,
                raw: true
            });

            // Calculate summary
            const summaryMap = {};
            
            laporan.forEach(item => {
                const period = item.periode;
                
                if (!summaryMap[period]) {
                    summaryMap[period] = {
                        periode: period,
                        pemasukan: 0,
                        pengeluaran: 0,
                        saldo: 0
                    };
                }
                
                if (item.jenisTransaksi === 'pemasukan') {
                    summaryMap[period].pemasukan += parseFloat(item.jumlah);
                } else {
                    summaryMap[period].pengeluaran += parseFloat(item.jumlah);
                }
                
                summaryMap[period].saldo = 
                    summaryMap[period].pemasukan - 
                    summaryMap[period].pengeluaran;
            });

            return res.status(200).json({ 
                data: Object.values(summaryMap)
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get by ID
    static async getById(req, res) {
        try {
            const { user } = req;
            const { id } = req.params;

            const laporan = await LaporanKeuangan.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'role']
                    }
                ]
            });

            if (!laporan) {
                return res.status(404).json({ error: 'Laporan not found' });
            }

            return res.status(200).json({ data: laporan });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Update laporan
    static async update(req, res) {
        try {
            const { user } = req;
            const { id } = req.params;
            const { 
                tanggal, 
                jenisTransaksi, 
                kategori, 
                pihakKetiga, 
                jumlah, 
                keterangan 
            } = req.body;

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can update' });
            }

            const laporan = await LaporanKeuangan.findByPk(id);
            if (!laporan) {
                return res.status(404).json({ error: 'Laporan not found' });
            }

            const updateData = {};
            if (tanggal) updateData.tanggal = dayjs(tanggal).toDate();
            if (jenisTransaksi) updateData.jenisTransaksi = jenisTransaksi;
            if (kategori) updateData.kategori = kategori;
            if (pihakKetiga !== undefined) updateData.pihakKetiga = pihakKetiga;
            if (jumlah) updateData.jumlah = parseFloat(jumlah);
            if (keterangan !== undefined) updateData.keterangan = keterangan;

            await laporan.update(updateData);

            return res.status(200).json({
                message: 'Laporan updated successfully',
                data: laporan
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Delete laporan
    static async delete(req, res) {
        try {
            const { user } = req;
            const { id } = req.params;

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can delete' });
            }

            const laporan = await LaporanKeuangan.findByPk(id);
            if (!laporan) {
                return res.status(404).json({ error: 'Laporan not found' });
            }

            await laporan.destroy();

            return res.status(200).json({
                message: 'Laporan deleted successfully'
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get list of available periods
    static async getPeriods(req, res) {
        try {
            const periods = await LaporanKeuangan.findAll({
                attributes: [[LaporanKeuangan.sequelize.fn('DISTINCT', LaporanKeuangan.sequelize.col('periode')), 'periode']],
                order: [['periode', 'DESC']],
                raw: true
            });

            return res.status(200).json({ 
                data: periods.map(p => p.periode) 
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Export to PDF
    static async exportPDF(req, res) {
        try {
            const { user } = req;
            const { periode } = req.query;

            if (user.role !== 'admin' && user.role !== 'rt') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const whereClause = periode ? { periode } : {};
            
            const laporan = await LaporanKeuangan.findAll({
                where: whereClause,
                order: [['tanggal', 'ASC']]
            });

            // Calculate totals
            let totalPemasukan = 0;
            let totalPengeluaran = 0;
            
            laporan.forEach(item => {
                if (item.jenisTransaksi === 'pemasukan') {
                    totalPemasukan += parseFloat(item.jumlah);
                } else {
                    totalPengeluaran += parseFloat(item.jumlah);
                }
            });

            const saldoAkhir = totalPemasukan - totalPengeluaran;

            // Create PDF
            const doc = new PDFDocument({ margin: 50 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=laporan-keuangan-${periode || 'all'}.pdf`);
            
            doc.pipe(res);

            // Header
            doc.fontSize(20).text('Laporan Keuangan RT', { align: 'center' });
            doc.fontSize(12).text(`Periode: ${periode || 'Semua'}`, { align: 'center' });
            doc.moveDown();

            // Summary
            doc.fontSize(14).text('Ringkasan:', { underline: true });
            doc.fontSize(12);
            doc.text(`Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}`);
            doc.text(`Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`);
            doc.text(`Saldo Akhir: Rp ${saldoAkhir.toLocaleString('id-ID')}`, { 
                color: saldoAkhir >= 0 ? 'green' : 'red' 
            });
            doc.moveDown();

            // Table Header
            doc.fontSize(10);
            const tableTop = doc.y;
            const col1 = 50;
            const col2 = 120;
            const col3 = 220;
            const col4 = 320;
            const col5 = 420;

            doc.text('Tanggal', col1, tableTop);
            doc.text('Jenis', col2, tableTop);
            doc.text('Kategori', col3, tableTop);
            doc.text('Pihak Ketiga', col4, tableTop);
            doc.text('Jumlah', col5, tableTop);

            doc.moveTo(col1, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Table Content
            laporan.forEach(item => {
                const y = doc.y;
                doc.text(dayjs(item.tanggal).format('DD/MM/YYYY'), col1, y);
                doc.text(item.jenisTransaksi, col2, y);
                doc.text(item.kategori, col3, y);
                doc.text(item.pihakKetiga || '-', col4, y);
                doc.text(`Rp ${parseFloat(item.jumlah).toLocaleString('id-ID')}`, col5, y);
                doc.moveDown(0.5);
            });

            doc.end();

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }
};
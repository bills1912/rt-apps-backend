const { LaporanKeuangan, User, Notification, PublishedLaporan } = require('../models');
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

            if (user.role !== 'admin' && user.role !== 'rt') {
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

    // Publish laporan to warga
    static async publishToWarga(req, res) {
        try {
            const { user } = req;
            const { periode } = req.body;

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can publish' });
            }

            // Check if already published
            const existingPublish = await PublishedLaporan.findOne({
                where: { periode }
            });

            if (existingPublish) {
                return res.status(400).json({ 
                    error: 'Laporan periode ini sudah dipublikasikan' 
                });
            }

            // Create published record
            await PublishedLaporan.create({
                periode,
                publishedBy: user.id,
                publishedAt: new Date()
            });

            // Create notification for all users
            const users = await User.findAll({
                where: { role: 'user' }
            });

            const notifications = users.map(u => ({
                userId: u.id,
                forRole: 'user',
                isGlobal: false,
                type: 'laporan_published',
                title: 'Laporan Keuangan Dipublikasi',
                message: `Laporan keuangan periode ${dayjs(periode + '-01').format('MMMM YYYY')} telah dipublikasikan.`,
                tagihanId: null
            }));

            await Notification.bulkCreate(notifications);

            return res.status(200).json({ 
                message: 'Laporan berhasil dipublikasikan',
                notificationsSent: notifications.length
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get published reports (for users)
    static async getPublished(req, res) {
        try {
            const { user } = req;
            const { periode } = req.query;

            if (user.role !== 'user') {
                return res.status(403).json({ error: 'Only users can view published reports' });
            }

            // Get published periods
            const publishedPeriods = await PublishedLaporan.findAll({
                attributes: ['periode'],
                raw: true
            });

            const periodsList = publishedPeriods.map(p => p.periode);

            if (periodsList.length === 0) {
                return res.status(200).json({ data: [] });
            }

            const whereClause = {
                periode: { [Op.in]: periodsList }
            };

            if (periode) {
                whereClause.periode = periode;
            }

            const laporan = await LaporanKeuangan.findAll({
                where: whereClause,
                attributes: ['id', 'tanggal', 'jenisTransaksi', 'kategori', 
                           'pihakKetiga', 'jumlah', 'keterangan', 'periode'],
                order: [['tanggal', 'DESC']]
            });

            return res.status(200).json({ data: laporan });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get published summary (for users)
    static async getPublishedSummary(req, res) {
        try {
            const { user } = req;
            const { periode } = req.query;

            if (user.role !== 'user') {
                return res.status(403).json({ error: 'Only users can view published reports' });
            }

            // Get published periods
            const publishedPeriods = await PublishedLaporan.findAll({
                attributes: ['periode'],
                raw: true
            });

            const periodsList = publishedPeriods.map(p => p.periode);

            if (periodsList.length === 0) {
                return res.status(200).json({ data: [] });
            }

            const whereClause = {
                periode: { [Op.in]: periodsList }
            };

            if (periode) {
                whereClause.periode = periode;
            }

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

    // Export to PDF (existing code)
    static async exportPDF(req, res) {
        // ... keep existing exportPDF code ...
    }
};
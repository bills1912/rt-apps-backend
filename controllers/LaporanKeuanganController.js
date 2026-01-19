const { LaporanKeuangan, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

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

            // Only admin can create
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

            // Admin and RT can access
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

            // Admin, RT, and User can access
            if (!['admin', 'rt', 'user'].includes(user.role)) {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            const whereClause = periode ? { periode } : {};

            const laporan = await LaporanKeuangan.findAll({
                where: whereClause,
                attributes: [
                    'periode',
                    'jenisTransaksi',
                    [sequelize.fn('SUM', sequelize.col('jumlah')), 'total']
                ],
                group: ['periode', 'jenisTransaksi'],
                raw: true
            });

            // Calculate summary
            const summary = {};
            laporan.forEach(item => {
                if (!summary[item.periode]) {
                    summary[item.periode] = {
                        periode: item.periode,
                        pemasukan: 0,
                        pengeluaran: 0,
                        saldo: 0
                    };
                }
                
                if (item.jenisTransaksi === 'pemasukan') {
                    summary[item.periode].pemasukan = parseFloat(item.total);
                } else {
                    summary[item.periode].pengeluaran = parseFloat(item.total);
                }
                
                summary[item.periode].saldo = 
                    summary[item.periode].pemasukan - 
                    summary[item.periode].pengeluaran;
            });

            return res.status(200).json({ 
                data: Object.values(summary)
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

            // Only admin can update
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

            // Only admin can delete
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
                attributes: [
                    [sequelize.fn('DISTINCT', sequelize.col('periode')), 'periode']
                ],
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
};

// Add sequelize import at top if not exist
const { sequelize } = require('../models');
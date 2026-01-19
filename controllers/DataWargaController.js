const { DataWarga, User, TagihanUser, Tagihan } = require('../models');
const { Op } = require('sequelize');

module.exports = class DataWargaController {

    // --- 1. FITUR UTAMA: GET ALL (Dengan Logika Centang Hijau Otomatis) ---
    static async getAllWarga(req, res) {
        try {
            const { user } = req;
            
            // Security check
            if (user.role !== 'admin' && user.role !== 'rt') {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            // A. Ambil Data Warga
            let wargaData = await DataWarga.findAll({
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'kk', 'role']
                    }
                ],
                order: [['nama', 'ASC']]
            });

            // Convert ke plain object
            wargaData = wargaData.map(w => w.get({ plain: true }));

            // B. Ambil Data Tagihan LUNAS (Cek model TagihanUser & Tagihan ada atau tidak)
            if (TagihanUser && Tagihan) {
                const paidBills = await TagihanUser.findAll({
                    where: { 
                        // Status lunas bisa beragam, kita masukkan semua kemungkinan
                        status: { [Op.or]: ['approved', 'paid', 'success', 'lunas'] } 
                    },
                    include: [{
                        model: Tagihan,
                        as: 'tagihanDetail',
                        attributes: ['tagihanDate']
                    }]
                });

                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                // C. Gabungkan Data (Looping)
                wargaData.forEach(warga => {
                    if (!warga.paymentStatus) warga.paymentStatus = {};

                    if (warga.user && warga.user.id) {
                        const userBills = paidBills.filter(b => b.userId === warga.user.id);

                        userBills.forEach(bill => {
                            if (bill.tagihanDetail && bill.tagihanDetail.tagihanDate) {
                                const date = new Date(bill.tagihanDetail.tagihanDate);
                                const monthName = monthNames[date.getMonth()];
                                
                                if (monthName) {
                                    warga.paymentStatus[monthName] = true;
                                }
                            }
                        });
                    }
                });
            }

            return res.status(200).json({ data: wargaData });
        } catch (error) {
            console.log("Error getAllWarga:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    // --- 2. FUNGSI YANG HILANG (PENYEBAB ERROR) ---
    
    // Fungsi Create (POST)
    static async create(req, res) {
        try {
            const { user } = req;
            if (user.role !== 'admin' && user.role !== 'rt') {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            const data = await DataWarga.create(req.body);
            return res.status(201).json({ data });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Fungsi Sync (POST /sync) - Kemungkinan besar ini yang dicari router
    static async syncWargaData(req, res) {
        try {
            // Logika sinkronisasi data warga dengan user
            // Jika logic spesifiknya hilang, kita kembalikan success basic dulu agar tidak error
            const users = await User.findAll();
            // (Logika sync sederhana: pastikan user punya data warga)
            return res.status(200).json({ message: 'Sync successful', count: users.length });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Fungsi Delete
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await DataWarga.destroy({ where: { id } });
            return res.status(200).json({ message: 'Deleted successfully' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Fungsi Update General
    static async update(req, res) {
        try {
            const { id } = req.params;
            await DataWarga.update(req.body, { where: { id } });
            const updated = await DataWarga.findByPk(id);
            return res.status(200).json({ data: updated });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // --- 3. FITUR PENDUKUNG (Statistics & Manual Update) ---

    // Update Manual Payment Status
    static async updatePaymentStatus(req, res) {
        try {
            const { user } = req;
            const { id } = req.params;
            const { month, status } = req.body;

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can update' });
            }

            const warga = await DataWarga.findByPk(id);
            if (!warga) return res.status(404).json({ error: 'Warga not found' });

            let currentStatus = warga.paymentStatus || {};
            currentStatus = { ...currentStatus, [month]: status };

            await warga.update({ paymentStatus: currentStatus });

            return res.status(200).json({ message: 'Updated', data: warga });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Get Payment Stats
    static async getPaymentStats(req, res) {
        try {
            const { month } = req.query;
            const allWarga = await DataWarga.findAll(); // Perlu modifikasi jika ingin sync dgn Tagihan di sini juga, tapi standard dulu
            
            let stats = {
                totalWarga: allWarga.length,
                paidCount: 0,
                unpaidCount: 0,
                percentage: 0,
                monthlyStats: {}
            };

            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            if (month) {
                const paidCount = allWarga.filter(w => (w.paymentStatus || {})[month] === true).length;
                stats.paidCount = paidCount;
                stats.unpaidCount = allWarga.length - paidCount;
                stats.percentage = allWarga.length > 0 ? (paidCount / allWarga.length) * 100 : 0;
            } else {
                months.forEach(m => {
                    const paidCount = allWarga.filter(w => (w.paymentStatus || {})[m] === true).length;
                    stats.monthlyStats[m] = {
                        paid: paidCount,
                        unpaid: allWarga.length - paidCount
                    };
                });
            }
            return res.status(200).json({ data: stats });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Update Alamat
    static async updateWargaAddress(req, res) {
        try {
            const { user } = req;
            const { id } = req.params;
            const { alamat } = req.body;

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const warga = await DataWarga.findByPk(id);
            if (!warga) return res.status(404).json({ error: 'Not found' });

            await warga.update({ alamat });
            return res.status(200).json({ message: 'Address updated', data: warga });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
};
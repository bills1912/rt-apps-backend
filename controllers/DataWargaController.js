const { DataWarga, User, TagihanUser, Tagihan } = require('../models'); // Pastikan semua model di-import
const { Op } = require('sequelize');

module.exports = class DataWargaController {
    
    // Get all warga with payment status
    static async getAllWarga(req, res) {
        try {
            const { user } = req;
            
            // Only admin and RT can access
            if (user.role !== 'admin' && user.role !== 'rt') {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            // 1. Ambil Data Warga
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

            // Ubah ke plain object agar bisa diedit
            wargaData = wargaData.map(w => w.get({ plain: true }));

            // 2. Ambil Data Tagihan yang LUNAS
            // Cek apakah model Tagihan tersedia untuk menghindari crash
            if (TagihanUser && Tagihan) {
                const paidBills = await TagihanUser.findAll({
                    where: { 
                        // Sesuaikan status dengan database Anda ('approved', 'paid', 'success', 'lunas')
                        status: { [Op.or]: ['approved', 'paid', 'success', 'lunas'] } 
                    },
                    include: [{
                        model: Tagihan,
                        as: 'tagihanDetail',
                        attributes: ['tagihanDate']
                    }]
                });

                // List nama bulan hardcoded agar tidak error locale/bahasa
                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                // 3. Mapping Pembayaran ke Warga
                wargaData.forEach(warga => {
                    // Inisialisasi object paymentStatus jika null
                    if (!warga.paymentStatus) warga.paymentStatus = {};

                    // Jika warga terhubung dengan user
                    if (warga.user && warga.user.id) {
                        // Cari semua tagihan milik user ini
                        const userBills = paidBills.filter(b => b.userId === warga.user.id);

                        userBills.forEach(bill => {
                            // Cek kelengkapan data tagihan
                            if (bill.tagihanDetail && bill.tagihanDetail.tagihanDate) {
                                const date = new Date(bill.tagihanDetail.tagihanDate);
                                const monthIndex = date.getMonth(); // 0 - 11
                                const monthName = monthNames[monthIndex]; // Ambil nama bulan dari array
                                
                                if (monthName) {
                                    warga.paymentStatus[monthName] = true;
                                }
                            }
                        });
                    }
                });
            } else {
                console.log("Warning: Model TagihanUser atau Tagihan tidak ditemukan/null");
            }

            return res.status(200).json({ data: wargaData });
        } catch (error) {
            console.log("Error di getAllWarga:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Update payment status for specific month (Manual Toggle)
    static async updatePaymentStatus(req, res) {
        try {
            const { user } = req;
            const { id } = req.params;
            const { month, status } = req.body;

            // Only admin can update
            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can update payment status' });
            }

            const warga = await DataWarga.findByPk(id);
            if (!warga) {
                return res.status(404).json({ error: 'Warga not found' });
            }

            let currentStatus = warga.paymentStatus || {};
            
            // Update status for specific month
            currentStatus = {
                ...currentStatus,
                [month]: status
            };

            await warga.update({ paymentStatus: currentStatus });

            return res.status(200).json({ 
                message: 'Payment status updated',
                data: warga 
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get payment statistics
    static async getPaymentStats(req, res) {
        try {
            const { month } = req.query;
            
            const allWarga = await DataWarga.findAll();
            
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

            // Jika ada filter bulan tertentu
            if (month) {
                const paidCount = allWarga.filter(w => {
                    const status = w.paymentStatus || {};
                    return status[month] === true;
                }).length;

                stats.paidCount = paidCount;
                stats.unpaidCount = allWarga.length - paidCount;
                stats.percentage = allWarga.length > 0 ? (paidCount / allWarga.length) * 100 : 0;
            } else {
                // Statistik untuk semua bulan
                months.forEach(m => {
                    const paidCount = allWarga.filter(w => {
                        const status = w.paymentStatus || {};
                        return status[m] === true;
                    }).length;
                    
                    stats.monthlyStats[m] = {
                        paid: paidCount,
                        unpaid: allWarga.length - paidCount
                    };
                });
            }

            return res.status(200).json({ data: stats });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Update warga address
    static async updateWargaAddress(req, res) {
        try {
            const { user } = req;
            const { id } = req.params;
            const { alamat } = req.body;

            // Only admin can update
            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can update address' });
            }

            const warga = await DataWarga.findByPk(id);
            if (!warga) {
                return res.status(404).json({ error: 'Warga not found' });
            }

            await warga.update({ alamat });

            return res.status(200).json({ 
                message: 'Address updated successfully',
                data: warga 
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }
};
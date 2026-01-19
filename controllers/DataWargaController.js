const { DataWarga, User, TagihanUser, Tagihan } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

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

            console.log(`👥 Found ${wargaData.length} warga records`);

            // Convert ke plain object
            wargaData = wargaData.map(w => w.get({ plain: true }));

            // B. Ambil Data Tagihan LUNAS
            const paidBills = await TagihanUser.findAll({
                where: { 
                    status: 'verified'
                },
                include: [{
                    model: Tagihan,
                    as: 'tagihanDetail',
                    attributes: ['tagihanDate']
                }]
            });

            console.log(`💰 Found ${paidBills.length} verified payments`);

            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            // C. Gabungkan Data (Looping)
            wargaData.forEach(warga => {
                if (!warga.paymentStatus) warga.paymentStatus = {};

                if (warga.user && warga.user.id) {
                    const userBills = paidBills.filter(b => b.userId === warga.user.id);

                    console.log(`📋 User ${warga.user.name} (ID: ${warga.user.id}) has ${userBills.length} verified bills`);

                    userBills.forEach(bill => {
                        if (bill.tagihanDetail && bill.tagihanDetail.tagihanDate) {
                            const date = new Date(bill.tagihanDetail.tagihanDate);
                            const monthName = monthNames[date.getMonth()];
                            
                            console.log(`  ✅ Paid in ${monthName} (${date.toISOString()})`);
                            
                            if (monthName) {
                                warga.paymentStatus[monthName] = true;
                            }
                        }
                    });
                }
            });

            console.log('✅ Data warga with payment status prepared');

            return res.status(200).json({ data: wargaData });
        } catch (error) {
            console.error("❌ Error getAllWarga:", error);
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

    // Fungsi Sync (POST /sync) - Sinkronisasi user ke data warga
    static async syncWargaData(req, res) {
        try {
            const users = await User.findAll({
                where: { role: 'user' }
            });

            let syncedCount = 0;
            let skippedCount = 0;

            for (const user of users) {
                // Check if data warga already exists
                const existingWarga = await DataWarga.findOne({
                    where: { userId: user.id }
                });

                if (existingWarga) {
                    skippedCount++;
                    continue;
                }

                // Create new data warga
                await DataWarga.create({
                    userId: user.id,
                    nama: user.name,
                    alamat: 'Belum diisi', // Default address
                    paymentStatus: {}
                });

                syncedCount++;
            }

            return res.status(200).json({ 
                message: 'Sync successful',
                synced: syncedCount,
                skipped: skippedCount,
                total: users.length
            });
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
            
            console.log('📊 Getting payment stats for month:', month);
            
            // Get all warga with their user data
            const allWarga = await DataWarga.findAll({
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name'],
                    where: { role: 'user' }
                }]
            });
            
            console.log(`👥 Total warga found: ${allWarga.length}`);
            
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

            // Ambil SEMUA pembayaran verified
            const paidBills = await TagihanUser.findAll({
                where: { status: 'verified' },
                include: [{
                    model: Tagihan,
                    as: 'tagihanDetail',
                    attributes: ['tagihanDate'],
                    required: true
                }],
                attributes: ['userId', 'status']
            });

            console.log(`💰 Total verified payments found: ${paidBills.length}`);

            if (month) {
                // Stats untuk bulan tertentu
                const paidUserIds = new Set();
                
                paidBills.forEach(bill => {
                    if (bill.tagihanDetail && bill.tagihanDetail.tagihanDate) {
                        const billDate = new Date(bill.tagihanDetail.tagihanDate);
                        const billMonth = months[billDate.getMonth()];
                        
                        console.log(`📅 Bill from user ${bill.userId}: ${billMonth}`);
                        
                        if (billMonth === month) {
                            paidUserIds.add(bill.userId);
                            console.log(`✅ User ${bill.userId} paid in ${month}`);
                        }
                    }
                });

                stats.paidCount = paidUserIds.size;
                stats.unpaidCount = allWarga.length - stats.paidCount;
                stats.percentage = allWarga.length > 0 ? (stats.paidCount / allWarga.length) * 100 : 0;
                
                console.log(`📈 Stats for ${month}: ${stats.paidCount} paid, ${stats.unpaidCount} unpaid`);
            } else {
                // Monthly stats untuk semua bulan
                months.forEach(m => {
                    const paidUserIds = new Set();
                    
                    paidBills.forEach(bill => {
                        if (bill.tagihanDetail && bill.tagihanDetail.tagihanDate) {
                            const billDate = new Date(bill.tagihanDetail.tagihanDate);
                            const billMonth = months[billDate.getMonth()];
                            
                            if (billMonth === m) {
                                paidUserIds.add(bill.userId);
                            }
                        }
                    });

                    stats.monthlyStats[m] = {
                        paid: paidUserIds.size,
                        unpaid: allWarga.length - paidUserIds.size
                    };
                });
            }
            
            return res.status(200).json({ data: stats });
        } catch (error) {
            console.error('❌ Error in getPaymentStats:', error);
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
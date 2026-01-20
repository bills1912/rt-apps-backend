const { DataWarga, User, TagihanUser, Tagihan } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

module.exports = class DataWargaController {

    // --- 1. FITUR UTAMA: GET ALL (Dengan Logika Centang Hijau Otomatis + Pagination + Search) ---
    static async getAllWarga(req, res) {
        try {
            const { user, query } = req;
            const { page = 1, limit = 10, search = '' } = query;
            
            // Security check
            if (user.role !== 'admin' && user.role !== 'rt') {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            // Build search condition
            const whereClause = {};
            if (search && search.trim() !== '') {
                whereClause.nama = { [Op.like]: `%${search}%` };
            }

            // Calculate offset
            const offset = (parseInt(page) - 1) * parseInt(limit);

            // A. Get total count for pagination
            const totalCount = await DataWarga.count({
                where: whereClause,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id'],
                    where: { role: 'user' }
                }]
            });

            // B. Ambil Data Warga with pagination
            let wargaData = await DataWarga.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'kk', 'role']
                    }
                ],
                order: [['nama', 'ASC']],
                limit: parseInt(limit),
                offset: offset
            });

            console.log(`👥 Found ${wargaData.length} warga records (Page ${page}, Search: "${search}")`);

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

            // Prepare pagination metadata
            const totalPages = Math.ceil(totalCount / parseInt(limit));
            const pagination = {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalItems: totalCount,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            };

            return res.status(200).json({ 
                data: wargaData,
                pagination: pagination
            });
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

    // Get Payment Stats - PERBAIKAN UTAMA
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

            // PERBAIKAN: Selalu return monthlyStats
            let stats = {
                totalWarga: allWarga.length,
                monthlyStats: {}
            };

            if (month) {
                // Stats untuk bulan tertentu
                const paidUserIds = new Set();
                
                paidBills.forEach(bill => {
                    if (bill.tagihanDetail && bill.tagihanDetail.tagihanDate) {
                        const billDate = new Date(bill.tagihanDetail.tagihanDate);
                        const billMonth = months[billDate.getMonth()];
                        
                        if (billMonth === month) {
                            paidUserIds.add(bill.userId);
                        }
                    }
                });

                const paidCount = paidUserIds.size;
                const unpaidCount = allWarga.length - paidCount;
                
                // PERBAIKAN: Tambahkan ke monthlyStats
                stats.monthlyStats[month] = {
                    paid: paidCount,
                    unpaid: unpaidCount
                };
                
                console.log(`📈 Stats for ${month}: ${paidCount} paid, ${unpaidCount} unpaid`);
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
            
            console.log('📊 Final stats:', JSON.stringify(stats, null, 2));
            
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
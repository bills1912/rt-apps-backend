const { DataWarga, User } = require('../models');
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

            const wargaData = await DataWarga.findAll({
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'kk', 'role']
                    }
                ],
                order: [['nama', 'ASC']]
            });

            return res.status(200).json({ data: wargaData });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Update payment status for specific month
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

            // Update payment status for specific month
            const currentStatus = warga.paymentStatus || {};
            currentStatus[month] = status;

            await warga.update({
                paymentStatus: currentStatus
            });

            return res.status(200).json({ 
                message: 'Payment status updated successfully',
                data: warga 
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Sync all users to data_warga (run this once or when new users are added)
    static async syncWargaData(req, res) {
        try {
            const { user } = req;

            // Only admin can sync
            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can sync data' });
            }

            // Get all users with role 'user'
            const users = await User.findAll({
                where: { role: 'user' }
            });

            const defaultPaymentStatus = {
                January: false,
                February: false,
                March: false,
                April: false,
                May: false,
                June: false,
                July: false,
                August: false,
                September: false,
                October: false,
                November: false,
                December: false
            };

            // Create or update data_warga entries
            for (const user of users) {
                const [warga, created] = await DataWarga.findOrCreate({
                    where: { userId: user.id },
                    defaults: {
                        userId: user.id,
                        nama: user.name,
                        alamat: '-', // Default value, should be updated
                        paymentStatus: defaultPaymentStatus
                    }
                });

                if (!created) {
                    // Update nama if changed
                    await warga.update({
                        nama: user.name
                    });
                }
            }

            return res.status(200).json({ 
                message: 'Data warga synced successfully',
                totalSynced: users.length 
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Get payment statistics
    static async getPaymentStats(req, res) {
        try {
            const { user } = req;
            const { month } = req.query;

            // Only admin and RT can access
            if (user.role !== 'admin' && user.role !== 'rt') {
                return res.status(403).json({ error: 'Unauthorized access' });
            }

            const allWarga = await DataWarga.findAll();
            
            let stats = {
                totalWarga: allWarga.length,
                monthlyStats: {}
            };

            if (month) {
                // Get stats for specific month
                const paidCount = allWarga.filter(w => w.paymentStatus[month] === true).length;
                stats.monthlyStats[month] = {
                    paid: paidCount,
                    unpaid: allWarga.length - paidCount
                };
            } else {
                // Get stats for all months
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
                
                months.forEach(month => {
                    const paidCount = allWarga.filter(w => w.paymentStatus[month] === true).length;
                    stats.monthlyStats[month] = {
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
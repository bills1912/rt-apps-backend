const { TagihanUser, User, LaporanKeuangan } = require('./models');
const dayjs = require('dayjs');

async function migrateVerifiedPayments() {
    try {
        console.log('🔄 Starting migration of verified payments to laporan keuangan...');
        
        // Get all verified tagihan_users
        const verifiedPayments = await TagihanUser.findAll({
            where: { status: 'verified' },
            include: [{ model: User, as: 'user' }]
        });

        console.log(`📊 Found ${verifiedPayments.length} verified payments`);

        let successCount = 0;
        let skipCount = 0;

        for (const payment of verifiedPayments) {
            try {
                // Parse tagihan snapshot
                let tagihanSnapshot = payment.tagihanSnapshot;
                if (typeof tagihanSnapshot === 'string') {
                    tagihanSnapshot = JSON.parse(tagihanSnapshot);
                }

                // Check if already exists in laporan
                const existingLaporan = await LaporanKeuangan.findOne({
                    where: {
                        kategori: 'Iuran Warga',
                        pihakKetiga: payment.user ? payment.user.name : 'Warga',
                        jumlah: tagihanSnapshot.totalPrice,
                        periode: dayjs(tagihanSnapshot.tagihanDate).format('YYYY-MM')
                    }
                });

                if (existingLaporan) {
                    console.log(`⏭️  Skipping payment ID ${payment.id} - already exists in laporan`);
                    skipCount++;
                    continue;
                }

                // Create laporan pemasukan
                await LaporanKeuangan.create({
                    tanggal: payment.updatedAt || dayjs().toDate(),
                    jenisTransaksi: 'pemasukan',
                    kategori: 'Iuran Warga',
                    pihakKetiga: payment.user ? payment.user.name : 'Warga',
                    jumlah: tagihanSnapshot.totalPrice,
                    keterangan: `Pembayaran ${tagihanSnapshot.tagihanName || 'Iuran'} - ${payment.user ? payment.user.name : 'Warga'}`,
                    periode: dayjs(tagihanSnapshot.tagihanDate).format('YYYY-MM'),
                    buktiTransaksi: [],
                    createdBy: 1 // Default admin ID, adjust if needed
                });

                console.log(`✅ Migrated payment ID ${payment.id} - ${payment.user ? payment.user.name : 'Warga'} - Rp ${tagihanSnapshot.totalPrice}`);
                successCount++;

            } catch (itemError) {
                console.error(`❌ Error migrating payment ID ${payment.id}:`, itemError.message);
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`✅ Successfully migrated: ${successCount}`);
        console.log(`⏭️  Skipped (already exists): ${skipCount}`);
        console.log(`❌ Failed: ${verifiedPayments.length - successCount - skipCount}`);
        console.log('\n🎉 Migration completed!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateVerifiedPayments();
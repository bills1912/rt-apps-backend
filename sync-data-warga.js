const { User, DataWarga } = require('./models');

async function syncDataWarga() {
    try {
        console.log('🔄 Starting sync of users to data_warga...');
        
        // Get all users with role 'user'
        const users = await User.findAll({
            where: { role: 'user' }
        });

        console.log(`📊 Found ${users.length} users`);

        let syncedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            try {
                // Check if data warga already exists
                const existingWarga = await DataWarga.findOne({
                    where: { userId: user.id }
                });

                if (existingWarga) {
                    console.log(`⏭️  Skipping user ID ${user.id} (${user.name}) - already exists`);
                    skippedCount++;
                    continue;
                }

                // Create new data warga
                await DataWarga.create({
                    userId: user.id,
                    nama: user.name,
                    alamat: 'Belum diisi', // Default address
                    paymentStatus: {} // Will be auto-populated from tagihan_users
                });

                console.log(`✅ Synced user ID ${user.id} - ${user.name}`);
                syncedCount++;

            } catch (itemError) {
                console.error(`❌ Error syncing user ID ${user.id}:`, itemError.message);
            }
        }

        console.log('\n📈 Sync Summary:');
        console.log(`✅ Successfully synced: ${syncedCount}`);
        console.log(`⏭️  Skipped (already exists): ${skippedCount}`);
        console.log(`❌ Failed: ${users.length - syncedCount - skippedCount}`);
        console.log('\n🎉 Sync completed!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

syncDataWarga();
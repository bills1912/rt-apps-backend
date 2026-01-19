const bcrypt = require('bcrypt');
const { User } = require('./models');

async function generateRTUser() {
    try {
        const payload = {
            kk: '0000000000000002',
            email: 'rt@example.com',
            password: bcrypt.hashSync('testrt', 10),
            name: 'Ketua RT',
            role: 'rt'
        }

        const user = await User.create(payload)
        console.log('RT user created successfully:', user.toJSON());
        
        console.log('\nLogin credentials:');
        console.log('KK: 0000000000000002');
        console.log('Password: testrt');
        
        process.exit(0);
    } catch (error) {
        console.log('Error creating RT user:', error);
        process.exit(1);
    }
}

generateRTUser()
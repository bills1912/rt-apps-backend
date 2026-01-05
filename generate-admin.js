const bcrypt = require('bcrypt');
const { User } = require('./models');

async function generateAdmin() {
    try {
        const payload = {
            kk: '0000000000000001',
            email: 'admin@example.com',
            password: bcrypt.hashSync('testadmin', 10),
            name: 'Admin RT',
            role: 'admin'
        }

        const user = await User.create(payload)
        console.log('Admin created successfully:', user.toJSON());
        process.exit(0);
    } catch (error) {
        console.log('Error creating admin:', error);
        process.exit(1);
    }
}
generateAdmin()
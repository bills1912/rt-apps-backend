const axios = require('axios');

const BASE_URL = 'http://localhost:5001'; // Adjust port if needed

async function testAuth() {
    const kk = '1234567890123456';
    const password = 'password123';
    const name = 'Test User';

    try {
        // 1. Register
        console.log('Testing Registration...');
        try {
            const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, {
                kk,
                password,
                name
            });
            console.log('Registration successful:', registerRes.status);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error === 'Account with the same KK already exist') {
                console.log('User already exists, proceeding to login...');
            } else {
                throw error;
            }
        }

        // 2. Login
        console.log('Testing Login...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            kk,
            password
        });
        console.log('Login successful:', loginRes.status);
        console.log('Token received:', !!loginRes.data.data.token);

        // 3. Duplicate Register
        console.log('Testing Duplicate Registration...');
        try {
            await axios.post(`${BASE_URL}/api/auth/register`, {
                kk,
                password,
                name
            });
            console.error('Duplicate registration should have failed!');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('Duplicate registration failed as expected:', error.response.data.error);
            } else {
                console.error('Unexpected error during duplicate registration:', error.message);
            }
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testAuth();

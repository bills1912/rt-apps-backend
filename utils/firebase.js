
const admin = require('firebase-admin')
const serviceAcc = require('../firebase_key.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAcc)
})

module.exports = {
    admin
}

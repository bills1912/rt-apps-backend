const multer = require('multer')
const storage = multer({
    storage: multer.memoryStorage(),
})

module.exports = storage
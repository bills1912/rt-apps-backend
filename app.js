const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const compression = require('compression')
const { loggingMiddleware, requestLogger } = require('./middlewares/logging')
const logger = require('./utils/logger')
require('dotenv').config()
const PORT = process.env.PORT || 3000;
const app = express()
const HOST = '0.0.0.0';
const http = require('http')
const server = http.createServer(app);

// Route imports
const authRoutes = require('./router/auth')
const tagihanRoutes = require('./router/tagihan')
const notificationRoutes = require('./router/notification')
const dataWargaRoutes = require('./router/data-warga')

app.use(compression())
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/public', express.static('public'))

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
})

app.use('/api', limiter)
app.use(loggingMiddleware)
app.use(requestLogger)

// Route uses
app.use('/api/auth', authRoutes)
app.use('/api/tagihan', tagihanRoutes)
app.use('/api/notification', notificationRoutes)
app.use('/api/data-warga', dataWargaRoutes)

app.use((req, res) => {
    res.status(404).json({ message: 'not found' });
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

try {
    server.listen(PORT, HOST, () => {
        console.info(`Server running on http://${HOST}:${PORT}`);
    });
} catch (error) {
    logger.error('[ERROR] Start Server')
    process.exit(1)
}
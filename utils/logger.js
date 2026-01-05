const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file')
const path = require('path')
const fs = require('fs')

const logDir = path.join(__dirname, '..', 'logs')
if(!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
} 

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logDir, '%DATE%.log'),
  datePattern: 'DD_MM_YYYY',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '60d',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'api-service' },
  transports: [
    dailyRotateFileTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

module.exports = logger;
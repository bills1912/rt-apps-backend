const morgan = require('morgan');
const logger = require('../utils/logger');

const stream = {
  write: (message) => logger.http(message.trim())
};

morgan.token('body', (req) => {
  const body = { ...req.body };
  const query = {...req.query}
  const params = {...req.params}
  // Remove sensitive data
  if (body.password) body.password = '********';
  if (body.passwordConfirm) body.passwordConfirm = '********';
  
  return JSON.stringify({body, query, params});
});

const skip = (req, res) => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test' || 
    (req.originalUrl === '/health' && res.statusCode === 200);
};

const loggingMiddleware = morgan(
  ':method :url :status :response-time ms - :res[content-length] :body',
  { stream, skip }
);

const requestLogger = (req, res, next) => {
  logger.info(`Request received: ${req.method} ${req.originalUrl} [HEADERS]: ${JSON.stringify(req.headers)}`);
  
  res.on('finish', () => {
    logger.info(
      `Response sent: ${req.method} ${req.originalUrl} ${res.statusCode}`
    );
  });
  
  next();
};

module.exports = { loggingMiddleware, requestLogger };
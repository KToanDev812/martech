import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

// Define log format
const formats = {
  json: winston.format.json(),
  pretty: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp as string} [${level}]: ${message as string}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    })
  ),
};

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    formats[logFormat as keyof typeof formats] || formats.json
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// If we're not in production, also log to the console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

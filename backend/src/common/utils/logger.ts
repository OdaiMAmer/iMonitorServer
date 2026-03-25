import winston from 'winston';
import { config } from '../../config/env.config';

const { combine, timestamp, colorize, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  if (stack) {
    return `${ts} [${level}]: ${message}\n${stack}${metaString}`;
  }
  return `${ts} [${level}]: ${message}${metaString}`;
});

export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    colorize(),
    logFormat,
  ),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export const morganStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

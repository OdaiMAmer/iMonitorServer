import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.config';
import { morganStream } from './common/utils/logger';
import { requestId } from './common/middleware/request-id';
import { errorHandler } from './common/middleware/error-handler';
import { AppError } from './common/utils/app-error';
import router from './routes';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: morganStream }));

app.use(requestId);

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
  }),
);

app.use(config.apiPrefix, router);

app.use((_req, _res, next) => {
  next(AppError.notFound('Route'));
});

app.use(errorHandler);

export default app;

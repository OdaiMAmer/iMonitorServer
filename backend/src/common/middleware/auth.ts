import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { config } from '../../config/env.config';
import { prisma } from '../../prisma/prisma.service';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { AppError } from '../utils/app-error';

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(AppError.unauthorized('Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    next(AppError.unauthorized('Token not provided'));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Token has expired'));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid token'));
      return;
    }
    next(AppError.unauthorized('Authentication failed'));
  }
}

export function authenticateAgent(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const agentKey = req.headers['x-agent-key'] as string | undefined;

  if (!agentKey) {
    next(AppError.unauthorized('Missing X-Agent-Key header'));
    return;
  }

  const hashedKey = createHash('sha256').update(agentKey).digest('hex');

  prisma.server
    .findFirst({
      where: {
        apiKeyHash: hashedKey,
      },
      select: {
        id: true,
        hostname: true,
      },
    })
    .then((server) => {
      if (!server) {
        next(AppError.unauthorized('Invalid agent key'));
        return;
      }

      req.agent = {
        serverId: server.id,
        hostname: server.hostname,
      };
      next();
    })
    .catch((error: Error) => {
      next(AppError.unauthorized(`Agent authentication failed: ${error.message}`));
    });
}

export function authorize(...roles: string[]) {
  return function (req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden(`Role '${req.user.role}' is not authorized for this action`));
      return;
    }

    next();
  };
}

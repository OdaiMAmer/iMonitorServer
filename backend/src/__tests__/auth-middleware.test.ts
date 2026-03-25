import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

vi.mock('../../src/config/env.config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key-for-testing',
      accessExpiration: '15m',
    },
  },
}));

vi.mock('../../src/prisma/prisma.service', () => ({
  prisma: {
    server: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../src/common/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { authenticate, authenticateAgent, authorize } from '../../src/common/middleware/auth';
import { prisma } from '../../src/prisma/prisma.service';

const mockPrisma = vi.mocked(prisma);

function createMockReqResNext() {
  const req = {
    headers: {},
    user: undefined,
    agent: undefined,
  } as any;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should set req.user for a valid JWT token', () => {
      const { req, res, next } = createMockReqResNext();
      const payload = { sub: 'user-id', email: 'test@test.com', role: 'ADMIN' };
      const token = jwt.sign(payload, 'test-secret-key-for-testing', { expiresIn: '15m' });
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.sub).toBe('user-id');
      expect(req.user.email).toBe('test@test.com');
      expect(req.user.role).toBe('ADMIN');
    });

    it('should call next with error when no authorization header', () => {
      const { req, res, next } = createMockReqResNext();

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing or invalid Authorization header',
          statusCode: 401,
        }),
      );
    });

    it('should call next with error when authorization header does not start with Bearer', () => {
      const { req, res, next } = createMockReqResNext();
      req.headers.authorization = 'Basic some-token';

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing or invalid Authorization header',
          statusCode: 401,
        }),
      );
    });

    it('should call next with error for an expired token', () => {
      const { req, res, next } = createMockReqResNext();
      const token = jwt.sign(
        { sub: 'user-id', email: 'test@test.com', role: 'ADMIN' },
        'test-secret-key-for-testing',
        { expiresIn: '0s' },
      );
      req.headers.authorization = `Bearer ${token}`;

      // Small delay to ensure token is expired
      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token has expired',
          statusCode: 401,
        }),
      );
    });

    it('should call next with error for an invalid token', () => {
      const { req, res, next } = createMockReqResNext();
      req.headers.authorization = 'Bearer invalid-jwt-token';

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        }),
      );
    });

    it('should call next with error for token signed with wrong secret', () => {
      const { req, res, next } = createMockReqResNext();
      const token = jwt.sign({ sub: 'user-id' }, 'wrong-secret', { expiresIn: '15m' });
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        }),
      );
    });
  });

  describe('authenticateAgent', () => {
    it('should set req.agent for a valid agent key', async () => {
      const { req, res, next } = createMockReqResNext();
      req.headers['x-agent-key'] = 'valid-agent-key';

      (mockPrisma.server.findFirst as any).mockResolvedValue({
        id: 'server-id',
        hostname: 'test-server',
      });

      authenticateAgent(req, res, next);

      // Wait for the promise to resolve
      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });

      expect(req.agent).toEqual({
        serverId: 'server-id',
        hostname: 'test-server',
      });
    });

    it('should call next with error when no X-Agent-Key header', () => {
      const { req, res, next } = createMockReqResNext();

      authenticateAgent(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing X-Agent-Key header',
          statusCode: 401,
        }),
      );
    });

    it('should call next with error for invalid agent key', async () => {
      const { req, res, next } = createMockReqResNext();
      req.headers['x-agent-key'] = 'invalid-key';

      (mockPrisma.server.findFirst as any).mockResolvedValue(null);

      authenticateAgent(req, res, next);

      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid agent key',
          statusCode: 401,
        }),
      );
    });
  });

  describe('authorize', () => {
    it('should allow access for user with matching role', () => {
      const { req, res, next } = createMockReqResNext();
      req.user = { sub: 'id', email: 'test@test.com', role: 'ADMIN' };

      const middleware = authorize('ADMIN', 'OPERATOR');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for user with non-matching role', () => {
      const { req, res, next } = createMockReqResNext();
      req.user = { sub: 'id', email: 'test@test.com', role: 'VIEWER' };

      const middleware = authorize('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringContaining('VIEWER'),
        }),
      );
    });

    it('should deny access when no user is set on request', () => {
      const { req, res, next } = createMockReqResNext();

      const middleware = authorize('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 401,
        }),
      );
    });

    it('should allow OPERATOR role for ADMIN,OPERATOR authorized route', () => {
      const { req, res, next } = createMockReqResNext();
      req.user = { sub: 'id', email: 'op@test.com', role: 'OPERATOR' };

      const middleware = authorize('ADMIN', 'OPERATOR');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock all dependencies
vi.mock('../../src/prisma/prisma.service', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    server: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    metric: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    processSnapshot: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    networkSnapshot: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    windowsServiceSnapshot: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    alertRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    alert: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    serverGroup: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    serverGroupMembership: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

vi.mock('../../src/config/env.config', () => ({
  config: {
    nodeEnv: 'test',
    port: 3000,
    apiPrefix: '/api/v1',
    jwt: {
      secret: 'test-secret-key-for-testing',
      accessExpiration: '15m',
      refreshExpiration: '7d',
    },
    cors: {
      origin: 'http://localhost:5173',
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 1000,
    },
    logging: {
      level: 'silent',
    },
    agent: {
      heartbeatTimeoutSeconds: 90,
      heartbeatIntervalSeconds: 30,
    },
    redis: {
      host: 'localhost',
      port: 6379,
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
  morganStream: { write: vi.fn() },
}));

vi.mock('../../src/common/utils/redis', () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
  deleteCache: vi.fn().mockResolvedValue(undefined),
  deleteCachePattern: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/gateway/socket.gateway', () => ({
  getIO: vi.fn().mockReturnValue(null),
}));

import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/prisma/prisma.service';

const mockPrisma = vi.mocked(prisma);

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('GET /api/v1/health should return 200 with status ok', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        service: 'iMonitorServer',
      });
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('Auth Flow Integration', () => {
    const passwordHash = bcrypt.hashSync('Password123', 12);
    const mockUser = {
      id: 'user-uuid-1',
      email: 'admin@example.com',
      passwordHash,
      displayName: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    it('should complete register -> login -> access protected route flow', async () => {
      // Step 1: Register a new user (requires admin token)
      const adminToken = jwt.sign(
        { sub: 'existing-admin', email: 'superadmin@test.com', role: 'ADMIN' },
        'test-secret-key-for-testing',
        { expiresIn: '15m' },
      );

      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // No existing user
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'newuser@example.com',
        displayName: 'New User',
        role: 'VIEWER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      } as any);

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass1',
          displayName: 'New User',
          role: 'VIEWER',
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);

      // Step 2: Login with the registered user
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser as any);
      mockPrisma.refreshToken.create.mockResolvedValueOnce({} as any);
      mockPrisma.user.update.mockResolvedValueOnce(mockUser as any);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'Password123' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data).toHaveProperty('accessToken');
      expect(loginRes.body.data).toHaveProperty('user');

      const accessToken = loginRes.body.data.accessToken;

      // Step 3: Access a protected route with the obtained token
      mockPrisma.server.findMany.mockResolvedValueOnce([]);
      mockPrisma.server.count.mockResolvedValueOnce(0);

      const protectedRes = await request(app)
        .get('/api/v1/servers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(protectedRes.status).toBe(200);
      expect(protectedRes.body.success).toBe(true);
    });

    it('should reject login with wrong credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('should reject protected route with no token', async () => {
      const res = await request(app).get('/api/v1/servers');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject protected route with expired token', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user-id', email: 'test@test.com', role: 'ADMIN' },
        'test-secret-key-for-testing',
        { expiresIn: '0s' },
      );

      const res = await request(app)
        .get('/api/v1/servers')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should validate login request body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: '12' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });
  });
});

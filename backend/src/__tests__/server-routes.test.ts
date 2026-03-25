import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock all dependencies before importing app
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

function createAdminToken(): string {
  return jwt.sign(
    { sub: 'admin-id', email: 'admin@test.com', role: 'ADMIN' },
    'test-secret-key-for-testing',
    { expiresIn: '15m' },
  );
}

function createViewerToken(): string {
  return jwt.sign(
    { sub: 'viewer-id', email: 'viewer@test.com', role: 'VIEWER' },
    'test-secret-key-for-testing',
    { expiresIn: '15m' },
  );
}

describe('Server Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/servers', () => {
    it('should return server list for authenticated user', async () => {
      const mockServers = [
        {
          id: 'srv-1',
          hostname: 'server-01',
          ipAddress: '10.0.0.1',
          status: 'ONLINE',
          groups: [],
        },
      ];

      mockPrisma.server.findMany.mockResolvedValue(mockServers as any);
      mockPrisma.server.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/servers')
        .set('Authorization', `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/servers');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/servers/:id', () => {
    it('should return server details for authenticated user', async () => {
      const mockServer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        hostname: 'server-01',
        ipAddress: '10.0.0.1',
        status: 'ONLINE',
        groups: [],
        metrics: [],
      };

      mockPrisma.server.findUnique.mockResolvedValue(mockServer as any);

      const res = await request(app)
        .get('/api/v1/servers/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent server', async () => {
      mockPrisma.server.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/servers/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/servers/:id', () => {
    it('should allow ADMIN to delete a server', async () => {
      const mockServer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        hostname: 'server-01',
      };

      mockPrisma.server.findUnique.mockResolvedValue(mockServer as any);
      mockPrisma.server.delete.mockResolvedValue(mockServer as any);

      const res = await request(app)
        .delete('/api/v1/servers/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${createAdminToken()}`);

      expect(res.status).toBe(204);
    });

    it('should reject VIEWER from deleting a server', async () => {
      const res = await request(app)
        .delete('/api/v1/servers/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${createViewerToken()}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/servers/:id', () => {
    it('should update a server for ADMIN', async () => {
      const mockServer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        hostname: 'server-01',
        displayName: 'Updated Server',
        groups: [],
      };

      mockPrisma.server.findUnique.mockResolvedValue(mockServer as any);
      mockPrisma.server.update.mockResolvedValue(mockServer as any);

      const res = await request(app)
        .patch('/api/v1/servers/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${createAdminToken()}`)
        .send({ displayName: 'Updated Server' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock all external dependencies before importing the service
vi.mock('../../src/prisma/prisma.service', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../src/config/env.config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key-for-testing',
      accessExpiration: '15m',
      refreshExpiration: '7d',
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

import { authService } from '../../src/modules/auth/auth.service';
import { prisma } from '../../src/prisma/prisma.service';

const mockPrisma = vi.mocked(prisma);

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      passwordHash: bcrypt.hashSync('Password123', 12),
      displayName: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    it('should return access token and user data on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      const result = await authService.login('admin@example.com', 'Password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
        role: mockUser.role,
      });

      // Verify the access token is a valid JWT
      const decoded = jwt.verify(result.accessToken, 'test-secret-key-for-testing') as any;
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw unauthorized error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', 'Password123'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw unauthorized error for deactivated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      await expect(authService.login('admin@example.com', 'Password123'))
        .rejects.toThrow('Account is deactivated');
    });

    it('should throw unauthorized error for incorrect password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(authService.login('admin@example.com', 'WrongPassword'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should store hashed refresh token in the database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await authService.login('admin@example.com', 'Password123');

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should update lastLoginAt on successful login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);

      await authService.login('admin@example.com', 'Password123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass1',
        displayName: 'New User',
        role: 'VIEWER',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      } as any);

      const result = await authService.register(userData);

      expect(result.email).toBe(userData.email);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
            passwordHash: expect.any(String),
          }),
        }),
      );

      // Verify the stored password is hashed, not plain text
      const createCall = mockPrisma.user.create.mock.calls[0][0] as any;
      expect(createCall.data.passwordHash).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, createCall.data.passwordHash)).toBe(true);
    });

    it('should throw conflict error for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'SecurePass1',
          displayName: 'Test',
        }),
      ).rejects.toThrow('Email is already in use');
    });

    it('should default role to VIEWER when not specified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'id',
        email: 'test@example.com',
        displayName: 'Test',
        role: 'VIEWER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      } as any);

      await authService.register({
        email: 'test@example.com',
        password: 'SecurePass1',
        displayName: 'Test',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'VIEWER',
          }),
        }),
      );
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: bcrypt.hashSync('OldPassword1', 12),
    };

    it('should change password and revoke all refresh tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({} as any);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 } as any);

      await authService.changePassword('user-id', 'OldPassword1', 'NewPassword1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { passwordHash: expect.any(String) },
      });

      // Verify new password hash is correct
      const updateCall = mockPrisma.user.update.mock.calls[0][0] as any;
      expect(await bcrypt.compare('NewPassword1', updateCall.data.passwordHash)).toBe(true);

      // Verify refresh tokens are revoked
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('should throw not found error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.changePassword('bad-id', 'old', 'new'))
        .rejects.toThrow('User not found');
    });

    it('should throw unauthorized error for incorrect current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(authService.changePassword('user-id', 'WrongPassword', 'NewPassword1'))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 } as any);

      await authService.logout('some-refresh-token-value');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isRevoked: true },
        }),
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const storedToken = {
        id: 'token-id',
        tokenHash: 'hashed',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-id',
          email: 'user@example.com',
          displayName: 'User',
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        },
      };

      mockPrisma.refreshToken.findFirst.mockResolvedValue(storedToken as any);
      mockPrisma.refreshToken.update.mockResolvedValue({} as any);
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);

      const result = await authService.refresh('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('user@example.com');

      // Old token should be revoked
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: { isRevoked: true },
      });
    });

    it('should throw unauthorized for invalid/expired refresh token', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(authService.refresh('invalid-token'))
        .rejects.toThrow('Invalid or expired refresh token');
    });
  });
});

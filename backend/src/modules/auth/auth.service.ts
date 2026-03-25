import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/types';
import { AppError } from '../../common/utils/app-error';
import { config } from '../../config/env.config';
import { logger } from '../../common/utils/logger';

const BCRYPT_COST = 12;

const userSelectWithoutPassword = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
};

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.unauthorized('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiration,
    } as jwt.SignOptions);

    const refreshTokenValue = crypto.randomUUID();
    const hashedRefreshToken = hashToken(refreshTokenValue);
    const refreshExpiresMs = parseDurationToMs('7d');

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async refresh(refreshTokenValue: string) {
    const hashedToken = hashToken(refreshTokenValue);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashedToken,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: userSelectWithoutPassword } },
    });

    if (!storedToken) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const user = storedToken.user;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiration,
    } as jwt.SignOptions);

    const newRefreshTokenValue = crypto.randomUUID();
    const newHashedToken = hashToken(newRefreshTokenValue);
    const refreshExpiresMs = parseDurationToMs('7d');

    await prisma.refreshToken.create({
      data: {
        tokenHash: newHashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    logger.info(`Token refreshed for user: ${user.email}`);

    return {
      accessToken,
      refreshToken: newRefreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async logout(refreshTokenValue: string) {
    const hashedToken = hashToken(refreshTokenValue);

    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashedToken },
      data: { isRevoked: true },
    });

    logger.info('User logged out');
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw AppError.notFound('User');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    logger.info(`Password changed for user: ${user.email}`);
  }

  async register(data: {
    email: string;
    password: string;
    displayName: string;
    role?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw AppError.conflict('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName,
        role: (data.role as any) ?? 'VIEWER',
      },
      select: userSelectWithoutPassword,
    });

    logger.info(`User registered: ${user.email}`);

    return user;
  }
}

export const authService = new AuthService();

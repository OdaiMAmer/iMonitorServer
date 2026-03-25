import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/prisma.service';
import { AppError } from '../../common/utils/app-error';
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

interface ListUsersQuery {
  page: number;
  pageSize: number;
  role?: string;
  search?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: string;
}

interface UpdateUserData {
  displayName?: string;
  role?: string;
  isActive?: boolean;
}

class UsersService {
  async findAll(query: ListUsersQuery) {
    const { page, pageSize, role, search } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelectWithoutPassword,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelectWithoutPassword,
    });

    if (!user) {
      throw AppError.notFound('User');
    }

    return user;
  }

  async findMe(userId: string) {
    return this.findById(userId);
  }

  async create(data: CreateUserData) {
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
        role: data.role as any,
      },
      select: userSelectWithoutPassword,
    });

    logger.info(`User created: ${user.email}`);

    return user;
  }

  async update(id: string, data: UpdateUserData) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw AppError.notFound('User');
    }

    const updateData: any = {};

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelectWithoutPassword,
    });

    logger.info(`User updated: ${user.email}`);

    return user;
  }

  async softDelete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      throw AppError.notFound('User');
    }

    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        throw AppError.badRequest('Cannot deactivate the last admin user');
      }
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: id, isRevoked: false },
      data: { isRevoked: true },
    });

    logger.info(`User soft-deleted: ${user.email}`);
  }
}

export const usersService = new UsersService();

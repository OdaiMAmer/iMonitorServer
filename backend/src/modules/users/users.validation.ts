import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const passwordMessage =
  'Password must contain at least one uppercase letter, one lowercase letter, and one number';

const roleEnum = z.enum(['ADMIN', 'OPERATOR', 'VIEWER']);

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, passwordMessage),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be at most 100 characters'),
  role: roleEnum,
});

export const updateUserSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters')
      .max(100, 'Display name must be at most 100 characters')
      .optional(),
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.role !== undefined ||
      data.isActive !== undefined,
    { message: 'At least one field must be provided' },
  );

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  role: roleEnum.optional(),
  search: z.string().optional(),
});

import { z } from 'zod';

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().optional(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color (e.g., #FF0000)')
    .optional(),
});

export const updateGroupSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    description: z.string().nullable().optional(),
    color: z
      .string()
      .regex(hexColorRegex, 'Color must be a valid hex color (e.g., #FF0000)')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided' },
  );

export const groupIdParamSchema = z.object({
  id: z.string().uuid('Invalid group ID format'),
});

export const assignServersSchema = z.object({
  serverIds: z
    .array(z.string().uuid('Invalid server ID format'))
    .min(1, 'At least one server ID is required'),
});

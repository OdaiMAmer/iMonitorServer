import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  unreadOnly: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

export const updateSmtpSchema = z
  .object({
    host: z.string().min(1, 'Host is required').optional(),
    port: z.number().int().min(1).max(65535).optional(),
    user: z.string().optional(),
    pass: z.string().optional(),
    from: z.string().email('Invalid sender email format').optional(),
    tls: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided' },
  );

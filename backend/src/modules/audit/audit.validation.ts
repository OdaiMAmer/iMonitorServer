import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  userId: z.string().uuid('Invalid user ID format').optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

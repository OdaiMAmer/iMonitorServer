import { z } from 'zod';

const metricTypeEnum = z.enum(['CPU', 'MEMORY', 'DISK', 'NETWORK_IN', 'NETWORK_OUT']);
const conditionEnum = z.enum(['gt', 'lt', 'eq']);
const severityEnum = z.enum(['CRITICAL', 'WARNING', 'INFO']);
const alertStatusEnum = z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']);
const channelEnum = z.enum(['IN_APP', 'EMAIL', 'WEBHOOK']);

export const createAlertRuleSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters'),
  serverId: z.string().uuid('Invalid server ID format').optional(),
  metricType: metricTypeEnum,
  condition: conditionEnum,
  threshold: z
    .number()
    .min(0, 'Threshold must be at least 0')
    .max(100, 'Threshold must be at most 100'),
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(30, 'Duration must be at least 30 seconds')
    .max(3600, 'Duration must be at most 3600 seconds'),
  severity: severityEnum,
  channels: z
    .array(channelEnum)
    .min(1, 'At least one notification channel is required'),
  webhookUrl: z.string().url('Invalid webhook URL').optional(),
  emailRecipients: z
    .array(z.string().email('Invalid email format'))
    .optional(),
  cooldownMinutes: z
    .number()
    .int('Cooldown must be an integer')
    .min(1, 'Cooldown must be at least 1 minute')
    .max(1440, 'Cooldown must be at most 1440 minutes')
    .default(15),
  isEnabled: z.boolean().default(true),
});

export const updateAlertRuleSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    serverId: z.string().uuid('Invalid server ID format').nullable().optional(),
    metricType: metricTypeEnum.optional(),
    condition: conditionEnum.optional(),
    threshold: z
      .number()
      .min(0, 'Threshold must be at least 0')
      .max(100, 'Threshold must be at most 100')
      .optional(),
    duration: z
      .number()
      .int('Duration must be an integer')
      .min(30, 'Duration must be at least 30 seconds')
      .max(3600, 'Duration must be at most 3600 seconds')
      .optional(),
    severity: severityEnum.optional(),
    channels: z
      .array(channelEnum)
      .min(1, 'At least one notification channel is required')
      .optional(),
    webhookUrl: z.string().url('Invalid webhook URL').nullable().optional(),
    emailRecipients: z
      .array(z.string().email('Invalid email format'))
      .optional(),
    cooldownMinutes: z
      .number()
      .int('Cooldown must be an integer')
      .min(1, 'Cooldown must be at least 1 minute')
      .max(1440, 'Cooldown must be at most 1440 minutes')
      .optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided' },
  );

export const alertRuleIdParamSchema = z.object({
  id: z.string().uuid('Invalid alert rule ID format'),
});

export const listAlertsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  status: alertStatusEnum.optional(),
  severity: severityEnum.optional(),
  serverId: z.string().uuid('Invalid server ID format').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const alertIdParamSchema = z.object({
  id: z.string().uuid('Invalid alert ID format'),
});

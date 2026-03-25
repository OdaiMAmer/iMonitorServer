import { z } from 'zod';

const metricTypeEnum = z.enum(['CPU', 'MEMORY', 'DISK', 'NETWORK_IN', 'NETWORK_OUT']);

export const metricsQuerySchema = z.object({
  type: metricTypeEnum.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  interval: z.enum(['1m', '5m', '15m', '1h', '6h', '1d']).optional(),
});

export type MetricsQuery = z.infer<typeof metricsQuerySchema>;

const bulkMetricItemSchema = z.object({
  type: metricTypeEnum,
  value: z.number(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

export const bulkMetricsSchema = z.object({
  metrics: z.array(bulkMetricItemSchema).min(1).max(1000),
});

export type BulkMetricsDto = z.infer<typeof bulkMetricsSchema>;

export const compareQuerySchema = z.object({
  serverIds: z.string().min(1, 'At least one server ID is required'),
  type: metricTypeEnum,
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CompareQuery = z.infer<typeof compareQuerySchema>;

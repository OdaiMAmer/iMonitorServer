import { z } from 'zod';

export const registerServerSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required'),
  ipAddress: z.string().min(1, 'IP address is required'),
  osVersion: z.string().optional(),
  agentVersion: z.string().optional(),
  cpuModel: z.string().optional(),
  cpuCores: z.number().int().positive().optional(),
  totalMemoryMb: z.number().positive().optional(),
  totalDiskGb: z.number().positive().optional(),
  registrationToken: z.string().min(1, 'Registration token is required'),
});

export type RegisterServerDto = z.infer<typeof registerServerSchema>;

export const updateServerSchema = z.object({
  displayName: z.string().min(1).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE']).optional(),
});

export type UpdateServerDto = z.infer<typeof updateServerSchema>;

const diskSchema = z.object({
  name: z.string(),
  usedGb: z.number().min(0),
  totalGb: z.number().min(0),
});

const networkInterfaceSchema = z.object({
  name: z.string(),
  bytesInPerSec: z.number().min(0),
  bytesOutPerSec: z.number().min(0),
});

const processSchema = z.object({
  pid: z.number().int(),
  name: z.string(),
  cpuPercent: z.number().min(0),
  memoryMb: z.number().min(0),
  startTime: z.string().optional(),
});

const serviceSchema = z.object({
  serviceName: z.string(),
  displayName: z.string(),
  status: z.string(),
  startType: z.string(),
});

export const heartbeatSchema = z.object({
  cpu: z.number().min(0).max(100),
  memoryUsedMb: z.number().min(0),
  memoryTotalMb: z.number().min(0),
  disks: z.array(diskSchema),
  networkInterfaces: z.array(networkInterfaceSchema),
  uptime: z.number().min(0),
  processes: z.array(processSchema).optional(),
  services: z.array(serviceSchema).optional(),
  timestamp: z.string().datetime(),
});

export type HeartbeatDto = z.infer<typeof heartbeatSchema>;

export const serverIdParamSchema = z.object({
  id: z.string().uuid('Invalid server ID format'),
});

export const listServersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE']).optional(),
  groupId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type ListServersQuery = z.infer<typeof listServersQuerySchema>;

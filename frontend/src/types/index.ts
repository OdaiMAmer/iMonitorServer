export interface User {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface Server {
  id: string;
  hostname: string;
  ipAddress: string;
  os: string;
  osVersion?: string;
  status: ServerStatus;
  agentVersion?: string;
  groupId?: string;
  group?: ServerGroup;
  lastHeartbeat?: string;
  lastSeen?: string;
  uptime?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ServerStatus = 'healthy' | 'warning' | 'critical' | 'offline' | 'maintenance';

export interface ServerMetrics {
  serverId: string;
  timestamp: string;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
}

export interface CpuMetrics {
  usagePercent: number;
  coreCount?: number;
  model?: string;
  speed?: number;
  temperature?: number;
}

export interface MemoryMetrics {
  usagePercent: number;
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
}

export interface DiskMetrics {
  usagePercent: number;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  drives?: DiskDrive[];
}

export interface DiskDrive {
  name: string;
  mountPoint: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
  type: string;
}

export interface NetworkMetrics {
  bytesInPerSec: number;
  bytesOutPerSec: number;
  totalBytesIn: number;
  totalBytesOut: number;
  connections?: NetworkConnection[];
}

export interface NetworkConnection {
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  protocol: string;
  state: string;
  pid?: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMB: number;
  startTime?: string;
  status: string;
}

export interface ServiceInfo {
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'paused' | 'starting' | 'stopping';
  startupType: 'automatic' | 'manual' | 'disabled';
}

export interface EventLog {
  id: string;
  timestamp: string;
  source: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  details?: string;
}

export interface HardwareInfo {
  cpu: { model: string; cores: number; speed: string; architecture: string };
  memory: { total: string; slots: number; type: string };
  disks: { model: string; capacity: string; type: string; interface: string }[];
  networkAdapters: { name: string; macAddress: string; speed: string; type: string }[];
  os: { name: string; version: string; build: string; architecture: string };
  bios: { manufacturer: string; version: string; releaseDate: string };
}

export interface ServerGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  serverIds?: string[];
  serverCount: number;
  createdAt: string;
}

export interface Alert {
  id: string;
  serverId: string;
  server?: Server;
  ruleId: string;
  rule?: AlertRule;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  isActive: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: 'cpu' | 'memory' | 'disk' | 'network' | 'service';
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number;
  severity: 'critical' | 'warning' | 'info';
  channels: ('inApp' | 'email' | 'webhook')[];
  targetServerIds?: string[];
  targetGroupIds?: string[];
  isEnabled: boolean;
  createdAt: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  encryption: 'none' | 'tls' | 'starttls';
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  lastTriggered?: string;
}

export interface GeneralSettings {
  siteName: string;
  heartbeatInterval: number;
  retentionDays: number;
  timezone: string;
  dashboardRefreshRate: number;
  language: string;
}

export interface DashboardStats {
  totalServers: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
}

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

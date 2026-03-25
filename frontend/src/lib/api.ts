import apiClient from './axios';
import type {
  LoginCredentials, AuthTokens, User, Server, ServerMetrics,
  ProcessInfo, ServiceInfo, EventLog, HardwareInfo, NetworkMetrics,
  ServerGroup, Alert, AlertRule, SmtpSettings, WebhookConfig,
  GeneralSettings, DashboardStats, TimeRange, PaginatedResponse,
} from '../types';

// Auth
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthTokens & { user: User }>('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  me: (signal?: AbortSignal) =>
    apiClient.get<User>('/auth/me', { signal }),
  refresh: () => apiClient.post<AuthTokens>('/auth/refresh', {}, { withCredentials: true }),
};

// Servers
export const serversApi = {
  list: (params?: Record<string, string>, signal?: AbortSignal) =>
    apiClient.get<Server[]>('/servers', { params, signal }),
  getById: (id: string, signal?: AbortSignal) =>
    apiClient.get<Server>(`/servers/${id}`, { signal }),
  delete: (id: string) =>
    apiClient.delete(`/servers/${id}`),
  getMetrics: (id: string, range: TimeRange, signal?: AbortSignal) =>
    apiClient.get<ServerMetrics[]>(`/servers/${id}/metrics`, { params: { range }, signal }),
  getProcesses: (id: string, signal?: AbortSignal) =>
    apiClient.get<ProcessInfo[]>(`/servers/${id}/processes`, { signal }),
  killProcess: (id: string, pid: number) =>
    apiClient.post(`/servers/${id}/processes/${pid}/kill`),
  getServices: (id: string, signal?: AbortSignal) =>
    apiClient.get<ServiceInfo[]>(`/servers/${id}/services`, { signal }),
  serviceAction: (id: string, serviceName: string, action: string) =>
    apiClient.post(`/servers/${id}/services/${serviceName}/action`, { action }),
  getEventLogs: (id: string, params?: Record<string, string>, signal?: AbortSignal) =>
    apiClient.get<PaginatedResponse<EventLog>>(`/servers/${id}/event-logs`, { params, signal }),
  getNetwork: (id: string, signal?: AbortSignal) =>
    apiClient.get<NetworkMetrics>(`/servers/${id}/network`, { signal }),
  getHardware: (id: string, signal?: AbortSignal) =>
    apiClient.get<HardwareInfo>(`/servers/${id}/hardware`, { signal }),
  restart: (id: string) =>
    apiClient.post(`/servers/${id}/remote/restart`),
  shutdown: (id: string) =>
    apiClient.post(`/servers/${id}/remote/shutdown`),
};

// Dashboard
export const dashboardApi = {
  getStats: (signal?: AbortSignal) =>
    apiClient.get<DashboardStats>('/dashboard/stats', { signal }),
};

// Groups
export const groupsApi = {
  list: (signal?: AbortSignal) =>
    apiClient.get<ServerGroup[]>('/server-groups', { signal }),
  create: (data: Partial<ServerGroup>) =>
    apiClient.post<ServerGroup>('/server-groups', data),
  update: (id: string, data: Partial<ServerGroup>) =>
    apiClient.put<ServerGroup>(`/server-groups/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/server-groups/${id}`),
};

// Alerts
export const alertsApi = {
  getActive: (signal?: AbortSignal) =>
    apiClient.get<Alert[]>('/alerts/active', { signal }),
  acknowledge: (id: string) =>
    apiClient.post(`/alerts/${id}/acknowledge`),
  getHistory: (params?: Record<string, string>, signal?: AbortSignal) =>
    apiClient.get<PaginatedResponse<Alert>>('/alerts/history', { params, signal }),
  getRules: (signal?: AbortSignal) =>
    apiClient.get<AlertRule[]>('/alerts/rules', { signal }),
  createRule: (data: Partial<AlertRule>) =>
    apiClient.post<AlertRule>('/alerts/rules', data),
  updateRule: (id: string, data: Partial<AlertRule>) =>
    apiClient.put<AlertRule>(`/alerts/rules/${id}`, data),
  deleteRule: (id: string) =>
    apiClient.delete(`/alerts/rules/${id}`),
};

// Users
export const usersApi = {
  list: (signal?: AbortSignal) =>
    apiClient.get<User[]>('/users', { signal }),
  create: (data: Partial<User> & { password: string }) =>
    apiClient.post<User>('/users', data),
  update: (id: string, data: Partial<User>) =>
    apiClient.put<User>(`/users/${id}`, data),
  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
};

// Settings
export const settingsApi = {
  getSmtp: (signal?: AbortSignal) =>
    apiClient.get<SmtpSettings>('/settings/smtp', { signal }),
  updateSmtp: (data: SmtpSettings) =>
    apiClient.put('/settings/smtp', data),
  testSmtp: (recipient: string) =>
    apiClient.post('/settings/smtp/test', { recipient }),
  getWebhooks: (signal?: AbortSignal) =>
    apiClient.get<WebhookConfig[]>('/settings/webhooks', { signal }),
  createWebhook: (data: Partial<WebhookConfig>) =>
    apiClient.post<WebhookConfig>('/settings/webhooks', data),
  updateWebhook: (id: string, data: Partial<WebhookConfig>) =>
    apiClient.put<WebhookConfig>(`/settings/webhooks/${id}`, data),
  deleteWebhook: (id: string) =>
    apiClient.delete(`/settings/webhooks/${id}`),
  testWebhook: (id: string) =>
    apiClient.post(`/settings/webhooks/${id}/test`),
  getGeneral: (signal?: AbortSignal) =>
    apiClient.get<GeneralSettings>('/settings/general', { signal }),
  updateGeneral: (data: GeneralSettings) =>
    apiClient.put('/settings/general', data),
};

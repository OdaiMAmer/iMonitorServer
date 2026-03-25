import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  iat?: number;
  exp?: number;
}

export interface AgentPayload {
  serverId: string;
  hostname: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  agent?: AgentPayload;
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta: {
    timestamp: string;
    requestId?: string;
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

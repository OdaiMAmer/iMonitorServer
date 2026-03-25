import { Router, Request, Response } from 'express';
import authRouter from '../modules/auth/auth.routes';
import usersRouter from '../modules/users/users.routes';
import serversRouter from '../modules/servers/servers.routes';
import metricsRouter from '../modules/metrics/metrics.routes';
import alertsRouter from '../modules/alerts/alerts.routes';
import notificationsRouter from '../modules/notifications/notifications.routes';
import serverGroupsRouter from '../modules/server-groups/server-groups.routes';
import dashboardRouter from '../modules/dashboard/dashboard.routes';
import auditRouter from '../modules/audit/audit.routes';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'iMonitorServer',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/servers', serversRouter);
router.use('/metrics', metricsRouter);
router.use('/alerts', alertsRouter);
router.use('/notifications', notificationsRouter);
router.use('/server-groups', serverGroupsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/audit-logs', auditRouter);

export default router;

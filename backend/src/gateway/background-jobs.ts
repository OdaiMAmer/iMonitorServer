import { logger } from '../common/utils/logger';
import { config } from '../config/env.config';
// Import services - use dynamic imports or lazy initialization to avoid circular deps

let serverCheckInterval: NodeJS.Timeout | null = null;
let alertEvaluationInterval: NodeJS.Timeout | null = null;
let metricAggregationInterval: NodeJS.Timeout | null = null;

export function startBackgroundJobs(): void {
  // Check for offline servers every 30 seconds
  serverCheckInterval = setInterval(async () => {
    try {
      // Dynamic import to avoid circular dependency
      const { serversService } = await import('../modules/servers/servers.service');
      await serversService.checkOfflineServers();
    } catch (error) {
      logger.error('Error checking offline servers:', error);
    }
  }, config.agent.heartbeatIntervalSeconds * 1000);

  // Evaluate alert rules every 30 seconds
  alertEvaluationInterval = setInterval(async () => {
    try {
      const { alertsService } = await import('../modules/alerts/alerts.service');
      await alertsService.evaluateAlerts();
    } catch (error) {
      logger.error('Error evaluating alerts:', error);
    }
  }, 30000);

  // Aggregate metrics every 5 minutes
  metricAggregationInterval = setInterval(async () => {
    try {
      const { metricsService } = await import('../modules/metrics/metrics.service');
      await metricsService.aggregateMetrics();
    } catch (error) {
      logger.error('Error aggregating metrics:', error);
    }
  }, 5 * 60 * 1000);

  logger.info('Background jobs started');
}

export function stopBackgroundJobs(): void {
  if (serverCheckInterval) {
    clearInterval(serverCheckInterval);
    serverCheckInterval = null;
  }
  if (alertEvaluationInterval) {
    clearInterval(alertEvaluationInterval);
    alertEvaluationInterval = null;
  }
  if (metricAggregationInterval) {
    clearInterval(metricAggregationInterval);
    metricAggregationInterval = null;
  }
  logger.info('Background jobs stopped');
}

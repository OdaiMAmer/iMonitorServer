import { describe, it, expect } from 'vitest';
import {
  createAlertRuleSchema,
  updateAlertRuleSchema,
  listAlertsQuerySchema,
  alertRuleIdParamSchema,
} from '../../src/modules/alerts/alerts.validation';

describe('Alert Rules Validation', () => {
  describe('createAlertRuleSchema', () => {
    const validRule = {
      name: 'High CPU Alert',
      metricType: 'CPU',
      condition: 'gt',
      threshold: 90,
      duration: 300,
      severity: 'CRITICAL',
      channels: ['IN_APP'],
    };

    it('should validate a correct alert rule', () => {
      const result = createAlertRuleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
    });

    it('should set default values for cooldownMinutes and isEnabled', () => {
      const result = createAlertRuleSchema.parse(validRule);
      expect(result.cooldownMinutes).toBe(15);
      expect(result.isEnabled).toBe(true);
    });

    it('should reject name shorter than 3 characters', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, name: 'AB' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3');
      }
    });

    it('should reject name longer than 100 characters', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject invalid metricType', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, metricType: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid metricTypes', () => {
      for (const metricType of ['CPU', 'MEMORY', 'DISK', 'NETWORK_IN', 'NETWORK_OUT']) {
        const result = createAlertRuleSchema.safeParse({ ...validRule, metricType });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid condition', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, condition: 'gte' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid conditions (gt, lt, eq)', () => {
      for (const condition of ['gt', 'lt', 'eq']) {
        const result = createAlertRuleSchema.safeParse({ ...validRule, condition });
        expect(result.success).toBe(true);
      }
    });

    it('should reject threshold below 0', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, threshold: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject threshold above 100', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, threshold: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept threshold of 0 and 100', () => {
      expect(createAlertRuleSchema.safeParse({ ...validRule, threshold: 0 }).success).toBe(true);
      expect(createAlertRuleSchema.safeParse({ ...validRule, threshold: 100 }).success).toBe(true);
    });

    it('should reject duration below 30 seconds', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, duration: 29 });
      expect(result.success).toBe(false);
    });

    it('should reject duration above 3600 seconds', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, duration: 3601 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer duration', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, duration: 30.5 });
      expect(result.success).toBe(false);
    });

    it('should reject empty channels array', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, channels: [] });
      expect(result.success).toBe(false);
    });

    it('should accept multiple valid channels', () => {
      const result = createAlertRuleSchema.safeParse({
        ...validRule,
        channels: ['IN_APP', 'EMAIL', 'WEBHOOK'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid channel', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, channels: ['SMS'] });
      expect(result.success).toBe(false);
    });

    it('should accept optional serverId as UUID', () => {
      const result = createAlertRuleSchema.safeParse({
        ...validRule,
        serverId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject serverId that is not a UUID', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, serverId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('should accept optional webhookUrl', () => {
      const result = createAlertRuleSchema.safeParse({
        ...validRule,
        webhookUrl: 'https://hooks.slack.com/test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid webhookUrl', () => {
      const result = createAlertRuleSchema.safeParse({
        ...validRule,
        webhookUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional emailRecipients array', () => {
      const result = createAlertRuleSchema.safeParse({
        ...validRule,
        emailRecipients: ['admin@example.com', 'ops@example.com'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email in emailRecipients', () => {
      const result = createAlertRuleSchema.safeParse({
        ...validRule,
        emailRecipients: ['not-an-email'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject cooldownMinutes below 1', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, cooldownMinutes: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject cooldownMinutes above 1440', () => {
      const result = createAlertRuleSchema.safeParse({ ...validRule, cooldownMinutes: 1441 });
      expect(result.success).toBe(false);
    });

    it('should accept all valid severities', () => {
      for (const severity of ['CRITICAL', 'WARNING', 'INFO']) {
        const result = createAlertRuleSchema.safeParse({ ...validRule, severity });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('updateAlertRuleSchema', () => {
    it('should accept partial update with only name', () => {
      const result = updateAlertRuleSchema.safeParse({ name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only threshold', () => {
      const result = updateAlertRuleSchema.safeParse({ threshold: 80 });
      expect(result.success).toBe(true);
    });

    it('should reject update with no fields', () => {
      const result = updateAlertRuleSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept nullable serverId', () => {
      const result = updateAlertRuleSchema.safeParse({ serverId: null });
      expect(result.success).toBe(true);
    });

    it('should accept isEnabled toggle', () => {
      const result = updateAlertRuleSchema.safeParse({ isEnabled: false });
      expect(result.success).toBe(true);
    });
  });

  describe('alertRuleIdParamSchema', () => {
    it('should accept a valid UUID', () => {
      const result = alertRuleIdParamSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID id', () => {
      const result = alertRuleIdParamSchema.safeParse({ id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('listAlertsQuerySchema', () => {
    it('should set default page and pageSize', () => {
      const result = listAlertsQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
    });

    it('should accept valid query parameters', () => {
      const result = listAlertsQuerySchema.safeParse({
        page: '2',
        pageSize: '50',
        status: 'ACTIVE',
        severity: 'CRITICAL',
        serverId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject pageSize above 100', () => {
      const result = listAlertsQuerySchema.safeParse({ pageSize: '101' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = listAlertsQuerySchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should coerce string numbers to numbers', () => {
      const result = listAlertsQuerySchema.parse({ page: '3', pageSize: '10' });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
    });
  });
});

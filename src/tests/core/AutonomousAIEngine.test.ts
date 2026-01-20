/**
 * @file 核心引擎测试
 * @description 测试AutonomousAIEngine类的功能
 * @module tests/core/AutonomousAIEngine.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutonomousAIEngine } from '../core/AutonomousAIEngine';
import { EngineStatus, MessageType } from '../types/engine.types';

describe('AutonomousAIEngine', () => {
  let engine: AutonomousAIEngine;

  beforeEach(() => {
    const config = {
      version: '1.0.0',
      environment: 'test' as const,
      messageConfig: {
        maxQueueSize: 100,
        retryPolicy: {
          maxRetries: 3,
          backoffFactor: 2
        }
      },
      taskConfig: {
        maxConcurrentTasks: 10,
        timeoutMs: 30000,
        priorityLevels: 4
      },
      stateConfig: {
        autoPersist: false,
        persistInterval: 60000,
        maxHistory: 1000
      },
      logConfig: {
        level: 'info',
        format: 'json' as const
      }
    };

    engine = new AutonomousAIEngine(config);
  });

  describe('initialize', () => {
    it('应该成功初始化引擎', async () => {
      await engine.initialize({});

      expect(engine.getStatus()).toBe(EngineStatus.STOPPED);
    });
  });

  describe('start', () => {
    it('应该成功启动引擎', async () => {
      await engine.initialize({});
      await engine.start();

      expect(engine.getStatus()).toBe(EngineStatus.RUNNING);
    });

    it('应该记录启动时间', async () => {
      await engine.initialize({});
      await engine.start();

      const metrics = engine.getMetrics();
      expect(metrics.uptime).toBeGreaterThan(0);
    });
  });

  describe('pause', () => {
    it('应该成功暂停引擎', async () => {
      await engine.initialize({});
      await engine.start();
      await engine.pause();

      expect(engine.getStatus()).toBe(EngineStatus.PAUSED);
    });
  });

  describe('shutdown', () => {
    it('应该成功关闭引擎', async () => {
      await engine.initialize({});
      await engine.start();
      await engine.shutdown();

      expect(engine.getStatus()).toBe(EngineStatus.STOPPED);
    });
  });

  describe('processMessage', () => {
    it('应该成功处理消息', async () => {
      await engine.initialize({});
      await engine.start();

      engine.registerMessageHandler(MessageType.USER_MESSAGE, async (message, context) => {
        return {
          success: true,
          content: 'Response',
          metadata: {}
        };
      });

      const response = await engine.processMessage({
        id: 'msg-001',
        type: MessageType.USER_MESSAGE,
        content: 'Hello',
        timestamp: new Date()
      });

      expect(response.success).toBe(true);
    });

    it('应该在非运行状态下拒绝处理消息', async () => {
      await engine.initialize({});

      await expect(
        engine.processMessage({
          id: 'msg-001',
          type: MessageType.USER_MESSAGE,
          content: 'Hello',
          timestamp: new Date()
        })
      ).rejects.toThrow();
    });
  });

  describe('registerMessageHandler', () => {
    it('应该成功注册消息处理器', () => {
      const handler = vi.fn();

      engine.registerMessageHandler(MessageType.USER_MESSAGE, handler);

      const handlers = (engine as any).messageHandlers.get(MessageType.USER_MESSAGE);
      expect(handlers).toBe(handler);
    });
  });

  describe('unregisterMessageHandler', () => {
    it('应该成功取消注册消息处理器', () => {
      const handler = vi.fn();

      engine.registerMessageHandler(MessageType.USER_MESSAGE, handler);
      engine.unregisterMessageHandler(MessageType.USER_MESSAGE);

      const handlers = (engine as any).messageHandlers.get(MessageType.USER_MESSAGE);
      expect(handlers).toBeUndefined();
    });
  });

  describe('getState', () => {
    it('应该返回引擎状态', async () => {
      await engine.initialize({});
      await engine.start();

      const state = engine.getState();

      expect(state.status).toBe(EngineStatus.RUNNING);
      expect(state.uptime).toBeGreaterThanOrEqual(0);
      expect(state.tasks).toBeDefined();
      expect(state.subsystems).toBeDefined();
      expect(state.metrics).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('应该返回引擎指标', async () => {
      await engine.initialize({});
      await engine.start();

      const metrics = engine.getMetrics();

      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.status).toBe(EngineStatus.RUNNING);
      expect(metrics.taskCount).toBeGreaterThanOrEqual(0);
      expect(metrics.messageThroughput).toBeGreaterThanOrEqual(0);
    });
  });
});

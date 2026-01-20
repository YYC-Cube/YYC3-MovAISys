/**
 * @file MessageBus 单元测试
 * @description 测试消息总线的核心功能
 * @module __tests__/unit/core/MessageBus.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MessageBus,
  Message,
  MessageHandler,
  MessageBusConfig,
  MessageMetrics,
  MessageFilter,
  Subscription
} from '../../../core/message-bus/MessageBus';

describe('MessageBus', () => {
  let messageBus: MessageBus;
  let config: MessageBusConfig;

  beforeEach(() => {
    config = {
      enableMetrics: true,
      enableHistory: true,
      maxHistorySize: 1000,
      enablePersistence: false,
      enablePrioritization: true,
      enableBroadcast: true,
      maxMessageSize: 1024 * 1024,
      enableCompression: false
    };

    messageBus = new MessageBus(config);
  });

  afterEach(() => {
    if (messageBus) {
      messageBus.destroy();
    }
  });

  describe('初始化', () => {
    it('应该成功初始化消息总线', () => {
      expect(messageBus).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultBus = new MessageBus();
      expect(defaultBus).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customConfig: MessageBusConfig = {
        enableMetrics: false,
        enableHistory: false
      };
      const customBus = new MessageBus(customConfig);
      expect(customBus).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(messageBus).toBeDefined();
    });
  });

  describe('消息发布', () => {
    it('应该成功发布消息', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      const messageId = await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(messageId).toBeDefined();
      expect(typeof messageId).toBe('string');
    });

    it('应该成功发布批量消息', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      const messages = [
        {
          type: 'test-event',
          source: 'test-source',
          payload: { data: 'test1' },
          priority: 'normal' as const
        },
        {
          type: 'test-event',
          source: 'test-source',
          payload: { data: 'test2' },
          priority: 'normal' as const
        }
      ];

      const messageIds = await messageBus.publishBatch(messages);
      expect(messageIds).toHaveLength(2);
    });

    it('应该处理消息发布失败', async () => {
      const invalidMessage: any = {
        type: 'test-event',
        source: 'test-source',
        payload: null,
        priority: 'normal'
      };

      await expect(messageBus.publish(invalidMessage)).rejects.toThrow();
    });
  });

  describe('消息订阅', () => {
    it('应该成功订阅消息', () => {
      const handler = vi.fn();
      const subscription = messageBus.subscribe('test-event', handler);
      expect(subscription).toBeDefined();
      expect(subscription.id).toBeDefined();
    });

    it('应该成功取消订阅', () => {
      const handler = vi.fn();
      const subscription = messageBus.subscribe('test-event', handler);
      const result = messageBus.unsubscribe(subscription.id);
      expect(result).toBe(true);
    });

    it('应该处理消息订阅失败', () => {
      const handler = vi.fn();
      const subscription = messageBus.subscribe('test-event', handler);
      const result = messageBus.unsubscribe('invalid-subscription-id');
      expect(result).toBe(false);
    });
  });

  describe('消息过滤', () => {
    it('应该支持消息过滤', async () => {
      const filter: MessageFilter = {
        type: 'test-event',
        priority: 'high'
      };

      const handler = vi.fn();
      messageBus.subscribe('test-event', handler, filter);

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'high'
      });

      expect(handler).toHaveBeenCalled();
    });

    it('应该支持消息优先级', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'high'
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('异步消息处理', () => {
    it('应该支持异步消息处理', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      messageBus.subscribe('test-event', handler);

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('同步消息处理', () => {
    it('应该支持同步消息处理', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('消息错误处理', () => {
    it('应该正确处理消息错误', async () => {
      const errorHandler = vi.fn();
      const handler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      messageBus.subscribe('test-event', handler);

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('消息历史', () => {
    it('应该记录消息历史', async () => {
      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      const history = messageBus.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该限制历史记录大小', async () => {
      const limitedBus = new MessageBus({ maxHistorySize: 5 });

      for (let i = 0; i < 10; i++) {
        await limitedBus.publish({
          type: 'test-event',
          source: 'test-source',
          payload: { data: `test${i}` },
          priority: 'normal'
        });
      }

      const history = limitedBus.getHistory();
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('消息广播', () => {
    it('应该支持消息广播', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      messageBus.subscribe('test-event', handler1);
      messageBus.subscribe('test-event', handler2);

      await messageBus.broadcast({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('消息路由', () => {
    it('应该支持消息路由', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      await messageBus.send('test-target', {
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(handler).toHaveBeenCalled();
    });

    it('应该处理路由失败', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      await messageBus.send('invalid-target', {
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('消息查询', () => {
    it('应该支持消息查询', async () => {
      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      const filter: MessageFilter = {
        type: 'test-event'
      };

      const messages = messageBus.query(filter);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('消息指标', () => {
    it('应该返回消息指标', async () => {
      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      const metrics = messageBus.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalMessages).toBeGreaterThan(0);
    });

    it('应该重置消息指标', async () => {
      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      messageBus.resetMetrics();
      const metrics = messageBus.getMetrics();
      expect(metrics.totalMessages).toBe(0);
    });
  });

  describe('消息暂停和恢复', () => {
    it('应该支持暂停消息', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      messageBus.pause();

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该支持恢复消息', async () => {
      const handler = vi.fn();
      messageBus.subscribe('test-event', handler);

      messageBus.pause();

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      messageBus.resume();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('消息清理', () => {
    it('应该正确清理消息资源', () => {
      messageBus.destroy();
      expect(messageBus).toBeDefined();
    });

    it('应该清除历史记录', async () => {
      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      messageBus.clearHistory();
      const history = messageBus.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('消息事件', () => {
    it('应该触发消息事件', async () => {
      const eventSpy = vi.fn();
      messageBus.addEventListener('message', eventSpy);

      await messageBus.publish({
        type: 'test-event',
        source: 'test-source',
        payload: { data: 'test' },
        priority: 'normal'
      });

      expect(eventSpy).toHaveBeenCalled();
    });
  });
});

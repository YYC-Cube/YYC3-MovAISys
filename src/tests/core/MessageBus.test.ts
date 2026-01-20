/**
 * @file 消息总线测试
 * @description 测试MessageBus类的功能
 * @module tests/core/MessageBus.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageBus } from '../core/MessageBus';
import { MessageType } from '../types/engine.types';

describe('MessageBus', () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = new MessageBus({
      maxQueueSize: 100,
      retryPolicy: {
        maxRetries: 3,
        backoffFactor: 2
      }
    });
  });

  describe('publish', () => {
    it('应该成功发布消息', async () => {
      const message = {
        id: 'msg-001',
        type: MessageType.USER_MESSAGE,
        content: 'Hello',
        timestamp: new Date()
      };

      await messageBus.publish(message);

      const queueStatus = messageBus.getQueueStatus();
      expect(queueStatus.size).toBeGreaterThan(0);
    });

    it('应该自动生成消息ID', async () => {
      const message = {
        type: MessageType.USER_MESSAGE,
        content: 'Hello',
        timestamp: new Date()
      } as any;

      await messageBus.publish(message);

      expect(message.id).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('应该成功订阅消息类型', () => {
      const handler = vi.fn();

      messageBus.subscribe(MessageType.USER_MESSAGE, handler);

      const handlers = (messageBus as any).handlers.get(MessageType.USER_MESSAGE);
      expect(handlers).toContain(handler);
    });
  });

  describe('unsubscribe', () => {
    it('应该成功取消订阅', () => {
      const handler = vi.fn();

      messageBus.subscribe(MessageType.USER_MESSAGE, handler);
      messageBus.unsubscribe(MessageType.USER_MESSAGE, handler);

      const handlers = (messageBus as any).handlers.get(MessageType.USER_MESSAGE);
      expect(handlers).not.toContain(handler);
    });
  });

  describe('getQueueStatus', () => {
    it('应该返回队列状态', () => {
      const status = messageBus.getQueueStatus();

      expect(status.size).toBeDefined();
      expect(status.processing).toBeDefined();
      expect(status.metrics).toBeDefined();
    });
  });

  describe('clear', () => {
    it('应该清空消息队列', async () => {
      const message = {
        id: 'msg-001',
        type: MessageType.USER_MESSAGE,
        content: 'Hello',
        timestamp: new Date()
      };

      await messageBus.publish(message);
      messageBus.clear();

      const status = messageBus.getQueueStatus();
      expect(status.size).toBe(0);
    });
  });
});

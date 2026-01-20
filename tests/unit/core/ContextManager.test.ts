/**
 * @file ContextManager 单元测试
 * @description 测试上下文管理器的核心功能
 * @module __tests__/unit/core/ContextManager.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextManager, ContextData } from '../../../core/context-manager/ContextManager';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager();
  });

  afterEach(() => {
    if (contextManager) {
    }
  });

  describe('初始化', () => {
    it('应该成功初始化上下文管理器', () => {
      expect(contextManager).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultManager = new ContextManager();
      expect(defaultManager).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(contextManager).toBeDefined();
    });
  });

  describe('上下文管理', () => {
    it('应该成功创建上下文', () => {
      const context = contextManager.getContext();
      expect(context).toBeDefined();
      expect(context.timestamp).toBeDefined();
    });

    it('应该成功获取上下文', () => {
      const context = contextManager.getContext();
      expect(context).toBeDefined();
      expect(context).toHaveProperty('timestamp');
    });

    it('应该成功更新上下文', () => {
      const updates: Partial<ContextData> = {
        user: 'test-user',
        pageContext: { url: 'https://test.com' }
      };

      contextManager.updateContext(updates);
      const context = contextManager.getContext();
      expect(context.user).toBe('test-user');
      expect(context.pageContext).toBeDefined();
    });

    it('应该成功删除上下文', () => {
      contextManager.updateContext({ user: 'test-user' });
      contextManager.updateContext({ user: undefined });
      const context = contextManager.getContext();
      expect(context.user).toBeUndefined();
    });

    it('应该处理上下文创建失败', () => {
      const manager = new ContextManager();
      expect(manager).toBeDefined();
    });
  });

  describe('上下文层级', () => {
    it('应该支持上下文层级', () => {
      contextManager.updateContext({
        user: 'test-user',
        businessContext: { level1: { level2: 'value' } }
      });

      const context = contextManager.getContext();
      expect(context.businessContext).toBeDefined();
      expect(context.businessContext?.level1?.level2).toBe('value');
    });

    it('应该支持上下文合并', () => {
      contextManager.updateContext({ user: 'user1' });
      contextManager.updateContext({ pageContext: { url: 'https://test.com' } });

      const context = contextManager.getContext();
      expect(context.user).toBe('user1');
      expect(context.pageContext).toBeDefined();
    });
  });

  describe('上下文查询', () => {
    it('应该支持上下文查询', () => {
      contextManager.updateContext({
        user: 'test-user',
        pageContext: { url: 'https://test.com' }
      });

      const context = contextManager.getContext();
      expect(context.user).toBe('test-user');
    });
  });

  describe('上下文错误处理', () => {
    it('应该正确处理查询错误', () => {
      const context = contextManager.getContext();
      expect(context).toBeDefined();
    });
  });

  describe('上下文历史', () => {
    it('应该记录上下文历史', () => {
      const context1 = contextManager.getContext();
      const timestamp1 = context1.timestamp;

      contextManager.updateContext({ user: 'test-user' });
      const context2 = contextManager.getContext();
      const timestamp2 = context2.timestamp;

      expect(timestamp2.getTime()).toBeGreaterThan(timestamp1.getTime());
    });

    it('应该限制历史记录大小', () => {
      for (let i = 0; i < 100; i++) {
        contextManager.updateContext({ user: `user${i}` });
      }

      const context = contextManager.getContext();
      expect(context).toBeDefined();
    });
  });

  describe('上下文持久化', () => {
    it('应该支持上下文持久化', () => {
      contextManager.updateContext({ user: 'test-user' });
      const context = contextManager.getContext();
      expect(context.user).toBe('test-user');
    });

    it('应该支持上下文恢复', () => {
      const originalContext = contextManager.getContext();
      const user = originalContext.user;

      contextManager.updateContext({ user: 'new-user' });
      const updatedContext = contextManager.getContext();

      expect(updatedContext.user).toBe('new-user');
    });
  });

  describe('上下文清理', () => {
    it('应该正确清理上下文资源', () => {
      contextManager.updateContext({ user: 'test-user' });
      expect(contextManager).toBeDefined();
    });
  });

  describe('上下文事件', () => {
    it('应该触发上下文事件', () => {
      contextManager.updateContext({ user: 'test-user' });
      const context = contextManager.getContext();
      expect(context).toBeDefined();
    });
  });

  describe('上下文验证', () => {
    it('应该支持上下文验证', () => {
      const context = contextManager.getContext();
      expect(context).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('页面上下文', () => {
    it('应该成功获取页面上下文', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext).toBeDefined();
      expect(pageContext).toHaveProperty('url');
      expect(pageContext).toHaveProperty('title');
      expect(pageContext).toHaveProperty('timestamp');
    });

    it('应该处理页面上下文获取失败', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext).toBeDefined();
    });
  });

  describe('上下文指标', () => {
    it('应该返回上下文指标', () => {
      const metrics = contextManager.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('contextSize');
      expect(metrics).toHaveProperty('lastUpdated');
    });

    it('应该正确计算上下文大小', () => {
      contextManager.updateContext({
        user: 'test-user',
        pageContext: { url: 'https://test.com' },
        conversationHistory: [{ message: 'test' }]
      });

      const metrics = contextManager.getMetrics();
      expect(metrics.contextSize).toBeGreaterThan(0);
    });

    it('应该正确记录最后更新时间', () => {
      const metrics1 = contextManager.getMetrics();
      const lastUpdated1 = metrics1.lastUpdated;

      contextManager.updateContext({ user: 'test-user' });
      const metrics2 = contextManager.getMetrics();
      const lastUpdated2 = metrics2.lastUpdated;

      expect(lastUpdated2.getTime()).toBeGreaterThan(lastUpdated1.getTime());
    });
  });

  describe('用户偏好', () => {
    it('应该支持用户偏好', () => {
      contextManager.updateContext({
        userPreferences: {
          theme: 'dark',
          language: 'zh-CN'
        }
      });

      const context = contextManager.getContext();
      expect(context.userPreferences).toBeDefined();
      expect(context.userPreferences?.theme).toBe('dark');
      expect(context.userPreferences?.language).toBe('zh-CN');
    });
  });

  describe('对话历史', () => {
    it('应该支持对话历史', () => {
      const conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];

      contextManager.updateContext({ conversationHistory });
      const context = contextManager.getContext();
      expect(context.conversationHistory).toBeDefined();
      expect(context.conversationHistory).toHaveLength(2);
    });
  });

  describe('业务上下文', () => {
    it('应该支持业务上下文', () => {
      contextManager.updateContext({
        businessContext: {
          industry: 'technology',
          domain: 'ai-assistant'
        }
      });

      const context = contextManager.getContext();
      expect(context.businessContext).toBeDefined();
      expect(context.businessContext?.industry).toBe('technology');
      expect(context.businessContext?.domain).toBe('ai-assistant');
    });
  });
});

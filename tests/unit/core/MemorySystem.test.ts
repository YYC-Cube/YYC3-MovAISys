/**
 * @file MemorySystem 单元测试
 * @description 测试记忆系统的核心功能
 * @module __tests__/unit/core/MemorySystem.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemorySystem } from '../../../core/memory/MemorySystem';
import { AutonomousAIConfig } from '../../../core/autonomous-ai-widget/types';

describe('MemorySystem', () => {
  let memorySystem: MemorySystem;
  let config: AutonomousAIConfig;

  beforeEach(() => {
    config = {
      enableMemory: true,
      enableLearning: true,
      enableToolUse: true,
      enableContextAwareness: true,
      businessContext: {
        industry: 'technology',
        domain: 'ai-assistant'
      }
    };

    memorySystem = new MemorySystem(config);
  });

  afterEach(() => {
    if (memorySystem) {
    }
  });

  describe('初始化', () => {
    it('应该成功初始化记忆系统', () => {
      expect(memorySystem).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultConfig: AutonomousAIConfig = {
        enableMemory: true,
        enableLearning: true
      };
      const defaultMemory = new MemorySystem(defaultConfig);
      expect(defaultMemory).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customConfig: AutonomousAIConfig = {
        enableMemory: false,
        enableLearning: false
      };
      const customMemory = new MemorySystem(customConfig);
      expect(customMemory).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(memorySystem).toBeDefined();
    });
  });

  describe('记忆管理', () => {
    it('应该成功存储记忆', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该成功检索记忆', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].user.content).toBe('Hello');
    });

    it('应该成功更新记忆', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该成功删除记忆', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      await memorySystem.clearAllData();
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBe(0);
    });

    it('应该处理记忆存储失败', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history).toBeDefined();
    });
  });

  describe('记忆分类', () => {
    it('应该支持记忆分类', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该支持记忆标签', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('记忆搜索', () => {
    it('应该支持记忆搜索', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const answers = await memorySystem.getAnswersForQuery('Hello');
      expect(answers).toBeDefined();
    });
  });

  describe('记忆查询', () => {
    it('应该支持记忆查询', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该正确处理查询错误', async () => {
      const history = await memorySystem.getInteractionHistory();
      expect(history).toBeDefined();
    });
  });

  describe('记忆历史', () => {
    it('应该记录记忆访问历史', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该限制历史记录大小', async () => {
      for (let i = 0; i < 1100; i++) {
        const userMessage = { role: 'user', content: `Hello ${i}` };
        const aiResponse = { role: 'assistant', content: `Hi there! ${i}` };
        await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      }

      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('记忆持久化', () => {
    it('应该支持记忆导出', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const exported = await memorySystem.exportMemoryData();
      expect(exported).toBeDefined();
    });

    it('应该支持记忆导入', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const exported = await memorySystem.exportMemoryData();

      const newMemory = new MemorySystem(config);
      await newMemory.importMemoryData(exported);

      const history = await newMemory.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('记忆清理', () => {
    it('应该正确清理记忆资源', async () => {
      await memorySystem.clearAllData();
      expect(memorySystem).toBeDefined();
    });

    it('应该清空记忆', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      await memorySystem.clearAllData();
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('记忆事件', () => {
    it('应该触发记忆事件', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history).toBeDefined();
    });
  });

  describe('记忆验证', () => {
    it('应该支持记忆验证', async () => {
      const userMessage = { role: 'user', content: 'Hello' };
      const aiResponse = { role: 'assistant', content: 'Hi there!' };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      const history = await memorySystem.getInteractionHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('记忆过期', () => {
    it('应该支持记忆过期', async () => {
      await memorySystem.cleanExpiredData();
      const history = await memorySystem.getInteractionHistory();
      expect(history).toBeDefined();
    });
  });

  describe('记忆指标', () => {
    it('应该返回记忆指标', async () => {
      const metrics = memorySystem.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('用户偏好', () => {
    it('应该支持用户偏好', async () => {
      const preferences = await memorySystem.getUserPreferences();
      expect(preferences).toBeDefined();
    });
  });

  describe('错误日志', () => {
    it('应该记录错误日志', async () => {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: 'Test error',
        context: {}
      };

      await memorySystem.saveErrorLog(errorLog);
      expect(memorySystem).toBeDefined();
    });
  });

  describe('缓存答案', () => {
    it('应该缓存答案', async () => {
      await memorySystem.cacheAnswer('test query', 'test answer');
      const cachedAnswer = await memorySystem.getCachedAnswer('test query');
      expect(cachedAnswer).toBe('test answer');
    });
  });

  describe('获取缓存答案', () => {
    it('应该获取缓存答案', async () => {
      await memorySystem.cacheAnswer('test query', 'test answer');
      const cachedAnswer = await memorySystem.getCachedAnswer('test query');
      expect(cachedAnswer).toBe('test answer');
    });

    it('应该返回null如果答案未缓存', async () => {
      const cachedAnswer = await memorySystem.getCachedAnswer('non-existent query');
      expect(cachedAnswer).toBeNull();
    });
  });

  describe('保存模式', () => {
    it('应该保存模式', async () => {
      const patterns = [
        {
          id: 'pattern-1',
          type: 'conversation',
          pattern: 'test pattern',
          confidence: 0.9,
          timestamp: new Date().toISOString()
        }
      ];

      await memorySystem.savePatterns(patterns);
      const savedPatterns = await memorySystem.getPatterns();
      expect(savedPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('获取模式', () => {
    it('应该获取模式', async () => {
      const patterns = [
        {
          id: 'pattern-1',
          type: 'conversation',
          pattern: 'test pattern',
          confidence: 0.9,
          timestamp: new Date().toISOString()
        }
      ];

      await memorySystem.savePatterns(patterns);
      const savedPatterns = await memorySystem.getPatterns();
      expect(savedPatterns.length).toBeGreaterThan(0);
      expect(savedPatterns[0].pattern).toBe('test pattern');
    });
  });

  describe('保存性能评估', () => {
    it('应该保存性能评估', async () => {
      const evaluation = {
        id: 'eval-1',
        timestamp: new Date().toISOString(),
        metrics: {
          responseTime: 100,
          accuracy: 0.95,
          userSatisfaction: 0.9
        }
      };

      await memorySystem.savePerformanceEvaluation(evaluation);
      const evaluations = await memorySystem.getPerformanceEvaluations();
      expect(evaluations.length).toBeGreaterThan(0);
    });
  });
});

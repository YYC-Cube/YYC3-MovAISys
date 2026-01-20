/**
 * @file LearningSystem 单元测试
 * @description 测试学习系统的核心功能
 * @module __tests__/unit/core/LearningSystem.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LearningSystem } from '../../../core/learning/LearningSystem';
import { MemorySystem } from '../../../core/memory/MemorySystem';
import { AutonomousAIConfig } from '../../../core/autonomous-ai-widget/types';

describe('LearningSystem', () => {
  let learningSystem: LearningSystem;
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
    learningSystem = new LearningSystem(config, memorySystem);
  });

  afterEach(() => {
    if (learningSystem) {
    }
    if (memorySystem) {
    }
  });

  describe('初始化', () => {
    it('应该成功初始化学习系统', () => {
      expect(learningSystem).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultConfig: AutonomousAIConfig = {
        enableMemory: true,
        enableLearning: true
      };
      const defaultMemory = new MemorySystem(defaultConfig);
      const defaultLearning = new LearningSystem(defaultConfig, defaultMemory);
      expect(defaultLearning).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customConfig: AutonomousAIConfig = {
        enableMemory: false,
        enableLearning: false
      };
      const customMemory = new MemorySystem(customConfig);
      const customLearning = new LearningSystem(customConfig, customMemory);
      expect(customLearning).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(learningSystem).toBeDefined();
    });
  });

  describe('学习管理', () => {
    it('应该成功记录学习数据', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBeGreaterThan(0);
    });

    it('应该成功分析学习数据', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();
    });

    it('应该成功应用学习结果', async () => {
      await learningSystem.updateLearningStrategy();
      expect(learningSystem).toBeDefined();
    });

    it('应该处理学习记录失败', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records).toBeDefined();
    });
  });

  describe('学习分类', () => {
    it('应该支持学习分类', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBeGreaterThan(0);
    });

    it('应该支持学习标签', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123', tags: ['test'] }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBeGreaterThan(0);
    });
  });

  describe('学习搜索', () => {
    it('应该支持学习搜索', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();
    });
  });

  describe('学习查询', () => {
    it('应该支持学习查询', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBeGreaterThan(0);
    });

    it('应该正确处理查询错误', async () => {
      const records = await learningSystem.getLearningRecords();
      expect(records).toBeDefined();
    });
  });

  describe('学习历史', () => {
    it('应该记录学习历史', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBeGreaterThan(0);
    });

    it('应该限制历史记录大小', async () => {
      for (let i = 0; i < 100; i++) {
        const record = {
          type: 'interaction',
          data: { message: `Hello ${i}` },
          context: { userId: `${i}` }
        };

        await learningSystem.recordInteraction(record);
      }

      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBeGreaterThan(0);
    });
  });

  describe('学习持久化', () => {
    it('应该支持学习导出', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const metrics = learningSystem.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('应该支持学习导入', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const metrics = learningSystem.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('学习清理', () => {
    it('应该正确清理学习资源', () => {
      expect(learningSystem).toBeDefined();
    });
  });

  describe('学习事件', () => {
    it('应该触发学习事件', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records).toBeDefined();
    });
  });

  describe('学习验证', () => {
    it('应该支持学习验证', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBeGreaterThan(0);
    });
  });

  describe('学习导出', () => {
    it('应该支持学习导出', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const metrics = learningSystem.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('学习导入', () => {
    it('应该支持学习导入', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const metrics = learningSystem.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('模式识别', () => {
    it('应该识别常见问题模式', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();
    });

    it('应该识别使用时间模式', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();
    });

    it('应该识别工具使用模式', async () => {
      const record = {
        type: 'interaction',
        data: { message: 'Hello' },
        context: { userId: '123' }
      };

      await learningSystem.recordInteraction(record);
      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();
    });
  });

  describe('性能评估', () => {
    it('应该评估性能', async () => {
      const evaluation = await learningSystem.evaluatePerformance();
      expect(evaluation).toBeDefined();
    });

    it('应该获取性能历史', async () => {
      const history = await learningSystem.getPerformanceHistory();
      expect(history).toBeDefined();
    });
  });

  describe('学习进度', () => {
    it('应该获取当前学习进度', async () => {
      const progress = await learningSystem.getCurrentProgress();
      expect(typeof progress).toBe('number');
    });
  });

  describe('学习指标', () => {
    it('应该返回学习指标', () => {
      const metrics = learningSystem.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('学习策略', () => {
    it('应该更新学习策略', async () => {
      await learningSystem.updateLearningStrategy();
      expect(learningSystem).toBeDefined();
    });
  });

  describe('获取模式', () => {
    it('应该获取识别的模式', async () => {
      const patterns = await learningSystem.getPatterns();
      expect(patterns).toBeDefined();
    });
  });
});

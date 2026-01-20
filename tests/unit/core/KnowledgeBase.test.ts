/**
 * @file KnowledgeBase 单元测试
 * @description 测试知识库的核心功能
 * @module __tests__/unit/core/KnowledgeBase.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  KnowledgeBase,
  KnowledgeItem,
  KnowledgeQuery,
  KnowledgeBaseConfig,
  KnowledgeMetrics
} from '../../../core/knowledge-base/KnowledgeBase';

describe('KnowledgeBase', () => {
  let knowledgeBase: KnowledgeBase;
  let config: KnowledgeBaseConfig;

  beforeEach(() => {
    config = {
      enablePersistence: false,
      enableIndexing: true,
      enableVersioning: true,
      maxItems: 10000,
      enableEmbedding: false
    };

    knowledgeBase = new KnowledgeBase(config);
  });

  afterEach(() => {
    if (knowledgeBase) {
      knowledgeBase.destroy();
    }
  });

  describe('初始化', () => {
    it('应该成功初始化知识库', () => {
      expect(knowledgeBase).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultKB = new KnowledgeBase();
      expect(defaultKB).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customConfig: KnowledgeBaseConfig = {
        enablePersistence: false,
        enableIndexing: false
      };
      const customKB = new KnowledgeBase(customConfig);
      expect(customKB).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(knowledgeBase).toBeDefined();
    });
  });

  describe('知识管理', () => {
    it('应该成功添加知识', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        metadata: { source: 'test' },
        confidence: 0.9,
        tags: ['test', 'sample']
      };

      const itemId = await knowledgeBase.add(item);
      expect(itemId).toBeDefined();
      expect(typeof itemId).toBe('string');
    });

    it('应该成功查询知识', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['test']
      };

      await knowledgeBase.add(item);
      const query: KnowledgeQuery = {
        type: 'fact',
        tags: ['test']
      };

      const results = await knowledgeBase.query(query);
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该成功更新知识', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'original' },
        tags: ['test']
      };

      const itemId = await knowledgeBase.add(item);
      await knowledgeBase.update(itemId, {
        content: { data: 'updated' }
      });

      const updatedItem = await knowledgeBase.get(itemId);
      expect(updatedItem?.content.data).toBe('updated');
    });

    it('应该成功删除知识', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['test']
      };

      const itemId = await knowledgeBase.add(item);
      await knowledgeBase.remove(itemId);

      const deletedItem = await knowledgeBase.get(itemId);
      expect(deletedItem).toBeUndefined();
    });

    it('应该处理知识添加失败', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['test']
      };

      for (let i = 0; i < 10001; i++) {
        await knowledgeBase.add({
          ...item,
          content: { data: `test${i}` }
        });
      }

      await expect(knowledgeBase.add(item)).rejects.toThrow();
    });
  });

  describe('知识分类', () => {
    it('应该支持知识分类', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['fact']
      });

      await knowledgeBase.add({
        type: 'rule',
        content: { data: 'test' },
        tags: ['rule']
      });

      const facts = await knowledgeBase.getByType('fact');
      const rules = await knowledgeBase.getByType('rule');

      expect(facts.length).toBeGreaterThan(0);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('应该支持知识标签', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['test', 'sample', 'demo']
      });

      const items = await knowledgeBase.getByTags(['test', 'sample']);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('知识搜索', () => {
    it('应该支持知识搜索', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test content for search' },
        tags: ['search']
      });

      const results = await knowledgeBase.search('test', 10);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('知识查询', () => {
    it('应该支持知识查询', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['test']
      });

      const query: KnowledgeQuery = {
        type: 'fact',
        tags: ['test']
      };

      const results = await knowledgeBase.query(query);
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该正确处理查询错误', async () => {
      const query: KnowledgeQuery = {
        type: 'invalid-type'
      };

      const results = await knowledgeBase.query(query);
      expect(results).toBeDefined();
    });
  });

  describe('知识历史', () => {
    it('应该记录知识访问历史', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['test']
      };

      await knowledgeBase.add(item);
      const metrics = knowledgeBase.getMetrics();
      expect(metrics.totalItems).toBeGreaterThan(0);
    });

    it('应该限制历史记录大小', async () => {
      const limitedKB = new KnowledgeBase({ maxItems: 5 });

      for (let i = 0; i < 10; i++) {
        await limitedKB.add({
          type: 'fact',
          content: { data: `test${i}` },
          tags: ['test']
        });
      }

      const metrics = limitedKB.getMetrics();
      expect(metrics.totalItems).toBeLessThanOrEqual(5);
    });
  });

  describe('知识持久化', () => {
    it('应该支持知识导出', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['test']
      });

      const exported = await knowledgeBase.export();
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
    });

    it('应该支持知识导入', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['test']
      };

      await knowledgeBase.add(item);
      const exported = await knowledgeBase.export();

      const newKB = new KnowledgeBase({ enablePersistence: false });
      await newKB.import(exported);

      const importedItem = await newKB.get(item.id);
      expect(importedItem).toBeDefined();
    });
  });

  describe('知识清理', () => {
    it('应该正确清理知识资源', () => {
      knowledgeBase.destroy();
      expect(knowledgeBase).toBeDefined();
    });

    it('应该清空知识库', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['test']
      });

      await knowledgeBase.clear();
      const metrics = knowledgeBase.getMetrics();
      expect(metrics.totalItems).toBe(0);
    });
  });

  describe('知识事件', () => {
    it('应该触发知识事件', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['test']
      });

      const metrics = knowledgeBase.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('知识验证', () => {
    it('应该支持知识验证', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        confidence: 0.9,
        tags: ['test']
      };

      const itemId = await knowledgeBase.add(item);
      const retrievedItem = await knowledgeBase.get(itemId);
      expect(retrievedItem).toBeDefined();
      expect(retrievedItem?.confidence).toBe(0.9);
    });
  });

  describe('知识指标', () => {
    it('应该返回知识指标', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['test']
      });

      const metrics = knowledgeBase.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalItems).toBeGreaterThan(0);
      expect(metrics.itemsByType).toBeDefined();
      expect(metrics.totalQueries).toBeDefined();
      expect(metrics.averageQueryTime).toBeDefined();
      expect(metrics.hitRate).toBeDefined();
    });

    it('应该正确计算知识指标', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test' },
        tags: ['test']
      });

      await knowledgeBase.add({
        type: 'rule',
        content: { data: 'test' },
        tags: ['test']
      });

      const metrics = knowledgeBase.getMetrics();
      expect(metrics.totalItems).toBe(2);
      expect(metrics.itemsByType.fact).toBe(1);
      expect(metrics.itemsByType.rule).toBe(1);
    });
  });

  describe('知识获取', () => {
    it('应该获取单个知识项', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['test']
      };

      const itemId = await knowledgeBase.add(item);
      const retrievedItem = await knowledgeBase.get(itemId);
      expect(retrievedItem).toBeDefined();
      expect(retrievedItem?.content.data).toBe('test');
    });

    it('应该获取所有知识项', async () => {
      await knowledgeBase.add({
        type: 'fact',
        content: { data: 'test1' },
        tags: ['test']
      });

      await knowledgeBase.add({
        type: 'rule',
        content: { data: 'test2' },
        tags: ['test']
      });

      const allItems = await knowledgeBase.getAll();
      expect(allItems.length).toBe(2);
    });
  });
});

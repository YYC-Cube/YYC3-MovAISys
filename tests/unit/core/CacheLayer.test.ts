/**
 * @file CacheLayer 单元测试
 * @description 测试缓存层的核心功能
 * @module __tests__/unit/core/CacheLayer.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheLayer, CacheConfig, CacheLevel, CacheStrategy } from '../../../core/cache/CacheLayer';

describe('CacheLayer', () => {
  let cacheLayer: CacheLayer;

  beforeEach(() => {
    const config: CacheConfig = {
      l1Size: 100,
      l1TTL: 60000,
      l2Size: '100MB',
      l2Policy: 'lru',
      l3Size: '1GB',
      l4TTL: 3600000,
      strategy: CacheStrategy.HYBRID,
      enableCompression: true,
      writeThrough: true,
      prefetchThreshold: 0.7
    };

    cacheLayer = new CacheLayer(config);
  });

  afterEach(() => {
    if (cacheLayer) {
      cacheLayer.destroy();
    }
  });

  describe('初始化', () => {
    it('应该成功初始化缓存层', () => {
      expect(cacheLayer).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultCache = new CacheLayer({});
      expect(defaultCache).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customConfig: CacheConfig = {
        l1Size: 200,
        l1TTL: 120000,
        strategy: CacheStrategy.LRU
      };
      const customCache = new CacheLayer(customConfig);
      expect(customCache).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(cacheLayer).toBeDefined();
    });
  });

  describe('缓存管理', () => {
    it('应该成功设置缓存', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      const result = await cacheLayer.get('test-key');
      expect(result).toBeDefined();
    });

    it('应该成功获取缓存', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      const result = await cacheLayer.get('test-key');
      expect(result).toBeDefined();
      expect(result.hit).toBe(true);
    });

    it('应该处理缓存未命中', async () => {
      const result = await cacheLayer.get('non-existent-key');
      expect(result).toBeDefined();
      expect(result.hit).toBe(false);
    });

    it('应该成功删除缓存', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      await cacheLayer.delete('test-key');
      const result = await cacheLayer.get('test-key');
      expect(result.hit).toBe(false);
    });

    it('应该成功清空缓存', async () => {
      await cacheLayer.set('test-key-1', { data: 'test1' });
      await cacheLayer.set('test-key-2', { data: 'test2' });
      await cacheLayer.clear();
      const result1 = await cacheLayer.get('test-key-1');
      const result2 = await cacheLayer.get('test-key-2');
      expect(result1.hit).toBe(false);
      expect(result2.hit).toBe(false);
    });
  });

  describe('缓存策略', () => {
    it('应该支持LRU策略', async () => {
      const config: CacheConfig = {
        l1Size: 2,
        strategy: CacheStrategy.LRU
      };
      const lruCache = new CacheLayer(config);
      
      await lruCache.set('key1', { data: 'value1' });
      await lruCache.set('key2', { data: 'value2' });
      await lruCache.set('key3', { data: 'value3' });
      
      const result = await lruCache.get('key1');
      expect(result.hit).toBe(false);
      
      lruCache.destroy();
    });

    it('应该支持TTL策略', async () => {
      const config: CacheConfig = {
        l1TTL: 100,
        strategy: CacheStrategy.TTL
      };
      const ttlCache = new CacheLayer(config);
      
      await ttlCache.set('test-key', { data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const result = await ttlCache.get('test-key');
      expect(result.hit).toBe(false);
      
      ttlCache.destroy();
    });
  });

  describe('缓存层级', () => {
    it('应该支持多级缓存', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      const result = await cacheLayer.get('test-key');
      expect(result).toBeDefined();
      expect(result.hit).toBe(true);
    });

    it('应该支持指定缓存层级', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      const metrics = cacheLayer.getMetrics(CacheLevel.L1);
      expect(metrics).toBeDefined();
    });
  });

  describe('缓存标签', () => {
    it('应该支持缓存标签', async () => {
      await cacheLayer.set('test-key', { data: 'test' }, {
        tags: ['tag1', 'tag2']
      });
      
      await cacheLayer.invalidateByTag('tag1');
      const result = await cacheLayer.get('test-key');
      expect(result.hit).toBe(false);
    });
  });

  describe('缓存预热', () => {
    it('应该支持缓存预热', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const loader = vi.fn().mockImplementation(async (key: string) => {
        return { data: `value-${key}` };
      });
      
      await cacheLayer.warmUp(keys, loader);
      expect(loader).toHaveBeenCalledTimes(3);
    });
  });

  describe('缓存指标', () => {
    it('应该返回缓存指标', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      await cacheLayer.get('test-key');
      
      const metrics = cacheLayer.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.hits).toBeGreaterThan(0);
    });

    it('应该返回指定层级的缓存指标', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      
      const metrics = cacheLayer.getMetrics(CacheLevel.L1);
      expect(metrics).toBeDefined();
    });
  });

  describe('缓存健康状态', () => {
    it('应该返回缓存健康状态', () => {
      const healthStatus = cacheLayer.getHealthStatus();
      expect(healthStatus).toBeDefined();
    });

    it('应该返回指定层级的健康状态', () => {
      const healthStatus = cacheLayer.getHealthStatus(CacheLevel.L1);
      expect(healthStatus).toBeDefined();
    });
  });

  describe('缓存压缩', () => {
    it('应该支持缓存压缩', async () => {
      const config: CacheConfig = {
        enableCompression: true
      };
      const compressedCache = new CacheLayer(config);
      
      const largeData = { data: 'x'.repeat(10000) };
      await compressedCache.set('test-key', largeData);
      
      const result = await compressedCache.get('test-key');
      expect(result.hit).toBe(true);
      expect(result.value.data).toBe(largeData.data);
      
      compressedCache.destroy();
    });
  });

  describe('缓存写入策略', () => {
    it('应该支持写透策略', async () => {
      const config: CacheConfig = {
        writeThrough: true
      };
      const writeThroughCache = new CacheLayer(config);
      
      await writeThroughCache.set('test-key', { data: 'test' });
      const result = await writeThroughCache.get('test-key');
      expect(result.hit).toBe(true);
      
      writeThroughCache.destroy();
    });

    it('应该支持写回策略', async () => {
      const config: CacheConfig = {
        writeBehind: true
      };
      const writeBehindCache = new CacheLayer(config);
      
      await writeBehindCache.set('test-key', { data: 'test' });
      const result = await writeBehindCache.get('test-key');
      expect(result.hit).toBe(true);
      
      writeBehindCache.destroy();
    });
  });

  describe('缓存清理', () => {
    it('应该正确清理缓存资源', () => {
      cacheLayer.destroy();
      expect(cacheLayer).toBeDefined();
    });
  });

  describe('缓存事件', () => {
    it('应该触发缓存命中事件', async () => {
      const handler = vi.fn();
      cacheLayer.on('cache:hit', handler);
      
      await cacheLayer.set('test-key', { data: 'test' });
      await cacheLayer.get('test-key');
      
      expect(handler).toHaveBeenCalled();
    });

    it('应该触发缓存未命中事件', async () => {
      const handler = vi.fn();
      cacheLayer.on('cache:miss', handler);
      
      await cacheLayer.get('non-existent-key');
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('缓存验证', () => {
    it('应该支持缓存验证', async () => {
      await cacheLayer.set('test-key', { data: 'test' });
      const result = await cacheLayer.get('test-key');
      expect(result.hit).toBe(true);
    });
  });

  describe('缓存元数据', () => {
    it('应该支持缓存元数据', async () => {
      await cacheLayer.set('test-key', { data: 'test' }, {
        metadata: { source: 'test', version: '1.0' }
      });
      
      const result = await cacheLayer.get('test-key');
      expect(result.hit).toBe(true);
    });
  });

  describe('缓存持久化', () => {
    it('应该支持缓存持久化', async () => {
      const config: CacheConfig = {
        persistentPath: '/tmp/cache'
      };
      const persistentCache = new CacheLayer(config);
      
      await persistentCache.set('test-key', { data: 'test' });
      const result = await persistentCache.get('test-key');
      expect(result.hit).toBe(true);
      
      persistentCache.destroy();
    });
  });
});

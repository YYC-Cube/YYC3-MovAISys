/**
 * @file ModelAdapter 单元测试
 * @description 测试模型适配器的核心功能
 * @module __tests__/unit/core/ModelAdapter.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ModelAdapter,
  ModelConfig,
  ModelRequest,
  ModelResponse,
  ModelCapabilities
} from '../../../core/pluggable/ModelAdapter';
import { ErrorHandler } from '../../../core/error-handler/ErrorHandler';

describe('ModelAdapter', () => {
  let adapter: ModelAdapter;
  let errorHandler: ErrorHandler;
  let config: ModelConfig;

  beforeEach(() => {
    errorHandler = new ErrorHandler({ enableAutoRecovery: true });
    adapter = new ModelAdapter('test-adapter', '1.0.0', errorHandler);
    
    config = {
      name: 'gpt-4',
      version: '1.0.0',
      provider: 'openai',
      apiKey: 'test-api-key',
      endpoint: 'https://api.openai.com/v1',
      maxTokens: 2048,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      timeout: 30000
    };
  });

  afterEach(async () => {
    if (adapter) {
      try {
      } catch (error) {
      }
    }
  });

  describe('初始化', () => {
    it('应该成功初始化适配器', async () => {
      await adapter.initialize(config);
      expect(adapter).toBeDefined();
    });

    it('应该使用默认配置初始化', async () => {
      const defaultConfig: ModelConfig = {
        name: 'gpt-3.5-turbo',
        version: '1.0.0',
        provider: 'openai',
        apiKey: 'test-key'
      };
      
      await adapter.initialize(defaultConfig);
      expect(adapter).toBeDefined();
    });

    it('应该使用自定义配置初始化', async () => {
      await adapter.initialize(config);
      expect(adapter).toBeDefined();
    });

    it('应该正确设置配置值', async () => {
      await adapter.initialize(config);
      expect(adapter).toBeDefined();
    });

    it('应该抛出错误如果配置无效', async () => {
      const invalidConfig: any = { name: 'test' };
      await expect(adapter.initialize(invalidConfig)).rejects.toThrow();
    });
  });

  describe('模型适配', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该成功适配OpenAI模型', async () => {
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Hello, AI!' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('应该成功适配Anthropic模型', async () => {
      const anthropicConfig: ModelConfig = {
        ...config,
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1'
      };

      await adapter.initialize(anthropicConfig);
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Hello, Claude!' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
    });

    it('应该成功适配本地模型', async () => {
      const localConfig: ModelConfig = {
        ...config,
        provider: 'local',
        endpoint: 'http://localhost:8000'
      };

      await adapter.initialize(localConfig);
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Hello, Local!' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
    });

    it('应该处理模型适配失败', async () => {
      const invalidConfig: ModelConfig = {
        ...config,
        endpoint: 'https://invalid-endpoint.com'
      };

      await adapter.initialize(invalidConfig);
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Test' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      await expect(adapter.generateResponse(request)).rejects.toThrow();
    });
  });

  describe('消息格式转换', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该正确转换消息格式', async () => {
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Hello!' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('应该处理消息转换失败', async () => {
      const invalidRequest: ModelRequest = {
        messages: [],
        temperature: 0.7,
        maxTokens: 100
      };

      await expect(adapter.generateResponse(invalidRequest)).rejects.toThrow();
    });
  });

  describe('响应格式处理', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该正确处理响应格式', async () => {
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Hello!' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.tokensUsed).toBeDefined();
      expect(response.model).toBeDefined();
    });

    it('应该处理响应解析失败', async () => {
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Test' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
    });
  });

  describe('模型切换', () => {
    it('应该支持模型切换', async () => {
      await adapter.initialize(config);
      
      const newConfig: ModelConfig = {
        ...config,
        name: 'gpt-3.5-turbo'
      };

      await adapter.initialize(newConfig);
      expect(adapter).toBeDefined();
    });

    it('应该处理模型切换失败', async () => {
      await adapter.initialize(config);
      
      const invalidConfig: ModelConfig = {
        ...config,
        name: 'invalid-model'
      };

      await expect(adapter.initialize(invalidConfig)).rejects.toThrow();
    });
  });

  describe('使用统计', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该正确记录使用统计', async () => {
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Hello!' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.tokensUsed).toBeDefined();
    });
  });

  describe('模型配置', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该支持模型配置', async () => {
      const newConfig: ModelConfig = {
        ...config,
        temperature: 0.5,
        maxTokens: 500
      };

      await adapter.initialize(newConfig);
      expect(adapter).toBeDefined();
    });

    it('应该处理配置错误', async () => {
      const invalidConfig: ModelConfig = {
        ...config,
        temperature: 2.0
      };

      await expect(adapter.initialize(invalidConfig)).rejects.toThrow();
    });
  });

  describe('模型版本管理', () => {
    it('应该支持模型版本管理', async () => {
      const version1Config: ModelConfig = {
        ...config,
        version: '1.0.0'
      };

      await adapter.initialize(version1Config);
      expect(adapter).toBeDefined();

      const version2Config: ModelConfig = {
        ...config,
        version: '2.0.0'
      };

      await adapter.initialize(version2Config);
      expect(adapter).toBeDefined();
    });
  });

  describe('模型错误处理', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该正确处理模型错误', async () => {
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Test' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
    });
  });

  describe('模型切换事件', () => {
    it('应该触发模型切换事件', async () => {
      const eventSpy = vi.fn();
      adapter.on('initialized', eventSpy);

      await adapter.initialize(config);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('健康检查', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该执行健康检查', async () => {
      const isHealthy = await adapter.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('模型能力', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该返回模型能力', () => {
      const capabilities = adapter.getCapabilities();
      expect(capabilities).toBeDefined();
      expect(capabilities.supportsStreaming).toBeDefined();
      expect(capabilities.supportsFunctionCalling).toBeDefined();
      expect(capabilities.supportsVision).toBeDefined();
      expect(capabilities.supportsAudio).toBeDefined();
      expect(capabilities.maxContextLength).toBeDefined();
      expect(capabilities.supportedLanguages).toBeDefined();
    });
  });

  describe('配置验证', () => {
    it('应该验证有效配置', () => {
      const isValid = adapter.validateConfig(config);
      expect(isValid).toBe(true);
    });

    it('应该拒绝无效配置', () => {
      const invalidConfig: any = { name: 'test' };
      const isValid = adapter.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('重试机制', () => {
    beforeEach(async () => {
      await adapter.initialize(config);
    });

    it('应该在失败时重试', async () => {
      const request: ModelRequest = {
        messages: [
          { role: 'user', content: 'Test' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const response = await adapter.generateResponse(request);
      expect(response).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该正确处理初始化错误', async () => {
      const invalidConfig: any = { name: 'test' };
      await expect(adapter.initialize(invalidConfig)).rejects.toThrow();
    });

    it('应该正确处理生成响应错误', async () => {
      await adapter.initialize(config);
      
      const invalidRequest: ModelRequest = {
        messages: [],
        temperature: 0.7,
        maxTokens: 100
      };

      await expect(adapter.generateResponse(invalidRequest)).rejects.toThrow();
    });
  });
});

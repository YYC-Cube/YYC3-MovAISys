/**
 * @file OpenAI模型适配器测试
 * @description 测试OpenAIAdapter类的功能
 * @module tests/model/OpenAIAdapter.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIAdapter } from '../model/OpenAIAdapter';
import { ModelProvider, ChatRequest } from '../types/model.types';

// Mock fetch
global.fetch = vi.fn() as any;

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    adapter = new OpenAIAdapter({
      apiKey: 'test-api-key',
      model: 'gpt-4-turbo-preview',
      maxRetries: 3,
      timeout: 30000
    });

    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('应该成功初始化适配器', async () => {
      await adapter.initialize();

      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('应该在缺少API密钥时抛出错误', async () => {
      const invalidAdapter = new OpenAIAdapter({} as any);

      await expect(invalidAdapter.initialize()).rejects.toThrow('OpenAI API密钥未配置');
    });
  });

  describe('chat', () => {
    it('应该成功调用聊天API', async () => {
      await adapter.initialize();

      // Mock fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chat-001',
          model: 'gpt-4-turbo-preview',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'Hello!'
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15
          }
        })
      });

      const request: ChatRequest = {
        provider: ModelProvider.OPENAI,
        type: 'chat_llm',
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      const response = await adapter.chat(request);

      expect(response.success).toBe(true);
      expect(response.message.content).toBe('Hello!');
      expect(response.usage.totalTokens).toBe(15);
    });

    it('应该在API错误时重试', async () => {
      await adapter.initialize();

      // Mock fetch error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const request: ChatRequest = {
        provider: ModelProvider.OPENAI,
        type: 'chat_llm',
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      await expect(adapter.chat(request)).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(4); // 初始调用 + 3次重试
    });
  });

  describe('healthCheck', () => {
    it('应该返回健康状态', async () => {
      await adapter.initialize();

      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });
});

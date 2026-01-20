/**
 * @file 本地模型适配器测试
 * @description 测试LocalModelAdapter类的功能
 * @module tests/model/LocalModelAdapter.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalModelAdapter } from '../model/LocalModelAdapter';
import { ModelProvider, ChatRequest } from '../types/model.types';

// Mock fetch
global.fetch = vi.fn() as any;

describe('LocalModelAdapter', () => {
  let adapter: LocalModelAdapter;

  beforeEach(() => {
    adapter = new LocalModelAdapter({
      modelPath: '/models/llama-3-8b',
      engine: 'ollama',
      host: 'localhost',
      port: 11434,
      model: 'llama3',
      maxRetries: 3,
      timeout: 60000
    });

    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('应该成功初始化适配器', async () => {
      // Mock health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      await adapter.initialize();

      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('应该返回健康状态', async () => {
      // Mock health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true
      });

      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('应该在健康检查失败时返回false', async () => {
      // Mock health check failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection failed'));

      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('chat', () => {
    it('应该成功调用聊天API', async () => {
      await adapter.initialize();

      // Mock fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3',
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
        provider: ModelProvider.LOCAL,
        type: 'chat_llm',
        model: 'llama3',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      const response = await adapter.chat(request);

      expect(response.success).toBe(true);
      expect(response.message.content).toBe('Hello!');
      expect(response.usage.totalTokens).toBe(15);
    });
  });
});

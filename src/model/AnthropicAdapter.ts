/**
 * @file Anthropic模型适配器实现
 * @description 实现Anthropic（Claude）模型的调用适配器
 * @module model/AnthropicAdapter
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { BaseModelAdapter, IModelAdapter, PreprocessedRequest, RawModelResponse } from './BaseModelAdapter';
import { logger } from '../utils/logger';
import { generateTraceId, ModelAdapterConfig, ModelCapability, ModelType } from '../types/model.types';
import {
  ModelProvider,
  ChatRequest,
  ChatResponse,
  CompletionRequest,
  CompletionResponse
} from '../types/model.types';

/**
 * Anthropic配置接口
 */
interface AnthropicConfig extends ModelAdapterConfig {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
}

/**
 * Anthropic API响应接口
 */
interface AnthropicMessageResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic模型适配器
 *
 * 功能：
 * 1. 支持Claude聊天（messages API）
 * 2. 支持文本补全（completions API）
 * 3. 自动重试和错误处理
 * 4. 长上下文支持（100K+ tokens）
 * 5. 完整的日志和监控
 */
export class AnthropicAdapter extends BaseModelAdapter implements IModelAdapter {
  protected config: AnthropicConfig;
  private defaultModel: string = 'claude-3-opus-20240229';

  constructor(config: AnthropicConfig) {
    const fullConfig: ModelAdapterConfig = {
      provider: ModelProvider.ANTHROPIC,
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.anthropic.com',
      model: 'claude-3-opus-20240229',
      timeout: 30000,
      retryPolicy: config.retryPolicy,
      cache: config.cache,
      metrics: config.metrics,
      logging: config.logging
    };

    super(fullConfig, {
              id: 'anthropic-adapter',
              name: 'Anthropic Adapter',
              provider: ModelProvider.ANTHROPIC,
              type: ModelType.CHAT_LLM,
              version: '1.0.0',
              capabilities: [
                ModelCapability.CHAT_COMPLETION,
                ModelCapability.TEXT_COMPLETION,
                ModelCapability.STREAMING
              ],
              limits: {
                maxInputTokens: 200000,
                maxOutputTokens: 4096,
                maxRequestsPerMinute: 50,
                maxTokensPerMinute: 40000
              },
              pricing: {
                inputPrice: 0.000015,
                outputPrice: 0.000075,
                currency: 'USD'
              },
              status: 'available'
            });
    this.config = config;

    logger.info('Anthropic适配器初始化', 'AnthropicAdapter', {
      model: this.defaultModel,
      baseUrl: config.baseUrl
    });
  }

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API密钥未配置');
    }

    logger.info('Anthropic适配器初始化完成', 'AnthropicAdapter');
  }

  /**
   * 调用Anthropic Messages API
   */
  private async callAnthropicMessages(request: ChatRequest): Promise<ChatResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
    const model = request.model || this.defaultModel;

    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const requestBody = {
      model,
      max_tokens: request.parameters?.maxTokens || 4096,
      messages,
      temperature: request.parameters?.temperature || 0.7,
      top_p: request.parameters?.topP || 1.0
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01'
    };

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API错误: ${response.status} - ${error}`);
    }

    const data: AnthropicMessageResponse = await response.json();

    const textContent = data.content.find(item => item.type === 'text')?.text || '';

    const finishReasonMap: Record<string, 'stop' | 'length' | 'function_call' | 'content_filter' | 'unknown'> = {
      'end_turn': 'stop',
      'max_tokens': 'length',
      'stop_sequence': 'stop'
    };
    const finishReason = finishReasonMap[data.stop_reason] || 'unknown';

    return {
      success: true,
      model: data.model,
      provider: ModelProvider.ANTHROPIC,
      timestamp: new Date(),
      processingTime: Date.now(),
      type: request.type,
      message: {
        role: 'assistant',
        content: textContent
      },
      finishReason,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      },
      traceId: generateTraceId()
    };
  }

  /**
   * 调用Anthropic Completions API
   */
  private async callAnthropicCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
    const model = request.model || this.defaultModel;

    const requestBody = {
      model,
      max_tokens_to_sample: request.parameters?.maxTokens || 4096,
      prompt: request.prompt,
      temperature: request.parameters?.temperature || 0.7,
      top_p: request.parameters?.topP || 1.0
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01'
    };

    const response = await fetch(`${baseUrl}/v1/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API错误: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      success: true,
      model: data.model,
      provider: ModelProvider.ANTHROPIC,
      timestamp: new Date(),
      processingTime: Date.now(),
      type: request.type,
      content: data.completion,
      finishReason: data.stop_reason,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      traceId: generateTraceId()
    };
  }

  protected async callModelAPI(request: PreprocessedRequest): Promise<RawModelResponse> {
    const original = request.original as CompletionRequest | ChatRequest;

    if ('messages' in original) {
      const response = await this.callAnthropicMessages(original as ChatRequest);
      return {
        raw: response,
        normalized: response
      };
    } else {
      const response = await this.callAnthropicCompletion(original as CompletionRequest);
      return {
        raw: response,
        normalized: response
      };
    }
  }

  protected async *callModelStream(request: PreprocessedRequest): AsyncIterable<unknown> {
    const original = request.original as CompletionRequest;
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
    const model = original.model || this.defaultModel;

    const requestBody = {
      model,
      max_tokens_to_sample: original.parameters?.maxTokens || 4096,
      prompt: original.prompt,
      stream: true
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01'
    };

    const response = await fetch(`${baseUrl}/v1/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API错误: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            yield JSON.parse(data);
          } catch (e) {
          }
        }
      }
    }
  }

  protected parseStreamChunk(chunk: unknown): {
    text?: string;
    tokens?: number;
    finished?: boolean;
    finishedReason?: string;
    index?: number;
  } {
    const data = chunk as any;

    if (data.type === 'completion' && data.completion) {
      return {
        text: data.completion,
        finished: data.stop_reason !== null,
        finishedReason: data.stop_reason,
        index: 0
      };
    }

    return {
      text: '',
      finished: false,
      index: 0
    };
  }

  protected async performHealthCheck(): Promise<void> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01'
    };

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.defaultModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic健康检查失败: ${response.status} - ${error}`);
    }
  }
}

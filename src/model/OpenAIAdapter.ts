/**
 * @file OpenAIAdapter.ts - OpenAI适配器实现
 * @description YYC³ MovAISys 智能浮窗系统 - 模型适配层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { BaseModelAdapter, IModelAdapter, PreprocessedRequest, RawModelResponse } from './BaseModelAdapter';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import {
  ModelAdapterConfig,
  ModelInfo,
  CompletionRequest,
  CompletionResponse,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelProvider
} from '../types/model.types';

/**
 * OpenAI客户端模拟
 * 实际项目中应该使用 @anthropic-ai/sdk 或 axios
 */
class OpenAIClient {
  constructor(_apiKey: string, _baseURL: string) {
  }

  async createCompletion(
    model: string,
    prompt: string
  ): Promise<unknown> {
    logger.debug('OpenAI创建补全', 'OpenAIClient', {
      model,
      prompt: prompt.substring(0, 100)
    });

    // 模拟API调用
    // 实际实现中应该使用 fetch 或 axios 调用 OpenAI API
    return {
      id: 'cmpl-' + Date.now(),
      object: 'text_completion',
      created: Date.now(),
      model,
      choices: [
        {
          index: 0,
          text: 'This is a simulated OpenAI response. In production, this would be the actual API response.',
          logprobs: null,
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: 20,
        total_tokens: Math.ceil(prompt.length / 4) + 20
      }
    };
  }

  async createChatCompletion(
    model: string,
    messages: unknown[]
  ): Promise<unknown> {
    logger.debug('OpenAI创建聊天补全', 'OpenAIClient', {
      model,
      messageCount: messages.length
    });

    // 模拟API调用
    return {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Date.now(),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a simulated OpenAI chat response. In production, this would be the actual API response.'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 20,
        total_tokens: 70
      }
    };
  }

  async createEmbedding(
    model: string,
    input: string | string[]
  ): Promise<unknown> {
    logger.debug('OpenAI创建向量嵌入', 'OpenAIClient', {
      model,
      input: Array.isArray(input) ? `${input.length} items` : input.substring(0, 100)
    });

    // 模拟向量嵌入
    const dimensions = 1536;
    const embeddings: number[][] = [];

    const inputs = Array.isArray(input) ? input : [input];
    for (const _ of inputs) {
      const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
      embeddings.push(embedding);
    }

    return {
      object: 'list',
      data: embeddings.map((emb, idx) => ({
        object: 'embedding',
        embedding: emb,
        index: idx
      })),
      model,
      usage: {
        prompt_tokens: inputs.length * 10,
        total_tokens: inputs.length * 10
      }
    };
  }

  async *createCompletionStream(
    model: string,
    prompt: string,
    options?: {
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
    }
  ): AsyncIterable<unknown> {
    logger.debug('OpenAI创建流式补全', 'OpenAIClient', {
      model,
      prompt: prompt.substring(0, 100),
      options
    });

    // 模拟流式响应
    const chunks = ['This ', 'is ', 'a ', 'streamed ', 'response.'];

    for (let i = 0; i < chunks.length; i++) {
      yield {
        id: 'cmpl-' + Date.now(),
        object: 'text_completion',
        created: Date.now(),
        model,
        choices: [
          {
            index: 0,
            delta: { content: chunks[i] },
            finish_reason: i === chunks.length - 1 ? 'stop' : null
          }
        ]
      };

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

/**
 * OpenAI适配器配置
 */
export interface OpenAIAdapterConfig extends ModelAdapterConfig {
  provider: ModelProvider.OPENAI;
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

/**
 * OpenAI适配器实现
 *
 * 设计理念：
 * 1. 完全兼容OpenAI API规范
 * 2. 支持流式和非流式调用
 * 3. 自动重试和错误恢复
 * 4. 完善的日志和监控
 * 5. 支持自定义请求头和组织ID
 */
export class OpenAIAdapter extends BaseModelAdapter implements IModelAdapter {
  private client: OpenAIClient;
  private rateLimiter: Map<string, { count: number; resetTime: number }>;
  private retryCount: number = 0;

  constructor(config: OpenAIAdapterConfig, modelInfo: ModelInfo) {
    super(config, modelInfo);

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAIClient(config.apiKey, config.baseURL || 'https://api.openai.com/v1');
    this.rateLimiter = new Map();

    logger.info('OpenAI适配器创建', 'OpenAIAdapter', {
      model: config.model,
      baseURL: config.baseURL
    });
  }

  // ================= 生命周期方法 =================

  async initialize(): Promise<void> {
    logger.info('初始化OpenAI适配器', 'OpenAIAdapter');

    try {
      // 验证API密钥
      await this.validateAPIKey();

      // 预热模型
      if (this.config.logging?.enabled) {
        await this.warmup();
      }

      this.isInitialized = true;
      logger.info('OpenAI适配器初始化成功', 'OpenAIAdapter');
    } catch (error) {
      logger.error('OpenAI适配器初始化失败', 'OpenAIAdapter', { error });
      throw error;
    }
  }

  // ================= 抽象方法实现 =================

  /**
   * 调用OpenAI文本补全API
   */
  protected async callModelAPI(request: PreprocessedRequest): Promise<RawModelResponse> {
    const startTime = Date.now();

    try {
      // 应用速率限制
      await this.applyRateLimit();

      const original = request.original as CompletionRequest | ChatRequest | EmbeddingRequest;
      const response = await this.callOpenAIAPI(original);

      const processingTime = Date.now() - startTime;

      logger.debug('OpenAI API调用成功', 'OpenAIAdapter', {
        processingTime,
        traceId: request.traceId
      });

      // 重置重试计数
      this.retryCount = 0;

      return {
        raw: response,
        normalized: this.normalizeOpenAIResponse(response, original)
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('OpenAI API调用失败', 'OpenAIAdapter', {
        error,
        processingTime,
        retryCount: this.retryCount,
        traceId: request.traceId
      });

      // 尝试重试
      if (this.shouldRetry(error as Error) && this.retryCount < (this.config.retryPolicy?.maxRetries || 3)) {
        this.retryCount++;
        const delay = this.calculateRetryDelay(this.retryCount);

        logger.warn('重试OpenAI API调用', 'OpenAIAdapter', {
          retryCount: this.retryCount,
          delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callModelAPI(request);
      }

      throw error;
    }
  }

  /**
   * 调用OpenAI流式API
   */
  protected async *callModelStream(request: PreprocessedRequest): AsyncIterable<unknown> {
    try {
      await this.applyRateLimit();

      const original = request.original as CompletionRequest;
      const stream = this.client.createCompletionStream(
        original.model,
        original.prompt,
        {
          max_tokens: original.parameters?.maxTokens,
          temperature: original.parameters?.temperature,
          top_p: original.parameters?.topP
        }
      );

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      logger.error('OpenAI流式API调用失败', 'OpenAIAdapter', { error });
      throw error;
    }
  }

  /**
   * 解析流式数据块
   */
  protected parseStreamChunk(chunk: unknown): {
    text?: string;
    tokens?: number;
    finished?: boolean;
    finishedReason?: string;
    index?: number;
  } {
    const data = chunk as any;

    if (data.choices?.[0]) {
      const choice = data.choices[0];
      const text = choice.delta?.content || '';
      const finished = choice.finish_reason !== null;

      return {
        text,
        tokens: text.length, // 简化的token计算
        finished,
        finishedReason: choice.finish_reason || undefined,
        index: choice.index || 0
      };
    }

    return { text: '', tokens: 0, finished: false, index: 0 };
  }

  /**
   * 执行健康检查
   */
  protected async performHealthCheck(): Promise<void> {
    try {
      await this.client.createCompletion(
        this.config.model,
        'test'
      );

      logger.info('OpenAI健康检查通过', 'OpenAIAdapter');
    } catch (error) {
      logger.error('OpenAI健康检查失败', 'OpenAIAdapter', { error });
      throw error;
    }
  }

  // ================= 私有辅助方法 =================

  /**
   * 调用OpenAI API（根据请求类型选择对应的API）
   */
  private async callOpenAIAPI(
    request: CompletionRequest | ChatRequest | EmbeddingRequest
  ): Promise<unknown> {
    if ('prompt' in request) {
      return await this.client.createCompletion(
        request.model,
        request.prompt
      );
    } else if ('messages' in request) {
      return await this.client.createChatCompletion(
        request.model,
        request.messages
      );
    } else if ('input' in request) {
      return await this.client.createEmbedding(
        request.model,
        request.input
      );
    }

    throw new Error('Unknown request type');
  }

  /**
   * 标准化OpenAI响应
   */
  private normalizeOpenAIResponse(
    response: any,
    _original: CompletionRequest | ChatRequest | EmbeddingRequest
  ): CompletionResponse | ChatResponse | EmbeddingResponse {
    if (response.choices?.[0]?.message) {
      const choice = response.choices[0];
      return {
        success: true,
        model: response.model,
        provider: ModelProvider.OPENAI,
        timestamp: new Date(),
        processingTime: 0,
        type: 'chat_llm' as any,
        message: choice.message,
        finishReason: choice.finish_reason,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } else if (response.choices?.[0]?.text) {
      const choice = response.choices[0];
      return {
        success: true,
        model: response.model,
        provider: ModelProvider.OPENAI,
        timestamp: new Date(),
        processingTime: 0,
        type: 'llm' as any,
        content: choice.text,
        finishReason: choice.finish_reason,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        },
        alternatives: response.choices.slice(1).map((c: any) => c.text)
      };
    } else if (response.data?.[0]?.embedding) {
      return {
        success: true,
        model: response.model,
        provider: ModelProvider.OPENAI,
        timestamp: new Date(),
        processingTime: 0,
        type: 'embedding' as any,
        embeddings: response.data.map((d: any) => d.embedding),
        dimensions: response.data[0].embedding.length,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    }

    throw new Error('Unknown response type');
  }

  /**
   * 验证API密钥
   */
  private async validateAPIKey(): Promise<void> {
    // 简化的验证，实际应该调用一个轻量级的API endpoint
    if (!this.config.apiKey || this.config.apiKey.length < 10) {
      throw new Error('Invalid OpenAI API key');
    }

    logger.info('OpenAI API密钥验证通过', 'OpenAIAdapter');
  }

  /**
   * 应用速率限制
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const key = this.config.apiKey || 'default';
    const windowSize = 60000; // 1分钟窗口
    const maxRequests = this.modelInfo.limits?.maxRequestsPerMinute || 3000;

    const rateInfo = this.rateLimiter.get(key);

    if (rateInfo) {
      if (now < rateInfo.resetTime) {
        // 在同一个时间窗口内
        if (rateInfo.count >= maxRequests) {
          // 超过速率限制
          const waitTime = rateInfo.resetTime - now;
          logger.warn('达到OpenAI速率限制，等待...', 'OpenAIAdapter', {
            waitTime: waitTime / 1000
          });

          await new Promise(resolve => setTimeout(resolve, waitTime));

          // 重置计数
          rateInfo.count = 0;
          rateInfo.resetTime = now + windowSize;
        }
      } else {
        // 时间窗口已过，重置
        rateInfo.count = 0;
        rateInfo.resetTime = now + windowSize;
      }
    } else {
      // 初始化速率限制器
      this.rateLimiter.set(key, {
        count: 0,
        resetTime: now + windowSize
      });
    }

    // 增加计数
    const currentRateInfo = this.rateLimiter.get(key)!;
    currentRateInfo.count++;

    metrics.gauge('openai.rate_limit_usage', currentRateInfo.count / maxRequests);
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: Error): boolean {
    const retryableErrors = [
      'timeout',
      'ETIMEDOUT',
      'ECONNRESET',
      'rate limit',
      '429',
      '500',
      '502',
      '503',
      '504'
    ];

    return retryableErrors.some(code =>
      error.message.toLowerCase().includes(code.toLowerCase())
    );
  }

  /**
   * 计算重试延迟（指数退避）
   */
  private calculateRetryDelay(retryCount: number): number {
    const backoffFactor = this.config.retryPolicy?.backoffFactor || 2;
    const initialDelay = this.config.retryPolicy?.initialDelay || 1000;
    return Math.min(initialDelay * Math.pow(backoffFactor, retryCount - 1), 60000);
  }
}

// ============ 导出 ============

export default OpenAIAdapter;

/**
 * @file BaseModelAdapter.ts - 模型适配器抽象基类
 * @description YYC³ MovAISys 智能浮窗系统 - 模型适配层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import {
  ModelAdapterConfig,
  CompletionRequest,
  CompletionResponse,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelInfo,
  ModelMetrics,
  ErrorResponse,
  generateTraceId,
  StreamChunk
} from '../types/model.types';

/**
 * 预处理后的请求
 */
export interface PreprocessedRequest {
  original: CompletionRequest | ChatRequest | EmbeddingRequest;
  normalized: unknown;
  headers: Record<string, string>;
  timeout: number;
  traceId: string;
}

/**
 * 原始模型响应
 */
export interface RawModelResponse {
  raw: unknown;
  normalized: unknown;
}

/**
 * 模型适配器抽象基类
 *
 * 设计理念：
 * 1. 模板方法模式：定义算法骨架，子类实现具体步骤
 * 2. 策略模式：不同模型有不同的调用策略
 * 3. 装饰器模式：添加缓存、重试、监控等横切关注点
 * 4. 统一接口：所有适配器实现相同的接口
 * 5. 可扩展性：易于添加新的模型提供商
 */
export abstract class BaseModelAdapter implements IModelAdapter {
  // ============ 配置与状态 ============
  protected config: ModelAdapterConfig;
  protected modelInfo: ModelInfo;
  protected metrics: ModelMetrics;
  protected isInitialized: boolean = false;

  // ============ 性能统计 ============
  private latencyHistory: number[] = [];

  constructor(config: ModelAdapterConfig, modelInfo: ModelInfo) {
    this.config = config;
    this.modelInfo = modelInfo;
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      totalTokens: 0,
      totalCost: 0,
      errorRate: 0
    };

    logger.info('模型适配器创建', 'BaseModelAdapter', {
      provider: config.provider,
      model: config.model
    });
  }

  // ================= 模型管理 =================

  getModelInfo(): ModelInfo {
    return this.modelInfo;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 简单的健康检查
      await this.healthCheck();
      return true;
    } catch (error) {
      logger.warn('模型不可用', 'BaseModelAdapter', {
        provider: this.config.provider,
        model: this.config.model,
        error
      });
      return false;
    }
  }

  async healthCheck(): Promise<{ status: string; latency?: number; message?: string }> {
    const startTime = Date.now();

    try {
      // 子类实现具体的健康检查逻辑
      await this.performHealthCheck();

      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        message: `${this.config.provider} ${this.config.model} is healthy`
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        status: 'unhealthy',
        latency,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ================= 核心推理方法 =================

  /**
   * 文本补全（模板方法）
   */
  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const traceId = generateTraceId();

    logger.debug('开始文本补全', 'BaseModelAdapter', {
      model: this.config.model,
      prompt: request.prompt.substring(0, 100) + '...',
      traceId
    });

    try {
      // 1. 更新指标
      this.metrics.requestCount++;

      // 2. 预处理请求
      const preprocessed = await this.preprocessRequest(request, traceId);

      // 3. 检查缓存
      const cached = await this.checkCache(preprocessed);
      if (cached) {
        logger.debug('命中缓存', 'BaseModelAdapter', { traceId });
        metrics.increment('model_adapter.cache_hit');
        return cached as CompletionResponse;
      }

      // 4. 调用模型API（抽象方法，由子类实现）
      const rawResponse = await this.callModelAPI(preprocessed);

      // 5. 后处理响应
      const processed = await this.postprocessResponse(rawResponse, request);

      // 6. 缓存结果
      await this.cacheResult(preprocessed, processed);

      // 7. 更新性能指标
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, processed.usage.totalTokens, true);

      // 8. 记录监控指标
      metrics.increment('model_adapter.completion_success');
      metrics.histogram('model_adapter.completion_latency', processingTime);
      metrics.histogram('model_adapter.tokens_used', processed.usage.totalTokens);

      logger.debug('文本补全完成', 'BaseModelAdapter', {
        processingTime,
        tokens: processed.usage.totalTokens,
        traceId
      });

      return processed as CompletionResponse;
    } catch (error) {
      // 错误处理
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, 0, false);

      logger.error('文本补全失败', 'BaseModelAdapter', {
        error,
        processingTime,
        traceId
      });

      metrics.increment('model_adapter.completion_failed');

      // 尝试错误恢复
      return await this.handleError(error, request, traceId) as CompletionResponse;
    }
  }

  /**
   * 聊天补全（模板方法）
   */
  async generateChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const traceId = generateTraceId();

    logger.debug('开始聊天补全', 'BaseModelAdapter', {
      model: this.config.model,
      messageCount: request.messages.length,
      traceId
    });

    try {
      // 1. 更新指标
      this.metrics.requestCount++;

      // 2. 预处理请求
      const preprocessed = await this.preprocessRequest(request, traceId);

      // 3. 检查缓存
      const cached = await this.checkCache(preprocessed);
      if (cached) {
        logger.debug('命中缓存', 'BaseModelAdapter', { traceId });
        metrics.increment('model_adapter.cache_hit');
        return cached as ChatResponse;
      }

      // 4. 调用模型API
      const rawResponse = await this.callModelAPI(preprocessed);

      // 5. 后处理响应
      const processed = await this.postprocessResponse(rawResponse, request);

      // 6. 缓存结果
      await this.cacheResult(preprocessed, processed);

      // 7. 更新性能指标
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, processed.usage.totalTokens, true);

      // 8. 记录监控指标
      metrics.increment('model_adapter.chat_success');
      metrics.histogram('model_adapter.chat_latency', processingTime);
      metrics.histogram('model_adapter.tokens_used', processed.usage.totalTokens);

      logger.debug('聊天补全完成', 'BaseModelAdapter', {
        processingTime,
        tokens: processed.usage.totalTokens,
        traceId
      });

      return processed as ChatResponse;
    } catch (error) {
      // 错误处理
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, 0, false);

      logger.error('聊天补全失败', 'BaseModelAdapter', {
        error,
        processingTime,
        traceId
      });

      metrics.increment('model_adapter.chat_failed');

      return await this.handleError(error, request, traceId) as ChatResponse;
    }
  }

  /**
   * 生成向量嵌入
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    const traceId = generateTraceId();

    logger.debug('开始生成向量嵌入', 'BaseModelAdapter', {
      model: this.config.model,
      input: Array.isArray(request.input) ? `${request.input.length} items` : request.input.substring(0, 100),
      traceId
    });

    try {
      this.metrics.requestCount++;

      const preprocessed = await this.preprocessRequest(request, traceId);
      const cached = await this.checkCache(preprocessed);

      if (cached) {
        return cached as EmbeddingResponse;
      }

      const rawResponse = await this.callModelAPI(preprocessed);
      const processed = await this.postprocessResponse(rawResponse, request);
      await this.cacheResult(preprocessed, processed);

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, processed.usage.totalTokens, true);

      return processed as EmbeddingResponse;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, 0, false);

      logger.error('生成向量嵌入失败', 'BaseModelAdapter', { error, processingTime });

      throw error;
    }
  }

  // ================= 流式处理方法 =================

  /**
   * 流式文本补全
   */
  async *streamCompletion(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const traceId = generateTraceId();
    let buffer = '';
    let tokenCount = 0;

    logger.debug('开始流式文本补全', 'BaseModelAdapter', {
      model: this.config.model,
      traceId
    });

    try {
      this.metrics.requestCount++;

      const preprocessed = await this.preprocessRequest(request, traceId);
      const stream = await this.callModelStream(preprocessed);

      for await (const chunk of stream) {
        const parsed = this.parseStreamChunk(chunk);
        tokenCount += parsed.tokens || 0;
        buffer += parsed.text || '';

        const streamChunk: StreamChunk = {
          delta: {
            content: parsed.text
          },
          finishReason: parsed.finishedReason,
          index: parsed.index || 0,
          isComplete: parsed.finished || false
        };

        yield streamChunk;

        if (parsed.finished) {
          // 完成时的最终chunk
          yield {
            delta: {},
            finishReason: parsed.finishedReason,
            index: parsed.index || 0,
            isComplete: true,
            usage: {
              promptTokens: tokenCount, // 简化处理
              completionTokens: tokenCount,
              totalTokens: tokenCount * 2
            }
          };
          break;
        }
      }
    } catch (error) {
      logger.error('流式文本补全失败', 'BaseModelAdapter', { error, traceId });
      throw error;
    }
  }

  // ================= 批量处理方法 =================

  /**
   * 批量文本补全
   */
  async batchComplete(requests: CompletionRequest[]): Promise<CompletionResponse[]> {
    logger.debug('开始批量文本补全', 'BaseModelAdapter', {
      count: requests.length
    });

    const results = await Promise.allSettled(
      requests.map(request => this.generateCompletion(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          type: 'llm' as const,
          model: this.config.model,
          provider: this.config.provider,
          timestamp: new Date(),
          processingTime: 0,
          content: '',
          finishReason: 'unknown',
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          },
          error: {
            code: 'BATCH_ERROR',
            message: result.reason instanceof Error ? result.reason.message : 'Unknown error',
            index
          }
        } as CompletionResponse;
      }
    });
  }

  // ================= 模型配置方法 =================

  async updateConfig(config: Partial<ModelAdapterConfig>): Promise<void> {
    logger.info('更新模型适配器配置', 'BaseModelAdapter', {
      provider: this.config.provider,
      model: this.config.model,
      updates: Object.keys(config)
    });

    this.config = { ...this.config, ...config };

    // 如果需要重新初始化
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  getConfig(): ModelAdapterConfig {
    return { ...this.config };
  }

  // ================= 性能优化方法 =================

  async warmup(): Promise<void> {
    logger.info('模型预热中...', 'BaseModelAdapter', {
      provider: this.config.provider,
      model: this.config.model
    });

    try {
      // 发送一个简单的请求进行预热
      await this.generateCompletion({
        provider: this.config.provider,
        model: this.config.model,
        type: 'llm' as any,
        prompt: 'Hello'
      });

      logger.info('模型预热完成', 'BaseModelAdapter');
    } catch (error) {
      logger.warn('模型预热失败', 'BaseModelAdapter', { error });
      // 不抛出错误，预热失败不应影响后续使用
    }
  }

  async clearCache(): Promise<void> {
    // 由子类实现
    logger.info('清除缓存', 'BaseModelAdapter');
  }

  async optimizeFor(batchSize: number): Promise<void> {
    logger.info('优化模型适配器', 'BaseModelAdapter', { batchSize });
    // 由子类实现特定优化
  }

  // ================= 性能指标方法 =================

  getMetrics(): ModelMetrics {
    return { ...this.metrics };
  }

  // ================= 抽象方法（由子类实现）=================

  /**
   * 初始化适配器
   */
  abstract initialize(): Promise<void>;

  /**
   * 调用模型API
   */
  protected abstract callModelAPI(request: PreprocessedRequest): Promise<RawModelResponse>;

  /**
   * 调用模型流式API
   */
  protected abstract callModelStream(request: PreprocessedRequest): AsyncIterable<unknown>;

  /**
   * 解析流式数据块
   */
  protected abstract parseStreamChunk(chunk: unknown): {
    text?: string;
    tokens?: number;
    finished?: boolean;
    finishedReason?: string;
    index?: number;
  };

  /**
   * 执行健康检查
   */
  protected abstract performHealthCheck(): Promise<void>;

  // ================= 保护方法（供子类使用）=================

  /**
   * 预处理请求
   */
  protected async preprocessRequest(
    request: CompletionRequest | ChatRequest | EmbeddingRequest,
    traceId: string
  ): Promise<PreprocessedRequest> {
    // 1. 验证请求
    await this.validateRequest(request);

    // 2. 标准化请求
    const normalized = this.normalizeRequest(request);

    // 3. 构建请求头
    const headers = this.buildHeaders();

    return {
      original: request,
      normalized,
      headers,
      timeout: this.config.timeout || 30000,
      traceId
    };
  }

  /**
   * 后处理响应
   */
  protected async postprocessResponse(
    rawResponse: RawModelResponse,
    originalRequest: CompletionRequest | ChatRequest | EmbeddingRequest
  ): Promise<CompletionResponse | ChatResponse | EmbeddingResponse> {
    // 子类可以覆盖此方法实现特定的后处理逻辑
    console.log(`后处理响应，请求类型: ${originalRequest.type}`);
    return rawResponse.normalized as any;
  }

  /**
   * 检查缓存
   */
  protected async checkCache(request: PreprocessedRequest): Promise<CompletionResponse | ChatResponse | EmbeddingResponse | null> {
    if (!this.config.cache?.enabled) {
      return null;
    }

    const cacheKey = this.generateCacheKey(request);
    logger.debug('检查缓存', 'BaseModelAdapter', { cacheKey });

    // 由子类实现具体的缓存逻辑
    // 这里返回null表示未命中
    return null;
  }

  /**
   * 缓存结果
   */
  protected async cacheResult(
    request: PreprocessedRequest,
    response: CompletionResponse | ChatResponse | EmbeddingResponse
  ): Promise<void> {
    if (!this.config.cache?.enabled) {
      return;
    }

    const cacheKey = this.generateCacheKey(request);
    logger.debug('缓存结果', 'BaseModelAdapter', { 
      cacheKey,
      responseModel: response.model,
      responseProvider: response.provider
    });

    // 由子类实现具体的缓存逻辑
  }

  /**
   * 错误处理
   */
  protected async handleError(
    error: unknown,
    _originalRequest: CompletionRequest | ChatRequest | EmbeddingRequest,
    _traceId: string
  ): Promise<CompletionResponse | ChatResponse | EmbeddingResponse> {
    const errorResponse: ErrorResponse = {
      code: 'MODEL_ADAPTER_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      retryable: false
    };

    // 尝试错误分类
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorResponse.code = 'TIMEOUT_ERROR';
        errorResponse.retryable = true;
        errorResponse.suggestedRetryAfter = 5;
      } else if (error.message.includes('rate limit')) {
        errorResponse.code = 'RATE_LIMIT_ERROR';
        errorResponse.retryable = true;
        errorResponse.suggestedRetryAfter = 60;
      }
    }

    // 返回错误响应
    return {
      success: false,
      model: this.config.model,
      provider: this.config.provider,
      timestamp: new Date(),
      processingTime: 0,
      content: '',
      finishReason: 'unknown',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      error: errorResponse
    } as any;
  }

  // ================= 私有方法 =================

  /**
   * 验证请求
   */
  private async validateRequest(request: CompletionRequest | ChatRequest | EmbeddingRequest): Promise<void> {
    if (!request.model) {
      throw new Error('Model is required');
    }

    // 验证输入长度
    const maxLength = this.modelInfo.limits?.maxInputTokens || 4096;
    const inputLength = this.calculateInputLength(request);

    if (inputLength > maxLength) {
      logger.warn('输入超过最大长度', 'BaseModelAdapter', {
        inputLength,
        maxLength
      });
      throw new Error(`Input exceeds maximum length: ${inputLength} > ${maxLength}`);
    }
  }

  /**
   * 标准化请求
   */
  private normalizeRequest(request: CompletionRequest | ChatRequest | EmbeddingRequest): unknown {
    // 子类可以覆盖此方法实现特定的标准化逻辑
    return request;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YYC3-AILP-Intelligent-Widget/1.0.0'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: PreprocessedRequest): string {
    // 简单的缓存键生成，子类可以优化
    return `${this.config.provider}-${this.config.model}-${JSON.stringify(request.normalized)}`;
  }

  /**
   * 计算输入长度
   */
  private calculateInputLength(request: CompletionRequest | ChatRequest | EmbeddingRequest): number {
    // 简化的长度计算，实际应该使用tokenizer
    if ('prompt' in request) {
      return request.prompt.length;
    } else if ('messages' in request) {
      return JSON.stringify(request.messages).length;
    } else if ('input' in request) {
      return JSON.stringify(request.input).length;
    }
    return 0;
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(latency: number, tokens: number, success: boolean): void {
    // 更新延迟历史
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }

    // 计算平均延迟
    this.metrics.averageLatency =
      this.latencyHistory.reduce((sum, l) => sum + l, 0) / this.latencyHistory.length;

    // 计算P95和P99延迟
    const sorted = [...this.latencyHistory].sort((a, b) => a - b);
    this.metrics.p95Latency = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.metrics.p99Latency = sorted[Math.floor(sorted.length * 0.99)] || 0;

    // 更新token统计
    this.metrics.totalTokens += tokens;

    // 更新成功/失败统计
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    // 计算错误率
    this.metrics.errorRate =
      this.metrics.errorCount / (this.metrics.successCount + this.metrics.errorCount);

    // 计算成本
    if (this.modelInfo.pricing) {
      const cost = (tokens / 1000) * this.modelInfo.pricing.inputPrice;
      this.metrics.totalCost += cost;
    }
  }
}

// ============ 接口定义 ============

/**
 * 模型适配器接口
 */
export interface IModelAdapter {
  // ============ 模型管理 ============
  getModelInfo(): ModelInfo;
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<{ status: string; latency?: number; message?: string }>;

  // ============ 核心推理 ============
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  generateChatCompletion(request: ChatRequest): Promise<ChatResponse>;
  generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  // ============ 流式处理 ============
  streamCompletion(request: CompletionRequest): AsyncIterable<StreamChunk>;
  streamChat?(request: ChatRequest): AsyncIterable<StreamChunk>;

  // ============ 批量处理 ============
  batchComplete(requests: CompletionRequest[]): Promise<CompletionResponse[]>;

  // ============ 模型配置 ============
  updateConfig(config: Partial<ModelAdapterConfig>): Promise<void>;
  getConfig(): ModelAdapterConfig;

  // ============ 性能优化 ============
  warmup(): Promise<void>;
  clearCache(): Promise<void>;
  optimizeFor(batchSize: number): Promise<void>;

  // ============ 性能指标 ============
  getMetrics(): ModelMetrics;
}

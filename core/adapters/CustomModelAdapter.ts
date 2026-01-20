/**
 * @file 自定义模型适配器实现
 * @description 实现自定义模型API的适配器，支持用户自定义的AI模型
 * @module adapters/CustomModelAdapter
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 */

import { ModelAdapter, ModelGenerationRequest, ModelGenerationResponse } from './ModelAdapter';
import { AutonomousAIConfig } from '../autonomous-ai-widget/types';
import { AITool } from '../tools/types';
import { 
  ValidationError, 
  NetworkError, 
  TimeoutError,
  AuthenticationError,
  isRetryable
} from '../error-handler/ErrorTypes';
import { ErrorHandler } from '../error-handler/ErrorHandler';

export interface CustomModelConfig extends AutonomousAIConfig {
  customEndpoint: string;
  customHeaders?: Record<string, string>;
  requestTransformer?: (request: any) => any;
  responseTransformer?: (response: any) => ModelGenerationResponse;
}

export class CustomModelAdapter implements ModelAdapter {
  private config: CustomModelConfig;
  private status: 'idle' | 'initializing' | 'generating' | 'error' = 'idle';
  private abortController: AbortController | null = null;
  private supportedTools: string[] = [];
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private responseTimes: number[] = [];
  private errorHandler: ErrorHandler;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: CustomModelConfig, errorHandler?: ErrorHandler) {
    this.config = config;
    this.errorHandler = errorHandler || new ErrorHandler({ enableAutoRecovery: true });
  }

  async initialize(config: CustomModelConfig): Promise<void> {
    this.status = 'initializing';
    this.config = config;

    if (!this.config.apiType) {
      throw new ValidationError('apiType is required', 'apiType', {
        additionalData: { config: this.config }
      });
    }

    if (this.config.apiType !== 'custom') {
      throw new ValidationError('apiType must be "custom" for CustomModelAdapter', 'apiType', {
        additionalData: { apiType: this.config.apiType }
      });
    }

    if (!this.config.customEndpoint) {
      throw new ValidationError('customEndpoint is required for custom model', 'customEndpoint', {
        additionalData: { config: this.config }
      });
    }

    if (this.config.apiKey && !this.config.customHeaders) {
      this.config.customHeaders = {
        'Authorization': `Bearer ${this.config.apiKey}`
      };
    }

    this.status = 'idle';
  }

  async generate(request: ModelGenerationRequest): Promise<ModelGenerationResponse> {
    this.status = 'generating';
    this.abortController = new AbortController();
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const result = await this.generateWithRetry(request);
      
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.successfulRequests++;
      
      return result;
    } catch (error) {
      this.failedRequests++;
      this.status = 'error';
      await this.errorHandler.handleError(error as Error, {
        operation: 'generate',
        adapter: 'CustomModelAdapter',
        request
      });
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  private async generateWithRetry(request: ModelGenerationRequest): Promise<ModelGenerationResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const customRequest = this.buildCustomRequest(request);
        const response = await this.callCustomModelAPI(customRequest);
        return this.convertCustomResponse(response);
      } catch (error) {
        lastError = error as Error;
        
        if (!isRetryable(error as Error) || attempt >= this.maxRetries) {
          break;
        }

        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async cancel(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.status = 'idle';
  }

  getSupportedTools(): string[] {
    return [...this.supportedTools];
  }

  supportsTool(toolName: string): boolean {
    return this.supportedTools.includes(toolName);
  }

  setSupportedTools(tools: string[]): void {
    this.supportedTools = [...tools];
  }

  getStatus(): 'idle' | 'initializing' | 'generating' | 'error' {
    return this.status;
  }

  getConfig(): CustomModelConfig {
    return { ...this.config };
  }

  getMetrics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  } {
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      averageResponseTime,
    };
  }

  private buildCustomRequest(request: ModelGenerationRequest): any {
    const customMessages: Array<{ role: string; content: string; tool_calls?: any[] }> = [];

    if (request.messages?.find(m => m.role === 'system')) {
      customMessages.push(...request.messages);
    } else {
      customMessages.push({ role: 'system', content: 'You are a helpful AI assistant.' });
      if (request.messages) {
        customMessages.push(...request.messages);
      }
    }

    customMessages.push({ role: 'user', content: request.prompt });

    const tools = request.tools?.map(tool => this.convertToCustomTool(tool));

    const baseRequest = {
      messages: customMessages,
      max_tokens: request.modelConfig?.maxTokens || this.config.maxTokens || 4096,
      temperature: request.modelConfig?.temperature || this.config.temperature || 0.7,
      tools: tools || [],
      tool_choice: request.forceToolUse ? 'auto' : 'none',
    };

    if (this.config.requestTransformer) {
      return this.config.requestTransformer(baseRequest);
    }

    return baseRequest;
  }

  private async callCustomModelAPI(request: any): Promise<any> {
    const endpoint = this.config.customEndpoint;
    const headers = {
      'Content-Type': 'application/json',
      ...this.config.customHeaders
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(
            `Custom model authentication failed: ${response.status} ${response.statusText} ${errorData.error?.message}`,
            {
              path: endpoint,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        if (response.status === 408 || response.status === 504) {
          throw new TimeoutError(
            `Custom model request timeout: ${response.status} ${response.statusText}`,
            this.config.timeout || 30000,
            {
              path: endpoint,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        if (response.status === 429) {
          throw new NetworkError(
            `Custom model rate limit exceeded: ${response.statusText}`,
            {
              path: endpoint,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        if (response.status >= 500) {
          throw new NetworkError(
            `Custom model server error: ${response.status} ${response.statusText}`,
            {
              path: endpoint,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        throw new NetworkError(
          `Custom model API error: ${response.status} ${response.statusText} ${errorData.error?.message}`,
          {
            path: endpoint,
            additionalData: { 
              status: response.status, 
              statusText: response.statusText,
              errorData
            }
          }
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError(
          `Network error connecting to custom model: ${error.message}`,
          {
            path: endpoint,
            additionalData: { originalError: error.message }
          }
        );
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(
          `Custom model request was cancelled`,
          this.config.timeout || 30000,
          {
            path: endpoint,
            additionalData: { reason: 'aborted' }
          }
        );
      }

      throw error;
    }
  }

  private convertCustomResponse(customResponse: any): ModelGenerationResponse {
    if (this.config.responseTransformer) {
      return this.config.responseTransformer(customResponse);
    }

    const message = customResponse.choices?.[0]?.message || customResponse.message;
    const toolCall = message?.tool_calls?.[0] || message?.toolCall;

    this.status = 'idle';

    return {
      content: message?.content || '',
      toolUsed: !!toolCall,
      toolCall: toolCall
        ? {
            name: toolCall.name || toolCall.function?.name,
            params: toolCall.params || toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {},
          }
        : undefined,
      usage: customResponse.usage
        ? {
            promptTokens: customResponse.usage.prompt_tokens,
            completionTokens: customResponse.usage.completion_tokens,
            totalTokens: customResponse.usage.total_tokens,
          }
        : undefined,
      timestamp: Date.now(),
      modelId: customResponse.model || this.config.modelName,
    };
  }

  private convertToCustomTool(tool: AITool): any {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    };
  }
}

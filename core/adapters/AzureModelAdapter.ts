/**
 * @file Azure OpenAI模型适配器实现
 * @description 实现Azure OpenAI API的模型适配器
 * @module adapters/AzureModelAdapter
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

export interface AzureOpenAIConfig extends AutonomousAIConfig {
  endpoint: string;
  apiVersion: string;
  deploymentName: string;
}

export class AzureModelAdapter implements ModelAdapter {
  private config: AzureOpenAIConfig;
  private status: 'idle' | 'initializing' | 'generating' | 'error' = 'idle';
  private abortController: AbortController | null = null;
  private supportedTools: string[] = ['search', 'calculator', 'code_interpreter', 'retrieval'];
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private responseTimes: number[] = [];
  private errorHandler: ErrorHandler;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: AzureOpenAIConfig, errorHandler?: ErrorHandler) {
    this.config = config;
    this.errorHandler = errorHandler || new ErrorHandler({ enableAutoRecovery: true });
  }

  async initialize(config: AzureOpenAIConfig): Promise<void> {
    this.status = 'initializing';
    this.config = config;

    if (!this.config.apiType) {
      throw new ValidationError('apiType is required', 'apiType', {
        additionalData: { config: this.config }
      });
    }

    if (!this.config.deploymentName) {
      throw new ValidationError('deploymentName is required for Azure OpenAI', 'deploymentName', {
        additionalData: { config: this.config }
      });
    }

    if (!this.config.endpoint) {
      throw new ValidationError('endpoint is required for Azure OpenAI', 'endpoint', {
        additionalData: { config: this.config }
      });
    }

    if (!this.config.apiKey) {
      throw new ValidationError('apiKey is required for Azure OpenAI', 'apiKey', {
        additionalData: { apiType: this.config.apiType }
      });
    }

    if (!this.config.apiVersion) {
      this.config.apiVersion = '2024-02-15-preview';
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
        adapter: 'AzureModelAdapter',
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
        const azureRequest = this.buildAzureRequest(request);
        const response = await this.callAzureOpenAIAPI(azureRequest);
        return this.convertAzureResponse(response);
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

  getStatus(): 'idle' | 'initializing' | 'generating' | 'error' {
    return this.status;
  }

  getConfig(): AzureOpenAIConfig {
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

  private buildAzureRequest(request: ModelGenerationRequest): any {
    const azureMessages: Array<{ role: string; content: string; tool_calls?: any[] }> = [];

    if (request.messages?.find(m => m.role === 'system')) {
      azureMessages.push(...request.messages);
    } else {
      azureMessages.push({ role: 'system', content: 'You are a helpful AI assistant.' });
      if (request.messages) {
        azureMessages.push(...request.messages);
      }
    }

    azureMessages.push({ role: 'user', content: request.prompt });

    const tools = request.tools?.map(tool => this.convertToAzureTool(tool));

    return {
      messages: azureMessages,
      max_tokens: request.modelConfig?.maxTokens || this.config.maxTokens || 4096,
      temperature: request.modelConfig?.temperature || this.config.temperature || 0.7,
      tools: tools || [],
      tool_choice: request.forceToolUse ? 'auto' : 'none',
    };
  }

  private async callAzureOpenAIAPI(request: any): Promise<any> {
    const apiKey = this.config.apiKey;
    const endpoint = this.config.endpoint;
    const deploymentName = this.config.deploymentName;
    const apiVersion = this.config.apiVersion;
    const baseURL = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(
            `Azure OpenAI authentication failed: ${response.status} ${response.statusText} ${errorData.error?.message}`,
            {
              path: baseURL,
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
            `Azure OpenAI request timeout: ${response.status} ${response.statusText}`,
            this.config.timeout || 30000,
            {
              path: baseURL,
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
            `Azure OpenAI rate limit exceeded: ${response.statusText}`,
            {
              path: baseURL,
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
            `Azure OpenAI server error: ${response.status} ${response.statusText}`,
            {
              path: baseURL,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        throw new NetworkError(
          `Azure OpenAI API error: ${response.status} ${response.statusText} ${errorData.error?.message}`,
          {
            path: baseURL,
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
          `Network error connecting to Azure OpenAI: ${error.message}`,
          {
            path: baseURL,
            additionalData: { originalError: error.message }
          }
        );
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(
          `Azure OpenAI request was cancelled`,
          this.config.timeout || 30000,
          {
            path: baseURL,
            additionalData: { reason: 'aborted' }
          }
        );
      }

      throw error;
    }
  }

  private convertAzureResponse(azureResponse: any): ModelGenerationResponse {
    const message = azureResponse.choices[0].message;
    const toolCall = message.tool_calls?.[0];

    this.status = 'idle';

    return {
      content: message.content || '',
      toolUsed: !!toolCall,
      toolCall: toolCall
        ? {
            name: toolCall.function.name,
            params: JSON.parse(toolCall.function.arguments),
          }
        : undefined,
      usage: azureResponse.usage
        ? {
            promptTokens: azureResponse.usage.prompt_tokens,
            completionTokens: azureResponse.usage.completion_tokens,
            totalTokens: azureResponse.usage.total_tokens,
          }
        : undefined,
      timestamp: Date.now(),
      modelId: azureResponse.model,
    };
  }

  private convertToAzureTool(tool: AITool): any {
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

import { EventEmitter } from 'events';

export interface ModelConfig {
  name: string;
  type: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  baseURL?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionRequest {
  prompt: string;
  parameters?: Record<string, any>;
}

export interface CompletionResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
  metadata?: Record<string, any>;
  error?: Error;
}

export abstract class BaseModelAdapter extends EventEmitter {
  protected config: ModelConfig;
  protected lastUsed: Date;

  constructor(config: ModelConfig) {
    super();
    this.config = this.validateConfig(config);
    this.lastUsed = new Date();
  }

  protected validateConfig(config: ModelConfig): ModelConfig {
    if (!config.model) {
      throw new Error('Model name is required');
    }
    return config;
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    this.lastUsed = new Date();

    try {
      const validatedRequest = await this.validateRequest(request);
      const preprocessed = await this.preprocess(validatedRequest);
      const rawResponse = await this.callModelAPI(preprocessed);
      const processed = await this.postprocess(rawResponse, validatedRequest);

      const duration = Date.now() - startTime;
      this.recordMetrics({ type: 'completion', duration, success: true });

      return processed;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics({ type: 'completion', duration, success: false, error });
      return await this.handleGenerationError(error, request);
    }
  }

  async *streamCompletion(request: CompletionRequest): AsyncIterable<StreamChunk> {
    this.lastUsed = new Date();

    try {
      const validatedRequest = await this.validateRequest(request);
      const preprocessed = await this.preprocess(validatedRequest);
      const stream = await this.callModelStream(preprocessed);

      let buffer = '';
      for await (const chunk of stream) {
        const parsed = this.parseStreamChunk(chunk);

        if (parsed.text) {
          buffer += parsed.text;
          yield {
            text: parsed.text,
            isComplete: false
          };
        }

        if (parsed.finished) {
          yield {
            text: '',
            isComplete: true,
            metadata: {
              finalText: buffer,
              finishReason: parsed.finishReason
            }
          };
          break;
        }
      }

    } catch (error) {
      yield {
        text: '',
        isComplete: true,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          errorTime: new Date(),
          partialResult: ''
        }
      };
    }
  }

  protected abstract callModelAPI(request: any): Promise<any>;
  protected abstract callModelStream(request: any): AsyncIterable<any>;
  protected abstract parseStreamChunk(chunk: any): any;

  protected async validateRequest(request: CompletionRequest): Promise<CompletionRequest> {
    if (!request.prompt?.trim()) {
      throw new Error('Prompt cannot be empty');
    }
    return request;
  }

  protected async preprocess(request: CompletionRequest): Promise<any> {
    return request;
  }

  protected async postprocess(response: any, _originalRequest: CompletionRequest): Promise<CompletionResponse> {
    return response;
  }

  protected async handleGenerationError(error: unknown, _originalRequest: CompletionRequest): Promise<CompletionResponse> {
    throw error;
  }

  protected recordMetrics(metrics: Record<string, any>): void {
    this.emit('metrics:recorded', metrics);
  }

  getModelInfo(): ModelConfig {
    return this.config;
  }
}

export class OpenAIAdapter extends BaseModelAdapter {
  constructor(config: ModelConfig) {
    super(config);
  }

  protected async callModelAPI(request: any): Promise<any> {
    console.log(`[OpenAI] Calling API with prompt: ${request.prompt}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      choices: [{
        message: {
          content: `This is a simulated response from OpenAI model ${this.config.model} for: ${request.prompt}`
        }
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };
  }

  protected async *callModelStream(_request: any): AsyncIterable<any> {
    const responseText = `This is a simulated streaming response from OpenAI model ${this.config.model}`;
    const words = responseText.split(' ');

    for (const word of words) {
      yield {
        choices: [{
          delta: {
            content: word + ' '
          }
        }]
      };
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    yield {
      choices: [{
        finish_reason: 'stop'
      }]
    };
  }

  protected parseStreamChunk(chunk: any): any {
    if (chunk.choices?.[0]?.delta?.content) {
      return {
        text: chunk.choices[0].delta.content,
        finished: false
      };
    } else if (chunk.choices?.[0]?.finish_reason) {
      return {
        text: '',
        finished: true,
        finishReason: chunk.choices[0].finish_reason
      };
    }
    return { text: '', finished: false };
  }

  protected async postprocess(response: any, _originalRequest: CompletionRequest): Promise<CompletionResponse> {
    return {
      text: response.choices[0].message.content,
      usage: response.usage,
      model: this.config.model
    };
  }
}

export class ModelRouter {
  private adapters: Map<string, BaseModelAdapter> = new Map();

  registerAdapter(id: string, adapter: BaseModelAdapter): void {
    this.adapters.set(id, adapter);
  }

  async routeRequest(request: CompletionRequest, preferredAdapterId?: string): Promise<CompletionResponse> {
    if (preferredAdapterId && this.adapters.has(preferredAdapterId)) {
      const adapter = this.adapters.get(preferredAdapterId)!;
      return await adapter.generateCompletion(request);
    }

    const firstAdapter = this.adapters.values().next().value;
    if (!firstAdapter) {
      throw new Error('No available model adapters');
    }

    return await firstAdapter.generateCompletion(request);
  }
}

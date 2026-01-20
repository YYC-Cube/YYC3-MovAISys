# YYC³ MovAISys 类型定义统一文档

## 核心类型定义

### 1. 工具系统类型

#### 1.1 AITool 接口
```typescript
export interface AITool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 工具版本 */
  version: string;
  /** 工具分组 */
  group: string;
  /** 工具作者 */
  author: string;
  /** 工具参数定义 */
  parameters: ToolParameter[];
  /** 工具执行函数 */
  execute: (
    params: Record<string, any>,
    context: ToolExecutionContext
  ) => Promise<ToolExecutionResult>;
  /** 工具示例 */
  examples?: Array<{
    name: string;
    description: string;
    params: Record<string, any>;
    result: ToolExecutionResult;
  }>;
  /** 工具元数据 */
  metadata?: {
    tags: string[];
    icon?: string;
    documentationUrl?: string;
    dependencies?: string[];
    permissions?: string[];
  };
}
```

#### 1.2 ToolParameter 接口
```typescript
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
  };
}
```

#### 1.3 ToolExecutionContext 接口
```typescript
export interface ToolExecutionContext {
  userId?: string;
  sessionId?: string;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  businessContext?: Record<string, any>;
  timeout?: number;
  tempStorage?: Record<string, any>;
}
```

#### 1.4 ToolExecutionResult 接口
```typescript
export interface ToolExecutionResult {
  success: boolean;
  content: string;
  data?: any;
  error?: string;
  executionTime: number;
  toolName: string;
  timestamp: number;
}
```

### 2. 学习系统类型

#### 2.1 LearningRecord 接口
```typescript
export interface LearningRecord {
  id: string;
  timestamp: string;
  userMessage: UserMessage;
  aiResponse: AIResponse;
  context: AIContext;
  accuracy: number;
  responseTime?: number;
  userSatisfaction: number;
  toolUsage?: Array<{
    toolName: string;
    effectiveness: number;
  }>;
}
```

#### 2.2 PatternRecognitionResult 接口
```typescript
export interface PatternRecognitionResult {
  id: string;
  type: 'common_questions' | 'usage_time' | 'tool_usage' | 'topic' | 'comprehensive';
  patterns: Array<{
    content: any;
    frequency: number;
    confidence: number;
  }>;
  insights: string[];
  confidence: number;
  detectedAt: string | Date;
}
```

#### 2.3 PerformanceEvaluation 接口
```typescript
export interface PerformanceEvaluation {
  id: string;
  timestamp: string;
  accuracy: number;
  responseTime: number;
  userSatisfaction: number;
  toolUsageEffectiveness: number;
  learningProgress: number;
}
```

### 3. 反馈系统类型

#### 3.1 UserFeedback 接口
```typescript
export interface UserFeedback {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  responseId: string;
  rating: number;
  comment?: string;
  improvementSuggestions?: string[];
}
```

#### 3.2 FeedbackAnalysis 接口
```typescript
export interface FeedbackAnalysis {
  id: string;
  feedback: UserFeedback;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyIssues: string[];
  suggestedImprovements: string[];
  preferenceUpdates: Record<string, any>;
  confidence: number;
  analyzedAt: Date;
}
```

### 4. 模型适配器类型

#### 4.1 ModelAdapter 接口
```typescript
export interface ModelAdapter {
  initialize(config: AutonomousAIConfig): Promise<void>;
  generate(request: ModelGenerationRequest): Promise<ModelGenerationResponse>;
  cancel(): Promise<void>;
  getSupportedTools(): string[];
  supportsTool(toolName: string): boolean;
  getStatus(): 'idle' | 'initializing' | 'generating' | 'error';
  getConfig(): AutonomousAIConfig;
  getMetrics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
}
```

#### 4.2 ModelGenerationRequest 接口
```typescript
export interface ModelGenerationRequest {
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  tools?: AITool[];
  modelConfig?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  forceToolUse?: boolean;
}
```

#### 4.3 ModelGenerationResponse 接口
```typescript
export interface ModelGenerationResponse {
  content: string;
  toolUsed: boolean;
  toolCall?: {
    name: string;
    params: any;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: number;
  modelId: string;
}
```

### 5. 核心引擎类型

#### 5.1 AutonomousAIConfig 接口
```typescript
export interface AutonomousAIConfig {
  apiType: 'internal' | 'openai' | 'azure' | 'custom';
  apiKey?: string;
  baseURL?: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  enableLearning?: boolean;
  enableTools?: boolean;
  enableAutoTask?: boolean;
  enableContextAwareness?: boolean;
  learningInterval?: number;
  businessContext?: Record<string, any>;
}
```

#### 5.2 Task 接口
```typescript
export interface Task {
  id: string;
  name: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  progress?: number;
  result?: AIResponse;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 5.3 AIContext 接口
```typescript
export interface AIContext {
  timestamp: Date;
  user?: string;
  conversationHistory?: Array<{
    userMessage: string;
    aiResponse: string;
  }>;
  userPreferences?: Record<string, any>;
  businessContext?: Record<string, any>;
  pageContext?: Record<string, any>;
  availableTools?: AITool[];
}
```

#### 5.4 AIResponse 接口
```typescript
export interface AIResponse {
  id: string;
  content: string;
  timestamp: Date;
  context: AIContext;
  toolCalls?: any[];
  suggestions?: string[];
  metadata?: {
    modelId?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    processingTime?: number;
  };
}
```

#### 5.5 UserMessage 接口
```typescript
export interface UserMessage {
  id: string;
  user?: string;
  content: string;
  timestamp: Date;
}
```

### 6. 错误类型

#### 6.1 YYC3Error 类
```typescript
export class YYC3Error extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: ErrorContext;

  constructor(
    message: string,
    code: string,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'YYC3Error';
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
  }
}
```

#### 6.2 ValidationError 类
```typescript
export class ValidationError extends YYC3Error {
  public readonly field: string;

  constructor(
    message: string,
    field: string,
    context?: ErrorContext
  ) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```

#### 6.3 ConflictError 类
```typescript
export class ConflictError extends YYC3Error {
  constructor(
    message: string,
    resource: string,
    context?: ErrorContext
  ) {
    super(message, 'CONFLICT_ERROR', context);
    this.name = 'ConflictError';
    this.resource = resource;
  }
}
```

#### 6.4 NotFoundError 类
```typescript
export class NotFoundError extends YYC3Error {
  constructor(
    message: string,
    resource: string,
    context?: ErrorContext
  ) {
    super(message, 'NOT_FOUND_ERROR', context);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}
```

#### 6.5 NetworkError 类
```typescript
export class NetworkError extends YYC3Error {
  constructor(
    message: string,
    context?: ErrorContext
  ) {
    super(message, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}
```

#### 6.6 TimeoutError 类
```typescript
export class TimeoutError extends YYC3Error {
  public readonly timeout: number;

  constructor(
    message: string,
    timeout: number,
    context?: ErrorContext
  ) {
    super(message, 'TIMEOUT_ERROR', context);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}
```

#### 6.7 AuthenticationError 类
```typescript
export class AuthenticationError extends YYC3Error {
  constructor(
    message: string,
    context?: ErrorContext
  ) {
    super(message, 'AUTHENTICATION_ERROR', context);
    this.name = 'AuthenticationError';
  }
}
```

#### 6.8 ErrorContext 接口
```typescript
export interface ErrorContext {
  path?: string;
  method?: string;
  additionalData?: Record<string, any>;
}
```

---

**文档创建时间**: 2026-01-21  
**创建人员**: YYC³ AI Team  
**版本**: 1.0.0

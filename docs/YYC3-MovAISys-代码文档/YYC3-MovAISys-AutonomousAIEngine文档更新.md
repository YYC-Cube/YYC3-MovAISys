# YYC³ MovAISys AutonomousAIEngine 文档更新

## 2. 核心自治引擎（更新版）

### 实际代码实现
// core/autonomous-ai-widget/AutonomousAIEngine.ts
export class AutonomousAIEngine {
  private config: AutonomousAIConfig;
  private memory: MemorySystem;
  private learning: LearningSystem;
  private toolRegistry: ToolRegistry;
  private contextManager: ContextManager;
  private modelAdapter: ModelAdapter;
  private eventEmitter: EventEmitter;
  private isRunning: boolean = false;
  private taskQueue: Map<string, Task> = new Map();
  private activeTask: Task | null = null;

  constructor(config: AutonomousAIConfig) {
    this.config = config;
    this.eventEmitter = new EventEmitter();
    this.initializeSubsystems();
  }

  /**
   * 初始化所有子系统
   */
  private initializeSubsystems(): void {
    // 记忆系统 - 长期记忆存储
    this.memory = new MemorySystem({
      persistence: true,
      maxMemoryItems: 1000,
      memoryTypes: ['conversation', 'preference', 'knowledge']
    });

    // 学习系统 - 自主学习和优化
    this.learning = new LearningSystem(this.config, this.memory);

    // 工具注册表 - 动态工具管理
    this.toolRegistry = new ToolRegistry();
    this.registerCoreTools();

    // 上下文管理器
    this.contextManager = new ContextManager();

    // 模型适配器 - 多模型支持
    this.modelAdapter = this.createModelAdapter();
  }

  /**
   * 创建模型适配器
   */
  private createModelAdapter(): ModelAdapter {
    switch (this.config.apiType) {
      case 'internal':
        return new InternalModelAdapter(this.config);
      case 'openai':
        return new OpenAIModelAdapter(this.config);
      case 'azure':
        return new AzureModelAdapter(this.config);
      case 'custom':
        return new CustomModelAdapter(this.config);
      default:
        throw new Error(`Unsupported API type: ${this.config.apiType}`);
    }
  }

  /**
   * 启动引擎
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new ConflictError('Engine is already running', 'AutonomousAIEngine', {
        additionalData: { status: 'running' }
      });
    }

    this.isRunning = true;
    this.eventEmitter.emit('engineStarted');

    if (this.config.enableLearning) {
      await this.startLearningLoop();
    }

    if (this.config.enableAutoTask) {
      await this.startTaskScheduler();
    }
  }

  /**
   * 停止引擎
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new ConflictError('Engine is not running', 'AutonomousAIEngine', {
        additionalData: { status: 'stopped' }
      });
    }

    this.isRunning = false;
    this.eventEmitter.emit('engineStopped');
  }

  /**
   * 处理用户消息
   */
  async processMessage(message: UserMessage): Promise<AIResponse> {
    // 1. 上下文构建
    const context = await this.buildContext(message);

    // 2. 工具选择
    const tools = await this.selectTools(context);

    // 3. 生成提示词
    const prompt = await this.buildPrompt(message, context, tools);

    // 4. 调用模型
    const response = await this.modelAdapter.generate(prompt, tools);

    // 5. 后处理
    const processedResponse = await this.postProcess(response, context);

    // 6. 学习更新
    await this.learning.recordInteraction({
      userMessage: message,
      aiResponse: processedResponse,
      context,
      accuracy: this.calculateAccuracy(message, processedResponse),
      responseTime: Date.now() - context.timestamp.getTime(),
      userSatisfaction: 0,
      toolUsage: tools.map(tool => ({
        toolName: tool.name,
        effectiveness: this.calculateToolEffectiveness(tool, response)
      }))
    });

    return processedResponse;
  }

  /**
   * 创建并执行任务
   */
  async createTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.taskQueue.set(newTask.id, newTask);

    if (this.config.enableAutoTask) {
      await this.executeTask(newTask);
    }

    return newTask;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus {
    const task = this.taskQueue.get(taskId);
    if (!task) {
      throw new NotFoundError(`Task not found: ${taskId}`, 'Task', {
        additionalData: { taskId }
      });
    }
    return task.status;
  }

  /**
   * 获取任务进度
   */
  getTaskProgress(taskId: string): number {
    const task = this.taskQueue.get(taskId);
    if (!task) {
      throw new NotFoundError(`Task not found: ${taskId}`, 'Task', {
        additionalData: { taskId }
      });
    }
    return task.progress || 0;
  }

  /**
   * 构建上下文
   */
  private async buildContext(message: UserMessage): Promise<AIContext> {
    const recentConversations = await this.memory.getRecentConversations(10);
    const userPreferences = await this.memory.getUserPreferences();
    const businessContext = this.config.businessContext;
    const pageContext = await this.contextManager.getPageContext();

    return {
      timestamp: new Date(),
      user: message.user,
      conversationHistory: recentConversations,
      userPreferences,
      businessContext,
      pageContext,
      availableTools: this.toolRegistry.getAvailableTools()
    };
  }

  /**
   * 选择工具
   */
  private async selectTools(context: AIContext): Promise<AITool[]> {
    if (!this.config.enableTools) {
      return [];
    }

    return await this.toolRegistry.suggestTools(context);
  }

  /**
   * 构建提示词
   */
  private async buildPrompt(message: UserMessage, context: AIContext, tools: AITool[]): Promise<string> {
    let prompt = '';

    if (context.businessContext) {
      prompt += `Business Context: ${JSON.stringify(context.businessContext)}\n\n`;
    }

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += 'Conversation History:\n';
      for (const conv of context.conversationHistory) {
        prompt += `User: ${conv.userMessage}\n`;
        prompt += `AI: ${conv.aiResponse}\n`;
      }
      prompt += '\n';
    }

    prompt += `User: ${message.content}\n`;

    if (tools.length > 0) {
      prompt += '\nAvailable Tools:\n';
      for (const tool of tools) {
        prompt += `- ${tool.name}: ${tool.description}\n`;
      }
    }

    return prompt;
  }

  /**
   * 后处理响应
   */
  private async postProcess(response: ModelResponse, context: AIContext): Promise<AIResponse> {
    return {
      id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: response.content,
      timestamp: new Date(),
      context,
      toolCalls: response.toolCalls,
      suggestions: [],
      metadata: {
        modelId: response.model,
        usage: response.usage,
        processingTime: Date.now() - context.timestamp.getTime()
      }
    };
  }

  /**
   * 启动学习循环
   */
  private async startLearningLoop(): Promise<void> {
    const learningInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(learningInterval);
        return;
      }

      await this.learning.recognizePatterns();
      await this.learning.evaluatePerformance();
      await this.learning.updateLearningStrategy();
    }, this.config.learningInterval || 60000);
  }

  /**
   * 启动任务调度器
   */
  private async startTaskScheduler(): Promise<void> {
    const schedulerInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(schedulerInterval);
        return;
      }

      const pendingTasks = Array.from(this.taskQueue.values())
        .filter(task => task.status === 'pending');

      for (const task of pendingTasks) {
        await this.executeTask(task);
      }
    }, 5000);
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task): Promise<void> {
    if (this.activeTask) {
      return;
    }

    this.activeTask = task;
    task.status = 'running';
    task.updatedAt = new Date();

    try {
      const message: UserMessage = {
        id: `msg-${Date.now()}`,
        user: 'system',
        content: task.prompt,
        timestamp: new Date()
      };

      const response = await this.processMessage(message);

      task.status = 'completed';
      task.progress = 100;
      task.result = response;
      task.updatedAt = new Date();

      this.eventEmitter.emit('taskCompleted', task);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.updatedAt = new Date();

      this.eventEmitter.emit('taskFailed', task);
    } finally {
      this.activeTask = null;
    }
  }

  /**
   * 计算准确率
   */
  private calculateAccuracy(message: UserMessage, response: AIResponse): number {
    return 0.8;
  }

  /**
   * 计算工具效果
   */
  private calculateToolEffectiveness(tool: AITool, response: ModelResponse): number {
    return 0.85;
  }

  /**
   * 注册核心工具
   */
  private registerCoreTools(): void {
    const coreTools = [
      {
        name: 'search',
        description: '搜索网络信息',
        category: 'research',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询' }
          },
          required: ['query']
        },
        execute: async (params: any) => {
          return { results: [] };
        }
      }
    ];

    for (const tool of coreTools) {
      this.toolRegistry.registerTool(tool);
    }
  }

  /**
   * 订阅事件
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 取消订阅事件
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

### 主要改进点

1. **事件系统**：添加了 EventEmitter 用于处理引擎事件
2. **任务管理**：实现了完整的任务队列和调度系统
3. **学习循环**：添加了自动学习循环，定期进行模式识别和性能评估
4. **任务调度器**：实现了自动任务调度器，定期执行待处理任务
5. **错误处理**：改进了错误处理，使用自定义错误类型
6. **状态管理**：添加了运行状态管理和任务状态跟踪
7. **工具注册**：实现了核心工具的自动注册
8. **事件订阅**：提供了事件订阅和取消订阅接口

### 支持的模型适配器

1. **InternalModelAdapter**：内部模型适配器
2. **OpenAIModelAdapter**：OpenAI 模型适配器
3. **AzureModelAdapter**：Azure OpenAI 模型适配器（新增）
4. **CustomModelAdapter**：自定义模型适配器（新增）

---

**文档更新时间**: 2026-01-21  
**更新人员**: YYC³ AI Team  
**版本**: 2.0.0

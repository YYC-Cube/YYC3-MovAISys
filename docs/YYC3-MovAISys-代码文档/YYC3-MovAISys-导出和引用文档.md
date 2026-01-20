# YYC³ MovAISys 导出和引用文档

## 核心模块导出

### 1. 主入口文件
**文件路径**: `core/index.ts`

### 2. 核心配置和实例接口

#### 2.1 类型导出
```typescript
export type { AutonomousAIConfig, AIWidgetInstance } from './autonomous-ai-widget/types';
```

#### 2.2 类导出
```typescript
export { AutonomousAIEngine } from './autonomous-ai-widget/AutonomousAIEngine';
export { AutonomousAIEngine as PluggableAIEngineExport } from './pluggable/AutonomousAIEngine';
```

### 3. AI模型适配器

#### 3.1 基础接口
```typescript
export * from './adapters/ModelAdapter';
```

#### 3.2 具体实现
```typescript
export { OpenAIModelAdapter } from './adapters/OpenAIModelAdapter';
export { InternalModelAdapter } from './adapters/InternalModelAdapter';
export { AzureModelAdapter } from './adapters/AzureModelAdapter'; // 新增
export { CustomModelAdapter } from './adapters/CustomModelAdapter'; // 新增
```

### 4. 学习系统

#### 4.1 类型定义
```typescript
export * from './learning/types';
```

#### 4.2 核心类
```typescript
export { LearningSystem } from './learning/LearningSystem';
export { PatternRecognizer } from './learning/PatternRecognizer'; // 新增
export { FeedbackAnalyzer } from './learning/FeedbackAnalyzer'; // 新增
```

### 5. 记忆系统

#### 5.1 核心类
```typescript
export { MemorySystem } from './memory/MemorySystem';
```

### 6. 工具系统

#### 6.1 类型定义
```typescript
export * from './tools/types';
```

#### 6.2 核心类
```typescript
export { ToolRegistry } from './tools/ToolRegistry';
export * from './tools/core-tools';
```

### 7. 上下文管理器

#### 7.1 核心类
```typescript
export { ContextManager } from './context-manager/ContextManager';
```

### 8. 消息总线系统

#### 8.1 类型定义
```typescript
export * from './message-bus/MessageBus';
```

#### 8.2 核心类
```typescript
export { MessageBus } from './message-bus/MessageBus';
```

### 9. 任务调度器

#### 9.1 类型定义
```typescript
export * from './task-scheduler/TaskScheduler';
```

#### 9.2 核心类
```typescript
export { TaskScheduler } from './task-scheduler/TaskScheduler';
```

### 10. 状态管理器

#### 10.1 类型定义
```typescript
export * from './state-manager/StateManager';
```

#### 10.2 核心类
```typescript
export { StateManager } from './state-manager/StateManager';
```

### 11. 事件分发器

#### 11.1 类型定义
```typescript
export * from './event-dispatcher/EventDispatcher';
```

#### 11.2 核心类
```typescript
export { EventDispatcher } from './event-dispatcher/EventDispatcher';
```

### 12. 知识库系统

#### 12.1 类型定义
```typescript
export * from './knowledge-base/KnowledgeBase';
```

#### 12.2 核心类
```typescript
export { KnowledgeBase } from './knowledge-base/KnowledgeBase';
```

### 13. 智能缓存层

#### 13.1 类型定义
```typescript
export * from './cache/CacheLayer';
```

#### 13.2 核心类
```typescript
export { IntelligentCacheLayer } from './cache/CacheLayer';
```

### 14. 性能优化引擎

#### 14.1 类型定义
```typescript
export * from './performance/OptimizationEngine';
```

#### 14.2 核心类
```typescript
export { PerformanceOptimizer } from './performance/OptimizationEngine';
```

### 15. 统一错误处理系统

#### 15.1 类型定义
```typescript
export * from './error-handler';
```

#### 15.2 核心类
```typescript
export { ErrorHandler, ErrorBoundary } from './error-handler';
```

### 16. 可插拔式拖拽移动AI系统

#### 16.1 类型定义
```typescript
export * from './pluggable/types';
export * from './pluggable/AutonomousAIEngine';
export * from './pluggable/ModelAdapter';
```

#### 16.2 核心类
```typescript
export { ModelAdapter, OpenAIAdapter, AnthropicAdapter, LocalModelAdapter } from './pluggable/ModelAdapter';
export { createEngine, createModelAdapter } from './pluggable';
```

### 17. 闭环系统

#### 17.1 核心类
```typescript
export { ClosedLoopSystem } from './closed-loop/ClosedLoopSystem';
```

#### 17.2 价值创建维度
```typescript
export { GoalManagementSystem } from './closed-loop/value-creation/GoalManagementSystem';
```

#### 17.3 技术演进维度
```typescript
export { TechnicalMaturityModel } from './closed-loop/technical-evolution/TechnicalMaturityModel';
export { TechnologyRoadmap } from './closed-loop/technical-evolution/TechnologyRoadmap';
```

### 18. UI全局页面系统

#### 18.1 类型定义
```typescript
export * from './ui/types';
export type { UISystemConfig } from './ui/UISystem';
```

#### 18.2 核心组件
```typescript
export { ChatInterface } from './ui/ChatInterface';
export { ToolboxPanel } from './ui/ToolboxPanel';
export { InsightsDashboard } from './ui/InsightsDashboard';
export { WorkflowDesigner } from './ui/WorkflowDesigner';
export { UIManager } from './ui/UIManager';
export { UISystem } from './ui/UISystem';
```

### 19. 智能体系统

#### 19.1 类型定义
```typescript
export * from './ai/AgentProtocol';
export * from './ai/BaseAgent';
export * from './ai/AgentManager';
export type { AgentManagerConfig } from './ai/AgentManager';
```

#### 19.2 核心类
```typescript
export { BaseAgent } from './ai/BaseAgent';
export { AgentManager } from './ai/AgentManager';
export { LayoutAgent } from './ai/agents/LayoutAgent';
export { BehaviorAgent } from './ai/agents/BehaviorAgent';
export { ContentAgent } from './ai/agents/ContentAgent';
export { AssistantAgent } from './ai/agents/AssistantAgent';
export { MonitoringAgent } from './ai/agents/MonitoringAgent';
export { AgentSystem } from './ai/index';
```

### 20. 智能体系统集成

#### 20.1 核心类
```typescript
export { AgentSystemIntegration } from './integration/AgentSystemIntegration';
```

### 21. 版本和系统信息

#### 21.1 常量
```typescript
export const VERSION = '1.0.0';

export const SYSTEM_INFO = {
  name: 'YYC³ 自治AI浮窗系统',
  description: '完全自治的智能AI浮窗系统，具备独立运行、模块复用、自主学习等高级能力',
  version: VERSION,
  author: 'YYC³ Team',
  license: 'MIT',
  created: '2025-12-30'
};
```

#### 21.2 工厂函数
```typescript
export const createAIWidget = (config: AutonomousAIConfig): AIWidgetInstance => {
  // 创建新的AI浮窗实例
};

export const initializeYYC3AI = async (config: AutonomousAIConfig) => {
  // 初始化整个YYC³ AI系统
};
```

## 新增导出项（2026-01-21更新）

### 1. 模型适配器新增
- `AzureModelAdapter`: Azure OpenAI模型适配器
- `CustomModelAdapter`: 自定义模型适配器

### 2. 学习系统新增
- `PatternRecognizer`: 模式识别器
- `FeedbackAnalyzer`: 反馈分析器

## 导出结构图

```
core/index.ts
├── 核心配置和实例接口
│   ├── AutonomousAIConfig
│   └── AIWidgetInstance
├── AI模型适配器
│   ├── ModelAdapter (接口)
│   ├── OpenAIModelAdapter
│   ├── InternalModelAdapter
│   ├── AzureModelAdapter (新增)
│   └── CustomModelAdapter (新增)
├── 学习系统
│   ├── LearningSystem
│   ├── PatternRecognizer (新增)
│   └── FeedbackAnalyzer (新增)
├── 记忆系统
│   └── MemorySystem
├── 工具系统
│   ├── ToolRegistry
│   └── core-tools
├── 上下文管理器
│   └── ContextManager
├── 消息总线系统
│   └── MessageBus
├── 任务调度器
│   └── TaskScheduler
├── 状态管理器
│   └── StateManager
├── 事件分发器
│   └── EventDispatcher
├── 知识库系统
│   └── KnowledgeBase
├── 智能缓存层
│   └── IntelligentCacheLayer
├── 性能优化引擎
│   └── PerformanceOptimizer
├── 统一错误处理系统
│   ├── ErrorHandler
│   └── ErrorBoundary
├── 可插拔式拖拽移动AI系统
│   ├── ModelAdapter
│   ├── OpenAIAdapter
│   ├── AnthropicAdapter
│   └── LocalModelAdapter
├── 闭环系统
│   ├── ClosedLoopSystem
│   ├── GoalManagementSystem
│   ├── TechnicalMaturityModel
│   └── TechnologyRoadmap
├── UI全局页面系统
│   ├── ChatInterface
│   ├── ToolboxPanel
│   ├── InsightsDashboard
│   ├── WorkflowDesigner
│   ├── UIManager
│   └── UISystem
├── 智能体系统
│   ├── BaseAgent
│   ├── AgentManager
│   ├── LayoutAgent
│   ├── BehaviorAgent
│   ├── ContentAgent
│   ├── AssistantAgent
│   ├── MonitoringAgent
│   └── AgentSystem
└── 智能体系统集成
    └── AgentSystemIntegration
```

## 使用示例

### 1. 基本使用
```typescript
import { 
  AutonomousAIEngine, 
  OpenAIModelAdapter, 
  LearningSystem,
  PatternRecognizer,
  FeedbackAnalyzer 
} from '@yyc3/movaisys';

const engine = new AutonomousAIEngine(config);
await engine.start();
```

### 2. 使用Azure模型适配器
```typescript
import { 
  AutonomousAIEngine, 
  AzureModelAdapter 
} from '@yyc3/movaisys';

const config: AutonomousAIConfig = {
  apiType: 'azure',
  endpoint: 'https://your-resource.openai.azure.com',
  deploymentName: 'your-deployment',
  apiVersion: '2024-02-15-preview',
  apiKey: 'your-api-key',
  modelName: 'gpt-4'
};

const engine = new AutonomousAIEngine(config);
await engine.start();
```

### 3. 使用自定义模型适配器
```typescript
import { 
  AutonomousAIEngine, 
  CustomModelAdapter 
} from '@yyc3/movaisys';

const config: AutonomousAIConfig = {
  apiType: 'custom',
  customEndpoint: 'https://your-custom-api.com/generate',
  customHeaders: {
    'Authorization': 'Bearer your-token',
    'X-Custom-Header': 'value'
  },
  modelName: 'custom-model'
};

const engine = new AutonomousAIEngine(config);
await engine.start();
```

### 4. 使用学习系统
```typescript
import { 
  LearningSystem,
  PatternRecognizer,
  FeedbackAnalyzer 
} from '@yyc3/movaisys';

const learningSystem = new LearningSystem(config, memory);
const patternRecognizer = new PatternRecognizer();
const feedbackAnalyzer = new FeedbackAnalyzer();

// 记录交互
await learningSystem.recordInteraction({
  userMessage,
  aiResponse,
  context,
  accuracy: 0.9,
  userSatisfaction: 5
});

// 识别模式
const patterns = await learningSystem.recognizePatterns();

// 分析反馈
const analysis = await feedbackAnalyzer.analyze(feedback);
```

---

**文档创建时间**: 2026-01-21  
**创建人员**: YYC³ AI Team  
**版本**: 1.0.0

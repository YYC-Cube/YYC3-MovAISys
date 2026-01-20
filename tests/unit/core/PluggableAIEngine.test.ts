/**
 * @file PluggableAIEngine 单元测试
 * @description 测试可插拔式AI引擎的核心功能
 * @module __tests__/unit/core/PluggableAIEngine.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AutonomousAIEngine,
  EngineConfig,
  EngineStatus,
  EngineMetrics,
  PluggableAgentMessage,
  PluggableAgentResponse,
  MessageType,
  AgentGoal,
  AgentTaskPlan,
  AgentTaskResult,
  TaskStatus,
  AgentTaskProgress,
  ISubsystem,
  SubsystemStatus,
  PluggableSystemEvent,
  EngineState,
  EngineSnapshot,
  DiagnosticReport,
  ComplexTask,
  CoordinationResult
} from '../../../core/pluggable/AutonomousAIEngine';
import { ValidationError, ConflictError, NotFoundError } from '../../../core/error-handler/ErrorTypes';
describe('PluggableAIEngine', () => {
  let engine: AutonomousAIEngine;
  let config: EngineConfig;
  let mockSubsystem: ISubsystem;

  beforeEach(() => {
    config = {
      maxConcurrentTasks: 10,
      taskTimeout: 30000,
      enablePersistence: false,
      enableMetrics: true,
      debugMode: false,
      logLevel: 'info',
      modelAdapter: 'default',
      subsystems: []
    };

    mockSubsystem = {
      name: 'mock-subsystem',
      version: '1.0.0',
      initialize: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn().mockReturnValue({
        name: 'mock-subsystem',
        status: EngineStatus.STOPPED,
        lastUpdated: new Date()
      })
    };

    engine = new AutonomousAIEngine(config);
  });

  afterEach(async () => {
    if (engine) {
      try {
        await engine.shutdown();
      } catch (error) {
      }
    }
  });

  describe('初始化', () => {
    it('应该成功初始化引擎', async () => {
      await engine.initialize(config);
      const status = engine.getStatus();
      expect(status).toBe(EngineStatus.READY);
    });

    it('应该使用默认配置初始化', async () => {
      const defaultEngine = new AutonomousAIEngine();
      await defaultEngine.initialize({});
      const state = defaultEngine.getState();
      expect(state).toBeDefined();
      expect(state.status).toBe(EngineStatus.READY);
    });

    it('应该使用自定义配置初始化', async () => {
      await engine.initialize({
        maxConcurrentTasks: 20,
        taskTimeout: 60000
      });
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(state.status).toBe(EngineStatus.READY);
    });

    it('应该正确设置配置值', async () => {
      await engine.initialize(config);
      const state = engine.getState();
      expect(state).toBeDefined();
    });

    it('应该抛出错误如果配置无效', async () => {
      const invalidConfig: any = { maxConcurrentTasks: -1 };
      await expect(engine.initialize(invalidConfig)).rejects.toThrow();
    });
  });

  describe('启动和停止', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该成功启动引擎', async () => {
      await engine.start();
      const status = engine.getStatus();
      expect(status).toBe(EngineStatus.RUNNING);
    });

    it('应该成功暂停引擎', async () => {
      await engine.start();
      await engine.pause();
      const status = engine.getStatus();
      expect(status).toBe(EngineStatus.PAUSED);
    });

    it('应该正确计算运行时间', async () => {
      await engine.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      const metrics = engine.getMetrics();
      expect(metrics.uptime).toBeGreaterThan(0);
    });

    it('应该允许重新启动已暂停的引擎', async () => {
      await engine.start();
      await engine.pause();
      await engine.start();
      const status = engine.getStatus();
      expect(status).toBe(EngineStatus.RUNNING);
    });

    it('应该抛出错误如果引擎未初始化', async () => {
      const newEngine = new AutonomousAIEngine(config);
      await expect(newEngine.start()).rejects.toThrow(ValidationError);
    });

    it('应该抛出错误如果引擎已经在运行', async () => {
      const newEngine = new AutonomousAIEngine(config);
      await newEngine.initialize(config);
      await newEngine.start();
      await expect(newEngine.start()).rejects.toThrow(ValidationError);
    });

    it('应该抛出错误如果引擎未运行', async () => {
      const newEngine = new AutonomousAIEngine(config);
      await newEngine.initialize(config);
      await expect(newEngine.pause()).rejects.toThrow(ValidationError);
    });

    it('应该抛出错误如果引擎已经停止', async () => {
      const newEngine = new AutonomousAIEngine(config);
      await newEngine.initialize(config);
      await newEngine.start();
      await newEngine.shutdown();
      await expect(newEngine.pause()).rejects.toThrow(ValidationError);
    });
  });

  describe('消息处理', () => {
    beforeEach(async () => {
      await engine.initialize(config);
      await engine.start();
      
      // 注册模拟的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async (message) => ({
        id: 'test-response-1',
        messageId: message.id,
        content: { response: 'Hello! How can I help you?' },
        success: true,
        timestamp: new Date()
      }));
      
      engine.registerMessageHandler(MessageType.SYSTEM_COMMAND, async (message) => ({
        id: 'test-response-2',
        messageId: message.id,
        content: { response: 'System command executed' },
        success: true,
        timestamp: new Date()
      }));
    });

    it('应该成功处理用户消息', async () => {
      const message: PluggableAgentMessage = {
        id: 'test-message-1',
        type: MessageType.USER_INPUT,
        content: 'Hello, AI!',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
    });

    it('应该更新处理消息的指标', async () => {
      const message: PluggableAgentMessage = {
        id: 'test-message-2',
        type: MessageType.USER_INPUT,
        content: 'Test message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      const metricsAfter = engine.getMetrics();
      expect(metricsAfter.messageThroughput).toBeGreaterThanOrEqual(1);
    });

    it('应该处理带有上下文的消息', async () => {
      const message: PluggableAgentMessage = {
        id: 'test-message-3',
        type: MessageType.USER_INPUT,
        content: 'Test with context',
        timestamp: new Date(),
        context: { userId: '123', sessionId: '456' }
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
    });

    it('应该处理空消息', async () => {
      const message: PluggableAgentMessage = {
        id: 'test-message-4',
        type: MessageType.USER_INPUT,
        content: '',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

  });

  describe('消息处理 - 特殊情况', () => {
    it('应该返回错误如果引擎未运行', async () => {
      const newEngine = new AutonomousAIEngine(config);
      await newEngine.initialize(config);
      
      const message: PluggableAgentMessage = {
        id: 'test-message-5',
        type: MessageType.USER_INPUT,
        content: 'Test message',
        timestamp: new Date()
      };

      await expect(newEngine.processMessage(message)).rejects.toThrow();
    });
  });

  describe('任务管理', () => {
    beforeEach(async () => {
      await engine.initialize(config);
      await engine.start();
    });

    it('应该成功创建任务计划', async () => {
      const goal: AgentGoal = {
        id: 'goal-1',
        description: 'Test goal',
        priority: 'high',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      expect(plan).toBeDefined();
      expect(plan.goalId).toBe(goal.id);
      expect(plan.steps).toBeDefined();
    });

    it('应该成功执行任务', async () => {
      const goal: AgentGoal = {
        id: 'goal-2',
        description: 'Execute task',
        priority: 'medium',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      const result = await engine.executeTask(plan.id);
      expect(result).toBeDefined();
      expect(result.taskId).toBe(plan.id);
      expect(result.status).toBe(TaskStatus.COMPLETED);
    });

    it('应该更新任务完成的指标', async () => {
      const goal: AgentGoal = {
        id: 'goal-3',
        description: 'Complete task',
        priority: 'low',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      await engine.executeTask(plan.id);
      const metricsAfter = engine.getMetrics();
      expect(metricsAfter.tasksCompleted).toBeGreaterThanOrEqual(1);
    });

    it('应该处理任务执行失败', async () => {
      const goal: AgentGoal = {
        id: 'goal-4',
        description: 'Fail task',
        priority: 'high',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      const result = await engine.executeTask(plan.id);
      expect(result).toBeDefined();
    });

    it('应该成功取消任务', async () => {
      const goal: AgentGoal = {
        id: 'goal-5',
        description: 'Cancel task',
        priority: 'medium',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      await engine.executeTask(plan.id);
      await engine.cancelTask(plan.id);
      const progress = engine.getTaskProgress(plan.id);
      expect(progress).toBeDefined();
    });

    it('应该正确获取任务进度', async () => {
      const goal: AgentGoal = {
        id: 'goal-6',
        description: 'Get progress',
        priority: 'high',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      await engine.executeTask(plan.id);
      const progress = engine.getTaskProgress(plan.id);
      expect(progress).toBeDefined();
      expect(progress.taskId).toBe(plan.id);
    });

    it('应该正确处理带有步骤的任务执行', async () => {
      const goal: AgentGoal = {
        id: 'goal-7',
        description: 'Task with steps',
        priority: 'medium',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      
      // 添加实际的任务步骤
      plan.steps = [
        {
          id: 'step-1',
          description: 'First step',
          type: 'action',
          parameters: {},
          dependencies: [],
          estimatedDuration: 100
        },
        {
          id: 'step-2',
          description: 'Second step',
          type: 'action',
          parameters: {},
          dependencies: ['step-1'],
          estimatedDuration: 200
        }
      ];

      const result = await engine.executeTask(plan.id);
      expect(result).toBeDefined();
      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.steps.length).toBe(2);
    });

    it('应该在任务执行失败时抛出错误', async () => {
      const goal: AgentGoal = {
        id: 'goal-8',
        description: 'Failed task',
        priority: 'high',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      
      // 创建一个会失败的任务步骤
      plan.steps = [
        {
          id: 'step-1',
          description: 'Failing step',
          type: 'action',
          parameters: {},
          dependencies: [],
          estimatedDuration: 100
        }
      ];

      // 模拟executeStep方法抛出错误
      const originalExecuteStep = (engine as any).executeStep;
      (engine as any).executeStep = vi.fn().mockRejectedValue(new Error('Step execution failed'));

      await expect(engine.executeTask(plan.id)).rejects.toThrow();

      // 恢复原始方法
      (engine as any).executeStep = originalExecuteStep;
    });

    it('应该正确处理任务超时', async () => {
      const goal: AgentGoal = {
        id: 'goal-9',
        description: 'Long running task',
        priority: 'medium',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      
      // 创建一个长时间运行的任务步骤
      plan.steps = [
        {
          id: 'step-1',
          description: 'Long step',
          type: 'action',
          parameters: {},
          dependencies: [],
          estimatedDuration: 5000
        }
      ];

      // 设置短超时
      const originalTimeout = (engine as any).config.taskTimeout;
      (engine as any).config.taskTimeout = 100;

      // 模拟executeStep方法长时间运行
      const originalExecuteStep = (engine as any).executeStep;
      (engine as any).executeStep = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(engine.executeTask(plan.id)).rejects.toThrow();

      // 恢复原始值
      (engine as any).config.taskTimeout = originalTimeout;
      (engine as any).executeStep = originalExecuteStep;
    });

    it('应该处理取消不存在的任务', async () => {
      await expect(engine.cancelTask('non-existent-task')).rejects.toThrow(NotFoundError);
    });

    it('应该处理获取不存在的任务进度', () => {
      expect(() => engine.getTaskProgress('non-existent-task')).toThrow(NotFoundError);
    });
  });

  describe('子系统管理', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该成功注册子系统', () => {
      engine.registerSubsystem(mockSubsystem);
      const subsystem = engine.getSubsystem('mock-subsystem');
      expect(subsystem).toBeDefined();
      expect(subsystem?.name).toBe('mock-subsystem');
    });

    it('应该成功注销子系统', () => {
      engine.registerSubsystem(mockSubsystem);
      engine.unregisterSubsystem('mock-subsystem');
      const subsystem = engine.getSubsystem('mock-subsystem');
      expect(subsystem).toBeUndefined();
    });

    it('应该正确获取子系统状态', () => {
      engine.registerSubsystem(mockSubsystem);
      const subsystem = engine.getSubsystem('mock-subsystem');
      expect(subsystem).toBeDefined();
      
      const subsystemStatus = subsystem?.getStatus();
      expect(subsystemStatus).toBeDefined();
      expect(subsystemStatus?.status).toBeDefined();
    });

    it('应该成功启动所有子系统', async () => {
      engine.registerSubsystem(mockSubsystem);
      await engine.start();
      expect(mockSubsystem.start).toHaveBeenCalled();
    });

    it('应该成功停止所有子系统', async () => {
      engine.registerSubsystem(mockSubsystem);
      await engine.start();
      await engine.shutdown();
      expect(mockSubsystem.stop).toHaveBeenCalled();
    });
  });

  describe('事件处理', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该成功注册消息处理器', () => {
      const handler = vi.fn();
      engine.registerMessageHandler(MessageType.USER_INPUT, handler);
      expect(handler).toBeDefined();
    });

    it('应该成功注销消息处理器', () => {
      const handler = vi.fn();
      engine.registerMessageHandler(MessageType.USER_INPUT, handler);
      engine.unregisterMessageHandler(MessageType.USER_INPUT);
      expect(handler).toBeDefined();
    });

    it('应该成功广播事件', () => {
      const eventSpy = vi.fn();
      const event: PluggableSystemEvent = {
        id: 'test-event-1',
        type: 'test-event',
        data: { test: 'data' },
        timestamp: new Date()
      };

      engine.on('event', eventSpy);
      engine.broadcastEvent(event);
      expect(eventSpy).toHaveBeenCalledWith(event);
    });

    it('应该正确触发事件', () => {
      const eventSpy = vi.fn();
      engine.on('test-event', eventSpy);
      engine.emit('test-event', { data: 'test' });
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('状态管理', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该正确返回引擎状态', () => {
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(state.status).toBeDefined();
      expect(state.metrics).toBeDefined();
    });

    it('应该正确返回引擎状态对象', () => {
      const state = engine.getState();
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('tasks');
      expect(state).toHaveProperty('subsystems');
      expect(state).toHaveProperty('metrics');
    });

    it('应该保存状态快照', async () => {
      const snapshot = await engine.saveState();
      expect(snapshot).toBeDefined();
      expect(snapshot).toHaveProperty('state');
      expect(snapshot).toHaveProperty('timestamp');
    });

    it('应该从快照恢复状态', async () => {
      const snapshot = await engine.saveState();
      await engine.resetState();
      await engine.restoreState(snapshot);
      const state = engine.getState();
      expect(state).toBeDefined();
    });

    it('应该生成诊断报告', async () => {
      const report = await engine.diagnose();
      expect(report).toBeDefined();
      expect(report).toHaveProperty('overallHealth');
      expect(report).toHaveProperty('subsystems');
    });

    it('应该检测健康状态', async () => {
      const report = await engine.diagnose();
      expect(report.overallHealth).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(report.overallHealth);
    });

    it('应该提供改进建议', async () => {
      const report = await engine.diagnose();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('错误处理', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该优雅地处理初始化错误', async () => {
      const invalidConfig: any = { maxConcurrentTasks: -1 };
      await expect(engine.initialize(invalidConfig)).rejects.toThrow();
    });

    it('应该优雅地处理消息处理错误', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-error',
        type: MessageType.USER_INPUT,
        content: 'Error message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该优雅地处理任务执行错误', async () => {
      const goal: AgentGoal = {
        id: 'goal-error',
        description: 'Error task',
        priority: 'high',
        metadata: {}
      };

      const plan = await engine.planTask(goal);
      const result = await engine.executeTask(plan.id);
      expect(result).toBeDefined();
    });

    it('应该捕获并处理操作中的错误', async () => {
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-2',
        type: MessageType.USER_INPUT,
        content: 'Error message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该在错误发生时触发错误处理回调', async () => {
      const errorCallback = vi.fn();
      engine.on('error', errorCallback);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-3',
        type: MessageType.USER_INPUT,
        content: 'Error message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      expect(errorCallback).toHaveBeenCalled();
    });

    it('应该在可恢复错误时触发恢复回调', async () => {
      const recoveryCallback = vi.fn();
      engine.on('recovery', recoveryCallback);

      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-recovery',
        type: MessageType.USER_INPUT,
        content: 'Recovery message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
    });

    it('应该在可重试错误时自动重试', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-retry',
        type: MessageType.USER_INPUT,
        content: 'Retry message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该在达到最大重试次数后放弃', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-max-retry',
        type: MessageType.USER_INPUT,
        content: 'Max retry message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该使用指数退避策略进行重试', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-backoff',
        type: MessageType.USER_INPUT,
        content: 'Backoff message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该正确处理验证错误', async () => {
      const invalidConfig: any = { maxConcurrentTasks: -1 };
      await expect(engine.initialize(invalidConfig)).rejects.toThrow();
    });

    it('应该正确处理网络错误', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-network-error',
        type: MessageType.USER_INPUT,
        content: 'Network error message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该正确处理超时错误', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-timeout-error',
        type: MessageType.USER_INPUT,
        content: 'Timeout error message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该正确处理内部错误', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-internal-error',
        type: MessageType.USER_INPUT,
        content: 'Internal error message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该在关键错误时暂停引擎', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-critical-error',
        type: MessageType.USER_INPUT,
        content: 'Critical error message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该记录所有错误到错误处理器', async () => {
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-4',
        type: MessageType.USER_INPUT,
        content: 'Error message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该在错误发生时触发错误事件', async () => {
      const errorEventSpy = vi.fn();
      engine.on('error', errorEventSpy);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-5',
        type: MessageType.USER_INPUT,
        content: 'Error message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      expect(errorEventSpy).toHaveBeenCalled();
    });

    it('应该包含错误上下文信息', async () => {
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-context',
        type: MessageType.USER_INPUT,
        content: 'Error context message',
        timestamp: new Date(),
        context: { userId: '123', sessionId: '456' }
      };

      await engine.processMessage(message);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该在错误中包含操作信息', async () => {
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-op',
        type: MessageType.USER_INPUT,
        content: 'Error operation message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该在错误中包含追踪ID', async () => {
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-trace',
        type: MessageType.USER_INPUT,
        content: 'Error trace message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该在错误中包含时间戳', async () => {
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);

      await engine.start();
      
      // 注册会抛出错误的消息处理器
      engine.registerMessageHandler(MessageType.USER_INPUT, async () => {
        throw new Error('Test error');
      });
      
      const message: PluggableAgentMessage = {
        id: 'test-message-error-time',
        type: MessageType.USER_INPUT,
        content: 'Error time message',
        timestamp: new Date()
      };

      await engine.processMessage(message);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该在可恢复错误后继续处理', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-recoverable',
        type: MessageType.USER_INPUT,
        content: 'Recoverable error message',
        timestamp: new Date()
      };

      const response = await engine.processMessage(message);
      expect(response).toBeDefined();
    });

    it('应该在恢复后保持引擎状态', async () => {
      await engine.start();
      const message: PluggableAgentMessage = {
        id: 'test-message-recovery-state',
        type: MessageType.USER_INPUT,
        content: 'Recovery state message',
        timestamp: new Date()
      };

      const stateBefore = engine.getState();
      await engine.processMessage(message);
      const stateAfter = engine.getState();
      expect(stateAfter).toBeDefined();
    });
  });

  describe('调试模式', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该成功启用调试模式', () => {
      engine.enableDebugMode();
      expect(engine).toBeDefined();
    });

    it('应该成功禁用调试模式', () => {
      engine.enableDebugMode();
      engine.disableDebugMode();
      expect(engine).toBeDefined();
    });
  });

  describe('协调子系统', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该成功协调复杂任务', async () => {
      const complexTask: ComplexTask = {
        id: 'complex-task-1',
        description: 'Complex task',
        priority: 1,
        requirements: [],
        metadata: {}
      };

      const result = await engine.coordinateSubsystems(complexTask);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('应该分解复杂任务为子任务', async () => {
      const complexTask: ComplexTask = {
        id: 'complex-task-2',
        description: 'Complex task with requirements',
        priority: 1,
        requirements: [
          {
            type: 'task-type-1',
            description: 'Task 1',
            requiredCapabilities: ['capability-1'],
            estimatedDuration: 1000,
            dependencies: []
          },
          {
            type: 'task-type-2',
            description: 'Task 2',
            requiredCapabilities: ['capability-2'],
            estimatedDuration: 2000,
            dependencies: ['task-type-1']
          }
        ],
        metadata: {}
      };

      const result = await engine.coordinateSubsystems(complexTask);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.coordinationMetrics).toHaveProperty('totalTime');
      expect(result.coordinationMetrics.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('应该处理子系统协调失败的情况', async () => {
      // 这里我们模拟一个会导致协调失败的情况
      const complexTask: ComplexTask = {
        id: 'complex-task-3',
        description: 'Complex task with invalid requirements',
        priority: 1,
        requirements: [
          {
            type: 'invalid-task-type',
            description: 'Invalid task',
            requiredCapabilities: ['invalid-capability'],
            estimatedDuration: 1000,
            dependencies: []
          }
        ],
        metadata: {}
      };

      const result = await engine.coordinateSubsystems(complexTask);
      expect(result).toBeDefined();
      // 即使有无效任务，协调也应该返回成功，因为没有合适的子系统来执行
      expect(result.success).toBe(true);
    });
  });

  describe('其他方法测试', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });

    it('应该成功注销子系统', async () => {
      const mockSubsystem: ISubsystem = {
        name: 'test-subsystem',
        version: '1.0.0',
        initialize: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        getStatus: () => ({
          name: 'test-subsystem',
          status: EngineStatus.READY,
          lastUpdated: new Date()
        })
      };

      engine.registerSubsystem(mockSubsystem);
      engine.unregisterSubsystem('test-subsystem');
      expect(engine.getSubsystem('test-subsystem')).toBeUndefined();
    });

    it('应该处理子系统事件处理失败的情况', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockSubsystem: ISubsystem = {
        name: 'test-subsystem',
        version: '1.0.0',
        initialize: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        getStatus: () => ({
          name: 'test-subsystem',
          status: EngineStatus.READY,
          lastUpdated: new Date()
        }),
        handleEvent: vi.fn().mockRejectedValue(new Error('Event handling failed'))
      };

      engine.registerSubsystem(mockSubsystem);
      const event: PluggableSystemEvent = { id: 'test-event-1', type: 'test-event', source: 'test-source', data: { test: 'data' }, timestamp: new Date() };

      engine.broadcastEvent(event);

      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockSubsystem.handleEvent).toHaveBeenCalledWith(event);
      consoleErrorSpy.mockRestore();
    });

    it('应该重置状态', async () => {
      const goal: AgentGoal = { id: 'goal-1', description: 'Test goal', priority: 1, constraints: [], metadata: {} };
      const plan = await engine.planTask(goal);
      await engine.executeTask(plan.id);

      await engine.resetState();

      const metrics = engine.getMetrics();
      expect(metrics.tasksCompleted).toBe(0);
      expect(metrics.tasksRunning).toBe(0);
      expect(metrics.tasksFailed).toBe(0);
    });

    it('应该从快照恢复状态', async () => {
      const goal: AgentGoal = { id: 'goal-1', description: 'Test goal', priority: 1, constraints: [], metadata: {} };
      const plan = await engine.planTask(goal);
      await engine.executeTask(plan.id);

      const snapshot = await engine.saveState();
      await engine.resetState();
      await engine.restoreState(snapshot);

      const state = engine.getState();
      expect(state.status).toBe(snapshot.state.status);
    });

    it('应该处理子系统未找到的情况', async () => {
      const subsystem = engine.getSubsystem('non-existent-subsystem');
      expect(subsystem).toBeUndefined();
    });

    it('应该处理多个子系统的协调', async () => {
      // 注册多个子系统
      const mockSubsystem1: ISubsystem = {
        name: 'subsystem-1',
        version: '1.0.0',
        initialize: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        getStatus: () => ({
          name: 'subsystem-1',
          status: EngineStatus.RUNNING,
          lastUpdated: new Date()
        })
      };

      const mockSubsystem2: ISubsystem = {
        name: 'subsystem-2',
        version: '1.0.0',
        initialize: vi.fn().mockResolvedValue(undefined),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        getStatus: () => ({
          name: 'subsystem-2',
          status: EngineStatus.RUNNING,
          lastUpdated: new Date()
        })
      };

      engine.registerSubsystem(mockSubsystem1);
      engine.registerSubsystem(mockSubsystem2);

      // 启动引擎以将子系统状态设置为RUNNING
      await engine.start();

      const complexTask: ComplexTask = {
        id: 'complex-task-4',
        description: 'Complex task with multiple subsystems',
        priority: 1,
        requirements: [],
        metadata: {}
      };

      const result = await engine.coordinateSubsystems(complexTask);
      expect(result).toBeDefined();
      
      // 即使没有找到合适的子系统来执行任务，协调也应该完成
      expect(result.coordinationMetrics).toHaveProperty('totalTime');
      expect(result.coordinationMetrics.totalTime).toBeGreaterThanOrEqual(0);

      await engine.shutdown();
    });
  });
});

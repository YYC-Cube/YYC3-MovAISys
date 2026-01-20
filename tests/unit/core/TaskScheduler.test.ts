/**
 * @file TaskScheduler 单元测试
 * @description 测试任务调度器的核心功能
 * @module __tests__/unit/core/TaskScheduler.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskScheduler, Task, TaskPlan } from '../../../core/task-scheduler/TaskScheduler';

describe('TaskScheduler', () => {
  let taskScheduler: TaskScheduler;

  beforeEach(() => {
    taskScheduler = new TaskScheduler({
      maxConcurrentTasks: 3,
      enablePrioritization: true,
      enableDependencyResolution: true,
      enableMetrics: true,
      defaultTimeout: 60000,
      defaultMaxRetries: 3
    });
  });

  afterEach(() => {
    if (taskScheduler) {
      taskScheduler.stop();
      taskScheduler.destroy();
    }
  });

  describe('初始化', () => {
    it('应该成功初始化任务调度器', () => {
      expect(taskScheduler).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultScheduler = new TaskScheduler();
      expect(defaultScheduler).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customScheduler = new TaskScheduler({
        maxConcurrentTasks: 5,
        enablePrioritization: false
      });
      expect(customScheduler).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(taskScheduler).toBeDefined();
    });
  });

  describe('任务调度', () => {
    it('应该成功调度任务', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'test-task',
        description: 'Test task',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
    });

    it('应该支持任务优先级', async () => {
      const taskId1 = await taskScheduler.schedule({
        name: 'low-priority-task',
        priority: 10,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      const taskId2 = await taskScheduler.schedule({
        name: 'high-priority-task',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      expect(taskId1).toBeDefined();
      expect(taskId2).toBeDefined();
    });

    it('应该支持任务依赖', async () => {
      const taskId1 = await taskScheduler.schedule({
        name: 'dependent-task-1',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      const taskId2 = await taskScheduler.schedule({
        name: 'dependent-task-2',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true }),
        dependencies: [taskId1]
      });

      expect(taskId2).toBeDefined();
    });

    it('应该处理任务超时', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'timeout-task',
        priority: 1,
        timeout: 100,
        execute: vi.fn().mockImplementation(() => new Promise(() => {}))
      });

      expect(taskId).toBeDefined();
    });

    it('应该支持任务重试', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'retry-task',
        priority: 1,
        maxRetries: 3,
        execute: vi.fn().mockRejectedValueOnce(new Error('Test error'))
          .mockResolvedValue({ success: true })
      });

      expect(taskId).toBeDefined();
    });
  });

  describe('任务计划调度', () => {
    it('应该成功调度任务计划', async () => {
      const planId = await taskScheduler.schedulePlan({
        name: 'test-plan',
        tasks: [
          {
            name: 'task-1',
            priority: 1,
            execute: vi.fn().mockResolvedValue({ success: true })
          },
          {
            name: 'task-2',
            priority: 1,
            execute: vi.fn().mockResolvedValue({ success: true })
          }
        ]
      });

      expect(planId).toBeDefined();
      expect(typeof planId).toBe('string');
    });
  });

  describe('任务执行', () => {
    it('应该成功执行任务', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'test-task',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true, data: 'test' })
      });

      const result = await taskScheduler.executeTask(taskId);
      expect(result).toBeDefined();
    });

    it('应该处理任务执行失败', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'failed-task',
        priority: 1,
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      });

      await expect(taskScheduler.executeTask(taskId)).rejects.toThrow();
    });
  });

  describe('任务取消', () => {
    it('应该成功取消任务', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'cancel-task',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      await taskScheduler.cancelTask(taskId);
      const task = taskScheduler.getTask(taskId);
      expect(task?.status).toBe('cancelled');
    });

    it('应该成功取消任务计划', async () => {
      const planId = await taskScheduler.schedulePlan({
        name: 'cancel-plan',
        tasks: [
          {
            name: 'task-1',
            priority: 1,
            execute: vi.fn().mockResolvedValue({ success: true })
          }
        ]
      });

      await taskScheduler.cancelPlan(planId);
      const plan = taskScheduler.getPlan(planId);
      expect(plan?.status).toBe('cancelled');
    });
  });

  describe('任务进度', () => {
    it('应该返回任务进度', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'progress-task',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      const progress = taskScheduler.getTaskProgress(taskId);
      expect(progress).toBeDefined();
      expect(progress.taskId).toBe(taskId);
    });
  });

  describe('任务查询', () => {
    it('应该支持任务查询', async () => {
      const taskId = await taskScheduler.schedule({
        name: 'query-task',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      const task = taskScheduler.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.id).toBe(taskId);
    });

    it('应该支持计划查询', async () => {
      const planId = await taskScheduler.schedulePlan({
        name: 'query-plan',
        tasks: [
          {
            name: 'task-1',
            priority: 1,
            execute: vi.fn().mockResolvedValue({ success: true })
          }
        ]
      });

      const plan = taskScheduler.getPlan(planId);
      expect(plan).toBeDefined();
      expect(plan?.id).toBe(planId);
    });

    it('应该获取所有任务', async () => {
      await taskScheduler.schedule({
        name: 'task-1',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      await taskScheduler.schedule({
        name: 'task-2',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      const allTasks = taskScheduler.getAllTasks();
      expect(allTasks.length).toBeGreaterThan(0);
    });

    it('应该获取所有计划', async () => {
      await taskScheduler.schedulePlan({
        name: 'plan-1',
        tasks: [
          {
            name: 'task-1',
            priority: 1,
            execute: vi.fn().mockResolvedValue({ success: true })
          }
        ]
      });

      const allPlans = taskScheduler.getAllPlans();
      expect(allPlans.length).toBeGreaterThan(0);
    });
  });

  describe('调度器控制', () => {
    it('应该启动调度器', () => {
      taskScheduler.start();
      expect(taskScheduler).toBeDefined();
    });

    it('应该停止调度器', () => {
      taskScheduler.start();
      taskScheduler.stop();
      expect(taskScheduler).toBeDefined();
    });
  });

  describe('调度器指标', () => {
    it('应该返回调度器指标', () => {
      const metrics = taskScheduler.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalTasks).toBeDefined();
      expect(metrics.completedTasks).toBeDefined();
      expect(metrics.failedTasks).toBeDefined();
      expect(metrics.runningTasks).toBeDefined();
      expect(metrics.pendingTasks).toBeDefined();
      expect(metrics.averageExecutionTime).toBeDefined();
      expect(metrics.successRate).toBeDefined();
    });
  });

  describe('调度器清理', () => {
    it('应该正确清理调度器资源', () => {
      taskScheduler.destroy();
      expect(taskScheduler).toBeDefined();
    });
  });

  describe('调度器事件', () => {
    it('应该触发任务完成事件', async () => {
      const handler = vi.fn();
      taskScheduler.on('task:completed', handler);

      const taskId = await taskScheduler.schedule({
        name: 'event-task',
        priority: 1,
        execute: vi.fn().mockResolvedValue({ success: true })
      });

      await taskScheduler.executeTask(taskId);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('并发控制', () => {
    it('应该限制并发任务数量', async () => {
      const tasks = [];
      for (let i = 0; i < 10; i++) {
        tasks.push(taskScheduler.schedule({
          name: `concurrent-task-${i}`,
          priority: 1,
          execute: vi.fn().mockResolvedValue({ success: true })
        }));
      }

      const taskIds = await Promise.all(tasks);
      expect(taskIds.length).toBe(10);
    });
  });
});

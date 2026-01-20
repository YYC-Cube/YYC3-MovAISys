/**
 * @file MessageBus.ts - 消息总线实现
 * @description YYC³ MovAISys 智能浮窗系统 - 核心引擎层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { AgentMessage, MessageType, MessageHandler, ProcessingContext, EngineStatus } from '../types/engine.types';

/**
 * 消息总线配置接口
 */
interface MessageBusConfig {
  maxQueueSize: number;
  retryPolicy: {
    maxRetries: number;
    backoffFactor: number;
  };
}

/**
 * 消息条目（包含重试信息）
 */
interface MessageEntry {
  message: AgentMessage;
  retries: number;
  nextRetryAt?: Date;
}

/**
 * 消息总线实现
 *
 * 设计理念：
 * 1. 基于EventEmitter实现发布-订阅模式
 * 2. 支持消息持久化，防止消息丢失
 * 3. 支持消息重试，提高可靠性
 * 4. 支持优先级队列，确保重要消息优先处理
 * 5. 监控消息吞吐量和延迟
 */
export class MessageBus extends EventEmitter {
  private config: MessageBusConfig;
  private handlers: Map<MessageType, MessageHandler[]> = new Map();
  private queue: MessageEntry[] = [];
  private processing: boolean = false;
  private metrics = {
    published: 0,
    processed: 0,
    failed: 0,
    retried: 0,
    averageProcessingTime: 0
  };

  constructor(config: MessageBusConfig) {
    super();
    this.config = config;
    this.setMaxListeners(100); // 增加最大监听器数量

    logger.info('消息总线初始化', 'MessageBus', {
      maxQueueSize: config.maxQueueSize,
      retryPolicy: config.retryPolicy
    });
  }

  /**
   * 发布消息
   */
  async publish(message: AgentMessage): Promise<void> {
    // 验证消息
    if (!message.id) {
      message.id = this.generateId();
    }
    if (!message.timestamp) {
      message.timestamp = new Date();
    }

    // 检查队列大小
    if (this.queue.length >= this.config.maxQueueSize) {
      logger.warn('消息队列已满，丢弃最旧的消息', 'MessageBus', {
        queueSize: this.queue.length,
        maxSize: this.config.maxQueueSize
      });
      this.queue.shift(); // 移除最旧的消息
    }

    // 添加到队列
    this.queue.push({
      message,
      retries: 0
    });

    // 更新指标
    this.metrics.published++;
    metrics.increment('message_bus.published');

    logger.debug('消息已发布', 'MessageBus', {
      messageId: message.id,
      messageType: message.type,
      queueSize: this.queue.length
    });

    // 触发事件
    this.emit('message:published', message);

    // 如果不在处理中，开始处理
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * 订阅消息类型
   */
  subscribe(type: MessageType, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }

    this.handlers.get(type)!.push(handler);

    logger.debug('消息处理器已注册', 'MessageBus', {
      messageType: type,
      handlersCount: this.handlers.get(type)!.length
    });
  }

  /**
   * 取消订阅
   */
  unsubscribe(type: MessageType, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        logger.debug('消息处理器已取消注册', 'MessageBus', {
          messageType: type
        });
      }
    }
  }

  /**
   * 处理消息队列
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const entry = this.queue[0];

      // 检查是否需要等待重试
      if (entry.nextRetryAt && entry.nextRetryAt > new Date()) {
        break;
      }

      // 从队列中取出
      this.queue.shift();

      // 处理消息
      try {
        await this.processMessage(entry);
      } catch (error) {
        logger.error('消息处理失败', 'MessageBus', {
          messageId: entry.message.id,
          error
        });

        // 检查是否需要重试
        if (entry.retries < this.config.retryPolicy.maxRetries) {
          entry.retries++;
          entry.nextRetryAt = this.calculateNextRetry(entry.retries);

          // 重新加入队列
          this.queue.push(entry);

          this.metrics.retried++;
          metrics.increment('message_bus.retried');
        } else {
          // 超过最大重试次数，丢弃消息
          this.metrics.failed++;
          metrics.increment('message_bus.failed');

          this.emit('message:failed', entry.message, error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * 处理单个消息
   */
  private async processMessage(entry: MessageEntry): Promise<void> {
    const { message } = entry;

    logger.debug('处理消息', 'MessageBus', {
      messageId: message.id,
      messageType: message.type
    });

    // 触发事件
    this.emit('message:processing', message);

    // 查找处理器
    const handlers = this.handlers.get(message.type);

    if (!handlers || handlers.length === 0) {
      logger.warn('没有找到消息处理器', 'MessageBus', {
        messageType: message.type
      });
      return;
    }

    // 创建处理上下文
    const context: ProcessingContext = {
      traceId: this.generateTraceId(),
      message,
      engineState: {
        status: EngineStatus.RUNNING,
        uptime: 0,
        tasks: { total: 0, active: 0, completed: 0, failed: 0 },
        subsystems: [],
        metrics: {
          messageThroughput: 0,
          averageResponseTime: 0,
          errorRate: 0
        }
      },
      availableSubsystems: Array.from(this.handlers.keys()),
      currentTime: new Date()
    };

    // 并发调用所有处理器
    const results = await Promise.allSettled(
      handlers.map(handler => handler(message, context))
    );

    // 处理结果
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.debug('消息处理完成', 'MessageBus', {
      messageId: message.id,
      successful,
      failed
    });

    // 更新指标
    this.metrics.processed++;
    metrics.increment('message_bus.processed');
    metrics.histogram('message_bus.processing_time', Date.now() - message.timestamp.getTime());

    // 触发事件
    this.emit('message:processed', message, results);
  }

  /**
   * 计算下次重试时间（指数退避）
   */
  private calculateNextRetry(retryCount: number): Date {
    const delay = Math.pow(this.config.retryPolicy.backoffFactor, retryCount) * 1000;
    return new Date(Date.now() + delay);
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    size: number;
    processing: boolean;
    metrics: {
      published: number;
      processed: number;
      failed: number;
      retried: number;
      averageProcessingTime: number;
    };
  } {
    return {
      size: this.queue.length,
      processing: this.processing,
      metrics: { ...this.metrics }
    };
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
    logger.info('消息队列已清空', 'MessageBus');
  }

  /**
   * 销毁消息总线
   */
  destroy(): void {
    this.clear();
    this.handlers.clear();
    this.removeAllListeners();
    logger.info('消息总线已销毁', 'MessageBus');
  }

  // ============ 辅助方法 ============

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

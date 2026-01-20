/**
 * @file index.ts - 项目入口文件
 * @description YYC³ MovAISys 智能浮窗系统 - 主入口
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { logger } from './utils/logger';
import { AutonomousAIEngine } from './core/AutonomousAIEngine';
import { EngineConfig, EngineStatus } from './types/engine.types';

/**
 * 引擎配置
 */
const engineConfig: EngineConfig = {
  version: '0.1.0',
  environment: 'development',

  messageConfig: {
    maxQueueSize: 1000,
    retryPolicy: {
      maxRetries: 3,
      backoffFactor: 2
    }
  },

  taskConfig: {
    maxConcurrentTasks: 10,
    timeoutMs: 30000,
    priorityLevels: 4
  },

  stateConfig: {
    autoPersist: true,
    persistInterval: 60000,
    maxHistory: 1000
  },

  logConfig: {
    level: 'debug',
    format: 'json'
  }
};

/**
 * 主函数
 */
async function main() {
  logger.info('========================================');
  logger.info('YYC³ MovAISys 智能浮窗系统启动中...');
  logger.info('========================================');

  try {
    // 1. 创建引擎实例
    logger.info('步骤 1: 创建引擎实例');
    const engine = new AutonomousAIEngine(engineConfig);

    // 2. 初始化引擎
    logger.info('步骤 2: 初始化引擎');
    await engine.initialize(engineConfig);

    // 3. 启动引擎
    logger.info('步骤 3: 启动引擎');
    await engine.start();

    // 4. 等待引擎进入运行状态
    logger.info('步骤 4: 等待引擎就绪');
    let attempts = 0;
    while (engine.getStatus() !== EngineStatus.RUNNING && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (engine.getStatus() === EngineStatus.RUNNING) {
      logger.info('✅ 引擎启动成功！', 'main', {
        status: engine.getStatus(),
        uptime: 0
      });

      const state = engine.getState();
      logger.info('引擎状态', 'main', state as unknown as Record<string, unknown>);

      const metrics = engine.getMetrics();
      logger.info('引擎指标', 'main', metrics as unknown as Record<string, unknown>);

      // 7. 处理退出信号
      process.on('SIGINT', async () => {
        logger.info('接收到退出信号，正在关闭引擎...');
        await engine.shutdown();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        logger.info('接收到终止信号，正在关闭引擎...');
        await engine.shutdown();
        process.exit(0);
      });

      // 8. 保持进程运行
      logger.info('引擎正在运行，按 Ctrl+C 退出...');
      // 保持进程运行，直到收到退出信号
    } else {
      logger.error('引擎启动失败', 'main', {
        status: engine.getStatus(),
        attempts
      });
      process.exit(1);
    }
  } catch (error) {
    logger.fatal('引擎启动失败', 'main', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

// 启动应用
main().catch(error => {
  logger.fatal('未捕获的错误', 'main', { error });
  process.exit(1);
});

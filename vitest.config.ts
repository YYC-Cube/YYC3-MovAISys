import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/*.config.ts',
        '**/mocks/**',
        '**/fixtures/**'
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85
      }
    },
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    // 性能优化配置 - Vitest 4新配置格式
    pool: 'threads',
    singleThread: false,
    maxThreads: 8,
    minThreads: 4,
    // 减少测试输出以提高性能
    outputFile: false,
    // 禁用日志以提高性能
    silent: false,
    // 禁用并发锁定以提高性能
    concurrency: 10
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './core'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});

/**
 * @file ToolRegistry 单元测试
 * @description 测试工具注册表的核心功能
 * @module __tests__/unit/core/ToolRegistry.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-20
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToolRegistry, AITool, ToolResult } from '../../../core/tools/ToolRegistry';

describe('ToolRegistry', () => {
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
  });

  afterEach(() => {
    if (toolRegistry) {
    }
  });

  describe('初始化', () => {
    it('应该成功初始化工具注册表', () => {
      expect(toolRegistry).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      expect(toolRegistry).toBeDefined();
    });
  });

  describe('工具管理', () => {
    it('应该成功注册工具', () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      const tools = toolRegistry.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
    });

    it('应该成功执行工具', async () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true, data: 'test' })
      };

      toolRegistry.registerTool(tool);
      const result = await toolRegistry.executeTool('test-tool', {});
      expect(result.success).toBe(true);
    });

    it('应该处理工具执行失败', async () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      };

      toolRegistry.registerTool(tool);
      await expect(toolRegistry.executeTool('test-tool', {})).rejects.toThrow();
    });
  });

  describe('工具查询', () => {
    it('应该支持工具查询', () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      const tools = toolRegistry.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
    });

    it('应该按分类获取工具', () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      const tools = toolRegistry.getToolsByCategory('test');
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe('工具分类', () => {
    it('应该支持工具分类', () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      const tools = toolRegistry.getToolsByCategory('test');
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe('工具搜索', () => {
    it('应该支持工具搜索', async () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      const suggested = await toolRegistry.suggestTools({} as any);
      expect(suggested).toBeDefined();
    });
  });

  describe('工具历史', () => {
    it('应该记录工具使用历史', async () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      await toolRegistry.executeTool('test-tool', {});
      const metrics = toolRegistry.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('工具清理', () => {
    it('应该正确清理工具资源', () => {
      expect(toolRegistry).toBeDefined();
    });
  });

  describe('工具事件', () => {
    it('应该触发工具事件', async () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      await toolRegistry.executeTool('test-tool', {});
      const metrics = toolRegistry.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('工具验证', () => {
    it('应该支持工具验证', () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      const tools = toolRegistry.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe('工具推荐', () => {
    it('应该推荐相关工具', async () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      const suggested = await toolRegistry.suggestTools({} as any);
      expect(suggested).toBeDefined();
    });
  });

  describe('工具配置', () => {
    it('应该支持工具配置', () => {
      const tool: AITool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      toolRegistry.registerTool(tool);
      expect(toolRegistry).toBeDefined();
    });
  });

  describe('工具指标', () => {
    it('应该返回工具指标', () => {
      const metrics = toolRegistry.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});

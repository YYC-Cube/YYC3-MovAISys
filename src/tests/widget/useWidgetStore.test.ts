/**
 * @file Widget Store测试
 * @description 测试useWidgetStore的功能
 * @module tests/widget/useWidgetStore.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWidgetStore } from '../widget/stores/useWidgetStore';

describe('useWidgetStore', () => {
  beforeEach(() => {
    // 重置store
    useWidgetStore.setState({
      isOpen: false,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 600 },
      theme: 'light',
      messages: [],
      isLoading: false
    });
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = useWidgetStore.getState();

      expect(state.isOpen).toBe(false);
      expect(state.position).toEqual({ x: 0, y: 0 });
      expect(state.size).toEqual({ width: 400, height: 600 });
      expect(state.theme).toBe('light');
      expect(state.messages).toEqual([]);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('toggleWidget', () => {
    it('应该切换widget的打开/关闭状态', () => {
      const state = useWidgetStore.getState();

      // 初始状态为关闭
      expect(state.isOpen).toBe(false);

      // 切换为打开
      state.toggleWidget();
      expect(useWidgetStore.getState().isOpen).toBe(true);

      // 切换为关闭
      state.toggleWidget();
      expect(useWidgetStore.getState().isOpen).toBe(false);
    });
  });

  describe('updatePosition', () => {
    it('应该更新widget的位置', () => {
      const state = useWidgetStore.getState();

      const newPosition = { x: 100, y: 200 };
      state.updatePosition(newPosition);

      expect(useWidgetStore.getState().position).toEqual(newPosition);
    });
  });

  describe('updateSize', () => {
    it('应该更新widget的大小', () => {
      const state = useWidgetStore.getState();

      const newSize = { width: 500, height: 700 };
      state.updateSize(newSize);

      expect(useWidgetStore.getState().size).toEqual(newSize);
    });
  });

  describe('setTheme', () => {
    it('应该更新主题', () => {
      const state = useWidgetStore.getState();

      state.setTheme('dark');
      expect(useWidgetStore.getState().theme).toBe('dark');

      state.setTheme('light');
      expect(useWidgetStore.getState().theme).toBe('light');
    });
  });

  describe('addMessage', () => {
    it('应该添加消息', () => {
      const state = useWidgetStore.getState();

      const message = {
        id: 'msg-001',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date()
      };

      state.addMessage(message);

      const messages = useWidgetStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('应该添加多条消息', () => {
      const state = useWidgetStore.getState();

      const message1 = {
        id: 'msg-001',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date()
      };

      const message2 = {
        id: 'msg-002',
        role: 'assistant' as const,
        content: 'Hi there!',
        timestamp: new Date()
      };

      state.addMessage(message1);
      state.addMessage(message2);

      const messages = useWidgetStore.getState().messages;
      expect(messages).toHaveLength(2);
    });
  });

  describe('setLoading', () => {
    it('应该设置加载状态', () => {
      const state = useWidgetStore.getState();

      state.setLoading(true);
      expect(useWidgetStore.getState().isLoading).toBe(true);

      state.setLoading(false);
      expect(useWidgetStore.getState().isLoading).toBe(false);
    });
  });
});

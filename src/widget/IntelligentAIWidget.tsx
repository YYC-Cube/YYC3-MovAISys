/**
 * @file 智能AI浮窗组件
 * @description 可拖拽的智能AI浮窗组件
 * @module widget/IntelligentAIWidget
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import React, { useState, useRef, useEffect } from 'react';
import { useWidgetStore } from './stores/useWidgetStore';

/**
 * 智能AI浮窗组件
 */
export const IntelligentAIWidget: React.FC = () => {
  const { isVisible, position, size, theme, toggleVisibility, setPosition, setSize } = useWidgetStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const widgetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (!dragHandleRef.current?.contains(e.target as Node)) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    e.preventDefault();
  };

  // 处理拖拽移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, setPosition]);

  // 处理调整大小
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const widgetRect = widgetRef.current?.getBoundingClientRect();

      if (widgetRect) {
        setSize({
          width: e.clientX - widgetRect.left,
          height: e.clientY - widgetRect.top
        });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setSize]);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        style={{ zIndex: 9999 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      ref={widgetRef}
      onMouseDown={handleDragStart}
      className={`fixed bg-white rounded-lg shadow-2xl overflow-hidden transition-colors ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 9999
      }}
    >
      {/* 顶部拖拽栏 */}
      <div
        ref={dragHandleRef}
        className={`flex items-center justify-between p-3 cursor-move ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="font-semibold">智能AI助手</span>
        </div>
        <button
          onClick={toggleVisibility}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100% - 120px)' }}>
        <div className="text-center text-gray-500 py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-lg">开始与AI对话</p>
          <p className="text-sm mt-2">输入您的问题，AI将为您解答</p>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="输入您的问题..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            发送
          </button>
        </div>
      </div>

      {/* 调整大小的手柄 */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4" />
        </svg>
      </div>
    </div>
  );
};

export default IntelligentAIWidget;

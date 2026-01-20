/**
 * @file 拖拽系统组件
 * @description 实现可拖拽的组件系统
 * @module widget/DragSystem
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 位置接口
 */
interface Position {
  x: number;
  y: number;
}

/**
 * 拖拽系统属性接口
 */
interface DragSystemProps {
  children: React.ReactNode;
  onDragStart?: (position: Position) => void;
  onDrag?: (position: Position) => void;
  onDragEnd?: (position: Position) => void;
  initialPosition?: Position;
  disabled?: boolean;
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  handle?: string; // CSS选择器，指定拖拽手柄
}

/**
 * 拖拽系统组件
 */
export const DragSystem: React.FC<DragSystemProps> = ({
  children,
  onDragStart,
  onDrag,
  onDragEnd,
  initialPosition = { x: 0, y: 0 },
  disabled = false,
  bounds,
  handle
}) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });

  // 检查是否在拖拽手柄上
  const isOnHandle = useCallback((e: React.MouseEvent): boolean => {
    if (!handle) return true;

    const target = e.target as HTMLElement;
    return target.closest(handle) !== null;
  }, [handle]);

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || !isOnHandle(e)) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    onDragStart?.(position);

    e.preventDefault();
  }, [disabled, isOnHandle, position, onDragStart]);

  // 处理拖拽移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition: Position = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      };

      // 应用边界限制
      if (bounds) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();

          if (bounds.left !== undefined) {
            newPosition.x = Math.max(bounds.left, newPosition.x);
          }
          if (bounds.right !== undefined) {
            newPosition.x = Math.min(bounds.right - rect.width, newPosition.x);
          }
          if (bounds.top !== undefined) {
            newPosition.y = Math.max(bounds.top, newPosition.y);
          }
          if (bounds.bottom !== undefined) {
            newPosition.y = Math.min(bounds.bottom - rect.height, newPosition.y);
          }
        }
      }

      setPosition(newPosition);
      onDrag?.(newPosition);
    };

    const handleMouseUp = (_e: MouseEvent) => {
      setIsDragging(false);
      onDragEnd?.(position);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, bounds, onDrag, onDragEnd]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${disabled ? 'cursor-default' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
};

export default DragSystem;

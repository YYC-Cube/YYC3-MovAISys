 import React, { useState, useEffect, useRef, useCallback } from 'react';
  import { v4 as uuidv4 } from 'uuid';

  // 核心类型定义
  export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'failed';
  }

  export interface ChatConfig {
    engine?: any; // AutonomousAIEngine实例（可选）
    theme?: 'light' | 'dark';
    maxHistory?: number;
    standalone?: boolean; // 是否独立运行模式
  }

  /**
   * ChatInterface
   * React组件：聊天界面
   */
  export const ChatInterface: React.FC<ChatConfig> = ({
    engine,
    theme = 'light',
    maxHistory = 100,
    standalone = false
  }) => {
    // 状态管理
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(theme);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * 自动滚动到底部
     */
    const scrollToBottom = useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);

    /**
     * 发送消息
     */
    const handleSendMessage = useCallback(async () => {
      const content = inputValue.trim();
      if (!content || isTyping) return;

      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      try {
        let responseText: string;

        if (standalone) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          responseText = "这是一个示例响应。在实际应用中，这里会调用AI模型来生成响应。";
        } else {
          if (!engine) {
            throw new Error('Engine not provided in non-standalone mode');
          }
          const response = await engine.processMessage({
            id: uuidv4(),
            type: 'chat',
            source: 'user',
            content: { text: content, history: messages.slice(-maxHistory) },
            timestamp: new Date()
          });
          responseText = response.data?.text || 'No response';
        }

        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
          status: 'sent'
        };

        setMessages(prev => [...prev, assistantMessage]);

      } catch (error) {
        console.error('Failed to send message:', error);

        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
        inputRef.current?.focus();
      }
    }, [inputValue, isTyping, engine, messages, maxHistory, standalone]);

    /**
     * 处理回车发送
     */
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    }, [handleSendMessage]);

    /**
     * 主题切换
     */
    const toggleTheme = useCallback(() => {
      setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    /**
     * 清空聊天
     */
    const handleClearChat = useCallback(() => {
      setMessages([]);
    }, []);

    /**
     * 渲染消息
     */
    const renderMessage = useCallback((message: ChatMessage) => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';

      return (
        <div
          key={message.id}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              isSystem
                ? 'bg-yellow-100 text-yellow-800'
                : isUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow'
            }`}
          >
            {!isUser && !isSystem && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <span className="text-sm font-semibold">智能助手</span>
              </div>
            )}
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            <div className="text-xs mt-1 opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      );
    }, []);

    return (
      <div className={`flex flex-col h-full bg-white ${currentTheme === 'dark' ?
'dark:bg-gray-800' : ''}`}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">AI Chat</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="px-3 py-1 text-sm rounded hover:bg-gray-100"
            >
              {currentTheme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm rounded hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg mb-2">👋 欢迎使用AI聊天</p>
              <p className="text-sm">开始与AI对话吧！</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-
100" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-
200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isTyping}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none
focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isTyping || !inputValue.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  export default ChatInterface;

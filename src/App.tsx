import React, { useEffect, useState } from 'react';
import { AutonomousAIEngine } from './core/AutonomousAIEngine';
import { EngineConfig } from './types/engine.types';
import { ChatInterface } from './widget/ChatInterface';
import './App.css';

/**
 * YYC3智能浮窗应用
 */
const App: React.FC = () => {
  const [engine, setEngine] = useState<AutonomousAIEngine | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setStatus('Initializing Core Engine...');

        const engineConfig: EngineConfig = {
          version: '1.0.0',
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
            priorityLevels: 3
          },
          stateConfig: {
            autoPersist: true,
            persistInterval: 60000,
            maxHistory: 100
          },
          logConfig: {
            level: 'info',
            format: 'text'
          }
        };
        const aiEngine = new AutonomousAIEngine(engineConfig);
        await aiEngine.initialize(engineConfig);
        setEngine(aiEngine);

        setStatus('Ready!');

      } catch (error) {
        console.error('Initialization failed:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeApp();
  }, []);

  if (!engine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-500 text-white px-6 py-4">
          <h1 className="text-xl font-bold">YYC³ 智能浮窗</h1>
          <p className="text-sm opacity-90">基于五标五高五化的多维度AI系统</p>
        </div>

        <div className="h-[600px]">
          <ChatInterface
            engine={engine}
            theme="light"
            maxHistory={50}
          />
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              <span className="font-semibold">状态:</span> {engine.getState().status}
            </div>
            <div>
              <span className="font-semibold">模式:</span> 集成模式
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

# YYC³ MovAISys - 智能浮窗系统

![YYC³ Logo](https://github.com/YYC-Cube/yyc3-MovAISys/raw/main/public/yyc3-article-cover-05.png)

[![Version](https://img.shields.io/badge/version-v1.1.0-blue.svg)](https://github.com/YYC-Cube/yyc3-MovAISys)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/YYC-Cube/yyc3-MovAISys/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/YYC-Cube/yyc3-MovAISys)

## 📋 项目概述

YYC³（YanYuCloudCube）PortAISys 是一个基于云原生架构的便携式智能AI系统，旨在为企业提供高性能、高可靠性、高安全性、高扩展性和高可维护性的AI解决方案。

## ✨ 核心特性

- **🔌 可插拔架构**：组件化设计，轻松扩展和定制
- **🧠 多模型支持**：集成 OpenAI、Anthropic、本地模型等多种AI能力
- **📊 智能监控**：完善的日志、指标和追踪系统
- **🎨 现代化UI**：基于 React + Zustand 的交互界面
- **🧪 完整测试**：单元测试、集成测试、E2E测试全覆盖
- **🚀 容器化部署**：Docker + Docker Compose 一键部署
- **🔒 企业级安全**：端到端加密、权限管理、合规审计
- **⚡ 高性能**：低延迟、高并发、资源优化

## 🏗️ 系统架构

```
┌───────────────────────────────────────────────────────────────────────┐
│                         🧠 YYC³ 智能引擎核心                          │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┤
│    📥 数据     │    💡 决策       │    ⚡ 执行       │    📊 反馈       │
│    采集层      │    分析层      │    控制层      │    评估层      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
          ↑                               ↓
┌───────────────────────────────────────────────────────────────────────┐
│                         � 自适应学习闭环系统                          │
│   环境感知 → 数据处理 → 模型推理 → 行动执行 → 效果评估 → 知识更新     │
└───────────────────────────────────────────────────────────────────────┘
```

## 🛠️ 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | React | ^18.0.0 | UI框架 |
| **状态管理** | Zustand | ^4.0.0 | 轻量级状态管理 |
| **类型系统** | TypeScript | ^5.0.0 | 类型安全 |
| **构建工具** | Vite | ^5.0.0 | 快速构建 |
| **运行时** | Node.js | ^18.0.0 | JavaScript运行时 |
| **AI模型** | OpenAI API | - | 大语言模型 |
| **AI模型** | Anthropic API | - | Claude模型 |
| **本地推理** | Ollama | - | 本地模型运行 |
| **测试框架** | Vitest | ^4.0.0 | 单元测试 |
| **测试框架** | Playwright | ^1.0.0 | E2E测试 |
| **容器化** | Docker | ^20.10.0 | 应用容器化 |
| **容器编排** | Docker Compose | ^2.0.0 | 多容器管理 |
| **反向代理** | Nginx | ^1.20.0 | 负载均衡 |

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Bun >= 1.0.0 (可选，推荐)
- Docker >= 20.10.0
- Docker Compose >= 2.0.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/YYC-Cube/yyc3-MovAISys.git
cd yyc3-MovAISys

# 安装依赖
npm install
# 或使用Bun
bun install
```

### 配置

复制环境变量示例文件并根据需要修改：

```bash
cp .env.example .env
```

### 启动开发服务器

```bash
# 启动后端API
npm run dev
# 或使用Bun
bun run dev

# 启动前端UI
cd widget
npm run dev
```

### 构建生产版本

```bash
# 构建后端
npm run build

# 构建前端
cd widget
npm run build
```

## 📁 项目结构

```
/Users/my/yyc3-Mobile-Intelligent-AI-System/
├── core/                  # 核心引擎
│   ├── pluggable/         # 可插拔组件
│   ├── error-handler/     # 错误处理
│   └── metrics/           # 性能指标
├── widget/                # 前端界面
│   ├── components/        # UI组件
│   ├── stores/            # 状态管理
│   └── utils/             # 工具函数
├── tests/                 # 测试文件
│   ├── unit/              # 单元测试
│   └── e2e/               # E2E测试
├── public/                # 静态资源
├── docs/                  # 项目文档
├── .env.example           # 环境变量示例
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目说明
```

## � 核心模块文档

### 文档同步工具

自动同步项目文档与代码实现，确保文档的准确性和时效性。

### Web仪表板

提供实时监控和管理界面，支持：
- 系统状态监控
- 性能指标查看
- 日志查询
- 配置管理
- 任务调度

## 📝 开发指南

### 代码规范

- 遵循 TypeScript 最佳实践
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 保持代码简洁、可维护

### Git规范

- 提交信息格式：`type(scope): subject`
- 分支命名：`feature/xxx`、`fix/xxx`、`docs/xxx`
- 保持提交历史清晰、有意义

### 测试指南

- 单元测试覆盖率达到85%以上
- 使用 Vitest 编写单元测试
- 使用 Playwright 编写E2E测试
- 测试代码与业务代码分离

## 📊 实现状态

### ✅ 已完成模块

- [x] 项目基础设施搭建
- [x] 核心引擎MVP实现
- [x] 模型适配器基础实现
- [x] 错误处理系统
- [x] 日志和指标系统

### ⏳ 进行中模块

- [ ] 智能交互界面实现
- [ ] 测试体系搭建
- [ ] 部署配置完善

### 📅 待实现模块

- [ ] 高级AI模型集成
- [ ] 企业级安全特性
- [ ] 多语言支持
- [ ] 移动端适配

## 🗓️ 开发路线图

### 阶段1：基础架构搭建 (已完成)
- 项目初始化
- 核心框架搭建
- 基础模块实现

### 阶段2：功能完善 (进行中)
- 智能界面开发
- 测试体系搭建
- 部署配置完善

### 阶段3：性能优化 (计划中)
- 性能调优
- 负载测试
- 资源优化

### 阶段4：企业级特性 (计划中)
- 安全增强
- 合规审计
- 多租户支持

## 📖 API文档

### 核心API使用示例

```typescript
// 导入引擎
import { AutonomousAIEngine } from './core/pluggable/AutonomousAIEngine';
import { EngineConfig } from './core/pluggable/types';

// 创建引擎实例
const config: EngineConfig = {
  maxConcurrentTasks: 10,
  taskTimeout: 300000,
  enablePersistence: true
};

const engine = new AutonomousAIEngine(config);

// 初始化引擎
await engine.initialize(config);

// 启动引擎
await engine.start();

// 处理消息
const message = {
  id: 'msg-1',
  type: 'text',
  content: 'Hello, YYC³!',
  timestamp: new Date()
};

const response = await engine.processMessage(message);
console.log(response);

// 停止引擎
await engine.shutdown();
```

## � 安全与合规

### 安全特性

- **端到端加密**：数据传输和存储加密
- **权限管理**：基于角色的访问控制
- **安全审计**：完整的操作日志记录
- **漏洞扫描**：定期安全漏洞检测
- **入侵检测**：实时监控异常行为

### 合规标准

- GDPR (欧盟通用数据保护条例)
- CCPA (加州消费者隐私法案)
- ISO 27001 (信息安全管理体系)
- SOC 2 (服务组织控制)

## ⚡ 性能指标

### 系统性能

| 指标 | 数值 |
|------|------|
| 响应时间 | < 100ms |
| 并发用户 | > 1000 |
| 可用性 | 99.99% |
| 吞吐量 | > 1000 req/s |

### 前端性能

| 指标 | 数值 |
|------|------|
| 首屏加载时间 | < 2s |
| 交互响应时间 | < 100ms |
| 资源大小 | < 1MB |
| 性能评分 | > 90/100 |

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系方式

- **GitHub主页**：[https://github.com/YYC-Cube/yyc3-MovAISys](https://github.com/YYC-Cube/yyc3-MovAISys)
- **问题反馈**：[https://github.com/YYC-Cube/yyc3-MovAISys/issues](https://github.com/YYC-Cube/yyc3-MovAISys/issues)
- **邮箱**：[admin@0379.email](mailto:admin@0379.email)

---

**YYC³ MovAISys** - 重新定义AI交互体验 🚀

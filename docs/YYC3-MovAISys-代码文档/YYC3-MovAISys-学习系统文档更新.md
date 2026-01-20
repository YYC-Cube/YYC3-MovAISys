# YYC³ MovAISys 学习系统文档更新

## 4. 自主学习系统（更新版）

### 实际代码实现
// core/learning/LearningSystem.ts
export class LearningSystem {
  private config: AutonomousAIConfig;
  private memory: MemorySystem;
  private learningRecords: LearningRecord[] = [];
  private patterns: PatternRecognitionResult[] = [];
  private performanceHistory: PerformanceEvaluation[] = [];
  
  constructor(config: AutonomousAIConfig, memory: MemorySystem) {
    this.config = config;
    this.memory = memory;
  }
  
  /**
   * 记录用户交互
   * @param record 学习记录
   */
  async recordInteraction(record: Omit<LearningRecord, 'timestamp' | 'id'>): Promise<void> {
    if (!this.config.enableLearning) return;

    const learningRecord: LearningRecord = {
      ...record,
      id: `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.learningRecords.push(learningRecord);
    await this.memory.saveLearningRecord(learningRecord);
  }
  
  /**
   * 识别用户交互模式
   */
  async recognizePatterns(): Promise<PatternRecognitionResult[]> {
    if (!this.config.enableLearning) return [];

    const allRecords = await this.memory.getLearningRecords();
    
    const patterns: PatternRecognitionResult[] = [];
    
    // 1. 识别常见问题模式
    const commonQuestions = this.identifyCommonQuestions(allRecords);
    if (commonQuestions.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-common-questions`,
        type: 'common_questions',
        patterns: commonQuestions,
        confidence: 0.9,
        detectedAt: new Date().toISOString(),
      });
    }

    // 2. 识别使用时间模式
    const timePatterns = this.identifyTimePatterns(allRecords);
    if (timePatterns.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-time`,
        type: 'usage_time',
        patterns: timePatterns,
        confidence: 0.8,
        detectedAt: new Date().toISOString(),
      });
    }

    // 3. 识别工具使用模式
    const toolPatterns = this.identifyToolUsagePatterns(allRecords);
    if (toolPatterns.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-tools`,
        type: 'tool_usage',
        patterns: toolPatterns,
        confidence: 0.85,
        detectedAt: new Date().toISOString(),
      });
    }

    this.patterns = [...this.patterns, ...patterns];
    await this.memory.savePatterns(patterns);
    
    return patterns;
  }
  
  /**
   * 评估AI性能
   */
  async evaluatePerformance(): Promise<PerformanceEvaluation> {
    if (!this.config.enableLearning) {
      return {
        id: `eval-${Date.now()}`,
        timestamp: new Date().toISOString(),
        accuracy: 0,
        responseTime: 0,
        userSatisfaction: 0,
        toolUsageEffectiveness: 0,
        learningProgress: 0,
      };
    }

    const allRecords = await this.memory.getLearningRecords();
    const recentRecords = allRecords.filter(record => {
      const recordTime = new Date(record.timestamp);
      const now = new Date();
      return (now.getTime() - recordTime.getTime()) < 24 * 60 * 60 * 1000;
    });

    if (recentRecords.length === 0) {
      return {
        id: `eval-${Date.now()}`,
        timestamp: new Date().toISOString(),
        accuracy: 0.5,
        responseTime: 1000,
        userSatisfaction: 0.5,
        toolUsageEffectiveness: 0.5,
        learningProgress: 0,
      };
    }

    // 计算准确率
    const accurateResponses = recentRecords.filter(record => record.accuracy >= 0.8).length;
    const accuracy = accurateResponses / recentRecords.length;

    // 计算平均响应时间
    const totalResponseTime = recentRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0);
    const responseTime = totalResponseTime / recentRecords.length;

    // 计算用户满意度
    const satisfiedUsers = recentRecords.filter(record => record.userSatisfaction >= 3).length;
    const userSatisfaction = satisfiedUsers / recentRecords.length;

    // 计算工具使用效果
    const toolUsages = recentRecords.filter(record => record.toolUsage && record.toolUsage.length > 0);
    const effectiveToolUsages = toolUsages.filter(record => 
      record.toolUsage?.every(usage => usage.effectiveness >= 0.8)
    ).length;
    const toolUsageEffectiveness = toolUsages.length > 0 ? effectiveToolUsages / toolUsages.length : 0;

    // 计算学习进度
    const learningProgress = this.calculateLearningProgress(recentRecords);

    const evaluation: PerformanceEvaluation = {
      id: `eval-${Date.now()}`,
      timestamp: new Date().toISOString(),
      accuracy,
      responseTime,
      userSatisfaction,
      toolUsageEffectiveness,
      learningProgress,
    };

    this.performanceHistory.push(evaluation);
    await this.memory.savePerformanceEvaluation(evaluation);
    
    return evaluation;
  }
  
  /**
   * 更新学习策略
   */
  async updateLearningStrategy(): Promise<void> {
    if (!this.config.enableLearning) return;

    const latestEvaluation = await this.evaluatePerformance();
    const latestPatterns = await this.recognizePatterns();

    // 根据性能评估和模式识别结果调整学习策略
    if (latestEvaluation.accuracy < 0.7) {
      // 提高准确率的策略
      this.config.enableContextAwareness = true;
    }

    if (latestEvaluation.responseTime > 2000) {
      // 提高响应速度的策略
      this.config.maxTokens = Math.max(500, this.config.maxTokens - 250);
    }

    if (latestEvaluation.userSatisfaction < 0.6) {
      // 提高用户满意度的策略
      this.config.temperature = Math.min(0.9, this.config.temperature + 0.1);
    }

    // 根据识别到的模式调整系统行为
    for (const pattern of latestPatterns) {
      if (pattern.type === 'common_questions') {
        // 缓存常见问题的答案
        await this.cacheCommonQuestions(pattern.patterns);
      }
    }
  }
  
  /**
   * 获取学习记录
   */
  async getLearningRecords(): Promise<LearningRecord[]> {
    return await this.memory.getLearningRecords();
  }
  
  /**
   * 获取识别到的模式
   */
  async getPatterns(): Promise<PatternRecognitionResult[]> {
    return await this.memory.getPatterns();
  }
  
  /**
   * 获取性能评估历史
   */
  async getPerformanceHistory(): Promise<PerformanceEvaluation[]> {
    return await this.memory.getPerformanceEvaluations();
  }
  
  /**
   * 获取当前学习进度
   */
  async getCurrentProgress(): Promise<number> {
    const latestEvaluation = await this.evaluatePerformance();
    return latestEvaluation.learningProgress;
  }
}

### 新增的辅助类

#### 4.1 PatternRecognizer 类
// core/learning/PatternRecognizer.ts
export class PatternRecognizer {
  private config: PatternConfig;
  private patterns: Map<string, Pattern> = new Map();
  private recognitionHistory: PatternRecognitionResult[] = [];

  async analyzePatterns(
    recentInteractions: LearningRecord[],
    performanceHistory?: any[],
    userPreferences?: any
  ): Promise<PatternRecognitionResult> {
    // 实现模式识别逻辑
    const result: PatternRecognitionResult = {
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'comprehensive',
      patterns: [],
      insights: [],
      confidence: 0,
      detectedAt: new Date()
    };

    // 识别常见问题、时间模式、工具使用模式、话题模式
    const commonQuestions = this.identifyCommonQuestions(recentInteractions);
    const timePatterns = this.identifyTimePatterns(recentInteractions);
    const toolPatterns = this.identifyToolUsagePatterns(recentInteractions);
    const topicPatterns = this.identifyTopicPatterns(recentInteractions);

    result.patterns = [
      ...commonQuestions.map(q => ({
        content: { question: q.question },
        frequency: q.frequency,
        confidence: Math.min(1, q.frequency / 10)
      })),
      ...timePatterns.map(t => ({
        content: { hour: t.hour },
        frequency: t.frequency,
        confidence: Math.min(1, t.frequency / 20)
      })),
      ...toolPatterns.map(t => ({
        content: { toolName: t.toolName },
        frequency: t.frequency,
        confidence: Math.min(1, t.frequency / 15)
      })),
      ...topicPatterns.map(t => ({
        content: { topic: t.topic },
        frequency: t.frequency,
        confidence: Math.min(1, t.frequency / 8)
      }))
    ];

    result.insights = this.generateInsights(result.patterns, recentInteractions);
    result.confidence = this.calculateOverallConfidence(result.patterns);

    this.recognitionHistory.push(result);
    this.updatePatternStore(result.patterns);

    return result;
  }

  async generateInsights(
    recentInteractions: LearningRecord[],
    performanceHistory: any[],
    userPreferences: any
  ): Promise<string[]> {
    const insights: string[] = [];
    const patterns = await this.analyzePatterns(recentInteractions, performanceHistory, userPreferences);

    if (patterns.patterns.length === 0) {
      insights.push('暂未检测到显著的使用模式');
      return insights;
    }

    // 基于识别到的模式生成洞察
    const commonQuestions = patterns.patterns.filter(p => p.content.question);
    if (commonQuestions.length > 0) {
      const topQuestion = commonQuestions.sort((a, b) => b.frequency - a.frequency)[0];
      insights.push(`用户最常问的问题是："${topQuestion.content.question}"，出现${topQuestion.frequency}次`);
    }

    const timePatterns = patterns.patterns.filter(p => p.content.hour !== undefined);
    if (timePatterns.length > 0) {
      const peakHour = timePatterns.sort((a, b) => b.frequency - a.frequency)[0];
      insights.push(`用户最活跃的时间段是：${peakHour.content.hour}:00 - ${peakHour.content.hour + 1}:00`);
    }

    const toolPatterns = patterns.patterns.filter(p => p.content.toolName);
    if (toolPatterns.length > 0) {
      const topTool = toolPatterns.sort((a, b) => b.frequency - a.frequency)[0];
      insights.push(`用户最常用的工具是：${topTool.content.toolName}`);
    }

    return insights;
  }
}

#### 4.2 FeedbackAnalyzer 类
// core/learning/FeedbackAnalyzer.ts
export class FeedbackAnalyzer {
  private config: FeedbackConfig;
  private analysisHistory: FeedbackAnalysis[] = [];
  private feedbackPatterns: Map<string, number> = new Map();

  async analyze(feedback: UserFeedback): Promise<FeedbackAnalysis> {
    const analysis: FeedbackAnalysis = {
      id: `feedback-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      feedback,
      sentiment: this.determineSentiment(feedback.rating),
      keyIssues: this.identifyKeyIssues(feedback),
      suggestedImprovements: this.generateSuggestions(feedback),
      preferenceUpdates: this.extractPreferenceUpdates(feedback),
      confidence: this.calculateConfidence(feedback),
      analyzedAt: new Date()
    };

    this.analysisHistory.push(analysis);
    this.updateFeedbackPatterns(analysis);

    return analysis;
  }

  getSentimentStats(): {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  } {
    const stats = {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: this.analysisHistory.length
    };

    for (const analysis of this.analysisHistory) {
      stats[analysis.sentiment]++;
    }

    return stats;
  }

  getAverageRating(): number {
    if (this.analysisHistory.length === 0) return 0;

    const totalRating = this.analysisHistory.reduce(
      (sum, analysis) => sum + analysis.feedback.rating,
      0
    );

    return totalRating / this.analysisHistory.length;
  }
}

### 主要改进点

1. **架构简化**：移除了对 `KnowledgeBase` 的依赖，改为使用 `MemorySystem`
2. **功能增强**：添加了 `PatternRecognizer` 和 `FeedbackAnalyzer` 两个专门的类
3. **方法优化**：简化了方法签名，使其更符合实际代码实现
4. **性能评估**：实现了基于最近24小时数据的性能评估
5. **模式识别**：支持识别常见问题、时间模式、工具使用模式和话题模式
6. **反馈分析**：支持情感分析、问题识别和改进建议生成

---

**文档更新时间**: 2026-01-21  
**更新人员**: YYC³ AI Team  
**版本**: 2.0.0

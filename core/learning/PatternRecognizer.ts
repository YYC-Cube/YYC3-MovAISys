/**
 * @file 模式识别器
 * @description 识别用户交互模式，为学习系统提供智能洞察
 * @module learning/PatternRecognizer
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 */

import { LearningRecord } from './types';

export interface Pattern {
  id: string;
  type: string;
  content: any;
  frequency: number;
  confidence: number;
  lastSeen: Date;
}

export interface PatternRecognitionResult {
  id: string;
  type: string;
  patterns: Array<{
    content: any;
    frequency: number;
    confidence: number;
  }>;
  insights: string[];
  confidence: number;
  detectedAt: Date;
}

export interface PatternConfig {
  minFrequency: number;
  confidenceThreshold: number;
  maxPatterns: number;
  timeWindow: number;
}

export class PatternRecognizer {
  private config: PatternConfig;
  private patterns: Map<string, Pattern> = new Map();
  private recognitionHistory: PatternRecognitionResult[] = [];

  constructor(config?: Partial<PatternConfig>) {
    this.config = {
      minFrequency: 3,
      confidenceThreshold: 0.7,
      maxPatterns: 100,
      timeWindow: 7 * 24 * 60 * 60 * 1000, // 7天
      ...config
    };
  }

  async analyzePatterns(
    recentInteractions: LearningRecord[],
    performanceHistory?: any[],
    userPreferences?: any
  ): Promise<PatternRecognitionResult> {
    const result: PatternRecognitionResult = {
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'comprehensive',
      patterns: [],
      insights: [],
      confidence: 0,
      detectedAt: new Date()
    };

    const now = Date.now();
    const timeWindowStart = now - this.config.timeWindow;

    const recentRecords = recentInteractions.filter(
      record => new Date(record.timestamp).getTime() > timeWindowStart
    );

    if (recentRecords.length === 0) {
      return result;
    }

    const commonQuestions = this.identifyCommonQuestions(recentRecords);
    if (commonQuestions.length > 0) {
      result.patterns.push(...commonQuestions.map(q => ({
        content: { question: q.question },
        frequency: q.frequency,
        confidence: Math.min(1, q.frequency / 10)
      })));
    }

    const timePatterns = this.identifyTimePatterns(recentRecords);
    if (timePatterns.length > 0) {
      result.patterns.push(...timePatterns.map(t => ({
        content: { hour: t.hour },
        frequency: t.frequency,
        confidence: Math.min(1, t.frequency / 20)
      })));
    }

    const toolPatterns = this.identifyToolUsagePatterns(recentRecords);
    if (toolPatterns.length > 0) {
      result.patterns.push(...toolPatterns.map(t => ({
        content: { toolName: t.toolName },
        frequency: t.frequency,
        confidence: Math.min(1, t.frequency / 15)
      })));
    }

    const topicPatterns = this.identifyTopicPatterns(recentRecords);
    if (topicPatterns.length > 0) {
      result.patterns.push(...topicPatterns.map(t => ({
        content: { topic: t.topic },
        frequency: t.frequency,
        confidence: Math.min(1, t.frequency / 8)
      })));
    }

    result.insights = this.generateInsights(result.patterns, recentRecords);
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

    const topicPatterns = patterns.patterns.filter(p => p.content.topic);
    if (topicPatterns.length > 0) {
      const topTopic = topicPatterns.sort((a, b) => b.frequency - a.frequency)[0];
      insights.push(`用户最关注的话题是：${topTopic.content.topic}`);
    }

    if (patterns.confidence > 0.8) {
      insights.push('模式识别置信度较高，建议基于这些模式优化系统响应');
    } else if (patterns.confidence < 0.5) {
      insights.push('模式识别置信度较低，建议收集更多数据');
    }

    return insights;
  }

  getPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  getRecognitionHistory(): PatternRecognitionResult[] {
    return this.recognitionHistory;
  }

  clearOldPatterns(): void {
    const now = Date.now();
    const timeWindowStart = now - this.config.timeWindow;

    for (const [id, pattern] of this.patterns.entries()) {
      if (pattern.lastSeen.getTime() < timeWindowStart) {
        this.patterns.delete(id);
      }
    }
  }

  private identifyCommonQuestions(records: LearningRecord[]): Array<{ question: string; frequency: number }> {
    const questionFrequency: Record<string, number> = {};

    for (const record of records) {
      if (record.userQuery) {
        const normalizedQuery = record.userQuery.toLowerCase().trim();
        questionFrequency[normalizedQuery] = (questionFrequency[normalizedQuery] || 0) + 1;
      }
    }

    return Object.entries(questionFrequency)
      .filter(([_, frequency]) => frequency >= this.config.minFrequency)
      .map(([question, frequency]) => ({ question, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private identifyTimePatterns(records: LearningRecord[]): Array<{ hour: number; frequency: number }> {
    const hourFrequency: Record<number, number> = {};

    for (const record of records) {
      const hour = new Date(record.timestamp).getHours();
      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
    }

    return Object.entries(hourFrequency)
      .map(([hour, frequency]) => ({ hour: parseInt(hour), frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private identifyToolUsagePatterns(records: LearningRecord[]): Array<{ toolName: string; frequency: number }> {
    const toolFrequency: Record<string, number> = {};

    for (const record of records) {
      if (record.toolUsage) {
        for (const toolUsage of record.toolUsage) {
          toolFrequency[toolUsage.toolName] = (toolFrequency[toolUsage.toolName] || 0) + 1;
        }
      }
    }

    return Object.entries(toolFrequency)
      .map(([toolName, frequency]) => ({ toolName, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private identifyTopicPatterns(records: LearningRecord[]): Array<{ topic: string; frequency: number }> {
    const topicFrequency: Record<string, number> = {};

    for (const record of records) {
      if (record.userQuery) {
        const topics = this.extractTopics(record.userQuery);
        for (const topic of topics) {
          topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
        }
      }
    }

    return Object.entries(topicFrequency)
      .filter(([_, frequency]) => frequency >= this.config.minFrequency)
      .map(([topic, frequency]) => ({ topic, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private extractTopics(query: string): string[] {
    const topics: string[] = [];

    const topicKeywords = {
      '技术': ['技术', '开发', '编程', '代码', 'API'],
      '业务': ['业务', '销售', '营销', '客户', '市场'],
      '数据': ['数据', '分析', '统计', '报表', '图表'],
      '管理': ['管理', '团队', '项目', '任务', '流程'],
      '支持': ['帮助', '问题', '错误', '故障', '修复']
    };

    const lowerQuery = query.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          if (!topics.includes(topic)) {
            topics.push(topic);
          }
          break;
        }
      }
    }

    return topics;
  }

  private generateInsights(patterns: Array<any>, records: LearningRecord[]): string[] {
    const insights: string[] = [];

    if (patterns.length === 0) {
      insights.push('暂未检测到显著的使用模式');
      return insights;
    }

    const highConfidencePatterns = patterns.filter(p => p.confidence >= this.config.confidenceThreshold);
    if (highConfidencePatterns.length > 0) {
      insights.push(`检测到${highConfidencePatterns.length}个高置信度模式`);
    }

    const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
    if (totalFrequency > 50) {
      insights.push('用户使用频率较高，建议优化响应速度');
    }

    return insights;
  }

  private calculateOverallConfidence(patterns: Array<any>): number {
    if (patterns.length === 0) return 0;

    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const frequencyFactor = Math.min(1, patterns.length / 10);

    return (avgConfidence * 0.7 + frequencyFactor * 0.3);
  }

  private updatePatternStore(patterns: Array<any>): void {
    for (const pattern of patterns) {
      const patternId = `${pattern.type}-${JSON.stringify(pattern.content)}`;
      const existing = this.patterns.get(patternId);

      if (existing) {
        existing.frequency += pattern.frequency;
        existing.confidence = Math.min(1, existing.confidence * 0.9 + pattern.confidence * 0.1);
        existing.lastSeen = new Date();
      } else {
        this.patterns.set(patternId, {
          id: patternId,
          type: pattern.type,
          content: pattern.content,
          frequency: pattern.frequency,
          confidence: pattern.confidence,
          lastSeen: new Date()
        });
      }
    }

    if (this.patterns.size > this.config.maxPatterns) {
      this.clearOldPatterns();
    }
  }
}

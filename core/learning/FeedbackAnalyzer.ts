/**
 * @file 反馈分析器
 * @description 分析用户反馈，为学习系统提供改进建议
 * @module learning/FeedbackAnalyzer
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 */

import { UserFeedback } from '../autonomous-ai-widget/types';

export interface FeedbackAnalysis {
  id: string;
  feedback: UserFeedback;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyIssues: string[];
  suggestedImprovements: string[];
  preferenceUpdates: Record<string, any>;
  confidence: number;
  analyzedAt: Date;
}

export interface FeedbackConfig {
  sentimentThreshold: {
    positive: number;
    negative: number;
  };
  minConfidence: number;
  maxSuggestions: number;
}

export class FeedbackAnalyzer {
  private config: FeedbackConfig;
  private analysisHistory: FeedbackAnalysis[] = [];
  private feedbackPatterns: Map<string, number> = new Map();

  constructor(config?: Partial<FeedbackConfig>) {
    this.config = {
      sentimentThreshold: {
        positive: 4,
        negative: 2
      },
      minConfidence: 0.6,
      maxSuggestions: 5,
      ...config
    };
  }

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

  async analyzeBatch(feedbacks: UserFeedback[]): Promise<FeedbackAnalysis[]> {
    const analyses: FeedbackAnalysis[] = [];

    for (const feedback of feedbacks) {
      const analysis = await this.analyze(feedback);
      analyses.push(analysis);
    }

    return analyses;
  }

  getAnalysisHistory(): FeedbackAnalysis[] {
    return this.analysisHistory;
  }

  getFeedbackPatterns(): Map<string, number> {
    return new Map(this.feedbackPatterns);
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

  getCommonIssues(threshold: number = 3): Array<{ issue: string; frequency: number }> {
    const issueFrequency: Record<string, number> = {};

    for (const analysis of this.analysisHistory) {
      for (const issue of analysis.keyIssues) {
        issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
      }
    }

    return Object.entries(issueFrequency)
      .filter(([_, frequency]) => frequency >= threshold)
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  getAverageRating(): number {
    if (this.analysisHistory.length === 0) return 0;

    const totalRating = this.analysisHistory.reduce(
      (sum, analysis) => sum + analysis.feedback.rating,
      0
    );

    return totalRating / this.analysisHistory.length;
  }

  clearOldHistory(days: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.analysisHistory = this.analysisHistory.filter(
      analysis => analysis.analyzedAt >= cutoffDate
    );
  }

  private determineSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
    if (rating >= this.config.sentimentThreshold.positive) {
      return 'positive';
    } else if (rating <= this.config.sentimentThreshold.negative) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  private identifyKeyIssues(feedback: UserFeedback): string[] {
    const issues: string[] = [];

    if (feedback.rating <= this.config.sentimentThreshold.negative) {
      issues.push('用户满意度较低');
    }

    if (feedback.comment) {
      const comment = feedback.comment.toLowerCase();

      if (comment.includes('慢') || comment.includes('延迟') || comment.includes('等待')) {
        issues.push('响应速度慢');
      }

      if (comment.includes('不准确') || comment.includes('错误') || comment.includes('不对')) {
        issues.push('回答不准确');
      }

      if (comment.includes('复杂') || comment.includes('难懂') || comment.includes('不清楚')) {
        issues.push('回答过于复杂');
      }

      if (comment.includes('不相关') || comment.includes('偏题') || comment.includes('没回答')) {
        issues.push('回答不相关');
      }

      if (comment.includes('重复') || comment.includes('一样') || comment.includes('没变化')) {
        issues.push('回答重复');
      }
    }

    if (feedback.improvementSuggestions && feedback.improvementSuggestions.length > 0) {
      issues.push('用户有明确的改进建议');
    }

    return issues;
  }

  private generateSuggestions(feedback: UserFeedback): string[] {
    const suggestions: string[] = [];

    if (feedback.rating <= this.config.sentimentThreshold.negative) {
      suggestions.push('需要改进回答质量');
      suggestions.push('提高响应速度');
    }

    if (feedback.comment) {
      const comment = feedback.comment.toLowerCase();

      if (comment.includes('慢') || comment.includes('延迟')) {
        suggestions.push('优化模型推理速度');
        suggestions.push('考虑使用更快的模型');
      }

      if (comment.includes('不准确') || comment.includes('错误')) {
        suggestions.push('改进提示词工程');
        suggestions.push('增加上下文信息');
      }

      if (comment.includes('复杂') || comment.includes('难懂')) {
        suggestions.push('简化回答语言');
        suggestions.push('提供更多示例');
      }

      if (comment.includes('不相关') || comment.includes('偏题')) {
        suggestions.push('改进问题理解能力');
        suggestions.push('增加意图识别');
      }
    }

    if (feedback.improvementSuggestions) {
      suggestions.push(...feedback.improvementSuggestions);
    }

    return suggestions.slice(0, this.config.maxSuggestions);
  }

  private extractPreferenceUpdates(feedback: UserFeedback): Record<string, any> {
    const updates: Record<string, any> = {};

    if (feedback.rating >= this.config.sentimentThreshold.positive) {
      updates.preferredStyle = 'current';
    } else if (feedback.rating <= this.config.sentimentThreshold.negative) {
      updates.preferredStyle = 'different';
    }

    if (feedback.comment) {
      const comment = feedback.comment.toLowerCase();

      if (comment.includes('详细') || comment.includes('更多')) {
        updates.detailLevel = 'high';
      } else if (comment.includes('简洁') || comment.includes('简短')) {
        updates.detailLevel = 'low';
      }

      if (comment.includes('技术') || comment.includes('代码')) {
        updates.preferredTone = 'technical';
      } else if (comment.includes('简单') || comment.includes('易懂')) {
        updates.preferredTone = 'simple';
      }
    }

    return updates;
  }

  private calculateConfidence(feedback: UserFeedback): number {
    let confidence = 0.5;

    if (feedback.comment && feedback.comment.length > 10) {
      confidence += 0.2;
    }

    if (feedback.improvementSuggestions && feedback.improvementSuggestions.length > 0) {
      confidence += 0.2;
    }

    if (feedback.rating >= 1 && feedback.rating <= 5) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  private updateFeedbackPatterns(analysis: FeedbackAnalysis): void {
    for (const issue of analysis.keyIssues) {
      this.feedbackPatterns.set(issue, (this.feedbackPatterns.get(issue) || 0) + 1);
    }
  }
}

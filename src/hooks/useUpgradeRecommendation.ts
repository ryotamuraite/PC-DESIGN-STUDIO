// src/hooks/useUpgradeRecommendation.ts
// Phase 3: アップグレード診断・推奨機能用Reactフック

import { useState, useCallback, useRef } from 'react';
import { upgradeAnalyzer } from '../services/upgradeAnalyzer';
import {
  CurrentPCConfiguration,
  BottleneckAnalysis,
  UpgradeRecommendation,
  UpgradeServiceConfig
} from '../types/upgrade';

// ===========================================
// 🎯 フック型定義
// ===========================================

export interface UseUpgradeRecommendationState {
  // 診断状態
  isAnalyzing: boolean;
  isGeneratingRecommendations: boolean;
  
  // データ
  currentAnalysis: BottleneckAnalysis | null;
  recommendations: UpgradeRecommendation[];
  
  // エラー・進捗
  error: string | null;
  progress: number; // 0-100
  
  // 履歴
  analysisHistory: BottleneckAnalysis[];
  
  // パフォーマンス統計
  performance: {
    lastAnalysisTime: number;
    averageAnalysisTime: number;
    totalAnalyses: number;
  };
}

export interface UseUpgradeRecommendationActions {
  // メイン機能
  analyzePC: (config: CurrentPCConfiguration) => Promise<BottleneckAnalysis>;
  generateRecommendations: (analysis: BottleneckAnalysis) => Promise<UpgradeRecommendation[]>;
  
  // 状態管理
  clearAnalysis: () => void;
  clearError: () => void;
  
  // 履歴管理
  getAnalysisHistory: () => BottleneckAnalysis[];
  clearHistory: () => void;
  
  // キャッシュ管理
  clearCache: () => void;
  getCacheStats: () => { hit: number; miss: number; size: number };
}

export interface UseUpgradeRecommendationOptions {
  // 設定
  config?: Partial<UpgradeServiceConfig>;
  
  // キャッシュ設定
  enableCache?: boolean;
  cacheTimeout?: number; // ms
  
  // 自動推奨生成
  autoGenerateRecommendations?: boolean;
  
  // デバッグ
  enableDebugLogging?: boolean;
}

// ===========================================
// 🚀 メインフック実装
// ===========================================

export const useUpgradeRecommendation = (
  options: UseUpgradeRecommendationOptions = {}
): [UseUpgradeRecommendationState, UseUpgradeRecommendationActions] => {
  
  // オプション設定
  const {
    enableCache = true,
    cacheTimeout = 5 * 60 * 1000, // 5分
    autoGenerateRecommendations = true,
    enableDebugLogging = false
  } = options;

  // ===========================================
  // 📊 ステート管理
  // ===========================================

  const [state, setState] = useState<UseUpgradeRecommendationState>({
    isAnalyzing: false,
    isGeneratingRecommendations: false,
    currentAnalysis: null,
    recommendations: [],
    error: null,
    progress: 0,
    analysisHistory: [],
    performance: {
      lastAnalysisTime: 0,
      averageAnalysisTime: 0,
      totalAnalyses: 0
    }
  });

  // キャッシュ（ref使用で再レンダリング回避）
  const analysisCache = useRef<Map<string, {
    analysis: BottleneckAnalysis;
    timestamp: number;
  }>>(new Map());

  const recommendationCache = useRef<Map<string, {
    recommendations: UpgradeRecommendation[];
    timestamp: number;
  }>>(new Map());

  const cacheStats = useRef({ hit: 0, miss: 0 });

  // ===========================================
  // 🔧 ヘルパー関数
  // ===========================================

  const log = useCallback((message: string, ...args: unknown[]) => {
    if (enableDebugLogging) {
      console.log(`[useUpgradeRecommendation] ${message}`, ...args);
    }
  }, [enableDebugLogging]);

  const updateState = useCallback((updates: Partial<UseUpgradeRecommendationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const generateCacheKey = useCallback((config: CurrentPCConfiguration): string => {
    // PC構成の主要要素からキャッシュキーを生成
    const keyData = {
      name: config.name,
      parts: Object.entries(config.currentParts).map(([key, part]) => ({
        type: key,
        id: Array.isArray(part) ? part.map(p => p?.id).join(',') : part?.id || 'null'
      })),
      usage: config.pcInfo.usage,
      condition: config.pcInfo.condition
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }, []);

  const isValidCache = useCallback((timestamp: number): boolean => {
    return enableCache && (Date.now() - timestamp) < cacheTimeout;
  }, [enableCache, cacheTimeout]);

  // ===========================================
  // 🔍 メイン診断機能
  // ===========================================

  // ===========================================
  // 📋 推奨生成機能（analyzePCより前に定義）
  // ===========================================

  const generateRecommendations = useCallback(async (analysis: BottleneckAnalysis): Promise<UpgradeRecommendation[]> => {
    try {
      log('推奨生成開始', analysis.overallScore);
      
      updateState({
        isGeneratingRecommendations: true,
        error: null
      });

      // キャッシュチェック
      const cacheKey = `rec_${analysis.diagnosisDate.getTime()}_${analysis.overallScore}`;
      const cached = recommendationCache.current.get(cacheKey);
      
      if (cached && isValidCache(cached.timestamp)) {
        log('推奨キャッシュヒット', cacheKey);
        
        updateState({
          isGeneratingRecommendations: false,
          recommendations: cached.recommendations
        });
        
        return cached.recommendations;
      }

      // 推奨生成ロジック（簡易実装）
      const recommendations = await generateRecommendationsFromAnalysis(analysis);

      // キャッシュ保存
      if (enableCache) {
        recommendationCache.current.set(cacheKey, {
          recommendations,
          timestamp: Date.now()
        });
      }

      updateState({
        isGeneratingRecommendations: false,
        recommendations
      });

      log('推奨生成完了', recommendations.length);
      
      return recommendations;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '推奨生成に失敗しました';
      
      log('推奨生成エラー', errorMessage);
      
      updateState({
        isGeneratingRecommendations: false,
        error: errorMessage
      });
      
      throw error;
    }

  }, [enableCache, isValidCache, log, updateState]);

  const analyzePC = useCallback(async (config: CurrentPCConfiguration): Promise<BottleneckAnalysis> => {
    const startTime = Date.now();
    
    try {
      log('PC診断開始', config.name);
      
      // バリデーション
      if (!config.name || !config.currentParts) {
        throw new Error('無効なPC構成データです');
      }

      updateState({
        isAnalyzing: true,
        error: null,
        progress: 10
      });

      // キャッシュチェック
      const cacheKey = generateCacheKey(config);
      const cached = analysisCache.current.get(cacheKey);
      
      if (cached && isValidCache(cached.timestamp)) {
        log('キャッシュヒット', cacheKey);
        cacheStats.current.hit++;
        
        updateState({
          isAnalyzing: false,
          currentAnalysis: cached.analysis,
          progress: 100
        });
        
        // 自動推奨生成
        if (autoGenerateRecommendations) {
          await generateRecommendations(cached.analysis);
        }
        
        return cached.analysis;
      }

      cacheStats.current.miss++;
      log('分析実行', cacheKey);

      // 進捗更新
      updateState({ progress: 30 });

      // 実際の分析実行
      const analysis = await upgradeAnalyzer.analyzeCurrentPC(config);
      
      updateState({ progress: 80 });

      // キャッシュ保存
      if (enableCache) {
        analysisCache.current.set(cacheKey, {
          analysis,
          timestamp: Date.now()
        });
      }

      // パフォーマンス統計更新
      const analysisTime = Date.now() - startTime;
      const newTotalAnalyses = state.performance.totalAnalyses + 1;
      const newAverageTime = (
        (state.performance.averageAnalysisTime * state.performance.totalAnalyses) + analysisTime
      ) / newTotalAnalyses;

      // ステート更新
      updateState({
        isAnalyzing: false,
        currentAnalysis: analysis,
        progress: 100,
        analysisHistory: [...state.analysisHistory, analysis].slice(-10), // 最新10件のみ保持
        performance: {
          lastAnalysisTime: analysisTime,
          averageAnalysisTime: newAverageTime,
          totalAnalyses: newTotalAnalyses
        }
      });

      // 自動推奨生成
      if (autoGenerateRecommendations) {
        await generateRecommendations(analysis);
      }

      log('PC診断完了', {
        score: analysis.overallScore,
        bottlenecks: analysis.bottlenecks.length,
        time: analysisTime
      });

      return analysis;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '診断処理に失敗しました';
      
      log('診断エラー', errorMessage);
      
      updateState({
        isAnalyzing: false,
        error: errorMessage,
        progress: 0
      });
      
      throw error;
    }
  }, [
    generateCacheKey,
    isValidCache,
    enableCache,
    autoGenerateRecommendations,
    generateRecommendations,
    log,
    updateState,
    state.performance,
    state.analysisHistory
  ]);



  // ===========================================
  // 🗂️ ユーティリティ機能
  // ===========================================

  const clearAnalysis = useCallback(() => {
    log('分析データクリア');
    updateState({
      currentAnalysis: null,
      recommendations: [],
      error: null,
      progress: 0
    });
  }, [log, updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const getAnalysisHistory = useCallback(() => {
    return state.analysisHistory;
  }, [state.analysisHistory]);

  const clearHistory = useCallback(() => {
    log('履歴クリア');
    updateState({ analysisHistory: [] });
  }, [log, updateState]);

  const clearCache = useCallback(() => {
    log('キャッシュクリア');
    analysisCache.current.clear();
    recommendationCache.current.clear();
    cacheStats.current = { hit: 0, miss: 0 };
  }, [log]);

  const getCacheStats = useCallback(() => {
    return {
      hit: cacheStats.current.hit,
      miss: cacheStats.current.miss,
      size: analysisCache.current.size + recommendationCache.current.size
    };
  }, []);

  // ===========================================
  // 📤 戻り値
  // ===========================================

  const actions: UseUpgradeRecommendationActions = {
    analyzePC,
    generateRecommendations,
    clearAnalysis,
    clearError,
    getAnalysisHistory,
    clearHistory,
    clearCache,
    getCacheStats
  };

  return [state, actions];
};

// ===========================================
// 🛠️ 内部ヘルパー関数
// ===========================================

/**
 * ボトルネック分析から推奨プランを生成
 */
async function generateRecommendationsFromAnalysis(
  analysis: BottleneckAnalysis
): Promise<UpgradeRecommendation[]> {
  
  const recommendations: UpgradeRecommendation[] = [];
  
  // 緊急度順にボトルネックを分析
  const criticalBottlenecks = analysis.bottlenecks.filter(b => b.severity === 'critical');
  const majorBottlenecks = analysis.bottlenecks.filter(b => b.severity === 'major');

  // 1. 緊急対応プラン（critical）
  if (criticalBottlenecks.length > 0) {
    recommendations.push({
      id: `urgent-${Date.now()}`,
      name: '🚨 緊急対応プラン',
      description: '重大なボトルネックの即座解決',
      type: 'immediate',
      totalCost: criticalBottlenecks.reduce((sum, b) => sum + b.costEstimate, 0),
      timeframe: '即座に実行推奨',
      difficultyLevel: 'moderate',
      phases: criticalBottlenecks.map((bottleneck, index) => ({
        phase: index + 1,
        name: `${bottleneck.type}ボトルネック解決`,
        description: bottleneck.recommendedSolution,
        partsToReplace: [], // 実装簡略化
        estimatedCost: bottleneck.costEstimate,
        estimatedTime: 60,
        difficulty: bottleneck.difficultyLevel,
        phaseImprovement: {
          performance: bottleneck.improvementPotential,
          powerEfficiency: 0,
          stability: 20
        },
        prerequisites: [],
        dependencies: [],
        warnings: ['作業前にデータバックアップを必ず実行してください'],
        recommendations: [bottleneck.recommendedSolution]
      })),
      expectedImprovement: {
        performanceGain: Math.max(...criticalBottlenecks.map(b => b.improvementPotential)),
        valueGain: 30,
        longevityExtension: 12,
        powerEfficiencyGain: 5
      },
      roi: {
        costPerformanceRatio: 0.8,
        paybackPeriod: 6,
        totalSavings: 50000,
        valueRetention: 0.7
      },
      risks: criticalBottlenecks.map(b => ({
        type: 'compatibility',
        severity: 'medium',
        description: `${b.type}アップグレード時の互換性リスク`,
        mitigation: '事前互換性チェック実施',
        probability: 20,
        impact: 30
      })),
      generatedAt: new Date(),
      confidence: 0.9,
      priority: 95
    });
  }

  // 2. バランス改善プラン（major）
  if (majorBottlenecks.length > 0) {
    recommendations.push({
      id: `balanced-${Date.now()}`,
      name: '⚖️ バランス改善プラン',
      description: '段階的な性能バランス最適化',
      type: 'phased',
      totalCost: majorBottlenecks.reduce((sum, b) => sum + b.costEstimate, 0),
      timeframe: '3-6ヶ月での段階実行',
      difficultyLevel: 'moderate',
      phases: majorBottlenecks.map((bottleneck, index) => ({
        phase: index + 1,
        name: `段階${index + 1}: ${bottleneck.type}強化`,
        description: bottleneck.recommendedSolution,
        partsToReplace: [],
        estimatedCost: bottleneck.costEstimate,
        estimatedTime: 90,
        difficulty: bottleneck.difficultyLevel,
        phaseImprovement: {
          performance: bottleneck.improvementPotential * 0.8,
          powerEfficiency: 10,
          stability: 15
        },
        prerequisites: [],
        dependencies: index > 0 ? [index] : [],
        warnings: [],
        recommendations: [bottleneck.recommendedSolution]
      })),
      expectedImprovement: {
        performanceGain: majorBottlenecks.reduce((sum, b) => sum + b.improvementPotential, 0) / majorBottlenecks.length,
        valueGain: 50,
        longevityExtension: 24,
        powerEfficiencyGain: 15
      },
      roi: {
        costPerformanceRatio: 1.2,
        paybackPeriod: 12,
        totalSavings: 80000,
        valueRetention: 0.8
      },
      risks: [{
        type: 'performance',
        severity: 'low',
        description: '期待した性能向上が得られない可能性',
        mitigation: '段階的実行により途中評価・調整可能',
        probability: 15,
        impact: 20
      }],
      generatedAt: new Date(),
      confidence: 0.8,
      priority: 70
    });
  }

  // 3. 予算重視プラン
  if (analysis.overallScore < 70) {
    const lowCostBottlenecks = analysis.bottlenecks
      .filter(b => b.costEstimate < 30000)
      .sort((a, b) => b.improvementPotential - a.improvementPotential);

    if (lowCostBottlenecks.length > 0) {
      recommendations.push({
        id: `budget-${Date.now()}`,
        name: '💰 予算重視プラン',
        description: '低コストで最大効果を狙う最適化',
        type: 'budget',
        totalCost: lowCostBottlenecks.reduce((sum, b) => sum + b.costEstimate, 0),
        timeframe: '予算に応じて柔軟実行',
        difficultyLevel: 'easy',
        phases: lowCostBottlenecks.slice(0, 3).map((bottleneck, index) => ({
          phase: index + 1,
          name: `コスパ最優先: ${bottleneck.type}`,
          description: `低コストで${bottleneck.type}問題を解決`,
          partsToReplace: [],
          estimatedCost: bottleneck.costEstimate,
          estimatedTime: 45,
          difficulty: 'easy',
          phaseImprovement: {
            performance: bottleneck.improvementPotential,
            powerEfficiency: 5,
            stability: 10
          },
          prerequisites: [],
          dependencies: [],
          warnings: [],
          recommendations: [bottleneck.recommendedSolution]
        })),
        expectedImprovement: {
          performanceGain: Math.max(...lowCostBottlenecks.slice(0, 3).map(b => b.improvementPotential)),
          valueGain: 80,
          longevityExtension: 12,
          powerEfficiencyGain: 5
        },
        roi: {
          costPerformanceRatio: 2.0,
          paybackPeriod: 4,
          totalSavings: 100000,
          valueRetention: 0.6
        },
        risks: [{
          type: 'performance',
          severity: 'low',
          description: '長期的な拡張性に制限',
          mitigation: '将来的なアップグレード計画立案',
          probability: 10,
          impact: 15
        }],
        generatedAt: new Date(),
        confidence: 0.75,
        priority: 60
      });
    }
  }

  // 優先度順でソート
  return recommendations.sort((a, b) => b.priority - a.priority);
}

// ===========================================
// 🎯 エクスポート
// ===========================================

export default useUpgradeRecommendation;
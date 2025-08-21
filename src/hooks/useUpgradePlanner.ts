// src/hooks/useUpgradePlanner.ts
// Phase 3 Week2: アップグレードプランナー専用Reactフック

import { useState, useCallback, useRef } from 'react';
import {
  BottleneckAnalysis,
  UpgradeRecommendation,
  UpgradeSimulationConfig,
  UpgradeSimulationResult,
  UsageScenario,
  PerformanceTarget
} from '../types/upgrade';

// ===========================================
// 🎯 フック型定義
// ===========================================

export interface UpgradePlannerState {
  // プラン管理
  availablePlans: UpgradeRecommendation[];
  selectedPlan: UpgradeRecommendation | null;
  customPlan: UpgradeRecommendation | null;
  
  // プラン比較
  comparisonPlans: UpgradeRecommendation[];
  comparisonResult: ComparisonResult | null;
  
  // カスタムプラン生成
  isGeneratingCustom: boolean;
  customPlanConfig: CustomPlanConfig;
  
  // シミュレーション
  isSimulating: boolean;
  simulationResult: UpgradeSimulationResult | null;
  
  // 状態管理
  loading: boolean;
  error: string | null;
  
  // プラン実行追跡
  executionPlans: ExecutionPlan[];
  activeExecution: ExecutionPlan | null;
  
  // 統計・分析
  plannerStats: PlannerStatistics;
}

export interface UpgradePlannerActions {
  // プラン管理
  loadPlans: (analysis: BottleneckAnalysis) => Promise<void>;
  selectPlan: (plan: UpgradeRecommendation) => void;
  clearSelection: () => void;
  
  // プラン比較
  addToComparison: (plan: UpgradeRecommendation) => void;
  removeFromComparison: (planId: string) => void;
  clearComparison: () => void;
  runComparison: () => Promise<ComparisonResult>;
  
  // カスタムプラン
  updateCustomConfig: (config: Partial<CustomPlanConfig>) => void;
  generateCustomPlan: (analysis: BottleneckAnalysis) => Promise<UpgradeRecommendation>;
  
  // シミュレーション
  runSimulation: (config: UpgradeSimulationConfig) => Promise<UpgradeSimulationResult>;
  
  // プラン実行
  startExecution: (plan: UpgradeRecommendation) => ExecutionPlan;
  updateExecutionProgress: (executionId: string, progress: Partial<ExecutionProgress>) => void;
  completeExecution: (executionId: string, result: ExecutionResult) => void;
  
  // 最適化
  optimizePlan: (plan: UpgradeRecommendation, constraints: OptimizationConstraints) => Promise<UpgradeRecommendation>;
  
  // エクスポート・インポート
  exportPlan: (plan: UpgradeRecommendation, format: 'json' | 'csv' | 'pdf') => string;
  importPlan: (data: string, format: 'json' | 'csv') => UpgradeRecommendation;
  
  // ユーティリティ
  clearError: () => void;
  resetPlanner: () => void;
  getStatistics: () => PlannerStatistics;
}

// カスタムプラン設定
export interface CustomPlanConfig {
  budget: {
    min: number;
    max: number;
    preferred: number;
    flexibility: number; // 0-1
  };
  timeframe: {
    immediate: boolean;
    preferredDuration: number; // 月数
    maxDuration: number;
    phaseInterval: number; // フェーズ間隔（月）
  };
  priority: {
    performance: number; // 0-100 重み
    budget: number;
    efficiency: number;
    longevity: number;
    aesthetics: number;
  };
  constraints: {
    maxComplexity: 'simple' | 'moderate' | 'advanced' | 'expert';
    keepParts: string[]; // 維持したいパーツID
    mustReplaceParts: string[]; // 必須交換パーツID
    avoidManufacturers: string[];
    preferredManufacturers: string[];
  };
  scenarios: UsageScenario[];
  targets: PerformanceTarget[];
}

// プラン比較結果
export interface ComparisonResult {
  plans: UpgradeRecommendation[];
  metrics: ComparisonMetric[];
  ranking: PlanRanking[];
  tradeoffs: TradeoffAnalysis[];
  recommendation: string;
  confidence: number;
}

// 比較指標
export interface ComparisonMetric {
  name: string;
  key: string;
  values: { planId: string; value: number; rank: number }[];
  winner: string; // planId
  importance: number; // 0-1
}

// プランランキング
export interface PlanRanking {
  planId: string;
  overallScore: number;
  categoryScores: {
    cost: number;
    performance: number;
    roi: number;
    feasibility: number;
    risk: number;
  };
  reasoning: string[];
}

// トレードオフ分析
export interface TradeoffAnalysis {
  aspect1: string;
  aspect2: string;
  correlation: number; // -1 to 1
  description: string;
  recommendations: string[];
}

// プラン実行追跡
export interface ExecutionPlan {
  id: string;
  planId: string;
  plan: UpgradeRecommendation;
  startDate: Date;
  currentPhase: number;
  status: 'planning' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  progress: ExecutionProgress;
  timeline: ExecutionTimeline[];
  issues: ExecutionIssue[];
  notes: string[];
}

export interface ExecutionProgress {
  overallProgress: number; // 0-100
  phaseProgress: number; // 0-100
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  timeline: {
    estimatedCompletion: Date;
    actualCompletion?: Date;
    delayDays: number;
  };
  quality: {
    issuesCount: number;
    satisfactionScore: number; // 0-100
  };
}

export interface ExecutionTimeline {
  phase: number;
  phaseName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startDate?: Date;
  completionDate?: Date;
  actualCost?: number;
  notes?: string;
}

export interface ExecutionIssue {
  id: string;
  type: 'compatibility' | 'installation' | 'performance' | 'cost' | 'delay';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution?: string;
  resolved: boolean;
  reportedAt: Date;
  resolvedAt?: Date;
}

export interface ExecutionResult {
  success: boolean;
  actualImprovement: {
    performance: number;
    efficiency: number;
    userSatisfaction: number;
  };
  actualCost: number;
  actualDuration: number; // 日数
  lessonsLearned: string[];
  recommendations: string[];
}

// 最適化制約
export interface OptimizationConstraints {
  maxBudget?: number;
  maxDuration?: number; // 月数
  maxComplexity?: string;
  minImprovement?: number; // %
  riskTolerance: 'low' | 'medium' | 'high';
}

// プランナー統計
export interface PlannerStatistics {
  totalPlansGenerated: number;
  avgPlanCost: number;
  avgImprovement: number;
  popularPlanTypes: { type: string; count: number }[];
  userPreferences: {
    avgBudget: number;
    preferredTimeframe: string;
    topPriorities: string[];
  };
  successRates: {
    planCompletion: number; // %
    budgetAdherence: number; // %
    timelineAdherence: number; // %
    userSatisfaction: number; // 0-100
  };
  performance: {
    avgGenerationTime: number; // ms
    cacheHitRate: number; // %
  };
}

// ===========================================
// 🚀 メインフック実装
// ===========================================

export const useUpgradePlanner = (): [UpgradePlannerState, UpgradePlannerActions] => {
  
  // ===========================================
  // 📊 ステート管理
  // ===========================================
  
  const [state, setState] = useState<UpgradePlannerState>({
    availablePlans: [],
    selectedPlan: null,
    customPlan: null,
    comparisonPlans: [],
    comparisonResult: null,
    isGeneratingCustom: false,
    customPlanConfig: {
      budget: {
        min: 30000,
        max: 500000,
        preferred: 100000,
        flexibility: 0.2
      },
      timeframe: {
        immediate: false,
        preferredDuration: 6,
        maxDuration: 12,
        phaseInterval: 2
      },
      priority: {
        performance: 40,
        budget: 30,
        efficiency: 15,
        longevity: 10,
        aesthetics: 5
      },
      constraints: {
        maxComplexity: 'moderate',
        keepParts: [],
        mustReplaceParts: [],
        avoidManufacturers: [],
        preferredManufacturers: []
      },
      scenarios: [],
      targets: []
    },
    isSimulating: false,
    simulationResult: null,
    loading: false,
    error: null,
    executionPlans: [],
    activeExecution: null,
    plannerStats: {
      totalPlansGenerated: 0,
      avgPlanCost: 0,
      avgImprovement: 0,
      popularPlanTypes: [],
      userPreferences: {
        avgBudget: 100000,
        preferredTimeframe: '3-6months',
        topPriorities: ['performance', 'budget']
      },
      successRates: {
        planCompletion: 0,
        budgetAdherence: 0,
        timelineAdherence: 0,
        userSatisfaction: 0
      },
      performance: {
        avgGenerationTime: 0,
        cacheHitRate: 0
      }
    }
  });
  
  // キャッシュとパフォーマンス管理
  const planCache = useRef<Map<string, UpgradeRecommendation[]>>(new Map());
  const comparisonCache = useRef<Map<string, ComparisonResult>>(new Map());
  const performanceMetrics = useRef({
    generationTimes: [] as number[],
    cacheHits: 0,
    cacheMisses: 0
  });

  // ===========================================
  // 🔧 ヘルパー関数
  // ===========================================

  const updateState = useCallback((updates: Partial<UpgradePlannerState> | ((prev: UpgradePlannerState) => Partial<UpgradePlannerState>)) => {
    if (typeof updates === 'function') {
      setState(prev => ({ ...prev, ...updates(prev) }));
    } else {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const logPerformance = useCallback((operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    performanceMetrics.current.generationTimes.push(duration);
    
    // 最新100件のみ保持
    if (performanceMetrics.current.generationTimes.length > 100) {
      performanceMetrics.current.generationTimes.shift();
    }
    
    console.log(`[UpgradePlanner] ${operation}: ${duration}ms`);
  }, []);

  const generateCacheKey = useCallback((analysis: BottleneckAnalysis, config?: any): string => {
    const keyData = {
      score: analysis.overallScore,
      bottlenecks: analysis.bottlenecks.length,
      config: config ? JSON.stringify(config) : null
    };
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }, []);

  // ===========================================
  // 📋 プラン管理機能
  // ===========================================

  const loadPlans = useCallback(async (analysis: BottleneckAnalysis): Promise<void> => {
    const startTime = Date.now();
    
    try {
      updateState({ loading: true, error: null });
      
      // キャッシュチェック
      const cacheKey = generateCacheKey(analysis);
      const cached = planCache.current.get(cacheKey);
      
      if (cached) {
        performanceMetrics.current.cacheHits++;
        updateState({ 
          availablePlans: cached,
          selectedPlan: cached[0] || null,
          loading: false 
        });
        logPerformance('loadPlans (cached)', startTime);
        return;
      }
      
      performanceMetrics.current.cacheMisses++;
      
      // プラン生成（既存のupgradeAnalyzerを活用）
      const plans = await generatePlansFromAnalysis(analysis);
      
      // キャッシュ保存
      planCache.current.set(cacheKey, plans);
      
      updateState({
        availablePlans: plans,
        selectedPlan: plans[0] || null,
        loading: false
      });
      
      logPerformance('loadPlans', startTime);
      
    } catch (error) {
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'プラン読み込みに失敗しました'
      });
    }
  }, [generateCacheKey, updateState, logPerformance]);

  const selectPlan = useCallback((plan: UpgradeRecommendation) => {
    updateState({ selectedPlan: plan });
  }, [updateState]);

  const clearSelection = useCallback(() => {
    updateState({ selectedPlan: null });
  }, [updateState]);

  // ===========================================
  // ⚖️ プラン比較機能
  // ===========================================

  const addToComparison = useCallback((plan: UpgradeRecommendation) => {
    updateState((prev: UpgradePlannerState) => ({
      comparisonPlans: [...prev.comparisonPlans.filter(p => p.id !== plan.id), plan].slice(0, 3)
    }));
  }, [updateState]);

  const removeFromComparison = useCallback((planId: string) => {
    updateState((prev: UpgradePlannerState) => ({
      comparisonPlans: prev.comparisonPlans.filter(p => p.id !== planId)
    }));
  }, [updateState]);

  const clearComparison = useCallback(() => {
    updateState({ comparisonPlans: [], comparisonResult: null });
  }, [updateState]);

  const runComparison = useCallback(async (): Promise<ComparisonResult> => {
    const startTime = Date.now();
    
    try {
      const { comparisonPlans } = state;
      
      if (comparisonPlans.length < 2) {
        throw new Error('比較には最低2つのプランが必要です');
      }
      
      // キャッシュチェック
      const cacheKey = comparisonPlans.map(p => p.id).sort().join('_');
      const cached = comparisonCache.current.get(cacheKey);
      
      if (cached) {
        updateState({ comparisonResult: cached });
        logPerformance('runComparison (cached)', startTime);
        return cached;
      }
      
      // 比較分析実行
      const result = await performPlanComparison(comparisonPlans);
      
      // キャッシュ保存
      comparisonCache.current.set(cacheKey, result);
      
      updateState({ comparisonResult: result });
      
      logPerformance('runComparison', startTime);
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '比較分析に失敗しました';
      updateState({ error: errorMessage });
      throw error;
    }
  }, [state, updateState, logPerformance]);

  // ===========================================
  // 🎛️ カスタムプラン機能
  // ===========================================

  const updateCustomConfig = useCallback((config: Partial<CustomPlanConfig>) => {
    updateState((prev: UpgradePlannerState) => ({
      customPlanConfig: { ...prev.customPlanConfig, ...config }
    }));
  }, [updateState]);

  const generateCustomPlan = useCallback(async (analysis: BottleneckAnalysis): Promise<UpgradeRecommendation> => {
    const startTime = Date.now();
    
    try {
      updateState({ isGeneratingCustom: true, error: null });
      
      const { customPlanConfig } = state;
      
      // カスタムプラン生成ロジック
      const customPlan = await createCustomPlan(analysis, customPlanConfig);
      
      updateState({
        isGeneratingCustom: false,
        customPlan,
        selectedPlan: customPlan
      });
      
      logPerformance('generateCustomPlan', startTime);
      
      return customPlan;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'カスタムプラン生成に失敗しました';
      updateState({
        isGeneratingCustom: false,
        error: errorMessage
      });
      throw error;
    }
  }, [state, updateState, logPerformance]);

  // ===========================================
  // 🎯 プラン実行追跡
  // ===========================================

  const startExecution = useCallback((plan: UpgradeRecommendation): ExecutionPlan => {
    const executionPlan: ExecutionPlan = {
      id: `exec_${Date.now()}`,
      planId: plan.id,
      plan,
      startDate: new Date(),
      currentPhase: 0,
      status: 'planning',
      progress: {
        overallProgress: 0,
        phaseProgress: 0,
        budget: {
          allocated: plan.totalCost,
          spent: 0,
          remaining: plan.totalCost
        },
        timeline: {
          estimatedCompletion: new Date(Date.now() + (plan.phases.length * 30 * 24 * 60 * 60 * 1000)), // 月数を概算
          delayDays: 0
        },
        quality: {
          issuesCount: 0,
          satisfactionScore: 0
        }
      },
      timeline: plan.phases.map((phase, index) => ({
        phase: index + 1,
        phaseName: phase.name,
        status: 'pending'
      })),
      issues: [],
      notes: []
    };
    
    updateState((prev: UpgradePlannerState) => ({
      executionPlans: [...prev.executionPlans, executionPlan],
      activeExecution: executionPlan
    }));
    
    return executionPlan;
  }, [updateState]);

  // ===========================================
  // 🛠️ ユーティリティ機能
  // ===========================================

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const resetPlanner = useCallback(() => {
    setState({
      availablePlans: [],
      selectedPlan: null,
      customPlan: null,
      comparisonPlans: [],
      comparisonResult: null,
      isGeneratingCustom: false,
      customPlanConfig: state.customPlanConfig, // 設定は保持
      isSimulating: false,
      simulationResult: null,
      loading: false,
      error: null,
      executionPlans: [],
      activeExecution: null,
      plannerStats: state.plannerStats // 統計は保持
    });
    
    // キャッシュクリア
    planCache.current.clear();
    comparisonCache.current.clear();
  }, [state.customPlanConfig, state.plannerStats]);

  const getStatistics = useCallback((): PlannerStatistics => {
    const avgGenerationTime = performanceMetrics.current.generationTimes.length > 0
      ? performanceMetrics.current.generationTimes.reduce((a, b) => a + b, 0) / performanceMetrics.current.generationTimes.length
      : 0;
    
    const cacheHitRate = (performanceMetrics.current.cacheHits + performanceMetrics.current.cacheMisses) > 0
      ? (performanceMetrics.current.cacheHits / (performanceMetrics.current.cacheHits + performanceMetrics.current.cacheMisses)) * 100
      : 0;
    
    return {
      ...state.plannerStats,
      performance: {
        avgGenerationTime,
        cacheHitRate
      }
    };
  }, [state.plannerStats]);

  // プレースホルダー実装（簡略化）
  const updateExecutionProgress = useCallback((_executionId: string, _progress: Partial<ExecutionProgress>) => {
    // 実装省略
  }, []);

  const completeExecution = useCallback((executionId: string, result: ExecutionResult) => {
    // 実装省略
  }, []);

  const runSimulation = useCallback(async (config: UpgradeSimulationConfig): Promise<UpgradeSimulationResult> => {
    // 実装省略 - シミュレーション機能は Phase 3 Week3 で実装予定
    throw new Error('シミュレーション機能は Week3 で実装予定です');
  }, []);

  const optimizePlan = useCallback(async (plan: UpgradeRecommendation, constraints: OptimizationConstraints): Promise<UpgradeRecommendation> => {
    // 実装省略
    return plan;
  }, []);

  const exportPlan = useCallback((plan: UpgradeRecommendation, format: 'json' | 'csv' | 'pdf'): string => {
    // 実装省略
    return JSON.stringify(plan);
  }, []);

  const importPlan = useCallback((data: string, format: 'json' | 'csv'): UpgradeRecommendation => {
    // 実装省略
    return JSON.parse(data);
  }, []);

  // ===========================================
  // 📤 戻り値
  // ===========================================

  const actions: UpgradePlannerActions = {
    loadPlans,
    selectPlan,
    clearSelection,
    addToComparison,
    removeFromComparison,
    clearComparison,
    runComparison,
    updateCustomConfig,
    generateCustomPlan,
    runSimulation,
    startExecution,
    updateExecutionProgress,
    completeExecution,
    optimizePlan,
    exportPlan,
    importPlan,
    clearError,
    resetPlanner,
    getStatistics
  };

  return [state, actions];
};

// ===========================================
// 🛠️ 内部ヘルパー関数
// ===========================================

async function generatePlansFromAnalysis(analysis: BottleneckAnalysis): Promise<UpgradeRecommendation[]> {
  // Week1で実装済みのuseUpgradeRecommendationの生成ロジックを再利用
  // 簡略化された実装
  
  const plans: UpgradeRecommendation[] = [];
  const bottlenecks = analysis.bottlenecks;
  
  // 1. 緊急対応プラン
  if (bottlenecks.some(b => b.severity === 'critical')) {
    plans.push(createUrgentPlan(bottlenecks));
  }
  
  // 2. バランス重視プラン
  plans.push(createBalancedPlan(bottlenecks));
  
  // 3. 予算重視プラン
  plans.push(createBudgetPlan(bottlenecks));
  
  // 4. 性能重視プラン
  plans.push(createPerformancePlan(bottlenecks));
  
  return plans.filter(Boolean);
}

async function performPlanComparison(plans: UpgradeRecommendation[]): Promise<ComparisonResult> {
  // プラン比較分析実装
  const metrics: ComparisonMetric[] = [
    {
      name: 'コスト',
      key: 'totalCost',
      values: plans.map((plan, index) => ({
        planId: plan.id,
        value: plan.totalCost,
        rank: index + 1
      })),
      winner: plans.reduce((min, plan) => plan.totalCost < min.totalCost ? plan : min).id,
      importance: 0.8
    },
    {
      name: '性能向上',
      key: 'expectedImprovement.performanceGain',
      values: plans.map((plan, index) => ({
        planId: plan.id,
        value: plan.expectedImprovement.performanceGain,
        rank: index + 1
      })),
      winner: plans.reduce((max, plan) => plan.expectedImprovement.performanceGain > max.expectedImprovement.performanceGain ? plan : max).id,
      importance: 0.9
    }
  ];
  
  const ranking: PlanRanking[] = plans.map(plan => ({
    planId: plan.id,
    overallScore: calculateOverallScore(plan, metrics),
    categoryScores: {
      cost: normalizeCostScore(plan.totalCost, plans),
      performance: plan.expectedImprovement.performanceGain,
      roi: plan.roi.costPerformanceRatio * 50,
      feasibility: calculateFeasibilityScore(plan),
      risk: calculateRiskScore(plan)
    },
    reasoning: generateReasoningForPlan(plan)
  }));
  
  return {
    plans,
    metrics,
    ranking: ranking.sort((a, b) => b.overallScore - a.overallScore),
    tradeoffs: analyzeTradeoffs(plans),
    recommendation: generateRecommendation(ranking),
    confidence: 0.85
  };
}

async function createCustomPlan(analysis: BottleneckAnalysis, config: CustomPlanConfig): Promise<UpgradeRecommendation> {
  // カスタムプラン生成ロジック
  const plan: UpgradeRecommendation = {
    id: `custom_${Date.now()}`,
    name: '🎛️ カスタムプラン',
    description: 'ユーザー設定に基づく最適化プラン',
    type: 'balanced',
    totalCost: config.budget.preferred,
    timeframe: `${config.timeframe.preferredDuration}ヶ月`,
    difficultyLevel: config.constraints.maxComplexity,
    phases: [], // 実装簡略化
    expectedImprovement: {
      performanceGain: calculateCustomImprovement(analysis, config),
      valueGain: 50,
      longevityExtension: config.timeframe.preferredDuration,
      powerEfficiencyGain: 10
    },
    roi: {
      costPerformanceRatio: 1.2,
      paybackPeriod: config.timeframe.preferredDuration,
      totalSavings: config.budget.preferred * 0.3,
      valueRetention: 0.75
    },
    risks: [],
    generatedAt: new Date(),
    confidence: 0.8,
    priority: calculateCustomPriority(config)
  };
  
  return plan;
}

// プラン生成ヘルパー関数群（簡略化実装）
function createUrgentPlan(bottlenecks: any[]): UpgradeRecommendation {
  const critical = bottlenecks.filter(b => b.severity === 'critical');
  return {
    id: `urgent_${Date.now()}`,
    name: '🚨 緊急対応プラン',
    description: '重大問題の即座解決',
    type: 'immediate',
    totalCost: critical.reduce((sum, b) => sum + b.costEstimate, 0),
    timeframe: '即座実行',
    difficultyLevel: 'moderate',
    phases: [],
    expectedImprovement: { performanceGain: 30, valueGain: 20, longevityExtension: 6, powerEfficiencyGain: 5 },
    roi: { costPerformanceRatio: 0.8, paybackPeriod: 3, totalSavings: 50000, valueRetention: 0.7 },
    risks: [],
    generatedAt: new Date(),
    confidence: 0.9,
    priority: 95
  };
}

function createBalancedPlan(bottlenecks: any[]): UpgradeRecommendation {
  return {
    id: `balanced_${Date.now()}`,
    name: '⚖️ バランスプラン',
    description: 'コストと性能の最適バランス',
    type: 'balanced',
    totalCost: 150000,
    timeframe: '3-6ヶ月',
    difficultyLevel: 'moderate',
    phases: [],
    expectedImprovement: { performanceGain: 25, valueGain: 60, longevityExtension: 18, powerEfficiencyGain: 15 },
    roi: { costPerformanceRatio: 1.4, paybackPeriod: 8, totalSavings: 80000, valueRetention: 0.8 },
    risks: [],
    generatedAt: new Date(),
    confidence: 0.85,
    priority: 80
  };
}

function createBudgetPlan(bottlenecks: any[]): UpgradeRecommendation {
  return {
    id: `budget_${Date.now()}`,
    name: '💰 予算重視プラン',
    description: '最小コストで最大効果',
    type: 'budget',
    totalCost: 80000,
    timeframe: '柔軟実行',
    difficultyLevel: 'easy',
    phases: [],
    expectedImprovement: { performanceGain: 15, valueGain: 80, longevityExtension: 12, powerEfficiencyGain: 8 },
    roi: { costPerformanceRatio: 2.0, paybackPeriod: 4, totalSavings: 120000, valueRetention: 0.6 },
    risks: [],
    generatedAt: new Date(),
    confidence: 0.75,
    priority: 70
  };
}

function createPerformancePlan(bottlenecks: any[]): UpgradeRecommendation {
  return {
    id: `performance_${Date.now()}`,
    name: '🚀 性能重視プラン',
    description: '最高性能追求',
    type: 'performance',
    totalCost: 250000,
    timeframe: '6-12ヶ月',
    difficultyLevel: 'advanced',
    phases: [],
    expectedImprovement: { performanceGain: 45, valueGain: 40, longevityExtension: 24, powerEfficiencyGain: 20 },
    roi: { costPerformanceRatio: 1.0, paybackPeriod: 12, totalSavings: 60000, valueRetention: 0.9 },
    risks: [],
    generatedAt: new Date(),
    confidence: 0.8,
    priority: 85
  };
}

// ユーティリティ関数群
function calculateOverallScore(plan: UpgradeRecommendation, metrics: ComparisonMetric[]): number {
  return plan.priority; // 簡略化
}

function normalizeCostScore(cost: number, allPlans: UpgradeRecommendation[]): number {
  const maxCost = Math.max(...allPlans.map(p => p.totalCost));
  const minCost = Math.min(...allPlans.map(p => p.totalCost));
  return 100 - ((cost - minCost) / (maxCost - minCost)) * 100;
}

function calculateFeasibilityScore(plan: UpgradeRecommendation): number {
  const difficultyScores = { easy: 90, moderate: 75, difficult: 60, expert: 40 };
  return difficultyScores[plan.difficultyLevel] || 50;
}

function calculateRiskScore(plan: UpgradeRecommendation): number {
  return Math.max(0, 100 - (plan.risks.length * 20));
}

function generateReasoningForPlan(plan: UpgradeRecommendation): string[] {
  return [`${plan.name}は${plan.description}を重視`, `予想改善効果: ${plan.expectedImprovement.performanceGain}%`];
}

function analyzeTradeoffs(plans: UpgradeRecommendation[]): TradeoffAnalysis[] {
  return [{
    aspect1: 'コスト',
    aspect2: '性能',
    correlation: -0.6,
    description: 'コストと性能は概ね逆相関の関係',
    recommendations: ['予算に応じた最適バランス選択を推奨']
  }];
}

function generateRecommendation(ranking: PlanRanking[]): string {
  const topPlan = ranking[0];
  return `総合評価が最も高い「${topPlan.planId}」を推奨します`;
}

function calculateCustomImprovement(analysis: BottleneckAnalysis, config: CustomPlanConfig): number {
  const budgetFactor = config.budget.preferred / 150000; // 15万円基準
  const performancePriority = config.priority.performance / 100;
  const baseImprovement = analysis.bottlenecks.length * 8;
  
  return Math.min(baseImprovement * budgetFactor * performancePriority * 1.5, 60);
}

function calculateCustomPriority(config: CustomPlanConfig): number {
  return (config.priority.performance + config.priority.efficiency) / 2;
}

export default useUpgradePlanner;
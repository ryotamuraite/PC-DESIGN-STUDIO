// src/types/upgrade.ts
// Phase 3: 既存PCアップグレード支援機能 型定義

import { Part, PartCategory, ExtendedPCConfiguration } from './index';

// ===========================================
// 🔄 既存PC構成 (アップグレード診断用)
// ===========================================

// 現在のPC構成情報
export interface CurrentPCConfiguration {
  id: string;
  name: string;
  
  // 現在のパーツ構成
  currentParts: {
    cpu: Part | null;
    motherboard: Part | null;
    memory: Part[];                    // 複数メモリスロット対応
    gpu: Part | null;
    storage: Part[];                   // 複数ストレージ対応
    psu: Part | null;
    case: Part | null;
    cooler: Part | null;
    other: Part[];                     // その他周辺機器
  };
  
  // PC情報
  pcInfo: {
    purchaseDate?: Date;
    totalPrice?: number;
    warranty?: Date;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    usage: 'gaming' | 'office' | 'creative' | 'development' | 'server' | 'mixed';
    dailyUsageHours: number;
    location: 'home' | 'office' | 'mobile';
  };
  
  // 制限・制約
  constraints: {
    budget: number;
    timeframe: 'immediate' | '1-3months' | '3-6months' | '6-12months' | 'flexible';
    priority: 'performance' | 'budget' | 'efficiency' | 'aesthetics' | 'longevity';
    keepParts: PartCategory[];         // 維持したいパーツカテゴリ
    replaceParts: PartCategory[];      // 交換したいパーツカテゴリ
    maxComplexity: 'simple' | 'moderate' | 'advanced'; // 作業複雑度制限
  };
  
  // メタデータ
  createdAt: Date;
  lastUpdated: Date;
  version: string;
}

// ===========================================
// 🔍 診断結果 (ボトルネック分析)
// ===========================================

// ボトルネック分析結果
export interface BottleneckAnalysis {
  // 全体スコア
  overallScore: number;              // 0-100 総合パフォーマンススコア
  balanceScore: number;              // 0-100 バランス評価
  
  // パーツ別分析
  componentAnalysis: {
    [K in PartCategory]?: ComponentPerformance;
  };
  
  // ボトルネック識別
  bottlenecks: BottleneckResult[];
  
  // パフォーマンス予測
  performanceMetrics: {
    gaming: PerformanceMetrics;
    productivity: PerformanceMetrics;
    general: PerformanceMetrics;
  };
  
  // 互換性チェック
  compatibilityIssues: CompatibilityIssue[];
  
  // 診断メタデータ
  diagnosisDate: Date;
  confidence: number;                // 0-1 診断の信頼度
  dataSource: string[];
}

// コンポーネント個別パフォーマンス
export interface ComponentPerformance {
  part: Part;
  category: PartCategory;
  
  // スコア評価
  performanceScore: number;          // 0-100 絶対性能
  valueScore: number;                // 0-100 コスパ評価
  modernityScore: number;            // 0-100 現代性評価
  
  // 詳細分析
  strengths: string[];
  weaknesses: string[];
  recommendedAction: 'keep' | 'upgrade_soon' | 'upgrade_later' | 'replace_immediately';
  
  // 寿命予測
  expectedLifespan: number;          // 月数
  maintenanceNeeded: boolean;
  
  // 互換性
  compatibilityWithOthers: number;   // 0-100 他パーツとの相性
}

// ボトルネック結果
export interface BottleneckResult {
  type: 'cpu' | 'gpu' | 'memory' | 'storage' | 'psu' | 'cooling' | 'compatibility';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  
  // 詳細情報
  description: string;
  impact: string;
  recommendedSolution: string;
  
  // 改善効果予測
  improvementPotential: number;      // 0-100 改善ポテンシャル
  costEstimate: number;              // 解決にかかる概算費用
  difficultyLevel: 'easy' | 'moderate' | 'difficult' | 'expert';
  
  // 関連パーツ
  affectedParts: PartCategory[];
  dependentUpgrades: PartCategory[]; // 連動して必要なアップグレード
}

// パフォーマンス指標
export interface PerformanceMetrics {
  fps: {
    current: number;
    predicted: number;
    improvement: number;
  };
  loadTimes: {
    current: number;                 // 秒
    predicted: number;
    improvement: number;
  };
  multitasking: {
    current: number;                 // 0-100
    predicted: number;
    improvement: number;
  };
  overall: {
    current: number;                 // 0-100
    predicted: number;
    improvement: number;
  };
}

// 互換性問題
export interface CompatibilityIssue {
  type: 'physical' | 'electrical' | 'thermal' | 'software';
  severity: 'warning' | 'error' | 'critical';
  description: string;
  solution: string;
  affectedParts: PartCategory[];
  mustResolve: boolean;
}

// ===========================================
// 📋 アップグレードプラン
// ===========================================

// アップグレード提案
export interface UpgradeRecommendation {
  id: string;
  name: string;
  description: string;
  
  // プラン情報
  type: 'immediate' | 'phased' | 'budget' | 'performance' | 'balanced';
  totalCost: number;
  timeframe: string;
  difficultyLevel: 'easy' | 'moderate' | 'difficult' | 'expert';
  
  // アップグレード段階
  phases: UpgradePhase[];
  
  // 効果予測
  expectedImprovement: {
    performanceGain: number;         // % 改善
    valueGain: number;              // コスパ改善
    longevityExtension: number;     // 寿命延長（月）
    powerEfficiencyGain: number;    // 電力効率改善%
  };
  
  // ROI計算
  roi: {
    costPerformanceRatio: number;
    paybackPeriod: number;          // 月数
    totalSavings: number;           // 新規購入との差額
    valueRetention: number;         // 資産価値維持率
  };
  
  // リスク評価
  risks: UpgradeRisk[];
  
  // メタデータ
  generatedAt: Date;
  confidence: number;
  priority: number;                  // 0-100 推奨度
}

// アップグレード段階
export interface UpgradePhase {
  phase: number;
  name: string;
  description: string;
  
  // 段階詳細
  partsToReplace: PartUpgrade[];
  estimatedCost: number;
  estimatedTime: number;            // 時間（分）
  difficulty: 'easy' | 'moderate' | 'difficult' | 'expert';
  
  // 段階効果
  phaseImprovement: {
    performance: number;            // % 改善
    powerEfficiency: number;
    stability: number;
  };
  
  // 前提条件
  prerequisites: string[];
  dependencies: number[];           // 依存する段階番号
  
  // 注意事項
  warnings: string[];
  recommendations: string[];
}

// パーツアップグレード詳細
export interface PartUpgrade {
  currentPart: Part | null;
  recommendedPart: Part;
  category: PartCategory;
  
  // アップグレード理由
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  
  // 効果予測
  performanceGain: number;          // % 改善
  compatibilityImprovement: boolean;
  futureProofing: number;           // 0-100 将来性
  
  // コスト分析
  newPartCost: number;
  installationCost?: number;
  disposalValue?: number;           // 下取り・売却予想額
  netCost: number;
  
  // 実装詳細
  installationSteps: string[];
  requiredTools: string[];
  estimatedInstallTime: number;     // 分
  
  // リスク
  risks: string[];
  backupNeeded: boolean;
  dataLossRisk: boolean;
}

// アップグレードリスク
export interface UpgradeRisk {
  type: 'compatibility' | 'installation' | 'cost' | 'performance' | 'warranty';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
  probability: number;              // 0-100 発生確率
  impact: number;                   // 0-100 影響度
}

// ===========================================
// 🎯 アップグレードシミュレーション
// ===========================================

// 🚀 Phase 3 Week3: シミュレーター専用型定義

// シミュレーション結果（Week3新規）
export interface SimulationResult {
  id: string;
  planId: string;
  timestamp: Date;
  
  // 総合結果
  overallImprovement: number;        // % 性能向上
  resolvedBottlenecks: string[];
  
  // ROI関連
  roi: number;
  paybackMonths: number;
  monthlyProductivityGain?: number;
  annualSavings?: number;
  
  // メタデータ
  confidence: number;                // 0-100 信頼度
  methodology: string;
  estimatedCompletionTime?: string;
  riskFactors?: string[];
  userSatisfactionPrediction?: number;
}

// ベンチマーク結果（Week3新規）
export interface BenchmarkResult {
  testName: string;
  category: PerformanceCategory;
  beforeScore: number;
  afterScore: number;
  confidence: number;                // 0-100
  methodology: string;
  unit: string;
}

// 電力分析結果（Week3新規）
export interface PowerAnalysis {
  idle: { before: number; after: number };
  load: { before: number; after: number };
  annualCost: number;
  monthlyCostDifference?: number;
  efficiency: 'improved' | 'increased' | 'unchanged';
}

// 温度分析結果（Week3新規）
export interface ThermalResult {
  cpu: { before: number; after: number };
  gpu: { before: number; after: number };
  coolingEfficiency: number;         // 0-100
  noiseLevelDb: number;
  thermalThrottlingRisk?: 'low' | 'medium' | 'high';
}

// 構成比較結果（Week3新規）
export interface ComparisonResult {
  performance: {
    cpu: { before: number; after: number };
    gpu: { before: number; after: number };
    memory: { before: number; after: number };
  };
  efficiency: {
    powerEfficiency: { before: number; after: number };
    thermalEfficiency: { before: number; after: number };
    noiseLevel: { before: number; after: number };
  };
  overallRating: {
    before: number;
    after: number;
  };
  improvementAreas: string[];
  warnings: string[];
}

// パフォーマンスカテゴリ（Week3新規）
export type PerformanceCategory = 'CPU' | 'GPU' | 'Memory' | 'Storage' | 'Overall';

// ボトルネックタイプ（Week3新規）
export type BottleneckType = 'cpu' | 'gpu' | 'memory' | 'storage' | 'psu' | 'cooling' | 'compatibility';

// 使用シナリオタイプ（Week3新規） - interface版に統一

// PCConfiguration 型（Week3で使用）
export interface PCConfiguration {
  id: string;
  name: string;
  parts: {
    cpu: Part | null;
    gpu: Part | null;
    motherboard: Part | null;
    memory: Part | null;
    storage: Part | null;
    psu: Part | null;
    case: Part | null;
    cooler: Part | null;
    monitor: Part | null;
  };
  totalPrice: number;
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  tags?: string[];
}

// ===========================================
// 🎯 アップグレードシミュレーション（継続）
// ===========================================

// シミュレーション設定
export interface UpgradeSimulationConfig {
  currentPC: CurrentPCConfiguration;
  targetScenarios: UsageScenario[];
  budgetConstraints: BudgetConstraint[];
  timeConstraints: TimeConstraint;
  performanceTargets: PerformanceTarget[];
}

// 使用シナリオ
export interface UsageScenario {
  name: string;
  type: 'gaming' | 'productivity' | 'creative' | 'development' | 'general';
  applications: string[];
  usage: {
    cpu: number;                    // 0-100 使用率
    gpu: number;
    memory: number;
    storage: number;
  };
  weight: number;                   // 0-100 重要度
}

// 予算制約
export interface BudgetConstraint {
  type: 'total' | 'monthly' | 'per_part' | 'phased';
  amount: number;
  period?: number;                  // 月数（monthlyの場合）
  flexibility: number;              // 0-100 柔軟性
}

// 時間制約
export interface TimeConstraint {
  urgency: 'immediate' | 'flexible' | 'planned';
  deadline?: Date;
  availability: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
  };
  maxSessionDuration: number;       // 時間
}

// パフォーマンス目標
export interface PerformanceTarget {
  metric: 'fps' | 'load_time' | 'multitasking' | 'overall';
  currentValue: number;
  targetValue: number;
  priority: number;                 // 0-100
  mustAchieve: boolean;
}

// シミュレーション結果
export interface UpgradeSimulationResult {
  scenarios: SimulationScenario[];
  recommendations: UpgradeRecommendation[];
  comparison: UpgradeComparison;
  optimization: OptimizationResult;
  
  // メタデータ
  simulationDate: Date;
  confidence: number;
  computation: {
    duration: number;               // ms
    iterations: number;
    algorithm: string;
  };
}

// シミュレーションシナリオ結果
export interface SimulationScenario {
  name: string;
  configuration: ExtendedPCConfiguration;
  
  // 性能結果
  performance: PerformanceMetrics;
  costs: {
    totalCost: number;
    upgradeOnlyCost: number;
    installationCost: number;
    maintenanceCost: number;
  };
  
  // 評価
  scores: {
    performance: number;            // 0-100
    value: number;
    compatibility: number;
    futureProofing: number;
    overall: number;
  };
  
  // 実現性
  feasibility: {
    technical: number;              // 0-100
    economic: number;
    temporal: number;
    overall: number;
  };
}

// アップグレード比較
export interface UpgradeComparison {
  baseline: CurrentPCConfiguration;
  scenarios: SimulationScenario[];
  
  // 比較指標
  metrics: {
    performance: ComparisonMetric;
    cost: ComparisonMetric;
    value: ComparisonMetric;
    complexity: ComparisonMetric;
  };
  
  // 推奨順位
  ranking: {
    scenario: string;
    score: number;
    reasoning: string;
  }[];
  
  // 詳細分析
  tradeoffs: TradeoffAnalysis[];
}

// 比較指標
export interface ComparisonMetric {
  name: string;
  unit: string;
  baseline: number;
  scenarios: {
    name: string;
    value: number;
    improvement: number;            // % 改善
    rank: number;
  }[];
}

// トレードオフ分析
export interface TradeoffAnalysis {
  aspect1: string;
  aspect2: string;
  relationship: 'positive' | 'negative' | 'neutral';
  strength: number;                 // 0-100 関係の強さ
  description: string;
  recommendations: string[];
}

// 最適化結果
export interface OptimizationResult {
  algorithm: 'genetic' | 'simulated_annealing' | 'greedy' | 'dynamic_programming';
  
  // 最適解
  optimalSolution: {
    configuration: ExtendedPCConfiguration;
    upgrades: PartUpgrade[];
    totalCost: number;
    expectedPerformance: PerformanceMetrics;
    confidence: number;
  };
  
  // 代替解
  alternativeSolutions: {
    configuration: ExtendedPCConfiguration;
    score: number;
    tradeoffs: string[];
  }[];
  
  // 最適化統計
  statistics: {
    generations: number;
    convergence: number;            // 収束度 0-100
    exploredSolutions: number;
    computationTime: number;        // ms
  };
}

// ===========================================
// 📊 アップグレード履歴・追跡
// ===========================================

// アップグレード実行記録
export interface UpgradeExecution {
  id: string;
  planId: string;
  userId?: string;
  
  // 実行情報
  executionDate: Date;
  phase: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  
  // 実行詳細
  actualParts: PartUpgrade[];
  actualCost: number;
  actualTime: number;               // 分
  
  // 結果
  successRate: number;              // 0-100
  issues: ExecutionIssue[];
  actualPerformance?: PerformanceMetrics;
  
  // ユーザーフィードバック
  userRating?: number;              // 1-5
  userComments?: string;
  satisfaction?: number;            // 0-100
  
  // メタデータ
  notes: string;
  photos?: string[];                // 写真URL
  receipts?: string[];              // レシートURL
}

// 実行問題
export interface ExecutionIssue {
  type: 'compatibility' | 'installation' | 'performance' | 'cost' | 'other';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  resolution?: string;
  resolved: boolean;
  cost?: number;                    // 解決にかかった追加費用
}

// アップグレード追跡
export interface UpgradeTracking {
  pcId: string;
  upgradeHistory: UpgradeExecution[];
  
  // 統計
  statistics: {
    totalUpgrades: number;
    totalCost: number;
    averageSuccessRate: number;
    averageSatisfaction: number;
    lastUpgrade: Date;
  };
  
  // 学習データ
  learningData: {
    preferredManufacturers: string[];
    budgetPatterns: number[];
    performancePriorities: string[];
    commonIssues: string[];
  };
  
  // 将来予測
  predictions: {
    nextUpgrade: Date;
    suggestedBudget: number;
    lifecycleStage: 'new' | 'prime' | 'mature' | 'legacy';
  };
}

// ===========================================
// 🔄 サービス統合型
// ===========================================

// アップグレードサービス設定
export interface UpgradeServiceConfig {
  // 分析設定
  analysis: {
    enableBottleneckDetection: boolean;
    enablePerformancePrediction: boolean;
    enableCompatibilityCheck: boolean;
    confidenceThreshold: number;    // 0-1
  };
  
  // 推奨設定
  recommendations: {
    maxRecommendations: number;
    includePhased: boolean;
    includeBudgetOptions: boolean;
    includePerformanceOptions: boolean;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
  
  // シミュレーション設定
  simulation: {
    enableAdvancedSimulation: boolean;
    maxIterations: number;
    algorithm: 'genetic' | 'simulated_annealing' | 'greedy';
    timeout: number;                // ms
  };
  
  // 外部サービス連携
  integration: {
    priceComparison: boolean;
    stockMonitoring: boolean;
    reviewIntegration: boolean;
    benchmarkData: boolean;
  };
}

// サービス状態
export interface UpgradeServiceState {
  // 現在の診断
  currentDiagnosis?: BottleneckAnalysis;
  activeRecommendations: UpgradeRecommendation[];
  
  // シミュレーション状態
  simulationStatus: 'idle' | 'running' | 'completed' | 'error';
  simulationProgress: number;       // 0-100
  
  // キャッシュ
  cache: {
    diagnoses: Map<string, BottleneckAnalysis>;
    recommendations: Map<string, UpgradeRecommendation[]>;
    simulations: Map<string, UpgradeSimulationResult>;
  };
  
  // パフォーマンス
  performance: {
    lastAnalysisTime: number;       // ms
    cacheHitRate: number;          // 0-100
    averageResponseTime: number;    // ms
  };
}

// エクスポート用ユーティリティ型
export type UpgradePartCategory = PartCategory;
export type UpgradeExtendedConfig = ExtendedPCConfiguration;

// 型チェック関数
export function isUpgradeRecommendation(obj: unknown): obj is UpgradeRecommendation {
  return typeof obj === 'object' && obj !== null && 'phases' in obj && 'roi' in obj;
}

export function isBottleneckAnalysis(obj: unknown): obj is BottleneckAnalysis {
  return typeof obj === 'object' && obj !== null && 'bottlenecks' in obj && 'overallScore' in obj;
}

export function isCurrentPCConfiguration(obj: unknown): obj is CurrentPCConfiguration {
  return typeof obj === 'object' && obj !== null && 'currentParts' in obj && 'constraints' in obj;
}

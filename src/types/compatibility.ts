// src/types/compatibility.ts
// 互換性チェック用の型定義

// メイン互換性結果
export interface CompatibilityResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  score: number; // 0-100の互換性スコア
  checkedAt: Date;
  details: CompatibilityDetails;
}

// 互換性問題
export interface CompatibilityIssue {
  id: string;
  type: CompatibilityIssueType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedParts: string[];
  solution?: string;
  category: string;
}

// 互換性警告
export interface CompatibilityWarning {
  id: string;
  message: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

// 問題タイプ
export type CompatibilityIssueType = 
  | 'socket_mismatch' 
  | 'memory_incompatible' 
  | 'power_insufficient' 
  | 'size_conflict' 
  | 'connector_missing'
  | 'missing_part';

// 詳細互換性チェック結果（パフォーマンス予測統合版）
export interface CompatibilityDetails {
  cpuSocket: SocketCompatibility;
  memoryType: MemoryCompatibility;
  powerConnectors: PowerConnectorCompatibility;
  physicalFit: PhysicalCompatibility;
  performanceMatch: PerformanceCompatibility;
  performancePrediction?: {
    overallScore: number;
    bottleneckAnalysis: {
      cpuUtilization: number;
      gpuUtilization: number;
      bottleneckType: 'cpu' | 'gpu' | 'balanced' | 'memory' | 'unknown';
      severity: 'none' | 'mild' | 'moderate' | 'severe';
      ratio: number;
      message: string;
      resolutionImpact: Record<string, { cpuBound: boolean; gpuBound: boolean }>;
    };
    gamingPerformance: {
      averageFps: Record<string, number>;
      gameSpecificFps: Record<string, Record<string, number>>;
      recommendedResolution: string;
      rayTracingViable: boolean;
      dlssAvailable: boolean;
      performanceClass: 'entry' | 'mainstream' | 'high-end' | 'flagship';
    };
    useCaseScores: {
      gaming: number;
      contentCreation: number;
      workstation: number;
      overall: number;
      details: Record<string, { score: number; explanation: string }>;
    };
    recommendations: Array<{
      type: 'upgrade' | 'optimize' | 'alternative';
      priority: 'high' | 'medium' | 'low';
      component: 'cpu' | 'gpu' | 'memory' | 'storage';
      title: string;
      description: string;
      expectedImprovement: string;
      estimatedCost?: number;
    }>;
    optimizations: Array<{
      category: 'settings' | 'hardware' | 'configuration';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
    predictedAt: Date;
  };
}

// CPUソケット互換性（強化版）
export interface SocketCompatibility {
  compatible: boolean;
  cpuSocket?: string;
  motherboardSocket?: string;
  chipset?: string;
  supportedChipsets?: string[];
  message: string;
}

// メモリ互換性（強化版）
export interface MemoryCompatibility {
  compatible: boolean;
  memoryType?: string;
  memorySpeed?: number;
  totalCapacity?: number;
  maxCapacity?: number;
  moduleCount?: number;
  isJedecStandard?: boolean;
  isOverclocking?: boolean;
  dualChannelRecommended?: boolean;
  supportedSpeeds?: number[];
  supportedTypes?: string[];
  warnings?: string[];
  message: string;
}

// 電源コネクタ互換性（データベース駆動強化版）
export interface PowerConnectorCompatibility {
  compatible: boolean;
  requiredConnectors: string[];
  availableConnectors: string[];
  missingConnectors: string[];
  requiredDetails?: Array<{connector: string, purpose: string, device: string}>;
  missingDetails?: Array<{connector: string, purpose: string, device: string}>;
  powerWarning?: string;
  psuCategory?: string;
  message: string;
}

// 物理的互換性（データベース駆動強化版）
export interface PhysicalCompatibility {
  compatible: boolean;
  issues: string[];
  warnings: string[];
  detailedChecks?: Array<{check: string, status: 'pass' | 'warning' | 'fail', details: string}>;
  caseType?: string;
  clearanceAnalysis?: Array<{check: string, status: 'pass' | 'warning' | 'fail', details: string}>;
  message: string;
}

// パフォーマンス互換性（パフォーマンス予測統合版）
export interface PerformanceCompatibility {
  balanced: boolean;
  bottlenecks: string[];
  recommendations: string[];
  severity?: 'none' | 'mild' | 'moderate' | 'severe';
  performanceScore?: number;
  useCaseScores?: {
    gaming: number;
    contentCreation: number;
    workstation: number;
    overall: number;
  };
  bottleneckAnalysis?: {
    cpuUtilization: number;
    gpuUtilization: number;
    bottleneckType: 'cpu' | 'gpu' | 'balanced' | 'memory' | 'unknown';
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    ratio: number;
    message: string;
  };
  gamingPerformance?: {
    averageFps: Record<string, number>;
    recommendedResolution: string;
    rayTracingViable: boolean;
    dlssAvailable: boolean;
    performanceClass: 'entry' | 'mainstream' | 'high-end' | 'flagship';
  };
  message: string;
}

// 互換性チェック設定
export interface CompatibilityCheckConfig {
  strictMode?: boolean;
  includeWarnings?: boolean;
  checkPerformanceBalance?: boolean;
  futureUpgradeConsideration?: boolean;
}

// 互換性推奨事項
export interface CompatibilityRecommendation {
  id: string;
  type: 'alternative' | 'upgrade' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedParts: string[];
  alternatives?: CompatibilityAlternative[];
  estimatedCost?: number;
}

// 互換性の代替案
export interface CompatibilityAlternative {
  partId: string;
  name: string;
  price: number;
  improvement: string;
}

// 互換性データベース
export interface CompatibilityDatabase {
  sockets: SocketDatabase[];
  memory: MemoryDatabase[];
  formFactors: FormFactorDatabase[];
  powerConnectors: PowerConnectorDatabase[];
  lastUpdated: Date;
  version: string;
}

// ソケット互換性データベース
export interface SocketDatabase {
  socket: string;
  type: 'Intel' | 'AMD';
  generation: string;
  compatibleCpus: string[];
  compatibleMotherboards: string[];
}

// メモリ互換性データベース
export interface MemoryDatabase {
  type: 'DDR4' | 'DDR5';
  speeds: number[];
  maxCapacity: number;
  compatibleChipsets: string[];
}

// フォームファクター互換性データベース
export interface FormFactorDatabase {
  motherboard: string;
  compatibleCases: string[];
  dimensions: {
    width: number;
    height: number;
  };
}

// 電源コネクタデータベース
export interface PowerConnectorDatabase {
  connector: string;
  voltage: number;
  pins: number;
  usage: string[];
}

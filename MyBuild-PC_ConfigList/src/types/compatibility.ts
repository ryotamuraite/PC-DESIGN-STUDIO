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

// 詳細互換性チェック結果
export interface CompatibilityDetails {
  cpuSocket: SocketCompatibility;
  memoryType: MemoryCompatibility;
  powerConnectors: PowerConnectorCompatibility;
  physicalFit: PhysicalCompatibility;
  performanceMatch: PerformanceCompatibility;
}

// CPUソケット互換性
export interface SocketCompatibility {
  compatible: boolean;
  cpuSocket?: string;
  motherboardSocket?: string;
  message: string;
}

// メモリ互換性
export interface MemoryCompatibility {
  compatible: boolean;
  memoryType?: string;
  supportedTypes?: string[];
  maxCapacity?: number;
  message: string;
}

// 電源コネクタ互換性
export interface PowerConnectorCompatibility {
  compatible: boolean;
  requiredConnectors: string[];
  availableConnectors: string[];
  missingConnectors: string[];
  message: string;
}

// 物理的互換性
export interface PhysicalCompatibility {
  compatible: boolean;
  issues: string[];
  warnings: string[];
  message: string;
}

// パフォーマンス互換性
export interface PerformanceCompatibility {
  balanced: boolean;
  bottlenecks: string[];
  recommendations: string[];
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

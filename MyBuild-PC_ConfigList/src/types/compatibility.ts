// src/types/compatibility.ts
// 互換性チェック用の型定義

export interface CompatibilityResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
  score: number; // 0-100の互換性スコア
}

export interface CompatibilityIssue {
  id: string;
  type: CompatibilityIssueType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedParts: string[]; // パーツIDの配列
  solution?: string;
}

export interface CompatibilityWarning {
  id: string;
  type: CompatibilityWarningType;
  message: string;
  affectedParts: string[];
  recommendation?: string;
}

export type CompatibilityIssueType =
  | 'socket_mismatch'           // CPUとマザーボードのソケット不一致
  | 'memory_incompatible'       // メモリとマザーボードの不互換
  | 'gpu_too_long'             // GPUがケースに入らない
  | 'psu_insufficient'         // 電源容量不足
  | 'cooler_socket_mismatch'   // CPUクーラーのソケット不一致
  | 'cooler_too_tall'          // CPUクーラーがケースに入らない
  | 'insufficient_pcie_slots'   // PCIeスロット不足
  | 'insufficient_sata_ports'   // SATAポート不足
  | 'insufficient_m2_slots'     // M.2スロット不足
  | 'power_connector_missing'   // 電源コネクタ不足
  | 'form_factor_mismatch';     // フォームファクター不一致

export type CompatibilityWarningType =
  | 'memory_speed_suboptimal'   // メモリ速度が最適でない
  | 'cooling_marginal'          // 冷却性能がギリギリ
  | 'psu_efficiency_low'        // 電源効率が低い
  | 'bottleneck_potential'      // ボトルネック可能性
  | 'cable_management_tight'    // ケーブル管理が困難
  | 'future_upgrade_limited';   // 将来のアップグレード制限

// ソケット互換性マップ
export interface SocketCompatibility {
  cpu: string;
  motherboard: string[];
  cooler: string[];
}

// メモリ互換性情報
export interface MemoryCompatibility {
  motherboard: string;
  supportedTypes: string[];
  supportedSpeeds: number[];
  maxCapacity: number;
  maxSticks: number;
}

// 電源コネクタ要件
export interface PowerRequirements {
  motherboard: string; // '24pin'
  cpu: string[];       // ['8pin', '4+4pin']
  gpu: string[];       // ['8pin', '6+2pin']
  storage: number;     // SATA数
}

// フォームファクター互換性
export interface FormFactorCompatibility {
  case: string;
  supportedMotherboards: string[];
  supportedPsu: string[];
  maxGpuLength: number;
  maxCoolerHeight: number;
}

// 冷却要件
export interface CoolingRequirements {
  cpu: {
    tdp: number;
    socket: string;
  };
  cooler: {
    tdpRating: number;
    supportedSockets: string[];
    height: number;
  };
  case: {
    maxCoolerHeight: number;
    fanSupport: number;
  };
}

// 互換性チェック設定
export interface CompatibilityCheckConfig {
  strictMode: boolean;          // 厳密モード
  includeWarnings: boolean;     // 警告を含む
  futureProofing: boolean;      // 将来性を考慮
  budgetConstraints: boolean;   // 予算制約を考慮
}

// 互換性チェック結果の詳細
export interface DetailedCompatibilityResult extends CompatibilityResult {
  checks: {
    socket: SocketCheckResult;
    memory: MemoryCheckResult;
    power: PowerCheckResult;
    cooling: CoolingCheckResult;
    physical: PhysicalCheckResult;
  };
  recommendations: Recommendation[];
}

export interface SocketCheckResult {
  passed: boolean;
  cpuSocket?: string;
  motherboardSocket?: string;
  coolerSockets?: string[];
  issues: CompatibilityIssue[];
}

export interface MemoryCheckResult {
  passed: boolean;
  memoryType?: string;
  supportedTypes?: string[];
  memorySpeed?: number;
  supportedSpeeds?: number[];
  totalCapacity?: number;
  maxCapacity?: number;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
}

export interface PowerCheckResult {
  passed: boolean;
  totalConsumption: number;
  psuWattage: number;
  efficiency: number;
  headroom: number; // パーセンテージ
  connectorCheck: {
    motherboard: boolean;
    cpu: boolean;
    gpu: boolean;
    storage: boolean;
  };
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
}

export interface CoolingCheckResult {
  passed: boolean;
  cpuTdp: number;
  coolerRating: number;
  coolerHeight: number;
  maxCoolerHeight: number;
  socketCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityWarning[];
}

export interface PhysicalCheckResult {
  passed: boolean;
  gpuLength?: number;
  maxGpuLength?: number;
  caseFormFactor?: string;
  motherboardFormFactor?: string;
  psuFormFactor?: string;
  expansionSlots?: {
    required: number;
    available: number;
  };
  issues: CompatibilityIssue[];
}

export interface Recommendation {
  id: string;
  type: 'alternative' | 'upgrade' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedParts: string[];
  alternatives?: {
    partId: string;
    name: string;
    price: number;
    improvement: string;
  }[];
  estimatedCost?: number;
}

// 互換性チェック関数の型
export type CompatibilityChecker = (
  parts: Partial<Record<PartCategory, Part>>,
  config?: CompatibilityCheckConfig
) => Promise<DetailedCompatibilityResult>;

// 互換性データベース型
export interface CompatibilityDatabase {
  sockets: SocketCompatibility[];
  memory: MemoryCompatibility[];
  formFactors: FormFactorCompatibility[];
  lastUpdated: Date;
  version: string;
}
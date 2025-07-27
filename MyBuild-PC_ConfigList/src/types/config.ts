// src/types/config.ts
// PC構成と設定管理用の型定義

import { 
  CPU, 
  GPU, 
  Motherboard, 
  Memory, 
  Storage, 
  PSU, 
  Case, 
  CPUCooler, 
  BasePart,
  Part,
  PartCategory 
} from './parts';
import { PowerCalculationResult } from './power';
import { NumberRange, PriceRange } from './search';

// 互換性関連の型（compatibility.tsが完成するまでの仮定義）
export interface DetailedCompatibilityResult {
  compatible: boolean;
  warnings: CompatibilityWarning[];
  errors: CompatibilityError[];
  score: number;
}

export interface CompatibilityWarning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CompatibilityError {
  type: string;
  message: string;
  affectedParts: string[];
}

export interface PCConfiguration {
  id: string;
  name: string;
  description?: string;
  budget: number;
  purpose: ConfigurationPurpose;
  parts: ConfigurationParts;
  metadata: ConfigurationMetadata;
  calculations: ConfigurationCalculations;
  status: ConfigurationStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ConfigurationParts {
  cpu?: CPU;
  gpu?: GPU;
  motherboard?: Motherboard;
  memory?: Memory[];           // 複数のメモリスティック
  storage?: Storage[];         // 複数のストレージ
  psu?: PSU;
  case?: Case;
  cpuCooler?: CPUCooler;
  caseFans?: CaseFan[];       // ケースファン
  additionalParts?: Part[];    // その他のパーツ
}

export interface CaseFan extends BasePart {
  category: 'case_fan';
  size: number;               // mm
  rpm: NumberRange;
  airflow: number;            // CFM
  staticPressure: number;     // mmH2O
  noiseLevel: number;         // dB
  pwm: boolean;
  rgb: boolean;
  bearingType: string;
}

export type ConfigurationPurpose =
  | 'gaming'                  // ゲーミング
  | 'workstation'            // ワークステーション
  | 'office'                 // オフィス用途
  | 'htpc'                   // ホームシアター
  | 'server'                 // サーバー
  | 'budget'                 // 予算重視
  | 'high_end'               // ハイエンド
  | 'compact'                // コンパクト
  | 'silent'                 // 静音
  | 'overclocking'           // オーバークロック
  | 'content_creation'       // コンテンツ制作
  | 'ai_ml'                  // AI/機械学習
  | 'custom';                // カスタム

export interface ConfigurationMetadata {
  tags: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedBuildTime: number; // 組み立て予想時間（分）
  authorId?: string;
  isPublic: boolean;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  copyCount: number;
  comments?: ConfigurationComment[];
}

export interface ConfigurationComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  rating?: number;
  createdAt: Date;
  replies?: ConfigurationComment[];
}

export interface ConfigurationCalculations {
  totalPrice: number;
  budgetUsage: number;        // 予算使用率（0-1）
  power: PowerCalculationResult;
  compatibility: DetailedCompatibilityResult;
  performance: PerformanceEstimate;
  thermals: ThermalEstimate;
  noise: NoiseEstimate;
  upgradeability: UpgradeabilityScore;
}

export interface PerformanceEstimate {
  gaming: {
    score: number;            // 0-100
    fps1080p: number;
    fps1440p: number;
    fps4k: number;
    bottleneck: BottleneckAnalysis;
  };
  productivity: {
    score: number;
    renderingScore: number;
    encodingScore: number;
    multiTaskingScore: number;
  };
  synthetic: {
    cpuScore: number;
    gpuScore: number;
    memoryScore: number;
    storageScore: number;
  };
}

export interface BottleneckAnalysis {
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  component: PartCategory;
  percentage: number;
  recommendation: string;
}

export interface ThermalEstimate {
  cpuTemp: NumberRange;
  gpuTemp: NumberRange;
  systemTemp: NumberRange;
  warnings: ThermalWarning[];
}

export interface ThermalWarning {
  component: PartCategory;
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface NoiseEstimate {
  idleNoise: number;          // dB
  loadNoise: number;          // dB
  components: NoiseBreakdown[];
  rating: 'silent' | 'quiet' | 'moderate' | 'loud';
}

export interface NoiseBreakdown {
  component: PartCategory;
  idleNoise: number;
  loadNoise: number;
}

export interface UpgradeabilityScore {
  overall: number;            // 0-100
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
  suggestions: UpgradeSuggestion[];
}

export interface UpgradeSuggestion {
  component: PartCategory;
  priority: 'low' | 'medium' | 'high';
  description: string;
  estimatedCost: number;
  performanceGain: number;    // % improvement
}

export type ConfigurationStatus =
  | 'draft'                   // 下書き
  | 'complete'               // 完成
  | 'building'               // 組み立て中
  | 'built'                  // 組み立て完了
  | 'archived'               // アーカイブ
  | 'shared'                 // 共有済み
  | 'published';             // 公開済み

// 構成比較機能
export interface ConfigurationComparison {
  configurations: PCConfiguration[];
  metrics: ComparisonMetrics;
  recommendations: ComparisonRecommendation[];
}

export interface ComparisonMetrics {
  price: ComparisonValue[];
  performance: ComparisonValue[];
  power: ComparisonValue[];
  noise: ComparisonValue[];
  upgradeability: ComparisonValue[];
}

export interface ComparisonValue {
  configId: string;
  value: number;
  rank: number;
  percentageDiff?: number;    // 最高値との差
}

export interface ComparisonRecommendation {
  type: 'best_value' | 'best_performance' | 'most_efficient' | 'most_balanced';
  configId: string;
  reasoning: string;
  score: number;
}

// 構成テンプレート
export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  purpose: ConfigurationPurpose;
  budgetRange: PriceRange;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  isOfficial: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  baseConfiguration: Partial<ConfigurationParts>;
  recommendations: TemplateRecommendation[];
  variants: TemplateVariant[];
  tags: string[];
}

export interface TemplateVariant {
  name: string;
  description: string;
  budgetAdjustment: number;   // 予算調整（%）
  partAdjustments: Partial<ConfigurationParts>;
  targetPerformance: string;
}

export interface TemplateRecommendation {
  category: PartCategory;
  parts: string[];            // パーツIDの配列
  reasoning: string;
  alternatives: string[];
}

export interface TemplateBudgetRules {
  cpu: PriceRange;
  gpu: PriceRange;
  motherboard: PriceRange;
  memory: PriceRange;
  storage: PriceRange;
  psu: PriceRange;
  case: PriceRange;
  cooling: PriceRange;
  other: PriceRange;
}

export interface BudgetAllocation {
  category: PartCategory;
  percentage: number;         // 予算全体に対する割合
  minPrice: number;
  maxPrice: number;
  brands?: string[];
  specifications?: Record<string, string | number | boolean>; // 修正: any → 適切な型
}

// 構成エクスポート
export interface ConfigurationExport {
  format: ExportFormat;
  configuration: PCConfiguration;
  options: ExportOptions;
}

export type ExportFormat =
  | 'json'                    // JSON形式
  | 'csv'                     // CSV形式
  | 'pdf'                     // PDF形式
  | 'html'                    // HTML形式
  | 'markdown'                // Markdown形式
  | 'pcpartpicker'            // PCPartPicker形式
  | 'custom';                 // カスタム形式

export interface ExportOptions {
  includeImages: boolean;
  includePrices: boolean;
  includeSpecs: boolean;
  includeCompatibility: boolean;
  includePowerCalculation: boolean;
  includePerformanceEstimate: boolean;
  language: 'ja' | 'en';
  currency: 'JPY' | 'USD' | 'EUR';
  theme?: 'light' | 'dark';
  customTemplate?: string;
}

// 構成管理サービス
export interface ConfigurationService {
  create(config: Partial<PCConfiguration>): Promise<PCConfiguration>;
  update(id: string, updates: Partial<PCConfiguration>): Promise<PCConfiguration>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<PCConfiguration>;
  list(filters?: ConfigurationFilters): Promise<PCConfiguration[]>;
  duplicate(id: string, name?: string): Promise<PCConfiguration>;
  validate(config: PCConfiguration): Promise<DetailedCompatibilityResult>;
  calculate(config: PCConfiguration): Promise<ConfigurationCalculations>;
  compare(ids: string[]): Promise<ConfigurationComparison>;
  export(id: string, options: ConfigurationExport): Promise<Blob>;
  import(data: Record<string, unknown>, format: ExportFormat): Promise<PCConfiguration>; // 修正: any → Record<string, unknown>
  getTemplates(): Promise<ConfigurationTemplate[]>;
  createFromTemplate(templateId: string, budget: number): Promise<PCConfiguration>;
}

export interface ConfigurationFilters {
  purpose?: ConfigurationPurpose;
  budgetRange?: PriceRange;
  status?: ConfigurationStatus;
  authorId?: string;
  tags?: string[];
  sortBy?: ConfigurationSortOption;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export type ConfigurationSortOption =
  | 'created_at'
  | 'updated_at'
  | 'price'
  | 'performance'
  | 'popularity'
  | 'name';

// ローカルストレージ管理
export interface ConfigurationStorage {
  save(config: PCConfiguration): Promise<void>;
  load(id: string): Promise<PCConfiguration | null>;
  list(): Promise<PCConfiguration[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
  export(): Promise<PCConfiguration[]>;
  import(configs: PCConfiguration[]): Promise<void>;
  sync(): Promise<void>;
}
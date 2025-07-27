// src/types/config.ts
// PC構成と設定管理用の型定義

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
  recommendation?: string;
}

export interface ThermalEstimate {
  cpuTemp: TemperatureRange;
  gpuTemp: TemperatureRange;
  systemTemp: TemperatureRange;
  coolingAdequacy: 'excellent' | 'good' | 'adequate' | 'marginal' | 'insufficient';
  recommendations: ThermalRecommendation[];
}

export interface TemperatureRange {
  idle: number;               // °C
  load: number;               // °C
  max: number;                // °C
}

export interface ThermalRecommendation {
  type: 'cooler_upgrade' | 'case_fans' | 'airflow_optimization' | 'thermal_paste';
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NoiseEstimate {
  idle: number;               // dB
  load: number;               // dB
  components: ComponentNoise[];
  overall: 'silent' | 'quiet' | 'moderate' | 'loud' | 'very_loud';
}

export interface ComponentNoise {
  component: string;
  idle: number;
  load: number;
  contribution: number;       // 全体への寄与度（0-1）
}

export interface UpgradeabilityScore {
  overall: number;            // 0-100
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
  details: UpgradePathAnalysis;
}

export interface UpgradePathAnalysis {
  cpu: UpgradePath[];
  gpu: UpgradePath[];
  memory: UpgradePath[];
  storage: UpgradePath[];
}

export interface UpgradePath {
  component: string;
  compatibility: boolean;
  difficulty: 'easy' | 'moderate' | 'difficult';
  estimatedCost: number;
  performanceGain: number;    // パーセンテージ
}

export type ConfigurationStatus =
  | 'draft'                   // 下書き
  | 'complete'               // 完成
  | 'validated'              // 検証済み
  | 'built'                  // 組み立て済み
  | 'archived';              // アーカイブ

// 構成比較
export interface ConfigurationComparison {
  configurations: PCConfiguration[];
  comparison: ComparisonMatrix;
  winner: ComparisonWinner;
  recommendations: ComparisonRecommendation[];
}

export interface ComparisonMatrix {
  price: number[];
  performance: number[];
  power: number[];
  noise: number[];
  upgradeability: number[];
  compatibility: number[];
  buildDifficulty: number[];
}

export interface ComparisonWinner {
  overall: string;            // 構成ID
  categories: Record<string, string>;
}

export interface ComparisonRecommendation {
  type: 'best_value' | 'best_performance' | 'most_upgradeable' | 'quietest' | 'most_compatible';
  configurationId: string;
  reason: string;
  score: number;
}

// 構成テンプレート
export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  purpose: ConfigurationPurpose;
  budgetRange: PriceRange;
  partRequirements: PartRequirements;
  recommendations: TemplateRecommendation[];
  popularity: number;
  lastUpdated: Date;
}

export interface PartRequirements {
  required: PartCategory[];
  optional: PartCategory[];
  priorities: Record<PartCategory, number>; // 予算配分優先度
  constraints: PartConstraints;
}

export interface PartConstraints {
  [category: string]: {
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    specifications?: Record<string, any>;
  };
}

export interface TemplateRecommendation {
  category: PartCategory;
  parts: string[];            // パーツIDの配列
  reasoning: string;
  alternatives: string[];
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
  import(data: any, format: ExportFormat): Promise<PCConfiguration>;
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
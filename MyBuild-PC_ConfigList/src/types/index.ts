// src/types/index.ts
// パーツカテゴリ
// Phase 2: 拡張型定義
// 電源計算とデータ取得機能に対応

// Phase 1の既存型定義（継続使用）
export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  price: number;
  manufacturer?: string;
  specifications?: Record<string, any>;
  imageUrl?: string;
  affiliateUrl?: string;
  lastUpdated?: string;
}

export type PartCategory = 
  | 'cpu' 
  | 'gpu' 
  | 'motherboard' 
  | 'memory' 
  | 'storage' 
  | 'psu' 
  | 'case' 
  | 'cooler' 
  | 'monitor';

export interface PCConfiguration {
  id: string;
  name: string;
  parts: Record<PartCategory, Part | null>;
  totalPrice: number;
  budget?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Phase 2: 電源計算関連の新しい型定義

export interface PowerConsumption {
  category: PartCategory;
  partId: string;
  partName: string;
  basePower: number;      // 基本消費電力 (W)
  maxPower: number;       // 最大消費電力 (W)
  idlePower: number;      // アイドル時消費電力 (W)
  peakPower?: number;     // ピーク時消費電力 (W)
  powerEfficiency?: number; // 電力効率 (%)
}

export interface PowerCalculationResult {
  totalBasePower: number;     // 基本消費電力合計
  totalMaxPower: number;      // 最大消費電力合計
  totalIdlePower: number;     // アイドル時消費電力合計
  recommendedPSU: number;     // 推奨電源容量
  safetyMargin: number;       // 安全マージン (%)
  powerEfficiency: number;    // 全体の電力効率
  breakdown: PowerConsumption[]; // カテゴリ別内訳
  warnings: PowerWarning[];   // 警告リスト
  isOptimal: boolean;         // 最適化されているか
}

export interface PowerWarning {
  type: 'insufficient' | 'overkill' | 'efficiency' | 'compatibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedParts: string[];
  recommendation?: string;
}

export interface PSUSpecification {
  id: string;
  name: string;
  capacity: number;           // 容量 (W)
  efficiency: string;         // 効率認証 (80+ Bronze, Gold, etc.)
  efficiencyPercentage: number; // 効率 (%)
  modular: boolean;           // モジュラー対応
  connectors: PSUConnector[]; // コネクタ情報
  price: number;
  manufacturer: string;
}

export interface PSUConnector {
  type: '24pin' | '8pin' | '6pin' | '4pin' | 'sata' | 'molex' | 'pcie';
  count: number;
  label?: string;
}

// データ取得・更新関連の型定義

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: 'scraping' | 'api' | 'manual';
  lastUpdated: string;
  status: 'active' | 'inactive' | 'error';
  updateFrequency: number; // 更新頻度（時間）
}

export interface DataUpdateResult {
  sourceId: string;
  success: boolean;
  updatedCount: number;
  errorCount: number;
  errors: string[];
  executionTime: number; // ms
  timestamp: string;
}

export interface ExternalPartData {
  sourceId: string;
  externalId: string;
  name: string;
  price: number;
  url: string;
  imageUrl?: string;
  specifications: Record<string, any>;
  availability: boolean;
  rating?: number;
  reviewCount?: number;
  lastScraped: string;
}

// 互換性チェック関連（Phase 2で後実装）

export interface CompatibilityRule {
  id: string;
  name: string;
  category1: PartCategory;
  category2: PartCategory;
  checkFunction: string; // 関数名
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  warnings: CompatibilityWarning[];
  score: number; // 0-100の互換性スコア
}

export interface CompatibilityWarning {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedParts: string[];
  solution?: string;
}

// 検索・フィルタ関連（Phase 2で後実装）

export interface SearchFilter {
  category?: PartCategory[];
  priceRange?: {min: number; max: number};
  manufacturer?: string[];
  powerRange?: {min: number; max: number};
  keywords?: string;
  sortBy?: 'price' | 'power' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
  onlyAvailable?: boolean;
}

export interface SearchResult {
  parts: Part[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  filters: SearchFilter;
}

// ストア状態の型定義

export interface AppState {
  // Phase 1 状態
  currentConfig: PCConfiguration;
  savedConfigs: PCConfiguration[];
  budget: number;
  
  // Phase 2 新機能状態
  powerCalculation: PowerCalculationResult | null;
  dataUpdateStatus: Record<string, DataUpdateResult>;
  searchFilters: SearchFilter;
  searchResults: SearchResult | null;
  
  // UI状態
  activeTab: 'builder' | 'power' | 'compatibility' | 'search';
  isLoading: boolean;
  errors: string[];
}

// ユーティリティ型

export type PartUpdate = Partial<Part> & {id: string};
export type ConfigUpdate = Partial<PCConfiguration> & {id: string};
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
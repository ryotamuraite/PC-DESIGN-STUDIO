// src/types/index.ts
// メイン型定義ファイル
import { PowerCalculationResult } from '@/types';

// 電力関連型をエクスポート
export * from './power';

// パーツカテゴリ定義
export type PartCategory = 
  | 'cpu' 
  | 'gpu' 
  | 'motherboard' 
  | 'memory' 
  | 'storage' 
  | 'psu' 
  | 'case' 
  | 'cooler' 
  | 'monitor'
  | 'other';

// 基本パーツ情報
export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  price: number;
  manufacturer: string;
  specifications: Record<string, string | number | boolean>;
  availability?: boolean;
  rating?: number;
  reviewCount?: number;
  lastScraped?: string;
}

// PC構成
export interface PCConfiguration {
  id: string;
  name: string;
  parts: Partial<Record<PartCategory, Part>>;
  totalPrice: number;
  budget?: number;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  tags?: string[];
}

// データ更新関連
export interface DataUpdateResult {
  category: PartCategory;
  success: boolean;
  updatedCount: number;
  errors: string[];
  lastUpdate: Date;
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

// Phase 1 で使用されている基本的な設定型
export interface BudgetSettings {
  total: number;
  categories: Partial<Record<PartCategory, number>>;
  currency: 'JPY' | 'USD' | 'EUR';
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  compactMode: boolean;
  showPriceHistory: boolean;
}

// エラーハンドリング
export interface AppError {
  id: string;
  type: 'validation' | 'network' | 'data' | 'compatibility' | 'power';
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// ローカルストレージ用の設定
export interface StorageConfig {
  version: string;
  configurations: PCConfiguration[];
  settings: {
    budget: BudgetSettings;
    ui: UISettings;
  };
  lastBackup?: Date;
}

// Phase 2 でのデータ取得関連
export interface ScrapingConfig {
  sources: {
    name: string;
    url: string;
    enabled: boolean;
    lastUpdate: Date;
  }[];
  updateInterval: number; // 時間単位
  retryCount: number;
  timeout: number; // ミリ秒
}

// 価格履歴追跡
export interface PriceHistory {
  partId: string;
  prices: {
    price: number;
    source: string;
    timestamp: Date;
  }[];
  currentPrice: number;
  lowestPrice: number;
  averagePrice: number;
}

// パフォーマンスベンチマーク（将来の拡張用）
export interface PerformanceBenchmark {
  category: PartCategory;
  partId: string;
  benchmarks: {
    name: string;
    score: number;
    unit: string;
    source: string;
  }[];
  overallScore: number;
  lastUpdated: Date;
}
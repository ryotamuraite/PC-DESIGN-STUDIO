// src/types/index.ts
// メイン型定義ファイル - 統合版

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
  specifications: Record<string, unknown>;
  availability?: 'in_stock' | 'out_of_stock' | 'limited';
  rating?: number;
  reviewCount?: number;
  lastScraped?: string;
  model?: string;
  releaseDate?: string | Date;
  popularity?: number;
  url?: string;
}

// PC構成
export interface PCConfiguration {
  id: string;
  name: string;
  parts: Partial<Record<PartCategory, Part | null>>;
  totalPrice: number;
  totalPowerConsumption?: number;
  budget?: number;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  tags?: string[];
}

// PC構成の別名（互換性のため）
export type PCConfig = PCConfiguration;

// 電力関連型をエクスポート
export * from './power';
// 互換性関連型をエクスポート
export * from './compatibility';
// 検索関連型をエクスポート
export * from './search';

// 設定ストアの型定義
export interface ConfigStore {
  currentConfig: PCConfig;
  savedConfigs: PCConfig[];
  budget: number;
  
  setBudget: (budget: number) => void;
  addPart: (category: PartCategory, part: Part) => void;
  removePart: (category: PartCategory) => void;
  saveConfig: (name: string) => void;
  loadConfig: (id: string) => void;
  deleteConfig: (id: string) => void;
}

// データ更新関連
export interface DataUpdateResult {
  category: PartCategory;
  success: boolean;
  updatedCount: number;
  errors: string[];
  lastUpdate: Date;
}

// ストア状態の型定義
export interface AppState {
  currentConfig: PCConfiguration;
  savedConfigs: PCConfiguration[];
  budget: number;
  
  // Phase 2 新機能状態
  powerCalculation: import('./power').PowerCalculationResult | null;
  dataUpdateStatus: Record<string, DataUpdateResult>;
  searchFilters: import('./search').SearchFilters;
  searchResults: import('./search').SearchResult | null;
  
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

// src/types/index.ts
// メイン型定義ファイル - Phase 2統合版：新サービス群対応

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

// 基本パーツ情報（Phase 2拡張）
export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  price: number;
  manufacturer: string;
  brand?: string;                    // 🔧 修正: ブランド名追加
  powerConsumption?: number;         // 🔧 修正: 消費電力追加
  specifications: Record<string, unknown>;
  availability?: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' | 'pre_order';
  rating?: number;
  reviewCount?: number;
  lastScraped?: string;
  model?: string;
  releaseDate?: string | Date;
  popularity?: number;
  url?: string;
  
  // Phase 2 新フィールド
  trendScore?: number;
  confidence?: number;
  sources?: string[];
  priceHistory?: PriceHistoryEntry[];
  stockHistory?: StockHistoryEntry[];
  alerts?: (PriceAlert | StockAlert | NewProductAlert)[];
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

// ===========================================
// 💰 Phase 2: 価格サービス関連型
// ===========================================

export interface PriceData {
  partId: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lowestPrice?: number;
  highestPrice?: number;
  averagePrice?: number;
  priceHistory: PriceHistoryEntry[];
  sources: PriceSource[];
  lastUpdated: string;
  confidence: number; // 0-1 価格データの信頼度
}

export interface PriceHistoryEntry {
  price: number;
  timestamp: string;
  source: string;
}

export interface PriceSource {
  name: string;
  price: number;
  url?: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  shippingCost?: number;
  shippingDays?: number;
  lastChecked: string;
  reliability: number; // 0-1 ソースの信頼性
}

export interface PriceAlert {
  partId: string;
  targetPrice: number;
  currentPrice: number;
  alertType: 'price_drop' | 'price_rise' | 'availability' | 'threshold';
  triggeredAt: string;
  message: string;
}

// ===========================================
// 📦 Phase 2: 在庫サービス関連型
// ===========================================

export interface StockData {
  partId: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' | 'pre_order';
  stockCount?: number;
  estimatedRestockDate?: string;
  stockHistory: StockHistoryEntry[];
  sources: StockSource[];
  lastUpdated: string;
  confidence: number; // 0-1 在庫データの信頼度
  alerts: StockAlert[];
}

export interface StockHistoryEntry {
  availability: string;
  stockCount?: number;
  timestamp: string;
  source: string;
  event: 'restock' | 'out_of_stock' | 'limited' | 'price_change';
}

export interface StockSource {
  name: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' | 'pre_order';
  stockCount?: number;
  url?: string;
  estimatedRestockDate?: string;
  lastChecked: string;
  reliability: number; // 0-1 ソースの信頼性
  responseTime: number; // ms
}

export interface StockAlert {
  type: 'restock' | 'low_stock' | 'out_of_stock' | 'price_drop_with_stock';
  partId: string;
  message: string;
  triggeredAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: string;
}

export interface StockMonitorConfig {
  enabled: boolean;
  checkInterval: number; // ms
  lowStockThreshold: number;
  alertOnRestock: boolean;
  alertOnOutOfStock: boolean;
  priorityParts: string[]; // 優先監視パーツ
}

// ===========================================
// 🆕 Phase 2: 新製品サービス関連型
// ===========================================

export interface NewProductData {
  id: string;
  name: string;
  category: PartCategory;
  manufacturer: string;
  price: number;
  releaseDate: string;
  discoveredAt: string;
  sources: NewProductSource[];
  specifications: Record<string, string | number | boolean>; // 🔧 any → 具体的な型に修正
  availability: 'pre_order' | 'in_stock' | 'coming_soon';
  popularity: number; // 0-100
  trendScore: number; // 0-100 トレンド度
  confidence: number; // 0-1 データの信頼度
  alerts: NewProductAlert[];
}

export interface NewProductSource {
  name: string;
  url?: string;
  price?: number;
  availability: string;
  releaseDate?: string;
  lastChecked: string;
  reliability: number;
}

export interface NewProductAlert {
  type: 'new_release' | 'price_announcement' | 'availability_change' | 'trending';
  productId: string;
  message: string;
  triggeredAt: string;
  severity: 'info' | 'medium' | 'high';
  actionSuggested?: string;
}

export interface TrendAnalysis {
  category: PartCategory;
  trendingKeywords: string[];
  emergingManufacturers: string[];
  priceRanges: { min: number; max: number; average: number };
  releaseFrequency: number; // 製品リリース頻度（月あたり）
  lastUpdated: string;
}

export interface ProductFilter {
  categories?: PartCategory[];
  manufacturers?: string[];
  priceRange?: { min: number; max: number };
  releasedAfter?: string;
  minPopularity?: number;
  minTrendScore?: number;
}

// ===========================================
// 🛡️ Phase 2: セキュリティサービス関連型
// ===========================================

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  waitTime?: number;
  suggestions?: string[];
}

export interface RateLimitStatus {
  source: string;
  requestsInLastMinute: number;
  requestsInLastHour: number;
  isNearLimit: boolean;
  nextAvailableTime?: number;
}

export interface BotPreventionMeasures {
  userAgent: string;
  referer?: string;
  acceptLanguage: string;
  randomDelay: number;
  sessionId: string;
  fingerprint: string;
}

export interface AuditLogEntry {
  timestamp: string;
  source: string;
  action: string;
  partId?: string;
  result: 'success' | 'failure' | 'blocked';
  reason?: string;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityStats {
  activeSessions: number;
  totalRequests: number;
  errorRate: number;
  blockedRequests: number;
  topSources: Array<{ source: string; requests: number }>;
}

// ===========================================
// 📊 Phase 2: 統合APIサービス関連型
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
  source: string;
}

export interface ComprehensiveUpdateResult {
  priceUpdates: ApiResponse<PriceUpdate[]>;
  stockUpdates: ApiResponse<StockInfo[]>;
  newProducts: Map<PartCategory, Part[]>;
  summary: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: string;
    responseTime?: number;
    errorRate?: number;
    lastCheck?: string;
  }>; // 🔧 any → サービス情報の具体的な型
  responseTime: number;
  phase2Features: {
    priceService: string;
    stockService: string;
    newProductService: string;
    securityService: string;
  };
  recommendations: string[];
}

export interface ServiceStatistics {
  priceService: {
    cacheSize: number;
    errorCount: number;
    enabledSources: number;
    lastUpdate: string;
  }; // 🔧 any → 価格サービス統計の具体的な型
  stockService: {
    monitoring: boolean;
    cacheSize: number;
    priorityParts: number;
    lastCheck: string;
  }; // 🔧 any → 在庫サービス統計の具体的な型
  newProductService: {
    monitoring: boolean;
    cachedProducts: number;
    cachedTrends: number;
    lastDiscovery: string;
  }; // 🔧 any → 新製品サービス統計の具体的な型
  securityService: {
    activeSessions: number;
    totalRequests: number;
    errorRate: number;
    blockedRequests: number;
  }; // 🔧 any → セキュリティサービス統計の具体的な型
}

// ===========================================
// 📋 Phase 2: 監視・アラート関連型
// ===========================================

export interface MonitoringConfig {
  stockMonitoring: StockMonitorConfig;
  newProductMonitoring: {
    enabled: boolean;
    categories: PartCategory[];
    checkInterval: number;
  };
  priceMonitoring: {
    enabled: boolean;
    thresholds: Record<string, number>;
    alertOnSignificantChange: boolean;
  };
}

export interface AlertManager {
  priceAlerts: PriceAlert[];
  stockAlerts: StockAlert[];
  newProductAlerts: NewProductAlert[];
  systemAlerts: SystemAlert[];
}

export interface SystemAlert {
  type: 'security' | 'performance' | 'error' | 'maintenance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  details?: Record<string, string | number | boolean | string[]>; // 🔧 any → 具体的な型に修正
}

// ===========================================
// 📊 Phase 2: ストア状態拡張
// ===========================================

// 設定ストアの型定義（Phase 2拡張）
export interface ConfigStore {
  currentConfig: PCConfig;
  savedConfigs: PCConfig[];
  budget: number;
  
  // Phase 2 新機能
  monitoringConfig: MonitoringConfig;
  alertManager: AlertManager;
  serviceStats: ServiceStatistics | null;
  securityStatus: {
    rateLimits: RateLimitStatus[];
    securityStats: SecurityStats;
    auditLog: AuditLogEntry[];
  };
  
  setBudget: (budget: number) => void;
  addPart: (category: PartCategory, part: Part) => void;
  removePart: (category: PartCategory) => void;
  saveConfig: (name: string) => void;
  loadConfig: (id: string) => void;
  deleteConfig: (id: string) => void;
  
  // Phase 2 新メソッド
  updateMonitoringConfig: (config: Partial<MonitoringConfig>) => void;
  addAlert: (alert: PriceAlert | StockAlert | NewProductAlert | SystemAlert) => void;
  clearAlerts: (type?: string) => void;
  updateServiceStats: (stats: ServiceStatistics) => void;
}

// データ更新関連（Phase 2拡張）
export interface DataUpdateResult {
  category: PartCategory;
  success: boolean;
  updatedCount: number;
  errors: string[];
  lastUpdate: Date;
  
  // Phase 2 新フィールド
  dataType: 'price' | 'stock' | 'new_product' | 'comprehensive';
  confidence: number;
  sources: string[];
  duration: number;
  securityChecks: {
    passed: boolean;
    blockedRequests: number;
    rateLimitHits: number;
  };
}

// ストア状態の型定義（Phase 2拡張）
export interface AppState {
  currentConfig: PCConfiguration;
  savedConfigs: PCConfiguration[];
  budget: number;
  
  // Phase 2 新機能状態
  powerCalculation: import('./power').PowerCalculationResult | null;
  dataUpdateStatus: Record<string, DataUpdateResult>;
  searchFilters: import('./search').SearchFilters;
  searchResults: import('./search').SearchResult | null;
  
  // Phase 2: サービス状態
  serviceHealth: ServiceHealth | null;
  monitoringStatus: {
    stockMonitoring: boolean;
    newProductMonitoring: boolean;
    priceMonitoring: boolean;
  };
  dataCache: {
    priceData: Map<string, PriceData>;
    stockData: Map<string, StockData>;
    newProductsData: Map<PartCategory, NewProductData[]>;
  };
  alertSummary: {
    unreadCount: number;
    criticalCount: number;
    lastAlert: string | null;
  };
  
  // UI状態（拡張）
  activeTab: 'builder' | 'power' | 'compatibility' | 'search' | 'monitoring' | 'security';
  isLoading: boolean;
  errors: string[];
  
  // Phase 2: パフォーマンス状態
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    lastHealthCheck: string;
  };
}

// ユーティリティ型（Phase 2拡張）
export type PartUpdate = Partial<Part> & {id: string};
export type ConfigUpdate = Partial<PCConfiguration> & {id: string};
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Phase 2: 新ユーティリティ型
export type PriceDataUpdate = Partial<PriceData> & {partId: string};
export type StockDataUpdate = Partial<StockData> & {partId: string};
export type NewProductDataUpdate = Partial<NewProductData> & {id: string};

export type AlertType = PriceAlert | StockAlert | NewProductAlert | SystemAlert;
export type ServiceType = 'price' | 'stock' | 'newProduct' | 'security';
export type MonitoringType = 'stock' | 'newProduct' | 'price' | 'security';

// Phase 2: 統合データ型
export interface IntegratedPartData {
  part: Part;
  priceData?: PriceData;
  stockData?: StockData;
  trends?: TrendAnalysis;
  lastUpdated: string;
  confidence: number;
}

// Phase 1 で使用されている基本的な設定型（Phase 2拡張）
export interface BudgetSettings {
  total: number;
  categories: Partial<Record<PartCategory, number>>;
  currency: 'JPY' | 'USD' | 'EUR';
  
  // Phase 2 新機能
  alertThresholds: {
    overBudgetWarning: number; // 予算超過警告（%）
    priceDropAlert: number; // 価格下落アラート（%）
    significantChange: number; // 有意な変動（%）
  };
  autoUpdate: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    categories: PartCategory[];
  };
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  compactMode: boolean;
  showPriceHistory: boolean;
  
  // Phase 2 新機能
  enableNotifications: boolean;
  enableMonitoring: boolean;
  showSecurityStatus: boolean;
  defaultTab: 'builder' | 'power' | 'compatibility' | 'search' | 'monitoring';
  alertSettings: {
    showPriceAlerts: boolean;
    showStockAlerts: boolean;
    showNewProductAlerts: boolean;
    showSystemAlerts: boolean;
    alertSound: boolean;
  };
}

// エラーハンドリング
export interface AppError {
  id: string;
  type: 'validation' | 'network' | 'data' | 'compatibility' | 'power';
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// ローカルストレージ用の設定（Phase 2拡張）
export interface StorageConfig {
  version: string;
  configurations: PCConfiguration[];
  settings: {
    budget: BudgetSettings;
    ui: UISettings;
    monitoring: MonitoringConfig;
  };
  lastBackup?: Date;
  
  // Phase 2 新機能
  cache: {
    priceData: Array<{partId: string; data: PriceData; expiry: number}>;
    stockData: Array<{partId: string; data: StockData; expiry: number}>;
    newProductsData: Array<{category: PartCategory; data: NewProductData[]; expiry: number}>;
  };
  security: {
    auditLog: AuditLogEntry[];
    rateLimitHistory: Array<{source: string; timestamp: string; requests: number}>;
    lastSecurityCheck: string;
  };
  performance: {
    metrics: Array<{timestamp: string; responseTime: number; successRate: number}>;
    healthHistory: Array<{timestamp: string; status: string; details: Record<string, string | number | boolean>}>; // 🔧 any → 具体的な型に修正
  };
}

// パフォーマンスベンチマーク（Phase 2拡張）
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
  
  // Phase 2 新機能
  trendData: {
    historicalScores: Array<{date: string; score: number}>;
    ranking: number; // カテゴリ内ランキング
    percentile: number; // パーセンタイル
    competitorComparison: Array<{partId: string; score: number; priceDiff: number}>;
  };
  aiInsights: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

// ===========================================
// 💯 Phase 2: 統合エクスポート
// ===========================================

// 電力関連型をエクスポート
export * from './power';
// 互換性関連型をエクスポート
export * from './compatibility';
// 検索関連型をエクスポート
export * from './search';

// 🔧 修正: 重複型定義の整理

// 価格更新情報 (externalApiServiceからコピー)
export interface PriceUpdate {
  partId: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  priceChangePercent: number;
  source: string;
  updatedAt: string;
}

// 在庫情報 (externalApiServiceからコピー)
export interface StockInfo {
  partId: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued' | 'pre_order'; // 🔧 5状態対応
  stockCount?: number;
  estimatedRestockDate?: string;
  source: string;
  lastChecked: string;
}

// 互換性のためのエイリアス
export type PriceUpdateLegacy = PriceUpdate;
export type StockInfoLegacy = StockInfo;
export type PartLegacy = Part;
export type PCConfigLegacy = PCConfiguration;

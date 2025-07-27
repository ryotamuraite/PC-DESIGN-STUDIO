// src/types/data.ts
// データ取得・更新機能用の型定義

import { Part } from './index';

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: DataSourceType;
  enabled: boolean;
  priority: number;           // 優先度（1が最高）
  rateLimit: RateLimit;
  lastFetch: Date;
  lastSuccess: Date;
  errorCount: number;
  config: DataSourceConfig;
}

export type DataSourceType = 
  | 'scraping'              // Webスクレイピング
  | 'api'                   // REST API
  | 'csv'                   // CSVファイル
  | 'json'                  // JSONファイル
  | 'rss'                   // RSSフィード
  | 'manual';               // 手動更新

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  backoffMultiplier: number; // 失敗時のバックオフ倍率
}

export interface DataSourceConfig {
  // スクレイピング設定
  selectors?: {
    name: string;
    price: string;
    image: string;
    availability: string;
    specs: Record<string, string>;
  };
  
  // API設定
  apiKey?: string;
  baseUrl?: string;
  endpoints?: Record<string, string>;
  headers?: Record<string, string>;
  
  // 共通設定
  timeout: number;           // タイムアウト（秒）
  retryCount: number;        // リトライ回数
  userAgent?: string;
  proxy?: ProxyConfig;
  
  // データ変換設定
  mapping: DataMapping;
  validation: ValidationRules;
}

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface DataMapping {
  // 外部データフィールドから内部フィールドへのマッピング
  [externalField: string]: {
    internalField: string;
    transform?: DataTransform;
    required?: boolean;
    defaultValue?: string | number | boolean | null; // 修正: any → 適切な型
  };
}

export interface DataTransform {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'custom';
  regex?: string;            // 正規表現による抽出
  replacePattern?: {
    from: string;
    to: string;
  };
  multiplier?: number;       // 数値変換時の倍率
  dateFormat?: string;       // 日付フォーマット
  customFunction?: string;   // カスタム変換関数名
}

export interface ValidationRules {
  required: string[];        // 必須フィールド
  patterns: Record<string, string>; // フィールドごとの正規表現
  ranges: Record<string, {   // 数値の範囲
    min?: number;
    max?: number;
  }>;
  customValidation?: string; // カスタム検証関数名
}

// データ取得結果
export interface FetchResult {
  source: string;
  success: boolean;
  fetchedAt: Date;
  duration: number;          // 取得時間（ミリ秒）
  recordCount: number;
  errors: FetchError[];
  warnings: FetchWarning[];
  data: Part[];
  metadata: FetchMetadata;
}

export interface FetchError {
  type: FetchErrorType;
  message: string;
  field?: string;
  record?: number;
  details?: Record<string, unknown>; // 修正: any → Record<string, unknown>
}

export interface FetchWarning {
  type: 'data_quality' | 'compatibility' | 'performance';
  message: string;
  field?: string;
  record?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface FetchMetadata {
  source: string;
  version: string;
  timestamp: Date;
  checksum?: string;
  compression?: string;
  encoding?: string;
}

export type FetchErrorType =
  | 'network'               // ネットワークエラー
  | 'timeout'               // タイムアウト
  | 'authentication'        // 認証エラー
  | 'rate_limit'           // レート制限
  | 'parsing'              // パースエラー
  | 'validation'           // バリデーションエラー
  | 'transformation'       // 変換エラー
  | 'unknown';             // 不明なエラー

// データ処理・変換
export interface DataProcessor {
  process(data: Record<string, unknown>[], config: DataProcessorConfig): Promise<ProcessingResult>;
  validate(data: Record<string, unknown>[], rules: ValidationRules): Promise<ValidationResult>;
  transform(data: Record<string, unknown>[], mapping: DataMapping): Promise<Record<string, unknown>[]>;
  export(data: Part[], format: ExportFormat): Promise<Blob>; // 修正: any → Part[]
}

export interface ProcessingResult {
  success: boolean;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  warnings: ProcessingWarning[];
  errors: ProcessingError[];
  data: Part[];
  metadata: ProcessingMetadata;
}

export interface ProcessingWarning {
  type: 'data_quality' | 'compatibility' | 'performance';
  message: string;
  field?: string;
  record?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface ProcessingError {
  type: 'validation' | 'transformation' | 'mapping' | 'system';
  message: string;
  field?: string;
  record?: number;
  originalValue?: string | number | boolean;
}

export interface ProcessingMetadata {
  startTime: Date;
  endTime: Date;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

// バリデーション結果
export interface ValidationResult {
  valid: boolean;
  errors: ValidationFailure[];
  warnings: ValidationWarning[];
  statistics: ValidationStatistics;
}

export interface ValidationFailure {
  field: string;
  record: number;
  rule: string;
  message: string;
  value: string | number | boolean | null;
  expected?: string | number | boolean | null;
  details?: Record<string, unknown>; // 修正: any → Record<string, unknown>
  context?: Record<string, unknown>; // 修正: any → Record<string, unknown>
}

export interface ValidationWarning {
  field: string;
  record: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationStatistics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  warningRecords: number;
  fieldStatistics: Record<string, FieldStatistics>;
}

export interface FieldStatistics {
  totalValues: number;
  nullValues: number;
  uniqueValues: number;
  validValues: number;
  invalidValues: number;
  averageLength?: number;
  minValue?: number;
  maxValue?: number;
}

export interface DataProcessorConfig {
  batchSize: number;
  maxMemoryUsage: number;
  parallel: boolean;
  skipInvalidRecords: boolean;
  generateStatistics: boolean;
  customValidators: Record<string, string>; // 修正: any → Record<string, string>
  customTransformers: Record<string, string>; // 修正: any → Record<string, string>
}

// データ同期・更新
export interface DataSyncConfig {
  sources: string[];         // 同期対象のデータソースID
  schedule: SyncSchedule;
  conflictResolution: ConflictResolution;
  notifications: NotificationConfig;
  backup: BackupConfig;
}

export interface SyncSchedule {
  enabled: boolean;
  interval: number;          // 分単位
  timeZone: string;
  excludeHours?: number[];   // 除外する時間帯
  maxConcurrentSources: number;
}

export interface ConflictResolution {
  strategy: 'latest' | 'priority' | 'manual' | 'merge';
  priorityOrder?: string[];  // データソースの優先順位
  mergeFields?: string[];    // マージ対象フィールド
}

export interface NotificationConfig {
  onSuccess: boolean;
  onError: boolean;
  onWarning: boolean;
  methods: NotificationMethod[];
  recipients: string[];
}

export type NotificationMethod = 'email' | 'slack' | 'webhook' | 'log';

export interface BackupConfig {
  enabled: boolean;
  retentionDays: number;
  compressionLevel: number;
  encryptionEnabled: boolean;
  storageLocation: string;
}

// データキャッシュ
export interface DataCacheConfig {
  enabled: boolean;
  ttl: number;               // 生存時間（秒）
  maxSize: number;           // 最大キャッシュサイズ（MB）
  strategy: 'lru' | 'lfu' | 'fifo';
  compression: boolean;
}

export interface CacheEntry {
  key: string;
  data: Part[];
  timestamp: Date;
  expiresAt: Date;
  size: number;              // バイト数
  hitCount: number;
  lastAccessed: Date;
}

// データ品質監視
export interface DataQualityMetrics {
  completeness: number;      // 完全性（0-1）
  accuracy: number;          // 正確性（0-1）
  consistency: number;       // 一貫性（0-1）
  timeliness: number;        // 適時性（0-1）
  uniqueness: number;        // 一意性（0-1）
  validity: number;          // 有効性（0-1）
  overallScore: number;      // 総合スコア（0-1）
}

export interface QualityCheck {
  id: string;
  name: string;
  description: string;
  category: QualityCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  lastRun?: Date;
  nextRun?: Date;
  config: QualityCheckConfig;
}

export type QualityCategory = 
  | 'completeness'
  | 'accuracy'
  | 'consistency'
  | 'timeliness'
  | 'uniqueness'
  | 'validity';

export interface QualityCheckConfig {
  thresholds: Record<string, number>;
  rules: QualityRule[];
  notifications: QualityNotificationConfig;
}

export interface QualityRule {
  field: string;
  condition: string;
  expectedValue?: string | number | boolean;
  tolerance?: number;
  weight: number;
}

export interface QualityNotificationConfig {
  enabled: boolean;
  threshold: number;         // 品質スコア閾値
  methods: NotificationMethod[];
  recipients: string[];
}

// エクスポート形式
export type ExportFormat = 
  | 'json'
  | 'csv'
  | 'xlsx'
  | 'xml'
  | 'yaml'
  | 'sql';

// データサービス統合インターフェース
export interface DataService {
  // データソース管理
  addSource(source: DataSource): Promise<void>;
  updateSource(id: string, updates: Partial<DataSource>): Promise<void>;
  removeSource(id: string): Promise<void>;
  getSource(id: string): Promise<DataSource>;
  listSources(): Promise<DataSource[]>;
  
  // データ取得・処理
  fetchData(sourceId: string): Promise<FetchResult>;
  processData(data: Record<string, unknown>[], config: DataProcessorConfig): Promise<ProcessingResult>;
  
  // 同期・更新
  sync(config?: DataSyncConfig): Promise<void>;
  scheduleSync(config: DataSyncConfig): Promise<void>;
  
  // キャッシュ管理
  clearCache(pattern?: string): Promise<void>;
  getCacheStats(): Promise<Record<string, unknown>>;
  
  // 品質監視
  runQualityChecks(): Promise<DataQualityMetrics>;
  getQualityHistory(days?: number): Promise<DataQualityMetrics[]>;
}
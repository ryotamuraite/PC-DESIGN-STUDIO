// src/types/data.ts
// データ取得・更新機能用の型定義

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
    defaultValue?: any;
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
  details?: any;
}

export type FetchErrorType =
  | 'network_error'          // ネットワークエラー
  | 'timeout'               // タイムアウト
  | 'rate_limit'            // レート制限
  | 'parsing_error'         // パースエラー
  | 'validation_error'      // バリデーションエラー
  | 'mapping_error'         // マッピングエラー
  | 'authentication_error'  // 認証エラー
  | 'permission_error'      // 権限エラー
  | 'server_error'          // サーバーエラー
  | 'unknown_error';        // 不明なエラー

export interface FetchWarning {
  type: string;
  message: string;
  field?: string;
  record?: number;
}

export interface FetchMetadata {
  totalPages?: number;
  currentPage?: number;
  hasMore?: boolean;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
  serverInfo?: Record<string, any>;
}

// データ更新スケジュール
export interface UpdateSchedule {
  id: string;
  name: string;
  sources: string[];         // データソースIDの配列
  cron: string;             // Cron式
  timezone: string;
  enabled: boolean;
  lastRun: Date;
  nextRun: Date;
  runCount: number;
  config: ScheduleConfig;
}

export interface ScheduleConfig {
  maxDuration: number;       // 最大実行時間（秒）
  maxConcurrency: number;    // 同時実行数
  notifyOnSuccess: boolean;
  notifyOnError: boolean;
  retryFailedSources: boolean;
  cleanupOldData: boolean;
  backupBeforeUpdate: boolean;
}

// データ更新ログ
export interface UpdateLog {
  id: string;
  scheduleId: string;
  startTime: Date;
  endTime?: Date;
  status: UpdateStatus;
  results: FetchResult[];
  summary: UpdateSummary;
  errors: UpdateError[];
}

export type UpdateStatus =
  | 'running'               // 実行中
  | 'completed'             // 完了
  | 'partial'               // 一部完了
  | 'failed'                // 失敗
  | 'cancelled';            // キャンセル

export interface UpdateSummary {
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  deletedRecords: number;
  duration: number;
}

export interface UpdateError {
  source: string;
  error: FetchError;
  resolved: boolean;
}

// データ品質指標
export interface DataQuality {
  completeness: number;      // 完全性（0-1）
  accuracy: number;         // 正確性（0-1）
  freshness: number;        // 新鮮度（0-1）
  consistency: number;      // 一貫性（0-1）
  validity: number;         // 有効性（0-1）
  overall: number;          // 総合スコア（0-1）
  lastCalculated: Date;
  details: QualityDetails;
}

export interface QualityDetails {
  missingFields: Record<string, number>;    // 欠損フィールド
  invalidValues: Record<string, number>;    // 無効な値
  duplicateRecords: number;                 // 重複レコード
  outliers: Record<string, number>;         // 外れ値
  staleRecords: number;                     // 古いレコード
}

// データ差分
export interface DataDiff {
  added: Part[];
  updated: DataUpdate[];
  deleted: string[];        // 削除されたパーツのID
  summary: DiffSummary;
}

export interface DataUpdate {
  id: string;
  changes: FieldChange[];
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'modified' | 'removed';
}

export interface DiffSummary {
  totalChanges: number;
  addedCount: number;
  updatedCount: number;
  deletedCount: number;
  significantChanges: SignificantChange[];
}

export interface SignificantChange {
  type: 'price_drop' | 'price_increase' | 'availability_change' | 'new_product' | 'discontinued';
  count: number;
  threshold?: number;
}

// 通知設定
export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  conditions: NotificationCondition[];
}

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'slack' | 'discord';
  config: Record<string, any>;
  enabled: boolean;
}

export interface NotificationCondition {
  type: 'error' | 'warning' | 'success' | 'data_change';
  threshold?: number;
  cooldown?: number;        // 通知間隔（秒）
  filter?: Record<string, any>;
}

// データ取得サービスインターface
export interface DataFetcher {
  fetchFromSource(sourceId: string): Promise<FetchResult>;
  fetchAll(sourceIds?: string[]): Promise<FetchResult[]>;
  updateData(diff: DataDiff): Promise<void>;
  validateData(data: Part[]): Promise<ValidationResult>;
  getDataQuality(): Promise<DataQuality>;
  getUpdateHistory(limit?: number): Promise<UpdateLog[]>;
  scheduleUpdate(schedule: UpdateSchedule): Promise<void>;
  cancelSchedule(scheduleId: string): Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  record: number;
  field: string;
  value: any;
  rule: string;
  message: string;
}

export interface ValidationWarning {
  record: number;
  field: string;
  value: any;
  message: string;
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  warningRecords: number;
  errorRate: number;
}
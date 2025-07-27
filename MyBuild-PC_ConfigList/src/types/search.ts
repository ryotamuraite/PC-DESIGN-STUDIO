// src/types/search.ts
// 検索・フィルタ機能用の型定義

import { PartCategory, Part } from './index';

export interface SearchQuery {
  term: string;              // 検索キーワード
  category?: PartCategory;   // カテゴリフィルタ
  filters: SearchFilters;    // 詳細フィルタ
  sortBy: SortOption;       // ソート条件
  sortOrder: 'asc' | 'desc'; // ソート順
  page: number;             // ページ番号
  limit: number;            // 1ページあたりの件数
}

export interface SearchFilters {
  priceRange?: PriceRange;
  brands?: string[];
  availability?: ('in_stock' | 'out_of_stock' | 'limited')[];
  
  // CPU固有フィルタ
  sockets?: string[];
  coreCount?: NumberRange;
  threadCount?: NumberRange;
  baseClock?: NumberRange;
  tdp?: NumberRange;
  integratedGraphics?: boolean;
  
  // GPU固有フィルタ
  memory?: NumberRange;
  gpuMemoryType?: string[];  // 修正: memoryType → gpuMemoryType
  rayTracing?: boolean;
  dlss?: boolean;
  
  // マザーボード固有フィルタ
  chipsets?: string[];
  formFactors?: string[];
  memorySlots?: NumberRange;
  maxMemory?: NumberRange;
  memoryTypes?: string[];
  wifi?: boolean;
  
  // メモリ固有フィルタ
  ramMemoryType?: string[];  // 修正: memoryType → ramMemoryType
  capacity?: NumberRange;
  speed?: NumberRange;
  sticks?: NumberRange;
  rgb?: boolean;
  
  // ストレージ固有フィルタ
  storageTypes?: string[];
  storageCapacity?: NumberRange;
  interfaces?: string[];
  
  // 電源固有フィルタ
  wattage?: NumberRange;
  efficiency?: string[];
  modular?: string[];
  
  // ケース固有フィルタ
  caseFormFactors?: string[];
  temperedGlass?: boolean;
  
  // CPUクーラー固有フィルタ
  coolerTypes?: string[];
  coolerHeight?: NumberRange;
  tdpRating?: NumberRange;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface NumberRange {
  min?: number;
  max?: number;
}

export type SortOption =
  | 'relevance'      // 関連性
  | 'price_low'      // 価格（安い順）
  | 'price_high'     // 価格（高い順）
  | 'name'          // 名前
  | 'brand'         // ブランド
  | 'rating'        // 評価
  | 'popularity'    // 人気
  | 'release_date'  // 発売日
  | 'performance';  // パフォーマンス

export interface SearchResult {
  parts: Part[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  filters: ActiveFilters;
  suggestions: SearchSuggestion[];
  executionTime: number; // ms
}

export interface ActiveFilters {
  [key: string]: FilterValue[];
}

export interface FilterValue {
  value: string | number | boolean;
  label: string;
  count: number; // この条件でのヒット数
}

export interface SearchSuggestion {
  type: 'spelling' | 'alternative' | 'related';
  text: string;
  query: Partial<SearchQuery>;
}

// フィルタオプション定義
export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'number' | 'range' | 'boolean' | 'select' | 'multiselect';
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  categories: PartCategory[]; // このフィルタが適用されるカテゴリ
}

export interface SelectOption {
  value: string | number | boolean;
  label: string;
  count?: number;
}

// 検索履歴
export interface SearchHistory {
  id: string;
  query: SearchQuery;
  timestamp: Date;
  resultCount: number;
}

// 人気検索
export interface PopularSearch {
  query: string;
  category?: PartCategory;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

// 検索統計
export interface SearchStats {
  totalSearches: number;
  popularTerms: PopularSearch[];
  categoryDistribution: Record<PartCategory, number>;
  priceRangeDistribution: Record<string, number>;
  brandDistribution: Record<string, number>;
}

// オートコンプリート
export interface AutocompleteResult {
  suggestions: AutocompleteSuggestion[];
  products: Part[];
  categories: PartCategory[];
  brands: string[];
}

export interface AutocompleteSuggestion {
  text: string;
  type: 'product' | 'brand' | 'category' | 'feature';
  category?: PartCategory;
  count?: number;
  highlight?: [number, number][]; // ハイライト位置
}

// 検索設定
export interface SearchConfig {
  fuzzySearch: boolean;        // あいまい検索
  stemming: boolean;          // 語幹解析
  synonyms: boolean;          // 同義語展開
  autoCorrect: boolean;       // 自動訂正
  personalizedResults: boolean; // パーソナライズ結果
  maxSuggestions: number;     // 最大提案数
  cacheResults: boolean;      // 結果キャッシュ
  cacheDuration: number;      // キャッシュ期間（秒）
}

// 検索インデックス
export interface SearchIndex {
  parts: IndexedPart[];
  terms: SearchTerm[];
  categories: CategoryIndex[];
  brands: BrandIndex[];
  lastUpdated: Date;
  version: string;
}

export interface IndexedPart extends Part {
  searchTerms: string[];      // 検索用キーワード
  popularity: number;         // 人気スコア
  rating?: number;           // 評価
  reviewCount?: number;      // レビュー数
}

export interface SearchTerm {
  term: string;
  partIds: string[];
  frequency: number;
  category?: PartCategory;
}

export interface CategoryIndex {
  category: PartCategory;
  count: number;
  subcategories?: string[];
  popularBrands: string[];
  priceRange: PriceRange;
}

export interface BrandIndex {
  brand: string;
  count: number;
  categories: PartCategory[];
  priceRange: PriceRange;
  popularity: number;
}

// 検索結果のハイライト
export interface SearchHighlight {
  field: string;
  fragments: string[];
  matchedTerms: string[];
}

// 検索パフォーマンス指標
export interface SearchMetrics {
  queryTime: number;          // クエリ実行時間 (ms)
  indexTime: number;          // インデックス検索時間 (ms)
  filterTime: number;         // フィルタ適用時間 (ms)
  sortTime: number;          // ソート時間 (ms)
  totalTime: number;         // 総実行時間 (ms)
  cacheHit: boolean;         // キャッシュヒット
  resultCount: number;       // 結果件数
}

// 検索機能インターフェース
export interface SearchService {
  search(query: SearchQuery): Promise<SearchResult>;
  autocomplete(term: string, limit?: number): Promise<AutocompleteResult>;
  getFilterOptions(category?: PartCategory): Promise<FilterOption[]>;
  getPopularSearches(limit?: number): Promise<PopularSearch[]>;
  saveSearchHistory(query: SearchQuery, resultCount: number): Promise<void>;
  getSearchHistory(limit?: number): Promise<SearchHistory[]>;
  clearSearchHistory(): Promise<void>;
  updateIndex(parts: Part[]): Promise<void>;
  getSearchStats(): Promise<SearchStats>;
}

// フィルタ構築ヘルパー
export interface FilterBuilder {
  reset(): FilterBuilder;
  category(category: PartCategory): FilterBuilder;
  priceRange(min: number, max: number): FilterBuilder;
  brands(brands: string[]): FilterBuilder;
  availability(availability: string[]): FilterBuilder;
  custom(key: string, value: string | number | boolean): FilterBuilder; // 修正: any → 適切な型
  build(): SearchFilters;
}

// 検索クエリ構築ヘルパー
export interface QueryBuilder {
  term(term: string): QueryBuilder;
  category(category: PartCategory): QueryBuilder;
  filters(filters: SearchFilters): QueryBuilder;
  sortBy(field: SortOption, order?: 'asc' | 'desc'): QueryBuilder;
  page(page: number, limit?: number): QueryBuilder;
  build(): SearchQuery;
}
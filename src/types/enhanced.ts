// src/types/enhanced.ts
// 🎯 Phase 3-B: 複数パーツ対応拡張型定義

import { Part, PartCategory } from './index';

// 🆕 複数パーツ対応のための拡張構成型
export interface EnhancedPCConfiguration {
  id: string;
  name: string;
  
  // 🎯 拡張: 単一パーツカテゴリ
  singleParts: {
    cpu: Part | null;
    motherboard: Part | null;
    psu: Part | null;
    case: Part | null;
    cooler: Part | null;
    monitor: Part | null;
  };
  
  // 🎯 拡張: 複数パーツカテゴリ
  multipleParts: {
    storage: Part[];      // 🆕 SSD + HDD等複数ストレージ
    memory: Part[];       // 🆕 複数メモリスロット対応
    gpu: Part[];          // 🆕 マルチGPU対応
    other: Part[];        // 🆕 その他パーツ（工具等）
  };
  
  // 既存フィールド
  totalPrice: number;
  totalPowerConsumption?: number;
  budget?: number;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  tags?: string[];
  
  // 🆕 拡張フィールド
  buildComplexity?: 'beginner' | 'intermediate' | 'advanced';
  estimatedBuildTime?: number; // 組み立て推定時間（分）
  requiredTools?: Tool[];      // 🆕 必要工具リスト
  buildNotes?: string[];       // 🆕 組み立てメモ
}

// 🆕 工具定義
export interface Tool {
  id: string;
  name: string;
  category: 'screwdriver' | 'cable' | 'cleaning' | 'safety' | 'measurement' | 'other';
  description: string;
  required: boolean;      // 必須かオプションか
  price?: number;
  manufacturer?: string;
  purchaseUrl?: string;
  imageUrl?: string;
}

// 🆕 工具カテゴリ定義
export type ToolCategory = 'screwdriver' | 'cable' | 'cleaning' | 'safety' | 'measurement' | 'other';

// 🆕 構成操作用のユーティリティ型
export interface ConfigurationManager {
  // 単一パーツ操作
  setSinglePart: (category: keyof EnhancedPCConfiguration['singleParts'], part: Part | null) => void;
  getSinglePart: (category: keyof EnhancedPCConfiguration['singleParts']) => Part | null;
  
  // 複数パーツ操作
  addMultiplePart: (category: keyof EnhancedPCConfiguration['multipleParts'], part: Part) => void;
  removeMultiplePart: (category: keyof EnhancedPCConfiguration['multipleParts'], partId: string) => void;
  getMultipleParts: (category: keyof EnhancedPCConfiguration['multipleParts']) => Part[];
  setMultipleParts: (category: keyof EnhancedPCConfiguration['multipleParts'], parts: Part[]) => void;
  
  // 工具操作
  addTool: (tool: Tool) => void;
  removeTool: (toolId: string) => void;
  getRequiredTools: () => Tool[];
  getOptionalTools: () => Tool[];
  
  // 計算機能
  calculateTotalPrice: () => number;
  calculateTotalPowerConsumption: () => number;
  estimateBuildTime: () => number;
  
  // バリデーション
  validateConfiguration: () => ConfigurationValidation;
}

// 🆕 構成検証結果
export interface ConfigurationValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: ConfigurationRecommendation[];
}

export interface ValidationError {
  id: string;
  category: 'compatibility' | 'power' | 'budget' | 'missing_parts';
  message: string;
  severity: 'critical' | 'major' | 'minor';
  affectedParts: string[]; // パーツID配列
  suggestions: string[];
}

export interface ValidationWarning {
  id: string;
  category: 'performance' | 'efficiency' | 'cost' | 'compatibility';
  message: string;
  affectedParts: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface ConfigurationRecommendation {
  id: string;
  type: 'upgrade' | 'alternative' | 'addition' | 'optimization';
  title: string;
  description: string;
  estimatedCost: number;
  estimatedBenefit: string;
  priority: 'low' | 'medium' | 'high';
  suggestedParts?: Part[];
}

// 🆕 統計・分析用型
export interface ConfigurationStats {
  totalParts: number;
  categoryBreakdown: Record<string, number>;
  priceBreakdown: Record<string, number>;
  performanceScore: number;      // 0-100 の性能スコア
  valueScore: number;            // 0-100 のコスパスコア
  compatibilityScore: number;    // 0-100 の互換性スコア
  buildDifficultyScore: number;  // 0-100 の組み立て難易度
  powerEfficiencyScore: number;  // 0-100 の電力効率スコア
}

// 🆕 Legacy互換性のためのユーティリティ関数型
export interface LegacyCompatibility {
  // 既存のPCConfigurationを拡張型に変換
  upgradeConfiguration: (legacyConfig: unknown) => EnhancedPCConfiguration;
  
  // 拡張型を既存型に変換（後方互換性）
  downgradeConfiguration: (enhancedConfig: EnhancedPCConfiguration) => unknown;
  
  // 既存コンポーネントとの互換性確保
  extractLegacyParts: (enhancedConfig: EnhancedPCConfiguration) => Record<PartCategory, Part | null>;
}

// 🆕 設定・プリファレンス
export interface UserPreferences {
  defaultBudget: number;
  preferredManufacturers: string[];
  buildExperience: 'beginner' | 'intermediate' | 'advanced';
  prioritizePerformance: boolean;
  prioritizeValue: boolean;
  prioritizeQuietness: boolean;
  prioritizePowerEfficiency: boolean;
  autoValidation: boolean;
  showBuildGuide: boolean;
  currency: 'JPY' | 'USD' | 'EUR';
}

// 🆕 エクスポート用統合型
export interface EnhancedPCBuildingSystem {
  configuration: EnhancedPCConfiguration;
  manager: ConfigurationManager;
  validation: ConfigurationValidation;
  stats: ConfigurationStats;
  preferences: UserPreferences;
  tools: Tool[];
}

// 🎯 実用的なサンプル工具データ
export const COMMON_TOOLS: Tool[] = [
  {
    id: 'screwdriver-phillips',
    name: 'プラスドライバー',
    category: 'screwdriver',
    description: 'マザーボード・電源取り付け用（サイズ: #1, #2）',
    required: true,
    price: 500,
    manufacturer: '工具メーカー'
  },
  {
    id: 'cable-sata',
    name: 'SATAケーブル',
    category: 'cable',
    description: 'ストレージ接続用（追加ストレージ分）',
    required: false,
    price: 300,
    manufacturer: 'ケーブルメーカー'
  },
  {
    id: 'thermal-paste',
    name: 'サーマルペースト',
    category: 'other',
    description: 'CPU・GPUの冷却用（高性能品）',
    required: false,
    price: 1200,
    manufacturer: 'サーマルメーカー'
  },
  {
    id: 'antistatic-wrist',
    name: '静電気防止リストバンド',
    category: 'safety',
    description: 'パーツ保護用（推奨）',
    required: false,
    price: 800,
    manufacturer: '安全用品メーカー'
  }
];

// 🎯 カテゴリ判定ユーティリティ
export const isMultiplePartsCategory = (category: PartCategory): boolean => {
  return ['storage', 'memory', 'gpu', 'other'].includes(category);
};

export const isSinglePartCategory = (category: PartCategory): boolean => {
  return ['cpu', 'motherboard', 'psu', 'case', 'cooler', 'monitor'].includes(category);
};

// 🎯 型ガード関数
export const isEnhancedConfiguration = (config: unknown): config is EnhancedPCConfiguration => {
  return (
    config !== null &&
    typeof config === 'object' &&
    'singleParts' in config &&
    'multipleParts' in config
  );
};

export const isTool = (item: unknown): item is Tool => {
  return (
    item !== null &&
    typeof item === 'object' &&
    'id' in item &&
    'name' in item &&
    'category' in item &&
    'required' in item
  );
};
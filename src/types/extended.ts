// src/types/extended.ts
// ExtendedPCConfiguration型定義 - 複数パーツ対応拡張

import { PCConfiguration, Part, PartCategory } from './index';

// ExtendedPCConfiguration型定義
export interface ExtendedPCConfiguration extends Omit<PCConfiguration, 'parts'> {
  // 拡張: 複数パーツ対応
  parts: {
    cpu: Part | null;
    gpu: Part | null;
    motherboard: Part | null;
    memory: Part | null;
    storage: Part | null;
    psu: Part | null;
    case: Part | null;
    cooler: Part | null;
    monitor: Part | null;
  };
  
  // 複数パーツサポート
  multiParts: {
    memory: Part[];      // 複数メモリスロット
    storage: Part[];     // 複数ストレージ
    gpu: Part[];         // マルチGPU
    caseFans: Part[];    // ケースファン
    other: Part[];       // その他パーツ
  };
  
  // 制約条件
  constraints: {
    budget: number;
    maxPowerConsumption?: number;
    formFactorLimits?: string[];
    preferredBrands?: string[];
    avoidBrands?: string[];
    prioritizePerformance?: boolean;
    prioritizeValue?: boolean;
    prioritizeQuietness?: boolean;
  };
  
  // 互換性チェック結果
  compatibility: {
    overallScore: number;    // 0-100
    issues: CompatibilityIssue[];
    warnings: CompatibilityWarning[];
    lastChecked: Date;
  };
  
  // 計算結果キャッシュ
  calculations?: {
    totalPowerConsumption: number;
    estimatedPerformance: number;
    compatibilityScore: number;
    lastCalculated: Date;
  };
}

// 互換性問題定義
export interface CompatibilityIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'socket' | 'power' | 'size' | 'compatibility';
  message: string;
  affectedParts: string[];
  suggestion?: string;
}

export interface CompatibilityWarning {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  category: PartCategory;
}

// PCConfigurationからExtendedPCConfigurationへの変換関数
export const convertToExtendedConfiguration = (config: PCConfiguration): ExtendedPCConfiguration => {
  return {
    ...config,
    multiParts: {
      memory: [],
      storage: [],
      gpu: [],
      caseFans: [],
      other: []
    },
    constraints: {
      budget: config.budget || 150000,
      prioritizePerformance: false,
      prioritizeValue: false,
      prioritizeQuietness: false,
    },
    compatibility: {
      overallScore: 100,
      issues: [],
      warnings: [],
      lastChecked: new Date()
    },
    calculations: {
      totalPowerConsumption: 0,
      estimatedPerformance: 0,
      compatibilityScore: 100,
      lastCalculated: new Date()
    }
  };
};

// ExtendedPCConfigurationから基本PCConfigurationへの変換
export const convertFromExtendedConfiguration = (config: ExtendedPCConfiguration): PCConfiguration => {
  const { multiParts, constraints, compatibility, calculations, ...baseConfig } = config;
  return baseConfig;
};

// 型ガード関数
export const isExtendedPCConfiguration = (config: unknown): config is ExtendedPCConfiguration => {
  return (
    config !== null &&
    typeof config === 'object' &&
    'multiParts' in config &&
    'constraints' in config &&
    'compatibility' in config
  );
};

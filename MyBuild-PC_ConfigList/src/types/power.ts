// src/types/power.ts
// 電源計算用の型定義

export interface PowerCalculationResult {
  totalConsumption: number;    // 総消費電力 (W)
  recommendedPsu: number;      // 推奨電源容量 (W)
  efficiency: number;          // 効率 (0-1)
  loadPercentage: number;      // 負荷率 (0-100)
  headroom: number;           // 余裕 (0-100)
  breakdown: PowerBreakdown;
  warnings: PowerWarning[];
  recommendations: PowerRecommendation[];
}

export interface PowerBreakdown {
  cpu: PowerConsumption;
  gpu: PowerConsumption;
  motherboard: PowerConsumption;
  memory: PowerConsumption;
  storage: PowerConsumption[];
  cooling: PowerConsumption[];
  other: PowerConsumption;
  total: PowerConsumption;
}

export interface PowerConsumption {
  idle: number;        // アイドル時消費電力 (W)
  typical: number;     // 通常時消費電力 (W)
  peak: number;        // ピーク時消費電力 (W)
  component: string;   // コンポーネント名
}

export interface PowerWarning {
  id: string;
  type: PowerWarningType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  value: number;
  threshold: number;
  suggestion?: string;
}

export type PowerWarningType =
  | 'insufficient_capacity'     // 電源容量不足
  | 'high_load_percentage'     // 負荷率が高い
  | 'low_efficiency'           // 効率が悪い
  | 'insufficient_headroom'    // 余裕不足
  | 'connector_shortage'       // コネクタ不足
  | 'future_upgrade_limited';  // 将来のアップグレード制限

export interface PowerRecommendation {
  id: string;
  type: 'psu_upgrade' | 'component_alternative' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue: number;
  recommendedValue: number;
  alternatives?: PowerAlternative[];
  estimatedCost?: number;
}

export interface PowerAlternative {
  partId: string;
  name: string;
  wattage: number;
  efficiency: string;
  price: number;
  improvement: string;
}

// 電源効率マップ
export const PSU_EFFICIENCY_MAP = {
  '80+': 0.80,
  '80+ Bronze': 0.82,
  '80+ Silver': 0.85,
  '80+ Gold': 0.87,
  '80+ Platinum': 0.90,
  '80+ Titanium': 0.92
} as const;

// 負荷率別効率曲線
export interface EfficiencyCurve {
  load20: number;  // 20%負荷時の効率
  load50: number;  // 50%負荷時の効率
  load80: number;  // 80%負荷時の効率
  load100: number; // 100%負荷時の効率
}

// TDP別消費電力データ
export interface TDPData {
  component: string;
  tdp: number;
  idleMultiplier: number;     // アイドル時のTDPに対する比率
  typicalMultiplier: number;  // 通常時のTDPに対する比率
  peakMultiplier: number;     // ピーク時のTDPに対する比率
}

// システム負荷シナリオ
export interface LoadScenario {
  name: string;
  description: string;
  cpuLoad: number;    // CPU負荷率 (0-1)
  gpuLoad: number;    // GPU負荷率 (0-1)
  systemLoad: number; // システム全体負荷率 (0-1)
}

export const LOAD_SCENARIOS: LoadScenario[] = [
  {
    name: 'idle',
    description: 'アイドル時',
    cpuLoad: 0.05,
    gpuLoad: 0.0,
    systemLoad: 0.1
  },
  {
    name: 'office',
    description: 'オフィス作業',
    cpuLoad: 0.15,
    gpuLoad: 0.05,
    systemLoad: 0.2
  },
  {
    name: 'gaming',
    description: 'ゲーミング',
    cpuLoad: 0.6,
    gpuLoad: 0.85,
    systemLoad: 0.8
  },
  {
    name: 'rendering',
    description: 'レンダリング',
    cpuLoad: 0.95,
    gpuLoad: 0.95,
    systemLoad: 1.0
  },
  {
    name: 'stress_test',
    description: 'ストレステスト',
    cpuLoad: 1.0,
    gpuLoad: 1.0,
    systemLoad: 1.0
  }
];

// 電源計算設定
export interface PowerCalculationConfig {
  scenario: string;              // 使用シナリオ
  safetyMargin: number;         // 安全マージン (デフォルト: 0.2 = 20%)
  futureUpgradeMargin: number;  // 将来のアップグレード用マージン
  includePeripherals: boolean;  // 周辺機器を含む
  peripheralsPower: number;     // 周辺機器の消費電力
}

// デフォルト消費電力データ
export interface DefaultPowerData {
  motherboard: {
    atx: number;
    microATX: number;
    miniITX: number;
  };
  memory: {
    ddr4: number;    // スティック1本あたり
    ddr5: number;
  };
  storage: {
    ssd25: number;
    hdd35: number;
    nvme: number;
  };
  cooling: {
    airCooler: number;
    aio120: number;
    aio240: number;
    aio280: number;
    aio360: number;
    caseFan120: number;
    caseFan140: number;
  };
  other: {
    usb: number;        // USBデバイス1つあたり
    rgb: number;        // RGBライティング
    networking: number; // ネットワークカード
  };
}

// 電源コネクタ要件チェック
export interface PowerConnectorCheck {
  required: PowerConnectorRequirements;
  available: PowerConnectorAvailable;
  sufficient: boolean;
  missing: string[];
}

export interface PowerConnectorRequirements {
  motherboard: string;    // '24pin'
  cpu: string[];         // ['8pin'] or ['4+4pin']
  gpu: string[];         // ['8pin', '6+2pin']
  sata: number;          // SATA電源数
  molex: number;         // Molex電源数
}

export interface PowerConnectorAvailable {
  motherboard: string[];
  cpu: string[];
  pcie: string[];
  sata: number;
  molex: number;
  floppy: number;
}

// 電源計算ユーティリティ関数の型
export type PowerCalculator = (
  parts: Partial<Record<PartCategory, Part | Part[]>>,
  config?: PowerCalculationConfig
) => Promise<PowerCalculationResult>;

// 電源データベース
export interface PowerDatabase {
  tdpData: Record<string, TDPData>;
  defaultPowerData: DefaultPowerData;
  efficiencyCurves: Record<string, EfficiencyCurve>;
  lastUpdated: Date;
  version: string;
}
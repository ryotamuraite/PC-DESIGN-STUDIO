// src/types/index.ts
// パーツカテゴリ
export type PartCategory = 
  | 'cpu' 
  | 'motherboard' 
  | 'memory' 
  | 'storage' 
  | 'gpu' 
  | 'psu' 
  | 'case' 
  | 'cooling';

// スペック情報の型を明確に定義
export interface PartSpecs {
  // 共通プロパティ
  [key: string]: string | number | boolean | undefined;
  
  // CPU用
  cores?: number;
  threads?: number;
  baseClock?: string;
  boostClock?: string;
  socket?: string;
  
  // GPU用
  memory?: string;
  coreClock?: string;
  memoryClock?: string;
  
  // メモリ用
  capacity?: string;
  speed?: string;
  timings?: string;
  
  // ストレージ用
  interface?: string;
  readSpeed?: string;
  writeSpeed?: string;
  
  // 電源用
  wattage?: number;
  efficiency?: string;
  modular?: string;
}

// パーツデータの型
export interface Part {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: PartCategory;
  specs: PartSpecs;  // Record<string, any> から変更
  powerConsumption?: number; // W
  image?: string;
}

// 構成データの型
export interface PCConfig {
  id: string;
  name: string;
  budget: number;
  parts: Partial<Record<PartCategory, Part>>;
  totalPrice: number;
  totalPowerConsumption: number;
  createdAt: Date;
  updatedAt: Date;
}

// ストアの状態型
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
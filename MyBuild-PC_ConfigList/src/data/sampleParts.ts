// src/data/sampleParts.ts
import type { Part } from '@/types/index';

export const sampleParts: Part[] = [
  // CPU
  {
    id: 'cpu-1',
    name: 'Intel Core i5-13400F',
    brand: 'Intel',
    price: 32000,
    category: 'cpu',
    powerConsumption: 154,
    specs: {
      cores: 10,
      threads: 16,
      baseClock: '2.5GHz',
      boostClock: '4.6GHz',
      socket: 'LGA1700',
    },
  },
  {
    id: 'cpu-2',
    name: 'AMD Ryzen 5 7600X',
    brand: 'AMD',
    price: 35000,
    category: 'cpu',
    powerConsumption: 105,
    specs: {
      cores: 6,
      threads: 12,
      baseClock: '4.7GHz',
      boostClock: '5.3GHz',
      socket: 'AM5',
    },
  },
  
  // GPU
  {
    id: 'gpu-1',
    name: 'NVIDIA GeForce RTX 4060',
    brand: 'NVIDIA',
    price: 45000,
    category: 'gpu',
    powerConsumption: 115,
    specs: {
      memory: '8GB GDDR6',
      coreClock: '1830MHz',
      memoryClock: '17000MHz',
    },
  },
  {
    id: 'gpu-2',
    name: 'AMD Radeon RX 7600',
    brand: 'AMD',
    price: 40000,
    category: 'gpu',
    powerConsumption: 165,
    specs: {
      memory: '8GB GDDR6',
      coreClock: '2250MHz',
      memoryClock: '18000MHz',
    },
  },

  // メモリ
  {
    id: 'memory-1',
    name: 'Corsair Vengeance LPX 16GB (8GB×2)',
    brand: 'Corsair',
    price: 12000,
    category: 'memory',
    powerConsumption: 5,
    specs: {
      capacity: '16GB',
      speed: 'DDR4-3200',
      timings: 'CL16',
    },
  },

  // ストレージ
  {
    id: 'storage-1',
    name: 'Samsung 980 1TB NVMe SSD',
    brand: 'Samsung',
    price: 15000,
    category: 'storage',
    powerConsumption: 6,
    specs: {
      capacity: '1TB',
      interface: 'PCIe 3.0 x4',
      readSpeed: '3500MB/s',
      writeSpeed: '3000MB/s',
    },
  },

  // 電源
  {
    id: 'psu-1',
    name: 'Corsair RM650x 650W',
    brand: 'Corsair',
    price: 18000,
    category: 'psu',
    specs: {
      wattage: 650,
      efficiency: '80 PLUS Gold',
      modular: 'フルモジュラー',
    },
  },
];

// カテゴリ別にデータを取得するヘルパー関数
export const getPartsByCategory = (category: string) =>
  sampleParts.filter((part) => part.category === category);

// カテゴリの日本語名マッピング
export const categoryNames: Record<string, string> = {
  cpu: 'CPU',
  motherboard: 'マザーボード',
  memory: 'メモリ',
  storage: 'ストレージ',
  gpu: 'グラフィックボード',
  psu: '電源ユニット',
  case: 'PCケース',
  cooling: 'CPUクーラー',
};
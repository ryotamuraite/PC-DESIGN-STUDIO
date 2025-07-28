// src/data/sampleParts.ts
import type { Part } from '@/types/index';

export const sampleParts: Part[] = [
  // CPU
  {
    id: 'cpu-1',
    name: 'Intel Core i5-13400F',
    category: 'cpu',
    price: 32000,
    manufacturer: 'Intel',
    specifications: {
      cores: 10,
      threads: 16,
      baseClock: '2.5GHz',
      boostClock: '4.6GHz',
      socket: 'LGA1700',
      tdp: 154,
      power: 154,
      architecture: 'Raptor Lake'
    },
    availability: true,
    rating: 4.5,
    reviewCount: 1250
  },
  {
    id: 'cpu-2',
    name: 'AMD Ryzen 5 7600X',
    category: 'cpu',
    price: 35000,
    manufacturer: 'AMD',
    specifications: {
      cores: 6,
      threads: 12,
      baseClock: '4.7GHz',
      boostClock: '5.3GHz',
      socket: 'AM5',
      tdp: 105,
      power: 105,
      architecture: 'Zen 4'
    },
    availability: true,
    rating: 4.7,
    reviewCount: 890
  },
  
  // マザーボード
  {
    id: 'motherboard-1',
    name: 'ASUS PRIME B760M-A',
    category: 'motherboard',
    price: 18000,
    manufacturer: 'ASUS',
    specifications: {
      socket: 'LGA1700',
      chipset: 'B760',
      formFactor: 'mATX',
      memoryType: ['DDR4', 'DDR5'],
      maxMemory: 128,
      memorySlots: 4,
      pciSlots: 2,
      m2Slots: 2,
      usbPorts: 8,
      ethernetPorts: 1,
      cpuPowerConnector: '8pin',
      power: 50
    },
    availability: true,
    rating: 4.3,
    reviewCount: 560
  },
  {
    id: 'motherboard-2',
    name: 'MSI B650M PRO-VDH WiFi',
    category: 'motherboard',
    price: 16000,
    manufacturer: 'MSI',
    specifications: {
      socket: 'AM5',
      chipset: 'B650',
      formFactor: 'mATX',
      memoryType: ['DDR5'],
      maxMemory: 128,
      memorySlots: 4,
      pciSlots: 2,
      m2Slots: 2,
      usbPorts: 10,
      ethernetPorts: 1,
      cpuPowerConnector: '8pin',
      power: 45
    },
    availability: true,
    rating: 4.4,
    reviewCount: 420
  },
  
  // GPU
  {
    id: 'gpu-1',
    name: 'NVIDIA GeForce RTX 4060',
    category: 'gpu',
    price: 45000,
    manufacturer: 'NVIDIA',
    specifications: {
      memory: '8GB GDDR6',
      memoryBus: 128,
      coreClock: 1830,
      memoryClock: 17000,
      powerConnectors: ['8pin'],
      power: 115,
      tdp: 115,
      length: 244,
      width: 112,
      height: 40,
      pciVersion: 'PCIe 4.0',
      slots: 2
    },
    availability: true,
    rating: 4.2,
    reviewCount: 2100
  },
  {
    id: 'gpu-2',
    name: 'AMD Radeon RX 7600',
    category: 'gpu',
    price: 40000,
    manufacturer: 'AMD',
    specifications: {
      memory: '8GB GDDR6',
      memoryBus: 128,
      coreClock: 2250,
      memoryClock: 18000,
      powerConnectors: ['8pin'],
      power: 165,
      tdp: 165,
      length: 258,
      width: 124,
      height: 50,
      pciVersion: 'PCIe 4.0',
      slots: 2
    },
    availability: true,
    rating: 4.1,
    reviewCount: 1800
  },

  // メモリ
  {
    id: 'memory-1',
    name: 'Corsair Vengeance LPX 16GB (8GB×2)',
    category: 'memory',
    price: 12000,
    manufacturer: 'Corsair',
    specifications: {
      capacity: 16,
      totalCapacity: 16,
      type: 'DDR4',
      speed: 3200,
      timings: 'CL16',
      voltage: 1.35,
      modules: 2,
      moduleCapacity: 8,
      height: 31,
      power: 5
    },
    availability: true,
    rating: 4.6,
    reviewCount: 3200
  },
  {
    id: 'memory-2',
    name: 'G.Skill Trident Z5 32GB (16GB×2)',
    category: 'memory',
    price: 28000,
    manufacturer: 'G.Skill',
    specifications: {
      capacity: 32,
      totalCapacity: 32,
      type: 'DDR5',
      speed: 5600,
      timings: 'CL36',
      voltage: 1.25,
      modules: 2,
      moduleCapacity: 16,
      height: 44,
      power: 8
    },
    availability: true,
    rating: 4.5,
    reviewCount: 1100
  },

  // ストレージ
  {
    id: 'storage-1',
    name: 'Samsung 980 1TB NVMe SSD',
    category: 'storage',
    price: 15000,
    manufacturer: 'Samsung',
    specifications: {
      capacity: '1TB',
      capacityGB: 1000,
      interface: 'PCIe 3.0 x4',
      formFactor: 'M.2 2280',
      readSpeed: 3500,
      writeSpeed: 3000,
      power: 6,
      controller: 'Samsung Pablo'
    },
    availability: true,
    rating: 4.7,
    reviewCount: 4500
  },

  // 電源
  {
    id: 'psu-1',
    name: 'Corsair RM650x 650W',
    category: 'psu',
    price: 18000,
    manufacturer: 'Corsair',
    specifications: {
      wattage: 650,
      efficiency: '80 PLUS Gold',
      modular: 'フルモジュラー',
      formFactor: 'ATX',
      connectors: {
        '24pin': 1,
        '8pin': 2,
        '6pin': 2,
        'sata': 8,
        'molex': 4,
        'pcie': 4
      },
      fanSize: 135,
      length: 160,
      warranty: 10
    },
    availability: true,
    rating: 4.8,
    reviewCount: 2800
  },
  {
    id: 'psu-2',
    name: 'Seasonic Focus GX-550 550W',
    category: 'psu',
    price: 15000,
    manufacturer: 'Seasonic',
    specifications: {
      wattage: 550,
      efficiency: '80 PLUS Gold',
      modular: 'フルモジュラー',
      formFactor: 'ATX',
      connectors: {
        '24pin': 1,
        '8pin': 1,
        '6pin': 2,
        'sata': 6,
        'molex': 3,
        'pcie': 4
      },
      fanSize: 135,
      length: 140,
      warranty: 10
    },
    availability: true,
    rating: 4.7,
    reviewCount: 1900
  },

  // PCケース
  {
    id: 'case-1',
    name: 'Fractal Design Core 1000',
    category: 'case',
    price: 8000,
    manufacturer: 'Fractal Design',
    specifications: {
      formFactor: 'mATX',
      supportedFormFactors: ['mATX', 'Mini-ITX'],
      maxGpuLength: 350,
      maxCoolerHeight: 160,
      maxPsuLength: 200,
      expansionSlots: 4,
      driveBays25: 2,
      driveBays35: 2,
      frontPorts: 2,
      usbPorts: 2,
      fanMounts: 3,
      radiatorSupport: ['120mm', '140mm'],
      power: 20
    },
    availability: true,
    rating: 4.3,
    reviewCount: 850
  },

  // CPUクーラー
  {
    id: 'cooler-1',
    name: 'Noctua NH-U12S',
    category: 'cooler',
    price: 8500,
    manufacturer: 'Noctua',
    specifications: {
      type: 'Air',
      height: 158,
      width: 125,
      depth: 125,
      tdpRating: 165,
      sockets: ['LGA1700', 'LGA1200', 'AM5', 'AM4'],
      fanSize: 120,
      fanSpeed: 1500,
      noiseLevel: 22.4,
      power: 15
    },
    availability: true,
    rating: 4.9,
    reviewCount: 3500
  }
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
  cooler: 'CPUクーラー',
  monitor: 'モニター'
};

// 互換性のあるパーツの組み合わせ例
export const compatibleCombinations = {
  // Intel LGA1700 構成
  intel: {
    cpu: 'cpu-1',
    motherboard: 'motherboard-1',
    memory: 'memory-1', // DDR4対応
    gpu: 'gpu-1',
    psu: 'psu-1',
    case: 'case-1',
    cooler: 'cooler-1'
  },
  // AMD AM5 構成
  amd: {
    cpu: 'cpu-2',
    motherboard: 'motherboard-2',
    memory: 'memory-2', // DDR5対応
    gpu: 'gpu-2',
    psu: 'psu-2',
    case: 'case-1',
    cooler: 'cooler-1'
  }
};

// src/types/parts.ts
// 既存のパーツ型を拡張

export interface BasePart {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl?: string;
  description?: string;
  lastUpdated: Date;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
}

// CPU型定義の拡張
export interface CPU extends BasePart {
  category: 'cpu';
  socket: string;
  cores: number;
  threads: number;
  baseClock: number; // GHz
  boostClock?: number; // GHz
  tdp: number; // W (消費電力計算用)
  integratedGraphics?: string;
  memorySupport: string[]; // ['DDR4-3200', 'DDR5-4800']
  pcieLanes: number;
}

// GPU型定義の拡張
export interface GPU extends BasePart {
  category: 'gpu';
  chipset: string;
  memory: number; // GB
  memoryType: string; // GDDR6, GDDR6X
  coreClock: number; // MHz
  boostClock?: number; // MHz
  tdp: number; // W
  powerConnectors: string[]; // ['8pin', '6pin']
  length: number; // mm
  slots: number; // スロット占有数
  outputs: string[]; // ['HDMI', 'DisplayPort']
  rayTracing: boolean;
  dlss?: boolean;
}

// マザーボード型定義の拡張
export interface Motherboard extends BasePart {
  category: 'motherboard';
  socket: string;
  chipset: string;
  formFactor: 'ATX' | 'micro-ATX' | 'mini-ITX' | 'E-ATX';
  memorySlots: number;
  maxMemory: number; // GB
  memoryType: string[]; // ['DDR4', 'DDR5']
  memorySpeed: number[]; // [3200, 3600, 4000]
  pciSlots: {
    pcie16: number;
    pcie8: number;
    pcie4: number;
    pcie1: number;
  };
  sataConnectors: number;
  m2Slots: number;
  usbPorts: {
    usb2: number;
    usb3: number;
    usbC: number;
  };
  networking: {
    ethernet: boolean;
    wifi: boolean;
    bluetooth: boolean;
  };
  audio: string;
  powerConnectors: string[]; // ['24pin', '8pin', '4pin']
}

// メモリ型定義の拡張
export interface Memory extends BasePart {
  category: 'memory';
  type: 'DDR4' | 'DDR5';
  capacity: number; // GB per stick
  speed: number; // MHz
  timings: string; // CL16-18-18-38
  voltage: number; // V
  sticks: number; // キット内のスティック数
  totalCapacity: number; // 総容量
  heatspreader: boolean;
  rgb: boolean;
}

// ストレージ型定義の拡張
export interface Storage extends BasePart {
  category: 'storage';
  type: 'SSD' | 'HDD' | 'NVMe';
  capacity: number; // GB
  interface: string; // SATA, NVMe, M.2
  formFactor?: string; // 2.5", 3.5", M.2 2280
  readSpeed?: number; // MB/s
  writeSpeed?: number; // MB/s
  endurance?: number; // TBW
  powerConsumption: number; // W
}

// 電源型定義の拡張
export interface PSU extends BasePart {
  category: 'psu';
  wattage: number;
  efficiency: '80+' | '80+ Bronze' | '80+ Silver' | '80+ Gold' | '80+ Platinum' | '80+ Titanium';
  modular: 'non-modular' | 'semi-modular' | 'fully-modular';
  formFactor: 'ATX' | 'SFX' | 'SFX-L';
  connectors: {
    cpu: string[]; // ['8pin', '4+4pin']
    pcie: string[]; // ['8pin', '6+2pin']
    sata: number;
    molex: number;
    floppy: number;
  };
  cables: {
    length: number; // mm
    sleeved: boolean;
  };
  fan: {
    size: number; // mm
    bearing: string;
    rpm: number;
    noise: number; // dB
  };
}

// ケース型定義の拡張
export interface Case extends BasePart {
  category: 'case';
  formFactor: string[]; // ['ATX', 'micro-ATX', 'mini-ITX']
  maxGpuLength: number; // mm
  maxCpuCoolerHeight: number; // mm
  maxPsuLength: number; // mm
  driveBays: {
    ssd25: number;
    hdd35: number;
  };
  expansionSlots: number;
  frontPorts: {
    usb2: number;
    usb3: number;
    usbC: number;
    audio: boolean;
  };
  fans: {
    included: number;
    maxFront: number;
    maxRear: number;
    maxTop: number;
    maxBottom: number;
  };
  radiatorSupport: {
    front: number[]; // [240, 280, 360]
    top: number[];
    rear: number[];
  };
  tempered_glass: boolean;
  rgb: boolean;
}

// CPUクーラー型定義の拡張
export interface CPUCooler extends BasePart {
  category: 'cpu_cooler';
  type: 'air' | 'aio' | 'custom_loop';
  height: number; // mm
  sockets: string[]; // ['LGA1700', 'AM4', 'AM5']
  tdpRating: number; // W
  fans: {
    count: number;
    size: number; // mm
    rpm: number;
    noise: number; // dB
    pwm: boolean;
  };
  radiatorSize?: number; // AIO用 (240, 280, 360)
  rgb: boolean;
}

// 統一パーツ型
export type Part = CPU | GPU | Motherboard | Memory | Storage | PSU | Case | CPUCooler;

// パーツカテゴリ型
export type PartCategory = Part['category'];

// パーツ辞書型
export type PartsDictionary = {
  [K in PartCategory]: Extract<Part, { category: K }>[];
};
// src/data/motherboardSpecs.ts
// 🔧 Phase 2.5: マザーボード仕様データベース - 物理制限精密化

export interface MotherboardSpec {
  socket: string;
  chipset: string;
  formFactor: string;
  physicalLimits: {
    m2Slots: number;
    sataConnectors: number;
    memorySlots: number;
    expansionSlots: number;
    maxMemoryCapacity: number;
    usbPorts: {
      usb2: number;
      usb3: number;
      usbC: number;
    };
  };
  powerRequirements: {
    mainPower: string; // '24pin'
    cpuPower: string[]; // ['8pin', '4pin']
  };
  networking: {
    ethernet: boolean;
    wifi: boolean;
    bluetooth: boolean;
  };
  audio: string;
}

export const motherboardSpecsDatabase: Record<string, MotherboardSpec> = {
  // Intel Z790チップセット
  'Z790': {
    socket: 'LGA1700',
    chipset: 'Z790',
    formFactor: 'ATX',
    physicalLimits: {
      m2Slots: 4,
      sataConnectors: 6,
      memorySlots: 4,
      expansionSlots: 7,
      maxMemoryCapacity: 128,
      usbPorts: {
        usb2: 4,
        usb3: 8,
        usbC: 2
      }
    },
    powerRequirements: {
      mainPower: '24pin',
      cpuPower: ['8pin']
    },
    networking: {
      ethernet: true,
      wifi: true,
      bluetooth: true
    },
    audio: 'Realtek ALC1220'
  },

  // Intel Z690チップセット
  'Z690': {
    socket: 'LGA1700',
    chipset: 'Z690',
    formFactor: 'ATX',
    physicalLimits: {
      m2Slots: 3,
      sataConnectors: 6,
      memorySlots: 4,
      expansionSlots: 7,
      maxMemoryCapacity: 128,
      usbPorts: {
        usb2: 4,
        usb3: 6,
        usbC: 1
      }
    },
    powerRequirements: {
      mainPower: '24pin',
      cpuPower: ['8pin']
    },
    networking: {
      ethernet: true,
      wifi: false,
      bluetooth: false
    },
    audio: 'Realtek ALC897'
  },

  // AMD X670E チップセット
  'X670E': {
    socket: 'AM5',
    chipset: 'X670E',
    formFactor: 'ATX',
    physicalLimits: {
      m2Slots: 4,
      sataConnectors: 8,
      memorySlots: 4,
      expansionSlots: 7,
      maxMemoryCapacity: 128,
      usbPorts: {
        usb2: 4,
        usb3: 10,
        usbC: 2
      }
    },
    powerRequirements: {
      mainPower: '24pin',
      cpuPower: ['8pin', '4pin']
    },
    networking: {
      ethernet: true,
      wifi: true,
      bluetooth: true
    },
    audio: 'Realtek ALC4080'
  },

  // AMD B650 チップセット（ミドルレンジ）
  'B650': {
    socket: 'AM5',
    chipset: 'B650',
    formFactor: 'ATX',
    physicalLimits: {
      m2Slots: 2,
      sataConnectors: 4,
      memorySlots: 4,
      expansionSlots: 5,
      maxMemoryCapacity: 128,
      usbPorts: {
        usb2: 4,
        usb3: 6,
        usbC: 1
      }
    },
    powerRequirements: {
      mainPower: '24pin',
      cpuPower: ['8pin']
    },
    networking: {
      ethernet: true,
      wifi: false,
      bluetooth: false
    },
    audio: 'Realtek ALC897'
  },

  // Micro-ATX フォームファクター
  'B660M': {
    socket: 'LGA1700',
    chipset: 'B660',
    formFactor: 'micro-ATX',
    physicalLimits: {
      m2Slots: 2,
      sataConnectors: 4,
      memorySlots: 4,
      expansionSlots: 4,
      maxMemoryCapacity: 128,
      usbPorts: {
        usb2: 4,
        usb3: 4,
        usbC: 1
      }
    },
    powerRequirements: {
      mainPower: '24pin',
      cpuPower: ['8pin']
    },
    networking: {
      ethernet: true,
      wifi: false,
      bluetooth: false
    },
    audio: 'Realtek ALC897'
  },

  // Mini-ITX フォームファクター
  'X670E-I': {
    socket: 'AM5',
    chipset: 'X670E',
    formFactor: 'mini-ITX',
    physicalLimits: {
      m2Slots: 2,
      sataConnectors: 2,
      memorySlots: 2,
      expansionSlots: 1,
      maxMemoryCapacity: 64,
      usbPorts: {
        usb2: 2,
        usb3: 4,
        usbC: 1
      }
    },
    powerRequirements: {
      mainPower: '24pin',
      cpuPower: ['8pin']
    },
    networking: {
      ethernet: true,
      wifi: true,
      bluetooth: true
    },
    audio: 'Realtek ALC4080'
  }
};

// マザーボード仕様取得ヘルパー関数
export function getMotherboardSpec(chipset?: string): MotherboardSpec | null {
  if (!chipset) return null;
  return motherboardSpecsDatabase[chipset] || null;
}

// デフォルト仕様（マザーボード未選択時）
export const defaultMotherboardSpec: MotherboardSpec = {
  socket: 'LGA1700',
  chipset: 'Generic',
  formFactor: 'ATX',
  physicalLimits: {
    m2Slots: 2,
    sataConnectors: 4,
    memorySlots: 4,
    expansionSlots: 5,
    maxMemoryCapacity: 64,
    usbPorts: {
      usb2: 4,
      usb3: 4,
      usbC: 1
    }
  },
  powerRequirements: {
    mainPower: '24pin',
    cpuPower: ['8pin']
  },
  networking: {
    ethernet: true,
    wifi: false,
    bluetooth: false
  },
  audio: 'Generic'
};
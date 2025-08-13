// src/data/caseSpecs.ts
// 🔧 Phase 2.5: PCケース仕様データベース - 物理制限精密化

export interface CaseSpec {
  formFactor: string[];
  physicalDimensions: {
    width: number;  // mm
    height: number; // mm
    depth: number;  // mm
  };
  componentLimits: {
    maxGpuLength: number;      // mm
    maxCpuCoolerHeight: number; // mm
    maxPsuLength: number;       // mm
    maxRadiatorLength: number;  // mm
  };
  fanSupport: {
    front: {
      maxFans: number;
      sizes: number[]; // 120, 140mm等
      maxRadiator: number; // mm
    };
    rear: {
      maxFans: number;
      sizes: number[];
      maxRadiator: number;
    };
    top: {
      maxFans: number;
      sizes: number[];
      maxRadiator: number;
    };
    bottom: {
      maxFans: number;
      sizes: number[];
      maxRadiator: number;
    };
    totalMaxFans: number;
  };
  driveBays: {
    ssd25: number;  // 2.5インチSSD/HDD
    hdd35: number;  // 3.5インチHDD
  };
  frontPorts: {
    usb2: number;
    usb3: number;
    usbC: number;
    audio: boolean;
  };
  features: {
    temperedGlass: boolean;
    rgb: boolean;
    toolFree: boolean;
    cableManagement: boolean;
  };
}

export const caseSpecsDatabase: Record<string, CaseSpec> = {
  // フルタワーケース（ハイエンド）
  'full-tower-premium': {
    formFactor: ['E-ATX', 'ATX', 'micro-ATX', 'mini-ITX'],
    physicalDimensions: {
      width: 230,
      height: 550,
      depth: 550
    },
    componentLimits: {
      maxGpuLength: 420,
      maxCpuCoolerHeight: 190,
      maxPsuLength: 250,
      maxRadiatorLength: 420
    },
    fanSupport: {
      front: {
        maxFans: 3,
        sizes: [120, 140],
        maxRadiator: 420
      },
      rear: {
        maxFans: 1,
        sizes: [120, 140],
        maxRadiator: 140
      },
      top: {
        maxFans: 3,
        sizes: [120, 140],
        maxRadiator: 420
      },
      bottom: {
        maxFans: 2,
        sizes: [120],
        maxRadiator: 240
      },
      totalMaxFans: 9
    },
    driveBays: {
      ssd25: 6,
      hdd35: 4
    },
    frontPorts: {
      usb2: 2,
      usb3: 2,
      usbC: 1,
      audio: true
    },
    features: {
      temperedGlass: true,
      rgb: true,
      toolFree: true,
      cableManagement: true
    }
  },

  // ミドルタワーケース（一般的）
  'mid-tower-standard': {
    formFactor: ['ATX', 'micro-ATX', 'mini-ITX'],
    physicalDimensions: {
      width: 210,
      height: 450,
      depth: 450
    },
    componentLimits: {
      maxGpuLength: 350,
      maxCpuCoolerHeight: 165,
      maxPsuLength: 200,
      maxRadiatorLength: 280
    },
    fanSupport: {
      front: {
        maxFans: 2,
        sizes: [120, 140],
        maxRadiator: 280
      },
      rear: {
        maxFans: 1,
        sizes: [120],
        maxRadiator: 120
      },
      top: {
        maxFans: 2,
        sizes: [120, 140],
        maxRadiator: 240
      },
      bottom: {
        maxFans: 0,
        sizes: [],
        maxRadiator: 0
      },
      totalMaxFans: 5
    },
    driveBays: {
      ssd25: 4,
      hdd35: 2
    },
    frontPorts: {
      usb2: 2,
      usb3: 2,
      usbC: 1,
      audio: true
    },
    features: {
      temperedGlass: true,
      rgb: false,
      toolFree: false,
      cableManagement: true
    }
  },

  // Micro-ATXケース（コンパクト）
  'micro-atx-compact': {
    formFactor: ['micro-ATX', 'mini-ITX'],
    physicalDimensions: {
      width: 190,
      height: 380,
      depth: 380
    },
    componentLimits: {
      maxGpuLength: 280,
      maxCpuCoolerHeight: 155,
      maxPsuLength: 160,
      maxRadiatorLength: 240
    },
    fanSupport: {
      front: {
        maxFans: 2,
        sizes: [120],
        maxRadiator: 240
      },
      rear: {
        maxFans: 1,
        sizes: [120],
        maxRadiator: 120
      },
      top: {
        maxFans: 1,
        sizes: [120],
        maxRadiator: 120
      },
      bottom: {
        maxFans: 0,
        sizes: [],
        maxRadiator: 0
      },
      totalMaxFans: 4
    },
    driveBays: {
      ssd25: 2,
      hdd35: 1
    },
    frontPorts: {
      usb2: 1,
      usb3: 2,
      usbC: 0,
      audio: true
    },
    features: {
      temperedGlass: false,
      rgb: false,
      toolFree: false,
      cableManagement: false
    }
  },

  // Mini-ITXケース（超コンパクト）
  'mini-itx-ultra': {
    formFactor: ['mini-ITX'],
    physicalDimensions: {
      width: 170,
      height: 280,
      depth: 350
    },
    componentLimits: {
      maxGpuLength: 240,
      maxCpuCoolerHeight: 130,
      maxPsuLength: 140,
      maxRadiatorLength: 240
    },
    fanSupport: {
      front: {
        maxFans: 1,
        sizes: [120],
        maxRadiator: 120
      },
      rear: {
        maxFans: 1,
        sizes: [120],
        maxRadiator: 120
      },
      top: {
        maxFans: 0,
        sizes: [],
        maxRadiator: 0
      },
      bottom: {
        maxFans: 0,
        sizes: [],
        maxRadiator: 0
      },
      totalMaxFans: 2
    },
    driveBays: {
      ssd25: 2,
      hdd35: 0
    },
    frontPorts: {
      usb2: 0,
      usb3: 2,
      usbC: 1,
      audio: true
    },
    features: {
      temperedGlass: true,
      rgb: false,
      toolFree: true,
      cableManagement: true
    }
  },

  // ゲーミングケース（RGB・高性能）
  'gaming-rgb-tower': {
    formFactor: ['ATX', 'micro-ATX', 'mini-ITX'],
    physicalDimensions: {
      width: 220,
      height: 470,
      depth: 470
    },
    componentLimits: {
      maxGpuLength: 380,
      maxCpuCoolerHeight: 170,
      maxPsuLength: 220,
      maxRadiatorLength: 360
    },
    fanSupport: {
      front: {
        maxFans: 3,
        sizes: [120, 140],
        maxRadiator: 360
      },
      rear: {
        maxFans: 1,
        sizes: [120, 140],
        maxRadiator: 140
      },
      top: {
        maxFans: 2,
        sizes: [120, 140],
        maxRadiator: 280
      },
      bottom: {
        maxFans: 2,
        sizes: [120],
        maxRadiator: 240
      },
      totalMaxFans: 8
    },
    driveBays: {
      ssd25: 4,
      hdd35: 2
    },
    frontPorts: {
      usb2: 2,
      usb3: 3,
      usbC: 1,
      audio: true
    },
    features: {
      temperedGlass: true,
      rgb: true,
      toolFree: true,
      cableManagement: true
    }
  },

  // 静音重視ケース
  'silent-mid-tower': {
    formFactor: ['ATX', 'micro-ATX', 'mini-ITX'],
    physicalDimensions: {
      width: 210,
      height: 460,
      depth: 460
    },
    componentLimits: {
      maxGpuLength: 340,
      maxCpuCoolerHeight: 180,
      maxPsuLength: 200,
      maxRadiatorLength: 280
    },
    fanSupport: {
      front: {
        maxFans: 2,
        sizes: [140],
        maxRadiator: 280
      },
      rear: {
        maxFans: 1,
        sizes: [140],
        maxRadiator: 140
      },
      top: {
        maxFans: 2,
        sizes: [140],
        maxRadiator: 280
      },
      bottom: {
        maxFans: 0,
        sizes: [],
        maxRadiator: 0
      },
      totalMaxFans: 5
    },
    driveBays: {
      ssd25: 3,
      hdd35: 3
    },
    frontPorts: {
      usb2: 2,
      usb3: 2,
      usbC: 0,
      audio: true
    },
    features: {
      temperedGlass: false,
      rgb: false,
      toolFree: false,
      cableManagement: true
    }
  }
};

// ケース仕様取得ヘルパー関数
export function getCaseSpec(caseType?: string): CaseSpec | null {
  if (!caseType) return null;
  return caseSpecsDatabase[caseType] || null;
}

// デフォルトケース仕様（ケース未選択時）
export const defaultCaseSpec: CaseSpec = {
  formFactor: ['ATX', 'micro-ATX', 'mini-ITX'],
  physicalDimensions: {
    width: 210,
    height: 450,
    depth: 450
  },
  componentLimits: {
    maxGpuLength: 320,
    maxCpuCoolerHeight: 160,
    maxPsuLength: 180,
    maxRadiatorLength: 240
  },
  fanSupport: {
    front: {
      maxFans: 2,
      sizes: [120],
      maxRadiator: 240
    },
    rear: {
      maxFans: 1,
      sizes: [120],
      maxRadiator: 120
    },
    top: {
      maxFans: 1,
      sizes: [120],
      maxRadiator: 120
    },
    bottom: {
      maxFans: 0,
      sizes: [],
      maxRadiator: 0
    },
    totalMaxFans: 4
  },
  driveBays: {
    ssd25: 2,
    hdd35: 1
  },
  frontPorts: {
    usb2: 2,
    usb3: 2,
    usbC: 0,
    audio: true
  },
  features: {
    temperedGlass: false,
    rgb: false,
    toolFree: false,
    cableManagement: false
  }
};
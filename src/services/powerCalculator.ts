// src/services/powerCalculator.ts
import { Part, PartCategory, PCConfiguration } from '@/types';
import { 
  PowerCalculationResult, 
  PowerWarning,
  PowerConsumption,
  PSUSpecification
} from '@/types/power';

// デフォルト電力仕様データ（後でJSONファイルから読み込み予定）
const DEFAULT_POWER_SPECS = {
  cpu: {
    default: { idle: 10, base: 65, max: 125, efficiency: 85 },
    'intel-i7-13700k': { idle: 15, base: 125, max: 253, efficiency: 82 },
    'intel-i5-13600k': { idle: 12, base: 125, max: 181, efficiency: 84 },
    'amd-ryzen-7-7700x': { idle: 8, base: 105, max: 142, efficiency: 88 },
    'amd-ryzen-5-7600x': { idle: 6, base: 105, max: 142, efficiency: 87 }
  },
  gpu: {
    default: { idle: 15, base: 150, max: 250, efficiency: 80 },
    'rtx-4090': { idle: 25, base: 450, max: 450, efficiency: 78 },
    'rtx-4080': { idle: 20, base: 320, max: 320, efficiency: 80 },
    'rtx-4070': { idle: 15, base: 200, max: 200, efficiency: 82 },
    'rx-7900xtx': { idle: 20, base: 355, max: 355, efficiency: 79 },
    'rx-7800xt': { idle: 15, base: 263, max: 263, efficiency: 81 }
  },
  motherboard: {
    default: { idle: 20, base: 25, max: 35, efficiency: 90 },
    'atx': { idle: 25, base: 30, max: 40, efficiency: 88 },
    'micro-atx': { idle: 20, base: 25, max: 35, efficiency: 90 },
    'mini-itx': { idle: 15, base: 20, max: 30, efficiency: 92 }
  },
  memory: {
    default: { idle: 2, base: 3, max: 5, efficiency: 95 },
    'ddr4': { idle: 2, base: 3, max: 5, efficiency: 95 },
    'ddr5': { idle: 3, base: 4, max: 6, efficiency: 93 }
  },
  storage: {
    default: { idle: 2, base: 5, max: 8, efficiency: 90 },
    'nvme': { idle: 2, base: 6, max: 9, efficiency: 88 },
    'ssd': { idle: 1, base: 3, max: 5, efficiency: 95 },
    'hdd': { idle: 3, base: 8, max: 12, efficiency: 85 }
  },
  cooler: {
    default: { idle: 5, base: 15, max: 25, efficiency: 85 },
    'air': { idle: 0, base: 0, max: 0, efficiency: 100 }, // パッシブ
    'aio-120': { idle: 5, base: 10, max: 15, efficiency: 90 },
    'aio-240': { idle: 8, base: 15, max: 25, efficiency: 88 },
    'aio-360': { idle: 12, base: 20, max: 35, efficiency: 85 }
  }
};

export class PowerCalculatorService {
  private static instance: PowerCalculatorService;
  
  // シングルトンパターン
  public static getInstance(): PowerCalculatorService {
    if (!PowerCalculatorService.instance) {
      PowerCalculatorService.instance = new PowerCalculatorService();
    }
    return PowerCalculatorService.instance;
  }

  // 設定の消費電力を計算
  public calculatePowerConsumption(config: PCConfiguration): PowerCalculationResult {
    const consumptions: PowerConsumption[] = [];
    const warnings: PowerWarning[] = [];
    
    let totalBasePower = 0;
    let totalMaxPower = 0;
    let totalIdlePower = 0;

    // 各パーツの消費電力を計算
    Object.entries(config.parts).forEach(([category, part]) => {
      if (part) {
        const consumption = this.getPartPowerConsumption(part, category as PartCategory);
        if (consumption) {
          consumptions.push(consumption);
          totalBasePower += consumption.basePower;
          totalMaxPower += consumption.maxPower;
          totalIdlePower += consumption.idlePower;
        }
      }
    });

    // システムオーバーヘッドを追加（ケースファン、LED等）
    const systemOverhead = this.calculateSystemOverhead(config);
    const systemConsumption: PowerConsumption = {
      component: 'システム',
      category: 'other' as PartCategory,
      partId: 'system-overhead',
      partName: 'システムオーバーヘッド',
      idlePower: systemOverhead.idle,
      basePower: systemOverhead.base,
      maxPower: systemOverhead.max,
      powerEfficiency: 80
    };
    
    consumptions.push(systemConsumption);
    totalBasePower += systemOverhead.base;
    totalMaxPower += systemOverhead.max;
    totalIdlePower += systemOverhead.idle;

    // 推奨電源容量を計算（20%の安全マージン）
    const safetyMargin = 0.2;
    const recommendedPSU = Math.ceil((totalMaxPower * (1 + safetyMargin)) / 50) * 50; // 50W単位で切り上げ

    // 電力効率を計算
    const powerEfficiency = this.calculateOverallEfficiency(consumptions);

    // 警告を生成
    warnings.push(...this.generatePowerWarnings(config, totalMaxPower, recommendedPSU));

    // PSU負荷率を計算
    const currentPSU = config.parts.psu;
    const psuLoadPercentage = currentPSU ? 
      (totalMaxPower / this.extractPSUCapacity(currentPSU)) * 100 : 0;

    // 最適化判定
    const isOptimal = this.isPowerConfigOptimal(config, totalMaxPower, recommendedPSU);

    return {
      totalBasePower,
      totalMaxPower,
      totalIdlePower,
      recommendedPSU,
      safetyMargin: safetyMargin * 100,
      powerEfficiency,
      psuLoadPercentage,
      consumptions,
      warnings,
      isOptimal
    };
  }

  // パーツの消費電力情報を取得
  private getPartPowerConsumption(part: Part, category: PartCategory): PowerConsumption | null {
    if (category === 'psu') return null; // PSUは消費電力でなく供給側
    
    const spec = this.findPowerSpec(part, category);
    
    return {
      component: part.name,
      category,
      partId: part.id,
      partName: part.name,
      idlePower: spec.idle,
      basePower: spec.base,
      maxPower: spec.max,
      powerEfficiency: spec.efficiency
    };
  }

  // 電力スペックを検索
  private findPowerSpec(part: Part, category: PartCategory): {
    idle: number;
    base: number;
    max: number;
    efficiency: number;
  } {
    const categorySpecs = DEFAULT_POWER_SPECS[category as keyof typeof DEFAULT_POWER_SPECS];
    if (!categorySpecs) {
      return { idle: 5, base: 10, max: 20, efficiency: 85 };
    }

    // パーツIDでの直接マッチを試行
    const partSpec = (categorySpecs as Record<string, {idle: number; base: number; max: number; efficiency: number}>)[part.id];
    if (partSpec) return partSpec;

    // パーツ名での部分マッチを試行
    for (const [key, value] of Object.entries(categorySpecs)) {
      if (key !== 'default' && part.name.toLowerCase().includes(key.toLowerCase())) {
        return value as {idle: number; base: number; max: number; efficiency: number};
      }
    }

    // フォームファクターベースのマッチング（マザーボード等）
    if (category === 'motherboard' && part.specifications?.formFactor) {
      const formFactor = typeof part.specifications.formFactor === 'string' 
        ? part.specifications.formFactor.toLowerCase().replace(' ', '-')
        : '';
      const formFactorSpec = (categorySpecs as Record<string, {idle: number; base: number; max: number; efficiency: number}>)[formFactor];
      if (formFactorSpec) return formFactorSpec;
    }

    // メモリタイプでのマッチング
    if (category === 'memory' && part.specifications?.type) {
      const memType = typeof part.specifications.type === 'string'
        ? part.specifications.type.toLowerCase()
        : '';
      const memSpec = (categorySpecs as Record<string, {idle: number; base: number; max: number; efficiency: number}>)[memType];
      if (memSpec) return memSpec;
    }

    // ストレージタイプでのマッチング
    if (category === 'storage' && part.specifications?.type) {
      const storageType = typeof part.specifications.type === 'string'
        ? part.specifications.type.toLowerCase()
        : '';
      const storageSpec = (categorySpecs as Record<string, {idle: number; base: number; max: number; efficiency: number}>)[storageType];
      if (storageSpec) return storageSpec;
    }

    // デフォルト値を返す
    return (categorySpecs as Record<string, {idle: number; base: number; max: number; efficiency: number}>).default || { idle: 5, base: 10, max: 20, efficiency: 85 };
  }

  // システムオーバーヘッドを計算
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateSystemOverhead(_config: PCConfiguration): {
    base: number;
    max: number;
    idle: number;
  } {
    // ケースファン、LED、USBデバイス等の追加消費電力
    const fanCount = 3; // 推定ファン数
    const fanPower = 2; // ファン1つあたりの消費電力(W)
    const usbPower = 5; // USBデバイス用(W)
    const ledPower = 3; // LED照明用(W)
    const networkPower = 2; // ネットワーク機能(W)

    const base = (fanCount * fanPower) + usbPower + ledPower + networkPower;
    const max = base * 1.5;
    const idle = base * 0.4;

    return { base, max, idle };
  }

  // 全体の電力効率を計算
  private calculateOverallEfficiency(consumptions: PowerConsumption[]): number {
    if (consumptions.length === 0) return 85;

    const totalPower = consumptions.reduce((sum, c) => sum + c.maxPower, 0);
    if (totalPower === 0) return 85;

    const weightedEfficiency = consumptions.reduce((sum, c) => {
      const weight = c.maxPower / totalPower;
      return sum + (c.powerEfficiency || 85) * weight;
    }, 0);

    return Math.round(weightedEfficiency);
  }

  // 電源関連の警告を生成
  private generatePowerWarnings(
    config: PCConfiguration,
    totalMaxPower: number,
    recommendedPSU: number
  ): PowerWarning[] {
    const warnings: PowerWarning[] = [];
    const currentPSU = config.parts.psu;

    if (currentPSU) {
      const psuCapacity = this.extractPSUCapacity(currentPSU);
      const loadPercentage = (totalMaxPower / psuCapacity) * 100;
      
      if (psuCapacity < totalMaxPower) {
        warnings.push({
          id: 'insufficient-capacity',
          type: 'insufficient_capacity',
          severity: 'critical',
          message: `電源容量が不足しています。現在: ${psuCapacity}W, 必要: ${totalMaxPower}W`,
          value: psuCapacity,
          threshold: totalMaxPower,
          suggestion: `${recommendedPSU}W以上の電源に交換してください`
        });
      } else if (psuCapacity < recommendedPSU) {
        warnings.push({
          id: 'insufficient-margin',
          type: 'insufficient_headroom',
          severity: 'high',
          message: `電源容量に余裕がありません。安全マージンを考慮してください`,
          value: psuCapacity,
          threshold: recommendedPSU,
          suggestion: `${recommendedPSU}W以上の電源を推奨します`
        });
      } else if (loadPercentage > 90) {
        warnings.push({
          id: 'high-load',
          type: 'high_load_percentage',
          severity: 'high',
          message: `電源負荷率が高すぎます (${Math.round(loadPercentage)}%)`,
          value: loadPercentage,
          threshold: 90,
          suggestion: 'より大容量の電源をご検討ください'
        });
      } else if (psuCapacity > recommendedPSU * 1.8) {
        warnings.push({
          id: 'oversized-psu',
          type: 'low_efficiency',
          severity: 'low',
          message: `電源容量が過剰です。低負荷時の効率が悪くなる可能性があります`,
          value: psuCapacity,
          threshold: recommendedPSU * 1.8,
          suggestion: `${recommendedPSU}W程度の電源で十分です`
        });
      }

      // 効率認証チェック
      if (!this.hasEfficiencyCertification(currentPSU)) {
        warnings.push({
          id: 'no-efficiency-cert',
          type: 'low_efficiency',
          severity: 'medium',
          message: '80+効率認証のない電源が選択されています',
          value: 0,
          threshold: 80,
          suggestion: '80+ Bronze以上の効率認証電源を推奨します'
        });
      }
    } else {
      warnings.push({
        id: 'no-psu',
        type: 'insufficient_capacity',
        severity: 'critical',
        message: '電源が選択されていません',
        value: 0,
        threshold: totalMaxPower,
        suggestion: `${recommendedPSU}W以上の電源を選択してください`
      });
    }

    // GPU電力警告
    const gpu = config.parts.gpu;
    if (gpu) {
      const gpuPower = this.getPartPowerConsumption(gpu, 'gpu');
      if (gpuPower && gpuPower.maxPower > 300) {
        warnings.push({
          id: 'high-gpu-power',
          type: 'high_load_percentage',
          severity: 'medium',
          message: '高性能GPUが選択されています。十分な電源容量と冷却を確保してください',
          value: gpuPower.maxPower,
          threshold: 300,
          suggestion: '80+ Gold以上の高効率電源を推奨します'
        });
      }
    }

    return warnings;
  }

  // 電源容量をパーツから抽出
  private extractPSUCapacity(psu: Part): number {
    // specifications から取得
    if (psu.specifications?.capacity) {
      const capacity = psu.specifications.capacity;
      if (typeof capacity === 'number') {
        return capacity;
      }
      if (typeof capacity === 'string') {
        const parsed = parseInt(capacity, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }

    // パーツ名から容量を抽出（例: "750W Gold電源" -> 750）
    const match = psu.name.match(/(\d+)W/i);
    if (match) {
      return parseInt(match[1]);
    }

    // デフォルト値
    return 500;
  }

  // 効率認証があるかチェック
  private hasEfficiencyCertification(psu: Part): boolean {
    const name = psu.name.toLowerCase();
    const efficiency = psu.specifications?.efficiency;
    const efficiencyStr = typeof efficiency === 'string' ? efficiency.toLowerCase() : '';
    
    return name.includes('80+') || 
           name.includes('bronze') ||
           name.includes('silver') ||
           name.includes('gold') ||
           name.includes('platinum') ||
           name.includes('titanium') ||
           efficiencyStr.includes('80+');
  }

  // 電源設定が最適かどうかを判定
  private isPowerConfigOptimal(
    config: PCConfiguration,
    totalMaxPower: number,
    recommendedPSU: number
  ): boolean {
    const psu = config.parts.psu;
    if (!psu) return false;

    const psuCapacity = this.extractPSUCapacity(psu);
    
    // 容量が適切範囲内か (推奨容量の1.0~1.4倍)
    const capacityOptimal = psuCapacity >= recommendedPSU && psuCapacity <= recommendedPSU * 1.4;
    
    // 効率認証があるか
    const hasEfficiencyCert = this.hasEfficiencyCertification(psu);
    
    // 負荷率が適切か (50-80%)
    const loadPercentage = (totalMaxPower / psuCapacity) * 100;
    const loadOptimal = loadPercentage >= 50 && loadPercentage <= 80;

    return capacityOptimal && hasEfficiencyCert && loadOptimal;
  }

  // 推奨電源リストを取得
  public getRecommendedPSUs(requiredWattage: number): PSUSpecification[] {
    // 実際のデータベースから取得する代わりに、サンプルデータを返す
    const baseRecommendations: PSUSpecification[] = [
      {
        id: 'corsair-rm750x',
        name: 'Corsair RM750x',
        capacity: 750,
        efficiency: '80+ Gold',
        modular: true,
        price: 15000,
        efficiencyPercentage: 87,
        connectors: {
          motherboard: ['24pin'],
          cpu: ['4+4pin', '4+4pin'],
          pcie: ['6+2pin', '6+2pin', '6+2pin', '6+2pin'],
          sata: 8,
          molex: 4,
          floppy: 1
        }
      },
      {
        id: 'seasonic-focus-gx-850',
        name: 'Seasonic Focus GX-850',
        capacity: 850,
        efficiency: '80+ Gold',
        modular: true,
        price: 18000,
        efficiencyPercentage: 90,
        connectors: {
          motherboard: ['24pin'],
          cpu: ['4+4pin', '4+4pin'],
          pcie: ['6+2pin', '6+2pin', '6+2pin', '6+2pin'],
          sata: 8,
          molex: 4,
          floppy: 1
        }
      },
      {
        id: 'evga-supernova-1000',
        name: 'EVGA SuperNOVA 1000 G5',
        capacity: 1000,
        efficiency: '80+ Gold',
        modular: true,
        price: 22000,
        efficiencyPercentage: 88,
        connectors: {
          motherboard: ['24pin'],
          cpu: ['4+4pin', '4+4pin'],
          pcie: ['6+2pin', '6+2pin', '6+2pin', '6+2pin', '6+2pin'],
          sata: 10,
          molex: 4,
          floppy: 1
        }
      }
    ];

    // 必要な容量以上のPSUのみをフィルタリング
    return baseRecommendations.filter(psu => psu.capacity >= requiredWattage);
  }

  // 月間電気代を計算
  public calculateMonthlyCost(
    powerResult: PowerCalculationResult,
    usageHours: number,
    electricityRate: number
  ): { idle: number; normal: number; peak: number } {
    const daysInMonth = 30;
    const idleHours = 24 - usageHours;
    
    // kWh単位に変換
    const idleCost = (powerResult.totalIdlePower / 1000) * idleHours * daysInMonth * electricityRate;
    const normalCost = (powerResult.totalBasePower / 1000) * usageHours * daysInMonth * electricityRate;
    const peakCost = (powerResult.totalMaxPower / 1000) * (usageHours * 0.1) * daysInMonth * electricityRate; // ピーク使用は10%程度と仮定

    return {
      idle: idleCost,
      normal: normalCost,
      peak: peakCost
    };
  }
}
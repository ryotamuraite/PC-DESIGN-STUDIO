// src/services/powerCalculator.ts
import { 
  Part, 
  PartCategory, 
  PCConfiguration, 
  PowerConsumption, 
  PowerCalculationResult, 
  PowerWarning, 
  PSUSpecification 
} from '../types';
import { powerSpecs } from '@/data/static/powerSpecs.json';

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

    // システムオーバーヘッドを追加（マザーボード、ファン等）
    const systemOverhead = this.calculateSystemOverhead(config);
    totalBasePower += systemOverhead.base;
    totalMaxPower += systemOverhead.max;
    totalIdlePower += systemOverhead.idle;

    // 推奨電源容量を計算（20%のマージン）
    const safetyMargin = 20;
    const recommendedPSU = Math.ceil((totalMaxPower * (1 + safetyMargin / 100)) / 50) * 50; // 50W単位で切り上げ

    // 電力効率を計算
    const powerEfficiency = this.calculateOverallEfficiency(consumptions);

    // 警告を生成
    warnings.push(...this.generatePowerWarnings(config, totalMaxPower, recommendedPSU));

    // 最適化判定
    const isOptimal = this.isPowerConfigOptimal(config, totalMaxPower, recommendedPSU);

    return {
      totalBasePower,
      totalMaxPower,
      totalIdlePower,
      recommendedPSU,
      safetyMargin,
      powerEfficiency,
      breakdown: consumptions,
      warnings,
      isOptimal
    };
  }

  // パーツの消費電力情報を取得
  private getPartPowerConsumption(part: Part, category: PartCategory): PowerConsumption | null {
    const spec = this.findPowerSpec(part.id, category);
    
    if (!spec) {
      // デフォルト値を使用
      const defaultPower = this.getDefaultPowerConsumption(category);
      return {
        category,
        partId: part.id,
        partName: part.name,
        basePower: defaultPower.base,
        maxPower: defaultPower.max,
        idlePower: defaultPower.idle,
        powerEfficiency: defaultPower.efficiency
      };
    }

    return {
      category,
      partId: part.id,
      partName: part.name,
      basePower: spec.basePower,
      maxPower: spec.maxPower,
      idlePower: spec.idlePower,
      peakPower: spec.peakPower,
      powerEfficiency: spec.efficiency
    };
  }

  // 電力スペックをデータから検索
  private findPowerSpec(partId: string, category: PartCategory): any {
    // powerSpecs.jsonから該当するスペックを検索
    const categorySpecs = (powerSpecs as any)[category];
    if (!categorySpecs) return null;

    return categorySpecs.find((spec: any) => 
      spec.partId === partId || 
      spec.modelNumber === partId ||
      spec.name.toLowerCase().includes(partId.toLowerCase())
    );
  }

  // カテゴリ別デフォルト消費電力
  private getDefaultPowerConsumption(category: PartCategory): {
    base: number;
    max: number;
    idle: number;
    efficiency: number;
  } {
    const defaults = {
      cpu: { base: 65, max: 125, idle: 10, efficiency: 85 },
      gpu: { base: 150, max: 250, idle: 15, efficiency: 80 },
      motherboard: { base: 25, max: 35, idle: 20, efficiency: 90 },
      memory: { base: 3, max: 5, idle: 2, efficiency: 95 },
      storage: { base: 5, max: 8, idle: 2, efficiency: 90 },
      psu: { base: 0, max: 0, idle: 0, efficiency: 85 },
      case: { base: 10, max: 15, idle: 5, efficiency: 80 },
      cooler: { base: 15, max: 25, idle: 5, efficiency: 85 },
      monitor: { base: 30, max: 45, idle: 1, efficiency: 85 }
    };

    return defaults[category] || { base: 10, max: 20, idle: 5, efficiency: 85 };
  }

  // システムオーバーヘッドを計算
  private calculateSystemOverhead(config: PCConfiguration): {
    base: number;
    max: number;
    idle: number;
  } {
    // ケースファン、LED、USBデバイス等の追加消費電力
    const fanCount = 3; // デフォルトファン数
    const fanPower = 2; // ファン1つあたりの消費電力
    const usbPower = 5; // USBデバイス用
    const ledPower = 3; // LED照明用

    const base = (fanCount * fanPower) + usbPower + ledPower;
    const max = base * 1.5;
    const idle = base * 0.5;

    return { base, max, idle };
  }

  // 全体の電力効率を計算
  private calculateOverallEfficiency(consumptions: PowerConsumption[]): number {
    if (consumptions.length === 0) return 85;

    const totalPower = consumptions.reduce((sum, c) => sum + c.maxPower, 0);
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
      
      if (psuCapacity < totalMaxPower) {
        warnings.push({
          type: 'insufficient',
          severity: 'critical',
          message: `電源容量が不足しています。現在: ${psuCapacity}W, 必要: ${totalMaxPower}W`,
          affectedParts: [currentPSU.id],
          recommendation: `${recommendedPSU}W以上の電源に交換してください`
        });
      } else if (psuCapacity < recommendedPSU) {
        warnings.push({
          type: 'insufficient',
          severity: 'high',
          message: `電源容量に余裕がありません。安全マージンを考慮してください`,
          affectedParts: [currentPSU.id],
          recommendation: `${recommendedPSU}W以上の電源を推奨します`
        });
      } else if (psuCapacity > recommendedPSU * 1.5) {
        warnings.push({
          type: 'overkill',
          severity: 'low',
          message: `電源容量が過剰です。電力効率が悪くなる可能性があります`,
          affectedParts: [currentPSU.id],
          recommendation: `${recommendedPSU}W程度の電源で十分です`
        });
      }
    } else {
      warnings.push({
        type: 'insufficient',
        severity: 'critical',
        message: '電源が選択されていません',
        affectedParts: [],
        recommendation: `${recommendedPSU}W以上の電源を選択してください`
      });
    }

    // GPU電力警告
    const gpu = config.parts.gpu;
    if (gpu) {
      const gpuPower = this.getPartPowerConsumption(gpu, 'gpu');
      if (gpuPower && gpuPower.maxPower > 200) {
        warnings.push({
          type: 'efficiency',
          severity: 'medium',
          message: '高性能GPUが選択されています。十分な電源容量と冷却を確保してください',
          affectedParts: [gpu.id],
          recommendation: '80+ Gold以上の高効率電源を推奨します'
        });
      }
    }

    return warnings;
  }

  // 電源容量をパーツ名から抽出
  private extractPSUCapacity(psu: Part): number {
    // パーツ名から容量を抽出（例: "750W Gold電源" -> 750）
    const match = psu.name.match(/(\d+)W/i);
    if (match) {
      return parseInt(match[1]);
    }

    // specifications から取得
    if (psu.specifications?.capacity) {
      return psu.specifications.capacity;
    }

    // デフォルト値
    return 500;
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
    
    // 容量が適切範囲内か
    const capacityOptimal = psuCapacity >= recommendedPSU && psuCapacity <= recommendedPSU * 1.3;
    
    // 効率認証があるか
    const hasEfficiencyCert = psu.name.toLowerCase().includes('80+') || 
                             psu.name.toLowerCase().includes('bronze') ||
                             psu.name.toLowerCase().includes('gold') ||
                             psu.name.toLowerCase().includes('platinum');

    return capacityOptimal && hasEfficiencyCert;
  }

  // 推奨電源リストを取得
  public getRecommendedPSUs(requiredCapacity: number): PSUSpecification[] {
    // 実際の実装では外部データまたは静的データから取得
    const recommendedPSUs: PSUSpecification[] = [
      {
        id: 'psu-corsair-rm750x',
        name: 'Corsair RM750x 750W 80+ Gold',
        capacity: 750,
        efficiency: '80+ Gold',
        efficiencyPercentage: 90,
        modular: true,
        connectors: [
          { type: '24pin', count: 1 },
          { type: '8pin', count: 2 },
          { type: '6pin', count: 4 },
          { type: 'sata', count: 8 }
        ],
        price: 12000,
        manufacturer: 'Corsair'
      },
      {
        id: 'psu-seasonic-focus-850',
        name: 'Seasonic Focus GX-850 850W 80+ Gold',
        capacity: 850,
        efficiency: '80+ Gold',
        efficiencyPercentage: 90,
        modular: true,
        connectors: [
          { type: '24pin', count: 1 },
          { type: '8pin', count: 2 },
          { type: '6pin', count: 4 },
          { type: 'sata', count: 10 }
        ],
        price: 15000,
        manufacturer: 'Seasonic'
      }
    ];

    return recommendedPSUs.filter(psu => psu.capacity >= requiredCapacity);
  }

  // 月間電気代を計算
  public calculateMonthlyCost(
    powerResult: PowerCalculationResult,
    usageHours: number = 8,
    electricityRate: number = 27 // 円/kWh
  ): {
    idle: number;
    normal: number;
    peak: number;
  } {
    const hoursPerMonth = 30 * 24;
    const idleHours = hoursPerMonth - usageHours * 30;
    const normalHours = usageHours * 30 * 0.7; // 70%は通常使用
    const peakHours = usageHours * 30 * 0.3; // 30%はピーク使用

    return {
      idle: (powerResult.totalIdlePower / 1000) * idleHours * electricityRate,
      normal: (powerResult.totalBasePower / 1000) * normalHours * electricityRate,
      peak: (powerResult.totalMaxPower / 1000) * peakHours * electricityRate
    };
  }
}
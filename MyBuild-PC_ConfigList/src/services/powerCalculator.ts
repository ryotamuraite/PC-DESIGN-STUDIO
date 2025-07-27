// src/services/powerCalculator.ts
import { 
  PowerCalculationResult, 
  PowerBreakdown, 
  PowerConsumption, 
  PowerWarning, 
  PowerRecommendation,
  PowerCalculationConfig,
  PowerConnectorCheck,
  PowerConnectorRequirements,
  PowerConnectorAvailable,
  LOAD_SCENARIOS,
  PSU_EFFICIENCY_MAP,
  LoadScenario
} from '../types/power';
import { Part, PartCategory, CPU, GPU, PSU, Motherboard } from '../types/parts';
import { getPowerData } from '../data/static/powerSpecs';

export class PowerCalculatorService {
  private powerData = getPowerData();

  /**
   * メイン計算関数
   */
  async calculatePower(
    parts: Partial<Record<PartCategory, Part | Part[]>>,
    config: PowerCalculationConfig = this.getDefaultConfig()
  ): Promise<PowerCalculationResult> {
    const scenario = LOAD_SCENARIOS.find(s => s.name === config.scenario) || LOAD_SCENARIOS[2]; // デフォルトはgaming
    
    // 各コンポーネントの消費電力を計算
    const breakdown = await this.calculateBreakdown(parts, scenario);
    
    // 推奨電源容量を計算
    const recommendedPsu = this.calculateRecommendedPsu(breakdown.total, config);
    
    // 現在の電源をチェック
    const currentPsu = parts.psu as PSU;
    const efficiency = currentPsu ? this.getEfficiency(currentPsu.efficiency) : 0.85;
    const loadPercentage = currentPsu ? (breakdown.total.peak / currentPsu.wattage) * 100 : 0;
    const headroom = currentPsu ? Math.max(0, 100 - loadPercentage) : 0;

    // 警告とおすすめを生成
    const warnings = this.generateWarnings(breakdown, currentPsu, loadPercentage, headroom);
    const recommendations = this.generateRecommendations(breakdown, currentPsu, recommendedPsu);

    return {
      totalConsumption: breakdown.total.peak,
      recommendedPsu,
      efficiency,
      loadPercentage,
      headroom,
      breakdown,
      warnings,
      recommendations
    };
  }

  /**
   * 各コンポーネントの消費電力内訳を計算
   */
  private async calculateBreakdown(
    parts: Partial<Record<PartCategory, Part | Part[]>>,
    scenario: LoadScenario
  ): Promise<PowerBreakdown> {
    const breakdown: PowerBreakdown = {
      cpu: this.calculateCpuPower(parts.cpu as CPU, scenario),
      gpu: this.calculateGpuPower(parts.gpu as GPU, scenario),
      motherboard: this.calculateMotherboardPower(parts.motherboard as Motherboard),
      memory: this.calculateMemoryPower(parts.memory as any[]),
      storage: this.calculateStoragePower(parts.storage as any[]),
      cooling: this.calculateCoolingPower(parts.cpuCooler as any),
      other: this.calculateOtherPower(),
      total: { idle: 0, typical: 0, peak: 0, component: 'Total' }
    };

    // 合計を計算
    breakdown.total = {
      idle: Object.values(breakdown).reduce((sum, item) => {
        return sum + (Array.isArray(item) ? item.reduce((s, i) => s + i.idle, 0) : item.idle || 0);
      }, 0),
      typical: Object.values(breakdown).reduce((sum, item) => {
        return sum + (Array.isArray(item) ? item.reduce((s, i) => s + i.typical, 0) : item.typical || 0);
      }, 0),
      peak: Object.values(breakdown).reduce((sum, item) => {
        return sum + (Array.isArray(item) ? item.reduce((s, i) => s + i.peak, 0) : item.peak || 0);
      }, 0),
      component: 'Total'
    };

    return breakdown;
  }

  /**
   * CPU消費電力計算
   */
  private calculateCpuPower(cpu: CPU | undefined, scenario: LoadScenario): PowerConsumption {
    if (!cpu) {
      return { idle: 0, typical: 0, peak: 0, component: 'CPU (未選択)' };
    }

    const baseTdp = cpu.tdp;
    const idle = baseTdp * 0.05; // アイドル時は5%
    const typical = baseTdp * (0.3 + scenario.cpuLoad * 0.7); // 30% + 負荷率
    const peak = baseTdp * 1.2; // TDPの120%をピークとする

    return {
      idle: Math.round(idle),
      typical: Math.round(typical),
      peak: Math.round(peak),
      component: cpu.name
    };
  }

  /**
   * GPU消費電力計算
   */
  private calculateGpuPower(gpu: GPU | undefined, scenario: LoadScenario): PowerConsumption {
    if (!gpu) {
      return { idle: 0, typical: 0, peak: 0, component: 'GPU (未選択)' };
    }

    const baseTdp = gpu.tdp;
    const idle = baseTdp * 0.02; // アイドル時は2%
    const typical = baseTdp * (0.1 + scenario.gpuLoad * 0.9); // 10% + 負荷率
    const peak = baseTdp * 1.1; // TDPの110%をピークとする

    return {
      idle: Math.round(idle),
      typical: Math.round(typical),
      peak: Math.round(peak),
      component: gpu.name
    };
  }

  /**
   * マザーボード消費電力計算
   */
  private calculateMotherboardPower(motherboard: Motherboard | undefined): PowerConsumption {
    if (!motherboard) {
      return { idle: 0, typical: 0, peak: 0, component: 'マザーボード (未選択)' };
    }

    // フォームファクターに基づく基本消費電力
    const basePower = this.powerData.motherboard[motherboard.formFactor] || 
                     this.powerData.motherboard.atx;

    return {
      idle: basePower,
      typical: Math.round(basePower * 1.2),
      peak: Math.round(basePower * 1.5),
      component: motherboard.name
    };
  }

  /**
   * メモリ消費電力計算
   */
  private calculateMemoryPower(memory: any[] | undefined): PowerConsumption {
    if (!memory || memory.length === 0) {
      return { idle: 0, typical: 0, peak: 0, component: 'メモリ (未選択)' };
    }

    const totalSticks = memory.reduce((sum, mem) => sum + (mem.sticks || 1), 0);
    const memoryType = memory[0]?.type || 'DDR4';
    const perStickPower = this.powerData.memory[memoryType.toLowerCase() as 'ddr4' | 'ddr5'] || 
                         this.powerData.memory.ddr4;

    const totalPower = totalSticks * perStickPower;

    return {
      idle: Math.round(totalPower * 0.8),
      typical: totalPower,
      peak: Math.round(totalPower * 1.2),
      component: `メモリ (${totalSticks}本)`
    };
  }

  /**
   * ストレージ消費電力計算
   */
  private calculateStoragePower(storage: any[] | undefined): PowerConsumption[] {
    if (!storage || storage.length === 0) {
      return [{ idle: 0, typical: 0, peak: 0, component: 'ストレージ (未選択)' }];
    }

    return storage.map(drive => {
      const driveType = drive.type?.toLowerCase() || 'ssd';
      const basePower = this.powerData.storage[driveType as keyof typeof this.powerData.storage] || 
                       this.powerData.storage.ssd25;

      return {
        idle: Math.round(basePower * 0.3),
        typical: basePower,
        peak: Math.round(basePower * 1.5),
        component: drive.name || `${drive.type} ${drive.capacity}GB`
      };
    });
  }

  /**
   * 冷却システム消費電力計算
   */
  private calculateCoolingPower(cooler: any | undefined): PowerConsumption[] {
    const coolingPower: PowerConsumption[] = [];

    // CPUクーラー
    if (cooler) {
      const coolerType = cooler.type?.toLowerCase() || 'air';
      let basePower = this.powerData.cooling.airCooler;

      if (coolerType === 'aio') {
        const radiatorSize = cooler.radiatorSize || 240;
        basePower = this.powerData.cooling[`aio${radiatorSize}` as keyof typeof this.powerData.cooling] || 
                   this.powerData.cooling.aio240;
      }

      coolingPower.push({
        idle: Math.round(basePower * 0.5),
        typical: basePower,
        peak: Math.round(basePower * 1.2),
        component: cooler.name || 'CPUクーラー'
      });
    }

    // ケースファン（仮で3個と想定）
    const caseFanCount = 3;
    const caseFanPower = this.powerData.cooling.caseFan120 * caseFanCount;
    
    coolingPower.push({
      idle: Math.round(caseFanPower * 0.3),
      typical: Math.round(caseFanPower * 0.7),
      peak: caseFanPower,
      component: `ケースファン (${caseFanCount}個)`
    });

    return coolingPower;
  }

  /**
   * その他の消費電力計算
   */
  private calculateOtherPower(): PowerConsumption {
    const usbPower = this.powerData.other.usb * 4; // USB機器4個
    const rgbPower = this.powerData.other.rgb;
    const networkPower = this.powerData.other.networking;

    const total = usbPower + rgbPower + networkPower;

    return {
      idle: Math.round(total * 0.5),
      typical: total,
      peak: Math.round(total * 1.2),
      component: 'その他 (USB, RGB, ネットワーク)'
    };
  }

  /**
   * 推奨電源容量計算
   */
  private calculateRecommendedPsu(totalPower: PowerConsumption, config: PowerCalculationConfig): number {
    const peakPower = totalPower.peak;
    const safetyMargin = 1 + config.safetyMargin;
    const futureMargin = 1 + config.futureUpgradeMargin;
    
    let recommendedWattage = peakPower * safetyMargin * futureMargin;
    
    // 周辺機器を考慮
    if (config.includePeripherals) {
      recommendedWattage += config.peripheralsPower;
    }

    // 標準的な電源容量に丸める
    const standardWattages = [450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 1000, 1200, 1500];
    return standardWattages.find(w => w >= recommendedWattage) || 1500;
  }

  /**
   * 電源効率を取得
   */
  private getEfficiency(efficiencyRating: string): number {
    return PSU_EFFICIENCY_MAP[efficiencyRating as keyof typeof PSU_EFFICIENCY_MAP] || 0.85;
  }

  /**
   * 警告を生成
   */
  private generateWarnings(
    breakdown: PowerBreakdown, 
    psu: PSU | undefined, 
    loadPercentage: number, 
    headroom: number
  ): PowerWarning[] {
    const warnings: PowerWarning[] = [];

    if (!psu) {
      warnings.push({
        id: 'no_psu_selected',
        type: 'insufficient_capacity',
        severity: 'critical',
        message: '電源が選択されていません',
        value: 0,
        threshold: breakdown.total.peak,
        suggestion: `${breakdown.total.peak * 1.2}W以上の電源を選択してください`
      });
      return warnings;
    }

    // 容量不足チェック
    if (loadPercentage > 100) {
      warnings.push({
        id: 'insufficient_capacity',
        type: 'insufficient_capacity',
        severity: 'critical',
        message: '電源容量が不足しています',
        value: psu.wattage,
        threshold: breakdown.total.peak,
        suggestion: `${breakdown.total.peak * 1.2}W以上の電源に交換してください`
      });
    }

    // 高負荷チェック
    if (loadPercentage > 90) {
      warnings.push({
        id: 'high_load',
        type: 'high_load_percentage',
        severity: 'warning',
        message: '電源の負荷率が高すぎます',
        value: loadPercentage,
        threshold: 90,
        suggestion: 'より大容量の電源を検討してください'
      });
    }

    // 余裕不足チェック
    if (headroom < 10) {
      warnings.push({
        id: 'insufficient_headroom',
        type: 'insufficient_headroom',
        severity: 'warning',
        message: '将来のアップグレードを考慮すると余裕が不足しています',
        value: headroom,
        threshold: 20,
        suggestion: '20%以上の余裕を持った電源を選択することをお勧めします'
      });
    }

    // 効率チェック
    const efficiency = this.getEfficiency(psu.efficiency);
    if (efficiency < 0.85) {
      warnings.push({
        id: 'low_efficiency',
        type: 'low_efficiency',
        severity: 'info',
        message: '電源効率が低いです',
        value: efficiency * 100,
        threshold: 85,
        suggestion: '80+ Gold以上の電源を検討してください'
      });
    }

    return warnings;
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(
    breakdown: PowerBreakdown, 
    currentPsu: PSU | undefined, 
    recommendedWattage: number
  ): PowerRecommendation[] {
    const recommendations: PowerRecommendation[] = [];

    if (!currentPsu || currentPsu.wattage < recommendedWattage) {
      recommendations.push({
        id: 'psu_upgrade',
        type: 'psu_upgrade',
        priority: 'high',
        title: '電源のアップグレードをお勧めします',
        description: `より安定した動作のため、${recommendedWattage}W以上の電源をお勧めします`,
        currentValue: currentPsu?.wattage || 0,
        recommendedValue: recommendedWattage,
        alternatives: [
          {
            partId: 'example-psu-650w',
            name: '80+ Gold 650W',
            wattage: 650,
            efficiency: '80+ Gold',
            price: 8000,
            improvement: '安定性向上、効率向上'
          },
          {
            partId: 'example-psu-750w',
            name: '80+ Gold 750W',
            wattage: 750,
            efficiency: '80+ Gold',
            price: 10000,
            improvement: '将来のアップグレードにも対応'
          }
        ]
      });
    }

    return recommendations;
  }

  /**
   * 電源コネクタチェック
   */
  async checkPowerConnectors(
    parts: Partial<Record<PartCategory, Part | Part[]>>
  ): Promise<PowerConnectorCheck> {
    const required = this.calculateRequiredConnectors(parts);
    const available = this.getAvailableConnectors(parts.psu as PSU);

    return {
      required,
      available,
      sufficient: this.checkConnectorSufficiency(required, available),
      missing: this.findMissingConnectors(required, available)
    };
  }

  private calculateRequiredConnectors(
    parts: Partial<Record<PartCategory, Part | Part[]>>
  ): PowerConnectorRequirements {
    const motherboard = parts.motherboard as Motherboard;
    const cpu = parts.cpu as CPU;
    const gpu = parts.gpu as GPU;
    const storage = parts.storage as any[] || [];

    return {
      motherboard: '24pin',
      cpu: cpu ? ['8pin'] : [],
      gpu: gpu ? gpu.powerConnectors || [] : [],
      sata: storage.filter(s => s.interface === 'SATA').length,
      molex: 0 // 通常は不要
    };
  }

  private getAvailableConnectors(psu: PSU | undefined): PowerConnectorAvailable {
    if (!psu) {
      return {
        motherboard: [],
        cpu: [],
        pcie: [],
        sata: 0,
        molex: 0,
        floppy: 0
      };
    }

    return {
      motherboard: ['24pin'],
      cpu: psu.connectors?.cpu || ['8pin'],
      pcie: psu.connectors?.pcie || [],
      sata: psu.connectors?.sata || 4,
      molex: psu.connectors?.molex || 2,
      floppy: psu.connectors?.floppy || 1
    };
  }

  private checkConnectorSufficiency(
    required: PowerConnectorRequirements,
    available: PowerConnectorAvailable
  ): boolean {
    // マザーボード電源チェック
    if (!available.motherboard.includes(required.motherboard)) {
      return false;
    }

    // CPU電源チェック
    if (required.cpu.length > 0 && !required.cpu.every(conn => available.cpu.includes(conn))) {
      return false;
    }

    // GPU電源チェック
    if (required.gpu.length > 0 && !required.gpu.every(conn => available.pcie.includes(conn))) {
      return false;
    }

    // SATA電源チェック
    if (required.sata > available.sata) {
      return false;
    }

    return true;
  }

  private findMissingConnectors(
    required: PowerConnectorRequirements,
    available: PowerConnectorAvailable
  ): string[] {
    const missing: string[] = [];

    if (!available.motherboard.includes(required.motherboard)) {
      missing.push(`マザーボード: ${required.motherboard}`);
    }

    required.cpu.forEach(conn => {
      if (!available.cpu.includes(conn)) {
        missing.push(`CPU: ${conn}`);
      }
    });

    required.gpu.forEach(conn => {
      if (!available.pcie.includes(conn)) {
        missing.push(`GPU: ${conn}`);
      }
    });

    if (required.sata > available.sata) {
      missing.push(`SATA: ${required.sata - available.sata}個不足`);
    }

    return missing;
  }

  /**
   * デフォルト設定を取得
   */
  private getDefaultConfig(): PowerCalculationConfig {
    return {
      scenario: 'gaming',
      safetyMargin: 0.2,
      futureUpgradeMargin: 0.1,
      includePeripherals: true,
      peripheralsPower: 50
    };
  }
}
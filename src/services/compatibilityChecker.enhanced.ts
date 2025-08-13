// src/services/compatibilityChecker.enhanced.ts
// 🚀 互換性チェックサービス強化版 - Phase 2統合実装

import { PCConfiguration } from '@/types';
import { 
  CompatibilityResult, 
  CompatibilityIssue, 
  CompatibilityWarning,
  CompatibilityDetails,
  SocketCompatibility,
  MemoryCompatibility,
  PowerConnectorCompatibility,
  PhysicalCompatibility,
  PerformanceCompatibility
} from '@/types/compatibility';

// 🎯 強化版互換性チェックサービス
export class EnhancedCompatibilityCheckerService {
  private static instance: EnhancedCompatibilityCheckerService;
  
  // 互換性データベース（静的データ）
  private readonly compatibilityDatabase = {
    // CPUソケット互換性データベース
    sockets: {
      'LGA1700': {
        type: 'Intel',
        generation: '12th/13th/14th Gen',
        compatibleChipsets: ['Z690', 'B660', 'H610', 'Z790', 'B760', 'H770'],
        supportInfo: 'Intel Alder Lake, Raptor Lake対応'
      },
      'AM5': {
        type: 'AMD',
        generation: 'Ryzen 7000 Series',
        compatibleChipsets: ['X670E', 'X670', 'B650E', 'B650', 'A620'],
        supportInfo: 'AMD Zen 4アーキテクチャ対応'
      },
      'AM4': {
        type: 'AMD',
        generation: 'Ryzen 1000-5000 Series',
        compatibleChipsets: ['X570', 'B550', 'X470', 'B450', 'A520'],
        supportInfo: 'AMD Zen/Zen+/Zen2/Zen3対応'
      },
      'LGA1200': {
        type: 'Intel',
        generation: '10th/11th Gen',
        compatibleChipsets: ['Z590', 'B560', 'H510', 'Z490', 'B460', 'H410'],
        supportInfo: 'Intel Comet Lake, Rocket Lake対応'
      }
    },

    // メモリ互換性データベース
    memory: {
      'DDR5': {
        standardSpeeds: [4800, 5200, 5600, 6000, 6400, 6800, 7200],
        maxCapacity: 128,
        compatibleSockets: ['LGA1700', 'AM5'],
        voltages: [1.1, 1.25, 1.35],
        notes: '最新規格、高速・低電力'
      },
      'DDR4': {
        standardSpeeds: [2133, 2400, 2666, 2933, 3200, 3600, 4000],
        maxCapacity: 64,
        compatibleSockets: ['AM4', 'LGA1200', 'LGA1151'],
        voltages: [1.2, 1.35],
        notes: '広範囲対応、コストパフォーマンス良好'
      }
    },

    // 電源コネクタデータベース
    powerConnectors: {
      '24pin': { 
        type: 'motherboard_main', 
        required: true, 
        description: 'マザーボードメイン電源' 
      },
      '8pin_cpu': { 
        type: 'cpu_power', 
        required: true, 
        description: 'CPU電源（8pin）' 
      },
      '4+4pin': { 
        type: 'cpu_power', 
        required: true, 
        description: 'CPU電源（4+4pin分割式）' 
      },
      '8pin_pcie': { 
        type: 'gpu_power', 
        required: false, 
        description: 'PCI-E 8pin（GPU用）' 
      },
      '6pin_pcie': { 
        type: 'gpu_power', 
        required: false, 
        description: 'PCI-E 6pin（GPU用）' 
      },
      '6+2pin': { 
        type: 'gpu_power', 
        required: false, 
        description: 'PCI-E 6+2pin（8pin互換）' 
      }
    },

    // フォームファクター互換性データベース
    formFactors: {
      'ATX': {
        dimensions: { width: 305, height: 244 },
        compatibleCases: ['Full Tower', 'Mid Tower', 'ATX'],
        expansionSlots: 7,
        notes: 'スタンダードサイズ、拡張性良好'
      },
      'Micro-ATX': {
        dimensions: { width: 244, height: 244 },
        compatibleCases: ['Full Tower', 'Mid Tower', 'Micro-ATX', 'ATX'],
        expansionSlots: 4,
        notes: 'コンパクト、コストパフォーマンス良好'
      },
      'Mini-ITX': {
        dimensions: { width: 170, height: 170 },
        compatibleCases: ['Mini-ITX', 'Micro-ATX', 'Mid Tower', 'Full Tower'],
        expansionSlots: 1,
        notes: '超小型、携帯性重視'
      }
    },

    // パフォーマンス予測データベース
    performanceProfiles: {
      // 簡易的なパフォーマンス予測データ（実際の実装では外部APIやデータベース使用）
      cpuTiers: {
        'flagship': { minPrice: 80000, performance: 95, category: 'flagship' },
        'high-end': { minPrice: 50000, performance: 85, category: 'high-end' },
        'mainstream': { minPrice: 25000, performance: 70, category: 'mainstream' },
        'entry': { minPrice: 0, performance: 50, category: 'entry' }
      },
      gpuTiers: {
        'flagship': { minPrice: 150000, performance: 95, category: 'flagship' },
        'high-end': { minPrice: 80000, performance: 85, category: 'high-end' },
        'mainstream': { minPrice: 40000, performance: 70, category: 'mainstream' },
        'entry': { minPrice: 0, performance: 50, category: 'entry' }
      }
    }
  };

  // シングルトンパターン
  public static getInstance(): EnhancedCompatibilityCheckerService {
    if (!EnhancedCompatibilityCheckerService.instance) {
      EnhancedCompatibilityCheckerService.instance = new EnhancedCompatibilityCheckerService();
    }
    return EnhancedCompatibilityCheckerService.instance;
  }

  // 🚀 メイン互換性チェック関数（強化版）
  public checkFullCompatibility(config: PCConfiguration): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    
    // 各種互換性チェックを実行（強化版）
    const cpuSocket = this.checkCpuSocketCompatibilityEnhanced(config);
    const memoryType = this.checkMemoryCompatibilityEnhanced(config);
    const powerConnectors = this.checkPowerConnectorCompatibilityEnhanced(config);
    const physicalFit = this.checkPhysicalCompatibilityEnhanced(config);
    const performanceMatch = this.checkPerformanceBalanceEnhanced(config);

    // チェック結果から issues と warnings を収集
    this.collectIssuesAndWarnings(
      { cpuSocket, memoryType, powerConnectors, physicalFit, performanceMatch },
      issues,
      warnings
    );

    // 互換性スコアを計算（強化版）
    const score = this.calculateCompatibilityScoreEnhanced({
      cpuSocket,
      memoryType,
      powerConnectors,
      physicalFit,
      performanceMatch
    }, issues.length, warnings.length);

    const details: CompatibilityDetails = {
      cpuSocket,
      memoryType,
      powerConnectors,
      physicalFit,
      performanceMatch
    };

    // 🎯 改良版 isCompatible 判定
    const hasCriticalIssues = issues.filter(issue => issue.severity === 'critical').length > 0;
    const hasUnselectedParts = this.hasUnselectedEssentialParts(config);

    return {
      isCompatible: !hasCriticalIssues && !hasUnselectedParts,
      issues,
      warnings,
      score,
      checkedAt: new Date(),
      details
    };
  }

  // 🎯 強化版CPUソケット互換性チェック
  private checkCpuSocketCompatibilityEnhanced(config: PCConfiguration): SocketCompatibility {
    const cpu = config.parts.cpu;
    const motherboard = config.parts.motherboard;

    if (!cpu || !motherboard) {
      return {
        compatible: true,
        message: 'CPUまたはマザーボードの選択を待っています'
      };
    }

    const cpuSocket = this.getSpecValue(cpu.specifications, 'socket') as string | undefined;
    const motherboardSocket = this.getSpecValue(motherboard.specifications, 'socket') as string | undefined;
    const chipset = this.getSpecValue(motherboard.specifications, 'chipset') as string | undefined;

    if (!cpuSocket || !motherboardSocket) {
      return {
        compatible: false,
        cpuSocket,
        motherboardSocket,
        message: 'ソケット情報が不完全です'
      };
    }

    const compatible = cpuSocket === motherboardSocket;
    const socketInfo = this.compatibilityDatabase.sockets[cpuSocket as keyof typeof this.compatibilityDatabase.sockets];
    
    let message = '';
    if (compatible) {
      message = `ソケット ${cpuSocket} で互換性があります`;
      if (socketInfo) {
        message += ` (${socketInfo.supportInfo})`;
        
        // チップセット互換性の詳細チェック
        if (chipset && socketInfo.compatibleChipsets && !socketInfo.compatibleChipsets.includes(chipset)) {
          message += ` ⚠️ チップセット ${chipset} の対応を確認してください`;
        }
      }
    } else {
      message = `ソケットが一致しません (CPU: ${cpuSocket}, マザーボード: ${motherboardSocket})`;
      if (socketInfo) {
        message += ` CPUは${socketInfo.type} ${socketInfo.generation}対応が必要です`;
      }
    }

    return {
      compatible,
      cpuSocket,
      motherboardSocket,
      chipset,
      supportedChipsets: socketInfo?.compatibleChipsets,
      message
    };
  }

  // 🎯 強化版メモリ互換性チェック
  private checkMemoryCompatibilityEnhanced(config: PCConfiguration): MemoryCompatibility {
    const memory = config.parts.memory;
    const motherboard = config.parts.motherboard;
    // const cpu = config.parts.cpu; // 将来の拡張用（現在未使用）

    if (!memory || !motherboard) {
      return {
        compatible: true,
        message: 'メモリまたはマザーボードの選択を待っています'
      };
    }

    const memoryType = this.getSpecValue(memory.specifications, 'type') as string | undefined;
    const memorySpeed = this.getSpecValue(memory.specifications, 'speed') as number | undefined;
    const memoryCapacity = this.getSpecValue(memory.specifications, 'capacity') as number | undefined;
    const supportedTypes = this.getSpecArray(motherboard.specifications, 'memoryType');
    const maxCapacity = (this.getSpecValue(motherboard.specifications, 'maxMemory') as number) || 128;

    if (!memoryType) {
      return {
        compatible: false,
        message: 'メモリタイプ情報が不完全です'
      };
    }

    const memoryInfo = this.compatibilityDatabase.memory[memoryType as keyof typeof this.compatibilityDatabase.memory];
    const typeCompatible = supportedTypes.length === 0 || supportedTypes.includes(memoryType);
    const capacityCompatible = !memoryCapacity || memoryCapacity <= maxCapacity;
    
    // メモリスピード互換性チェック
    // let speedCompatible = true; // 今後の拡張用
    let speedWarning = '';
    if (memorySpeed && memoryInfo) {
      const isJedecStandard = memoryInfo.standardSpeeds.includes(memorySpeed);
      if (!isJedecStandard) {
        speedWarning = `メモリ速度 ${memorySpeed}MHz はオーバークロック設定が必要です`;
      }
    }

    const compatible = typeCompatible && capacityCompatible;
    const warnings: string[] = [];
    if (speedWarning) warnings.push(speedWarning);

    let message = '';
    if (!typeCompatible) {
      message = `メモリタイプが対応していません (メモリ: ${memoryType}, 対応: ${supportedTypes.join(', ')})`;
    } else if (!capacityCompatible) {
      message = `メモリ容量が上限を超えています (${memoryCapacity}GB > ${maxCapacity}GB)`;
    } else {
      message = `${memoryType} メモリで互換性があります`;
      if (memoryInfo) {
        message += ` (${memoryInfo.notes})`;
      }
      if (speedWarning) {
        message += ` ${speedWarning}`;
      }
    }

    return {
      compatible,
      memoryType,
      memorySpeed,
      totalCapacity: memoryCapacity,
      maxCapacity,
      supportedTypes: supportedTypes.length > 0 ? supportedTypes : memoryInfo?.compatibleSockets || [],
      supportedSpeeds: memoryInfo?.standardSpeeds,
      isJedecStandard: memorySpeed ? memoryInfo?.standardSpeeds.includes(memorySpeed) : undefined,
      isOverclocking: speedWarning.length > 0,
      warnings,
      message
    };
  }

  // 🎯 強化版電源コネクタ互換性チェック
  private checkPowerConnectorCompatibilityEnhanced(config: PCConfiguration): PowerConnectorCompatibility {
    const psu = config.parts.psu;
    const gpu = config.parts.gpu;
    const motherboard = config.parts.motherboard;
    const cpu = config.parts.cpu;

    if (!psu) {
      return {
        compatible: true,
        requiredConnectors: [],
        availableConnectors: [],
        missingConnectors: [],
        message: '電源ユニットの選択を待っています'
      };
    }

    const requiredConnectors: Array<{connector: string, purpose: string, device: string}> = [];
    const availableConnectors = this.getSpecObject(psu.specifications, 'connectors');

    // 必要なコネクタの詳細収集
    if (motherboard) {
      requiredConnectors.push({
        connector: '24pin',
        purpose: 'メイン電源',
        device: motherboard.name
      });
      
      const cpuPowerConnector = (this.getSpecValue(motherboard.specifications, 'cpuPowerConnector') as string) || '8pin_cpu';
      requiredConnectors.push({
        connector: cpuPowerConnector,
        purpose: 'CPU電源',
        device: cpu?.name || 'CPU'
      });
    }

    if (gpu) {
      const gpuConnectors = this.getSpecArray(gpu.specifications, 'powerConnectors');
      gpuConnectors.forEach(connector => {
        requiredConnectors.push({
          connector,
          purpose: 'GPU電源',
          device: gpu.name
        });
      });
    }

    // 利用可能なコネクタをリスト化
    const availableList: string[] = [];
    Object.entries(availableConnectors).forEach(([type, count]) => {
      const numCount = typeof count === 'number' ? count : 0;
      for (let i = 0; i < numCount; i++) {
        availableList.push(type);
      }
    });

    // 不足コネクタの確認（詳細版）
    const missingDetails: Array<{connector: string, purpose: string, device: string}> = [];
    const availableCopy = [...availableList];

    requiredConnectors.forEach(requirement => {
      const availableIndex = availableCopy.findIndex(available => 
        this.isConnectorCompatibleEnhanced(requirement.connector, available)
      );
      
      if (availableIndex === -1) {
        missingDetails.push(requirement);
      } else {
        availableCopy.splice(availableIndex, 1);
      }
    });

    const compatible = missingDetails.length === 0;
    const missingConnectors = missingDetails.map(detail => detail.connector);

    // 電源容量チェック
    const psuWattage = (this.getSpecValue(psu.specifications, 'wattage') as number) || 0;
    const totalPowerConsumption = this.calculateTotalPowerConsumption(config);
    let powerWarning = '';
    
    if (psuWattage > 0 && totalPowerConsumption > 0) {
      const efficiency = 0.8; // 80%効率と仮定
      const recommendedWattage = totalPowerConsumption / efficiency * 1.2; // 20%マージン
      
      if (psuWattage < recommendedWattage) {
        powerWarning = `電源容量不足の可能性 (推奨: ${Math.ceil(recommendedWattage)}W以上, 現在: ${psuWattage}W)`;
      }
    }

    let message = '';
    if (!compatible) {
      message = `不足している電源コネクタ: ${missingConnectors.join(', ')}`;
      message += ` (${missingDetails.map(d => `${d.connector} for ${d.device}`).join(', ')})`;
    } else {
      message = '電源コネクタに問題ありません';
      if (powerWarning) {
        message += ` ⚠️ ${powerWarning}`;
      }
    }

    return {
      compatible,
      requiredConnectors: requiredConnectors.map(r => r.connector),
      availableConnectors: availableList,
      missingConnectors,
      requiredDetails: requiredConnectors,
      missingDetails,
      powerWarning,
      message
    };
  }

  // 🎯 強化版物理的互換性チェック
  private checkPhysicalCompatibilityEnhanced(config: PCConfiguration): PhysicalCompatibility {
    const pcCase = config.parts.case;
    const motherboard = config.parts.motherboard;
    const gpu = config.parts.gpu;
    const cooler = config.parts.cooler;

    const issues: string[] = [];
    const warnings: string[] = [];
    const detailedChecks: Array<{check: string, status: 'pass' | 'warning' | 'fail', details: string}> = [];

    if (!pcCase) {
      return {
        compatible: true,
        issues: [],
        warnings: [],
        message: 'ケースの選択を待っています'
      };
    }

    // マザーボードサイズチェック（詳細版）
    if (motherboard) {
      const motherboardSize = this.getSpecValue(motherboard.specifications, 'formFactor') as string | undefined;
      const supportedSizes = this.getSpecArray(pcCase.specifications, 'supportedFormFactors');
      
      if (motherboardSize) {
        const formFactorInfo = this.compatibilityDatabase.formFactors[motherboardSize as keyof typeof this.compatibilityDatabase.formFactors];
        
        if (supportedSizes.length > 0) {
          if (!supportedSizes.includes(motherboardSize)) {
            issues.push(`マザーボード ${motherboardSize} がケースに対応していません`);
            detailedChecks.push({
              check: 'マザーボードフォームファクター',
              status: 'fail',
              details: `${motherboardSize} は対応していません (対応: ${supportedSizes.join(', ')})`
            });
          } else {
            detailedChecks.push({
              check: 'マザーボードフォームファクター',
              status: 'pass',
              details: `${motherboardSize} は対応しています`
            });
          }
        }
        
        if (formFactorInfo) {
          detailedChecks.push({
            check: 'マザーボード情報',
            status: 'pass',
            details: `${formFactorInfo.notes} (拡張スロット: ${formFactorInfo.expansionSlots})`
          });
        }
      }
    }

    // GPUサイズチェック（詳細版）
    if (gpu) {
      const gpuLength = (this.getSpecValue(gpu.specifications, 'length') as number) || 0;
      const gpuHeight = (this.getSpecValue(gpu.specifications, 'height') as number) || 0;
      const maxGpuLength = (this.getSpecValue(pcCase.specifications, 'maxGpuLength') as number) || 1000;
      const maxGpuHeight = (this.getSpecValue(pcCase.specifications, 'maxGpuHeight') as number) || 200;
      
      if (gpuLength > 0 && gpuLength > maxGpuLength) {
        issues.push(`GPU長 ${gpuLength}mm がケース上限 ${maxGpuLength}mm を超えています`);
        detailedChecks.push({
          check: 'GPU長さ',
          status: 'fail',
          details: `${gpuLength}mm > ${maxGpuLength}mm (上限超過)`
        });
      } else if (gpuLength > 0 && gpuLength > maxGpuLength * 0.9) {
        warnings.push(`GPU長がケース上限に近いです (${gpuLength}mm / ${maxGpuLength}mm)`);
        detailedChecks.push({
          check: 'GPU長さ',
          status: 'warning',
          details: `${gpuLength}mm (上限の90%以上: ${maxGpuLength}mm)`
        });
      } else if (gpuLength > 0) {
        detailedChecks.push({
          check: 'GPU長さ',
          status: 'pass',
          details: `${gpuLength}mm (上限: ${maxGpuLength}mm)`
        });
      }

      if (gpuHeight > 0 && gpuHeight > maxGpuHeight) {
        issues.push(`GPU高 ${gpuHeight}mm がケース上限 ${maxGpuHeight}mm を超えています`);
        detailedChecks.push({
          check: 'GPU高さ',
          status: 'fail',
          details: `${gpuHeight}mm > ${maxGpuHeight}mm (上限超過)`
        });
      } else if (gpuHeight > 0) {
        detailedChecks.push({
          check: 'GPU高さ',
          status: 'pass',
          details: `${gpuHeight}mm (上限: ${maxGpuHeight}mm)`
        });
      }
    }

    // CPUクーラーサイズチェック（詳細版）
    if (cooler) {
      const coolerHeight = (this.getSpecValue(cooler.specifications, 'height') as number) || 0;
      const coolerType = this.getSpecValue(cooler.specifications, 'type') as string;
      const maxCoolerHeight = (this.getSpecValue(pcCase.specifications, 'maxCoolerHeight') as number) || 1000;
      
      if (coolerHeight > 0 && coolerHeight > maxCoolerHeight) {
        issues.push(`CPUクーラー高 ${coolerHeight}mm がケース上限 ${maxCoolerHeight}mm を超えています`);
        detailedChecks.push({
          check: 'CPUクーラー高さ',
          status: 'fail',
          details: `${coolerHeight}mm > ${maxCoolerHeight}mm (上限超過)`
        });
      } else if (coolerHeight > 0 && coolerHeight > maxCoolerHeight * 0.95) {
        warnings.push(`クーラー高がケース上限に近いです (${coolerHeight}mm / ${maxCoolerHeight}mm)`);
        detailedChecks.push({
          check: 'CPUクーラー高さ',
          status: 'warning',
          details: `${coolerHeight}mm (上限の95%以上: ${maxCoolerHeight}mm)`
        });
      } else if (coolerHeight > 0) {
        detailedChecks.push({
          check: 'CPUクーラー高さ',
          status: 'pass',
          details: `${coolerHeight}mm (上限: ${maxCoolerHeight}mm)`
        });
      }

      if (coolerType) {
        detailedChecks.push({
          check: 'クーラータイプ',
          status: 'pass',
          details: `${coolerType}クーラー`
        });
      }
    }

    const compatible = issues.length === 0;

    let message = '';
    if (!compatible) {
      message = `${issues.length}件のサイズ問題があります`;
    } else if (warnings.length > 0) {
      message = `物理的サイズに問題ありませんが、${warnings.length}件の注意点があります`;
    } else {
      message = '物理的サイズに問題ありません';
    }

    return {
      compatible,
      issues,
      warnings,
      detailedChecks,
      caseType: this.getSpecValue(pcCase.specifications, 'type') as string,
      message
    };
  }

  // 🎯 強化版パフォーマンスバランスチェック
  private checkPerformanceBalanceEnhanced(config: PCConfiguration): PerformanceCompatibility {
    const cpu = config.parts.cpu;
    const gpu = config.parts.gpu;

    if (!cpu || !gpu) {
      return {
        balanced: true,
        bottlenecks: [],
        recommendations: [],
        message: 'CPUまたはGPUの選択を待っています'
      };
    }

    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // パフォーマンス分析（価格ベース簡易版）
    const cpuPrice = cpu.price || 0;
    const gpuPrice = gpu.price || 0;
    const cpuTier = this.getCpuTier(cpuPrice);
    const gpuTier = this.getGpuTier(gpuPrice);

    // パフォーマンスバランス分析
    const cpuPerformance = this.compatibilityDatabase.performanceProfiles.cpuTiers[cpuTier].performance;
    const gpuPerformance = this.compatibilityDatabase.performanceProfiles.gpuTiers[gpuTier].performance;
    
    const performanceDifference = Math.abs(cpuPerformance - gpuPerformance);
    let bottleneckType: 'cpu' | 'gpu' | 'balanced' | 'unknown' = 'balanced';
    let severity: 'none' | 'mild' | 'moderate' | 'severe' = 'none';

    if (performanceDifference > 20) {
      severity = 'severe';
      if (cpuPerformance < gpuPerformance) {
        bottleneckType = 'cpu';
        bottlenecks.push(`CPUがボトルネックになる可能性があります (CPU: ${cpuTier}, GPU: ${gpuTier})`);
        recommendations.push(`より高性能なCPU（${this.getHigherTier(cpuTier)}クラス以上）を検討してください`);
      } else {
        bottleneckType = 'gpu';
        bottlenecks.push(`GPUがボトルネックになる可能性があります (CPU: ${cpuTier}, GPU: ${gpuTier})`);
        recommendations.push(`より高性能なGPU（${this.getHigherTier(gpuTier)}クラス以上）を検討してください`);
      }
    } else if (performanceDifference > 10) {
      severity = 'mild';
      bottlenecks.push(`軽微なパフォーマンス不均衡があります (${performanceDifference}点差)`);
      recommendations.push('現在の構成でも十分ですが、将来のアップグレードで均衡を図ることを推奨します');
    }

    // 用途別スコア計算
    const useCaseScores = {
      gaming: this.calculateGamingScore(cpuTier, gpuTier),
      contentCreation: this.calculateContentCreationScore(cpuTier, gpuTier),
      workstation: this.calculateWorkstationScore(cpuTier, gpuTier),
      overall: Math.round((cpuPerformance + gpuPerformance) / 2)
    };

    // ゲーミングパフォーマンス予測
    const gamingPerformance = {
      averageFps: this.predictFrameRates(cpuTier, gpuTier),
      recommendedResolution: this.getRecommendedResolution(gpuTier),
      rayTracingViable: gpuTier === 'high-end' || gpuTier === 'flagship',
      dlssAvailable: gpu.name.toLowerCase().includes('rtx'),
      performanceClass: gpuTier as 'entry' | 'mainstream' | 'high-end' | 'flagship'
    };

    const balanced = bottlenecks.length === 0;
    const ratio = gpuPerformance / cpuPerformance;

    const message = balanced 
      ? `パフォーマンスバランスに問題ありません (CPU: ${cpuTier}, GPU: ${gpuTier})`
      : `${bottlenecks.length}件のパフォーマンス課題があります (${severity}レベル)`;

    return {
      balanced,
      bottlenecks,
      recommendations,
      severity,
      performanceScore: useCaseScores.overall,
      useCaseScores,
      bottleneckAnalysis: {
        cpuUtilization: bottleneckType === 'gpu' ? 100 : 80,
        gpuUtilization: bottleneckType === 'cpu' ? 100 : 80,
        bottleneckType,
        severity,
        ratio,
        message: bottlenecks[0] || 'バランスの取れた構成です'
      },
      gamingPerformance,
      message
    };
  }

  // ヘルパーメソッド群
  private collectIssuesAndWarnings(
    details: CompatibilityDetails,
    issues: CompatibilityIssue[],
    warnings: CompatibilityWarning[]
  ): void {
    // CPUソケット関連
    if (!details.cpuSocket.compatible && !details.cpuSocket.message.includes('待っています')) {
      issues.push({
        id: 'cpu_socket_mismatch',
        type: 'socket_mismatch',
        severity: 'critical',
        message: details.cpuSocket.message,
        affectedParts: ['cpu', 'motherboard'],
        solution: 'CPUソケットが一致するマザーボードを選択してください',
        category: 'ソケット互換性'
      });
    }

    // メモリ関連
    if (!details.memoryType.compatible && !details.memoryType.message.includes('待っています')) {
      issues.push({
        id: 'memory_type_mismatch',
        type: 'memory_incompatible',
        severity: 'critical',
        message: details.memoryType.message,
        affectedParts: ['memory', 'motherboard'],
        solution: 'マザーボードが対応するメモリ規格を選択してください',
        category: 'メモリ互換性'
      });
    }

    if (details.memoryType.warnings && details.memoryType.warnings.length > 0) {
      details.memoryType.warnings.forEach((warning, index) => {
        warnings.push({
          id: `memory_warning_${index}`,
          message: warning,
          recommendation: 'JEDEC標準速度のメモリまたはオーバークロック対応マザーボードを検討してください',
          priority: 'medium'
        });
      });
    }

    // 電源関連
    if (!details.powerConnectors.compatible && !details.powerConnectors.message.includes('待っています')) {
      issues.push({
        id: 'power_connector_missing',
        type: 'connector_missing',
        severity: 'critical',
        message: details.powerConnectors.message,
        affectedParts: ['psu', 'gpu', 'motherboard'],
        solution: '必要なコネクタを持つ電源ユニットを選択してください',
        category: '電源コネクタ'
      });
    }

    if (details.powerConnectors.powerWarning) {
      warnings.push({
        id: 'power_capacity_warning',
        message: details.powerConnectors.powerWarning,
        recommendation: 'より大容量の電源ユニットを検討してください',
        priority: 'high'
      });
    }

    // 物理的互換性関連
    if (!details.physicalFit.compatible && !details.physicalFit.message.includes('待っています')) {
      details.physicalFit.issues.forEach((issue, index) => {
        issues.push({
          id: `physical_fit_${index}`,
          type: 'size_conflict',
          severity: 'critical',
          message: issue,
          affectedParts: ['case', 'motherboard', 'gpu', 'cooler'],
          solution: 'より大きなケースまたは小さなパーツを検討してください',
          category: '物理的サイズ'
        });
      });

      details.physicalFit.warnings.forEach((warning, index) => {
        warnings.push({
          id: `physical_warning_${index}`,
          message: warning,
          recommendation: 'サイズを再確認することを推奨します',
          priority: 'medium'
        });
      });
    }

    // パフォーマンス関連
    if (!details.performanceMatch.balanced && !details.performanceMatch.message.includes('待っています')) {
      details.performanceMatch.bottlenecks.forEach((bottleneck, index) => {
        const severity = details.performanceMatch.severity === 'severe' ? 'critical' : 'warning';
        if (severity === 'critical') {
          issues.push({
            id: `performance_bottleneck_${index}`,
            type: 'power_insufficient',
            severity: 'critical',
            message: bottleneck,
            affectedParts: ['cpu', 'gpu'],
            solution: details.performanceMatch.recommendations[index] || 'バランスの取れた構成を検討してください',
            category: 'パフォーマンスバランス'
          });
        } else {
          warnings.push({
            id: `performance_bottleneck_${index}`,
            message: bottleneck,
            recommendation: details.performanceMatch.recommendations[index] || 'バランスの取れた構成を検討してください',
            priority: 'medium'
          });
        }
      });
    }
  }

  private calculateCompatibilityScoreEnhanced(
    details: CompatibilityDetails,
    criticalIssues: number,
    warnings: number
  ): number {
    let score = 100;

    // 未選択パーツによる減点
    if (details.cpuSocket.message.includes('待っています')) score -= 25;
    if (details.memoryType.message.includes('待っています')) score -= 20;
    if (details.powerConnectors.message.includes('待っています')) score -= 20;
    if (details.physicalFit.message.includes('待っています')) score -= 15;
    if (details.performanceMatch.message.includes('待っています')) score -= 10;

    // 互換性問題による減点（重み付き）
    if (!details.cpuSocket.compatible && !details.cpuSocket.message.includes('待っています')) score -= 30;
    if (!details.memoryType.compatible && !details.memoryType.message.includes('待っています')) score -= 25;
    if (!details.powerConnectors.compatible && !details.powerConnectors.message.includes('待っています')) score -= 25;
    if (!details.physicalFit.compatible && !details.physicalFit.message.includes('待っています')) score -= 15;
    
    // パフォーマンスバランスによる減点（段階的）
    if (details.performanceMatch.severity === 'severe') score -= 20;
    else if (details.performanceMatch.severity === 'moderate') score -= 10;
    else if (details.performanceMatch.severity === 'mild') score -= 5;

    // 追加の問題による減点
    score -= criticalIssues * 8;
    score -= warnings * 3;

    // ボーナスポイント（良い構成の場合）
    if (details.cpuSocket.compatible && details.memoryType.compatible && details.powerConnectors.compatible && 
        details.physicalFit.compatible && details.performanceMatch.balanced) {
      score += 5; // 完全互換性ボーナス
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private hasUnselectedEssentialParts(config: PCConfiguration): boolean {
    const essentialParts = ['cpu', 'motherboard', 'memory', 'psu'] as const;
    return essentialParts.some(part => !config.parts[part]);
  }

  private calculateTotalPowerConsumption(config: PCConfiguration): number {
    let total = 0;
    Object.values(config.parts).forEach(part => {
      if (part && part.powerConsumption) {
        total += part.powerConsumption;
      }
    });
    return total;
  }

  private isConnectorCompatibleEnhanced(required: string, available: string): boolean {
    if (required === available) return true;
    
    const compatibilityMap: Record<string, string[]> = {
      '8pin_cpu': ['8pin_cpu', '4+4pin'],
      '4pin': ['4pin', '4+4pin'],
      '8pin_pcie': ['8pin_pcie', '6+2pin'],
      '6pin_pcie': ['6pin_pcie', '6+2pin'],
      '24pin': ['24pin']
    };
    
    const compatibleConnectors = compatibilityMap[required] || [required];
    return compatibleConnectors.includes(available);
  }

  private getCpuTier(price: number): 'entry' | 'mainstream' | 'high-end' | 'flagship' {
    if (price >= 80000) return 'flagship';
    if (price >= 50000) return 'high-end';
    if (price >= 25000) return 'mainstream';
    return 'entry';
  }

  private getGpuTier(price: number): 'entry' | 'mainstream' | 'high-end' | 'flagship' {
    if (price >= 150000) return 'flagship';
    if (price >= 80000) return 'high-end';
    if (price >= 40000) return 'mainstream';
    return 'entry';
  }

  private getHigherTier(currentTier: string): string {
    const tiers = ['entry', 'mainstream', 'high-end', 'flagship'];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : currentTier;
  }

  private calculateGamingScore(cpuTier: string, gpuTier: string): number {
    const cpuScore = this.compatibilityDatabase.performanceProfiles.cpuTiers[cpuTier as keyof typeof this.compatibilityDatabase.performanceProfiles.cpuTiers].performance * 0.3;
    const gpuScore = this.compatibilityDatabase.performanceProfiles.gpuTiers[gpuTier as keyof typeof this.compatibilityDatabase.performanceProfiles.gpuTiers].performance * 0.7;
    return Math.round(cpuScore + gpuScore);
  }

  private calculateContentCreationScore(cpuTier: string, gpuTier: string): number {
    const cpuScore = this.compatibilityDatabase.performanceProfiles.cpuTiers[cpuTier as keyof typeof this.compatibilityDatabase.performanceProfiles.cpuTiers].performance * 0.6;
    const gpuScore = this.compatibilityDatabase.performanceProfiles.gpuTiers[gpuTier as keyof typeof this.compatibilityDatabase.performanceProfiles.gpuTiers].performance * 0.4;
    return Math.round(cpuScore + gpuScore);
  }

  private calculateWorkstationScore(cpuTier: string, gpuTier: string): number {
    const cpuScore = this.compatibilityDatabase.performanceProfiles.cpuTiers[cpuTier as keyof typeof this.compatibilityDatabase.performanceProfiles.cpuTiers].performance * 0.7;
    const gpuScore = this.compatibilityDatabase.performanceProfiles.gpuTiers[gpuTier as keyof typeof this.compatibilityDatabase.performanceProfiles.gpuTiers].performance * 0.3;
    return Math.round(cpuScore + gpuScore);
  }

  private predictFrameRates(_cpuTier: string, gpuTier: string): Record<string, number> {
    const baseFrameRates: Record<string, Record<string, number>> = {
      'entry': { '1080p': 45, '1440p': 30, '4K': 20 },
      'mainstream': { '1080p': 75, '1440p': 55, '4K': 35 },
      'high-end': { '1080p': 120, '1440p': 95, '4K': 65 },
      'flagship': { '1080p': 165, '1440p': 140, '4K': 95 }
    };

    return baseFrameRates[gpuTier] || baseFrameRates['entry'];
  }

  private getRecommendedResolution(gpuTier: string): string {
    const resolutionMap: Record<string, string> = {
      'entry': '1080p',
      'mainstream': '1080p',
      'high-end': '1440p',
      'flagship': '4K'
    };

    return resolutionMap[gpuTier] || '1080p';
  }

  // 既存のヘルパーメソッド
  private getSpecValue(spec: Record<string, unknown> | undefined, key: string): unknown {
    if (!spec) return undefined;
    return spec[key] || undefined;
  }

  private getSpecArray(spec: Record<string, unknown> | undefined, key: string): string[] {
    if (!spec) return [];
    const value = spec[key];
    if (Array.isArray(value)) {
      return value as string[];
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  }

  private getSpecObject(spec: Record<string, unknown> | undefined, key: string): Record<string, unknown> {
    if (!spec) return {};
    const value = spec[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }
}

// 既存のサービスとの互換性のためのエクスポート
export { EnhancedCompatibilityCheckerService as CompatibilityCheckerService };
export default EnhancedCompatibilityCheckerService;

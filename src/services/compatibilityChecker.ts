// src/services/compatibilityChecker.ts
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
import { CompatibilityDatabaseService } from './compatibilityDatabase';
import { PerformancePredictionService, PerformancePredictionResult } from './performancePrediction';

export class CompatibilityCheckerService {
  private static instance: CompatibilityCheckerService;
  private database: CompatibilityDatabaseService;
  private performancePrediction: PerformancePredictionService;
  
  private constructor() {
    this.database = CompatibilityDatabaseService.getInstance();
    this.performancePrediction = PerformancePredictionService.getInstance();
  }
  
  // シングルトンパターン
  public static getInstance(): CompatibilityCheckerService {
    if (!CompatibilityCheckerService.instance) {
      CompatibilityCheckerService.instance = new CompatibilityCheckerService();
    }
    return CompatibilityCheckerService.instance;
  }

  // メイン互換性チェック関数（パフォーマンス予測統合版）
  public checkCompatibility(config: PCConfiguration): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    
    // 必須パーツの選択チェック
    const missingParts = this.checkMissingParts(config);
    if (missingParts.length > 0) {
      missingParts.forEach(partType => {
        issues.push({
          id: `missing_${partType}`,
          type: 'missing_part',
          severity: 'critical',
          message: `${this.getPartDisplayName(partType)}を選択してください`,
          affectedParts: [partType],
          solution: `構成に${this.getPartDisplayName(partType)}を追加してください`,
          category: '必須パーツ'
        });
      });
    }
    
    // 各種互換性チェックを実行
    const cpuSocket = this.checkCpuSocketCompatibility(config);
    const memoryType = this.checkMemoryCompatibility(config);
    const powerConnectors = this.checkPowerConnectorCompatibility(config);
    const physicalFit = this.checkPhysicalCompatibility(config);
    
    // パフォーマンス予測を実行（新機能）
    const performancePrediction = this.performancePrediction.predictPerformance(config);
    const performanceMatch = this.convertPerformancePredictionToCompatibility(performancePrediction);

    // チェック結果から issues と warnings を収集
    if (!cpuSocket.compatible) {
      issues.push({
        id: 'cpu_socket_mismatch',
        type: 'socket_mismatch',
        severity: 'critical',
        message: cpuSocket.message,
        affectedParts: ['cpu', 'motherboard'],
        solution: 'CPUソケットが一致するマザーボードを選択してください',
        category: 'ソケット互換性'
      });
    }

    if (!memoryType.compatible) {
      issues.push({
        id: 'memory_type_mismatch',
        type: 'memory_incompatible',
        severity: 'critical',
        message: memoryType.message,
        affectedParts: ['memory', 'motherboard'],
        solution: 'マザーボードが対応するメモリ規格を選択してください',
        category: 'メモリ互換性'
      });
    }

    if (!powerConnectors.compatible) {
      issues.push({
        id: 'power_connector_missing',
        type: 'connector_missing',
        severity: 'critical',
        message: powerConnectors.message,
        affectedParts: ['psu', 'gpu', 'motherboard'],
        solution: '必要なコネクタを持つ電源ユニットを選択してください',
        category: '電源コネクタ'
      });
    }

    if (!physicalFit.compatible) {
      physicalFit.issues.forEach((issue: string, index: number) => {
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

      physicalFit.warnings.forEach((warning: string, index: number) => {
        warnings.push({
          id: `physical_warning_${index}`,
          message: warning,
          recommendation: 'サイズを再確認することを推奨します',
          priority: 'medium'
        });
      });
    }

    // パフォーマンス関連の警告を追加
    if (!performanceMatch.balanced) {
      performanceMatch.bottlenecks.forEach((bottleneck: string, index: number) => {
        warnings.push({
          id: `performance_bottleneck_${index}`,
          message: bottleneck,
          recommendation: 'バランスの取れた構成を検討してください',
          priority: performanceMatch.severity === 'severe' ? 'high' : 'medium'
        });
      });
    }

    // 互換性スコアを計算（パフォーマンス要素を含む）
    const score = this.calculateCompatibilityScore({
      cpuSocket,
      memoryType,
      powerConnectors,
      physicalFit,
      performanceMatch
    }, issues.length, warnings.length, performancePrediction);

    const details: CompatibilityDetails = {
      cpuSocket,
      memoryType,
      powerConnectors,
      physicalFit,
      performanceMatch,
      performancePrediction // 新しく追加
    };

    return {
      isCompatible: issues.filter(issue => issue.severity === 'critical').length === 0,
      issues,
      warnings,
      score,
      checkedAt: new Date(),
      details
    };
  }

  // CPUソケット互換性チェック（強化版）
  private checkCpuSocketCompatibility(config: PCConfiguration): SocketCompatibility {
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

    // データベースから詳細な互換性情報を取得
    const socketData = this.database.getCpuSocketCompatibility(cpuSocket);
    const supportedChipsets = this.database.getSupportedChipsets(cpuSocket);

    const socketCompatible = cpuSocket === motherboardSocket;
    const chipsetCompatible = !chipset || supportedChipsets.includes(chipset);

    // CPU名での具体的なサポートチェック
    const cpuName = cpu.name || '';
    let cpuSupported = true;
    if (socketData) {
      cpuSupported = socketData.supportedCPUs.some((supportedCpu: string) => 
        cpuName.includes(supportedCpu) || supportedCpu.includes(cpuName.split(' ')[0])
      );
    }

    const compatible = socketCompatible && chipsetCompatible && cpuSupported;

    let message = '';
    if (!socketCompatible) {
      message = `ソケットが一致しません (CPU: ${cpuSocket}, マザーボード: ${motherboardSocket})`;
    } else if (!chipsetCompatible) {
      message = `チップセット ${chipset} が CPU ${cpuSocket} でサポートされていません`;
    } else if (!cpuSupported) {
      message = `CPU ${cpuName} がマザーボードで正式サポートされていない可能性があります`;
    } else {
      message = `ソケット ${cpuSocket} で互換性があります${chipset ? ` (チップセット: ${chipset})` : ''}`;
    }

    return {
      compatible,
      cpuSocket,
      motherboardSocket,
      chipset,
      supportedChipsets,
      message
    };
  }

  // メモリ互換性チェック（強化版）
  private checkMemoryCompatibility(config: PCConfiguration): MemoryCompatibility {
    const memory = config.parts.memory;
    const motherboard = config.parts.motherboard;

    if (!memory || !motherboard) {
      return {
        compatible: true,
        message: 'メモリまたはマザーボードの選択を待っています'
      };
    }

    const memoryType = this.getSpecValue(memory.specifications, 'type') as string | undefined;
    const memorySpeed = (this.getSpecValue(memory.specifications, 'speed') as number) || 0;
    const memoryCapacity = (this.getSpecValue(memory.specifications, 'capacity') as number) || 0;
    const moduleCount = (this.getSpecValue(memory.specifications, 'modules') as number) || 1;
    
    const motherboardSocket = this.getSpecValue(motherboard.specifications, 'socket') as string | undefined;
    const chipset = this.getSpecValue(motherboard.specifications, 'chipset') as string | undefined;

    if (!memoryType) {
      return {
        compatible: false,
        message: 'メモリタイプ情報が不完全です'
      };
    }

    // データベースからメモリ互換性情報を取得
    const memoryData = this.database.getMemoryCompatibility(memoryType);
    const chipsetMemorySupport = chipset ? this.database.getChipsetMemorySupport(chipset) : null;
    
    // ソケット対応チェック
    const socketSupported = !memoryData || !motherboardSocket || 
      memoryData.supportedSockets.includes(motherboardSocket);
    
    // チップセット対応チェック
    const chipsetSupported = !memoryData || !chipset ||
      memoryData.supportedChipsets.includes(chipset);
    
    // メモリ速度チェック
    const speedSupported = !memoryData || memorySpeed === 0 ||
      memoryData.standardSpeeds.includes(memorySpeed) ||
      memoryData.overclockingSpeeds.includes(memorySpeed);
    
    // メモリ容量チェック
    const totalCapacity = memoryCapacity * moduleCount;
    const maxCapacity = chipsetMemorySupport?.maxCapacity || 
      memoryData?.maxTotalCapacity?.mainstream || 128;
    const capacitySupported = totalCapacity <= maxCapacity;
    
    // モジュール数チェック（デュアルチャンネル推奨）
    const dualChannelRecommended = moduleCount === 2 || moduleCount === 4;
    
    const compatible = socketSupported && chipsetSupported && speedSupported && capacitySupported;
    
    // 詳細メッセージ生成
    let message = '';
    const issues: string[] = [];
    const warnings: string[] = [];
    
    if (!socketSupported) {
      issues.push(`${memoryType}はソケット${motherboardSocket}でサポートされていません`);
    }
    if (!chipsetSupported) {
      issues.push(`${memoryType}はチップセット${chipset}でサポートされていません`);
    }
    if (!speedSupported) {
      issues.push(`メモリ速度${memorySpeed}MHzはサポートされていない可能性があります`);
    }
    if (!capacitySupported) {
      issues.push(`メモリ容量${totalCapacity}GBが上限${maxCapacity}GBを超えています`);
    }
    
    if (!dualChannelRecommended && moduleCount === 1) {
      warnings.push('デュアルチャンネルの性能を発揮するため、2枚構成を推奨します');
    }
    
    // JEDEC標準かオーバークロックかの判定
    const isJedecStandard = memoryData?.jedecStandard.includes(memorySpeed) || false;
    const isOverclocking = memoryData?.overclockingSpeeds.includes(memorySpeed) || false;
    
    if (isOverclocking) {
      warnings.push('オーバークロックメモリです。BIOS設定が必要な場合があります');
    }
    
    if (issues.length > 0) {
      message = issues.join(', ');
    } else if (warnings.length > 0) {
      message = `${memoryType} メモリで互換性があります (注意: ${warnings.join(', ')})`;
    } else {
      message = `${memoryType} ${memorySpeed}MHz ${totalCapacity}GB で互換性があります${isJedecStandard ? ' (JEDEC標準)' : isOverclocking ? ' (オーバークロック)' : ''}`;
    }

    return {
      compatible,
      memoryType,
      memorySpeed,
      totalCapacity,
      maxCapacity,
      moduleCount,
      isJedecStandard,
      isOverclocking,
      dualChannelRecommended,
      supportedSpeeds: memoryData?.standardSpeeds || [],
      message,
      warnings
    };
  }

  // 電源コネクタ互換性チェック（データベース駆動強化版）
  private checkPowerConnectorCompatibility(config: PCConfiguration): PowerConnectorCompatibility {
    const psu = config.parts.psu;
    const gpu = config.parts.gpu;
    const motherboard = config.parts.motherboard;

    if (!psu) {
      return {
        compatible: true,
        requiredConnectors: [],
        availableConnectors: [],
        missingConnectors: [],
        message: '電源ユニットの選択を待っています'
      };
    }

    const requiredConnectors: string[] = [];
    const requiredDetails: Array<{connector: string, purpose: string, device: string}> = [];
    
    // PSU仕様から利用可能コネクタを取得
    const availableConnectors = this.getSpecObject(psu.specifications, 'connectors');
    const psuCategory = this.determinePsuCategory(psu);
    
    // データベースからPSU分類別コネクタ情報を取得
    const psuData = this.database.getPsuConnectors(psuCategory);

    // マザーボード電源コネクタ（データベース駆動）
    if (motherboard) {
      requiredConnectors.push('24pin');
      requiredDetails.push({connector: '24pin', purpose: 'メインボード電源', device: 'motherboard'});
      
      const cpuPower = (this.getSpecValue(motherboard.specifications, 'cpuPowerConnector') as string) || '8pin_cpu';
      requiredConnectors.push(cpuPower);
      requiredDetails.push({connector: cpuPower, purpose: 'CPU補助電源', device: 'motherboard'});
    }

    // GPU電源コネクタ（データベース駆動・実GPUモデル照合）
    if (gpu) {
      const gpuModel = this.extractGpuModel(gpu.name || '');
      const gpuRequirements = this.database.getGpuPowerRequirements(gpuModel);
      
      if (gpuRequirements) {
        // データベースから正確な電源要件を取得
        gpuRequirements.connectors.forEach((connector: string) => {
          requiredConnectors.push(connector);
          requiredDetails.push({
            connector, 
            purpose: `GPU電源 (${gpuRequirements.totalPowerDraw}W)`, 
            device: 'gpu'
          });
        });
      } else {
        // フォールバック: specification から取得
        const gpuConnectors = this.getSpecArray(gpu.specifications, 'powerConnectors');
        gpuConnectors.forEach(connector => {
          requiredConnectors.push(connector);
          requiredDetails.push({connector, purpose: 'GPU電源', device: 'gpu'});
        });
      }
    }

    // 利用可能なコネクタをリスト化（PSUデータベースと仕様の統合）
    const availableList: string[] = [];
    const finalConnectors = psuData ? psuData.connectors : availableConnectors;
    
    Object.entries(finalConnectors).forEach(([type, count]) => {
      const numCount = typeof count === 'number' ? count : 0;
      for (let i = 0; i < numCount; i++) {
        availableList.push(type);
      }
    });

    // 詳細な不足コネクタ分析
    const missingConnectors: string[] = [];
    const missingDetails: Array<{connector: string, purpose: string, device: string}> = [];
    const availableCopy = [...availableList];

    requiredConnectors.forEach((required, index) => {
      const availableIndex = availableCopy.findIndex(available => 
        this.isConnectorCompatible(required, available)
      );
      
      if (availableIndex === -1) {
        missingConnectors.push(required);
        missingDetails.push(requiredDetails[index]);
      } else {
        availableCopy.splice(availableIndex, 1);
      }
    });

    // PSU電力不足チェック
    let powerWarning = '';
    if (gpu) {
      const gpuModel = this.extractGpuModel(gpu.name || '');
      const gpuRequirements = this.database.getGpuPowerRequirements(gpuModel);
      const psuWattage = (this.getSpecValue(psu.specifications, 'wattage') as number) || 0;
      
      if (gpuRequirements && psuWattage > 0) {
        if (psuWattage < gpuRequirements.minimumPSU) {
          powerWarning = ` また、電源容量${psuWattage}Wが${gpuModel}の最小要求${gpuRequirements.minimumPSU}Wを下回っています`;
        } else if (psuWattage < gpuRequirements.recommendedPSU) {
          powerWarning = ` 電源容量${psuWattage}Wは動作しますが、${gpuRequirements.recommendedPSU}W以上を推奨します`;
        }
      }
    }

    const compatible = missingConnectors.length === 0 && !powerWarning.includes('下回っています');

    // 詳細メッセージ生成
    let message = '';
    if (missingConnectors.length > 0) {
      const detailMessage = missingDetails.map(detail => 
        `${detail.connector} (${detail.purpose})`
      ).join(', ');
      message = `不足している電源コネクタ: ${detailMessage}`;
    } else {
      message = '電源コネクタに問題ありません';
    }
    
    if (powerWarning) {
      message += powerWarning;
    }

    return {
      compatible,
      requiredConnectors,
      availableConnectors: availableList,
      missingConnectors,
      requiredDetails,
      missingDetails,
      powerWarning: powerWarning || undefined,
      psuCategory,
      message
    };
  }

  // 物理的互換性チェック（データベース駆動強化版）
  private checkPhysicalCompatibility(config: PCConfiguration): PhysicalCompatibility {
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
        detailedChecks: [],
        message: 'ケースの選択を待っています'
      };
    }

    // ケースタイプを判定してデータベースから詳細情報を取得
    const caseType = this.determineCaseType(pcCase);
    const caseData = this.database.getCaseFormFactor(caseType);
    const physicalRules = this.database.getPhysicalCompatibilityRules();

    // マザーボードサイズチェック（データベース駆動）
    if (motherboard) {
      const motherboardSize = this.getSpecValue(motherboard.specifications, 'formFactor') as string | undefined;
      const supportedSizes = caseData?.supportedFormFactors || this.getSpecArray(pcCase.specifications, 'supportedFormFactors');
      
      if (motherboardSize) {
        const isSupported = supportedSizes.includes(motherboardSize);
        const checkStatus = isSupported ? 'pass' : 'fail';
        
        detailedChecks.push({
          check: 'マザーボードフォームファクタ',
          status: checkStatus,
          details: `${motherboardSize} vs サポート: [${supportedSizes.join(', ')}]`
        });
        
        if (!isSupported) {
          issues.push(`マザーボード ${motherboardSize} がケースタイプ ${caseType} に対応していません`);
        }
      }
    }

    // GPUサイズチェック（データベース駆動・実GPUモデル照合）
    if (gpu) {
      const gpuModel = this.extractGpuModel(gpu.name || '');
      const gpuDatabaseData = this.database.getGpuDimensions(gpuModel);
      
      // データベースから取得、フォールバックは仕様から
      const gpuLength = gpuDatabaseData?.length || (this.getSpecValue(gpu.specifications, 'length') as number) || 0;
      const gpuWidth = gpuDatabaseData?.width || (this.getSpecValue(gpu.specifications, 'width') as number) || 0;
      const gpuHeight = gpuDatabaseData?.height || (this.getSpecValue(gpu.specifications, 'height') as number) || 0;
      
      // ケース制限をデータベースから取得
      const maxGpuLength = caseData?.gpuSupport?.maxLength || (this.getSpecValue(pcCase.specifications, 'maxGpuLength') as number) || 1000;
      const maxGpuWidth = caseData?.gpuSupport?.maxWidth || 150; // デフォルト値
      const maxGpuHeight = caseData?.gpuSupport?.maxHeight || 60; // デフォルト値
      
      // 長さチェック
      if (gpuLength > 0) {
        const lengthStatus = gpuLength > maxGpuLength ? 'fail' : 
                           gpuLength > maxGpuLength * 0.9 ? 'warning' : 'pass';
        
        detailedChecks.push({
          check: 'GPU長さ',
          status: lengthStatus,
          details: `${gpuLength}mm vs 上限 ${maxGpuLength}mm (余裕: ${maxGpuLength - gpuLength}mm)`
        });
        
        if (gpuLength > maxGpuLength) {
          issues.push(`GPU長 ${gpuLength}mm がケース上限 ${maxGpuLength}mm を ${gpuLength - maxGpuLength}mm 超えています`);
        } else if (gpuLength > maxGpuLength * 0.9) {
          warnings.push(`GPU長が上限に近いです。余裕は ${maxGpuLength - gpuLength}mm です`);
        }
      }
      
      // 幅チェック（スロット幅制限）
      if (gpuWidth > 0 && gpuWidth > maxGpuWidth) {
        detailedChecks.push({
          check: 'GPU幅',
          status: 'fail',
          details: `${gpuWidth}mm vs 上限 ${maxGpuWidth}mm`
        });
        issues.push(`GPU幅 ${gpuWidth}mm がケース制限 ${maxGpuWidth}mm を超えています`);
      }
      
      // 高さチェック（スロット高制限）
      if (gpuHeight > 0 && gpuHeight > maxGpuHeight) {
        detailedChecks.push({
          check: 'GPU高さ',
          status: 'fail',
          details: `${gpuHeight}mm vs 上限 ${maxGpuHeight}mm`
        });
        issues.push(`GPU高 ${gpuHeight}mm がケーススロット高 ${maxGpuHeight}mm を超えています`);
      }
    }

    // CPUクーラーサイズチェック（データベース駆動強化）
    if (cooler) {
      const coolerType = this.determineCoolerType(cooler);
      const coolerModel = this.extractCoolerModel(cooler.name || '');
      const coolerData = this.database.getCoolerCompatibility(coolerType, coolerModel);
      
      // クーラー高さチェック
      const coolerHeight = coolerData?.height || (this.getSpecValue(cooler.specifications, 'height') as number) || 0;
      const maxCoolerHeight = caseData?.coolerSupport?.maxHeight || (this.getSpecValue(pcCase.specifications, 'maxCoolerHeight') as number) || 1000;
      
      if (coolerHeight > 0) {
        const heightStatus = coolerHeight > maxCoolerHeight ? 'fail' : 
                           coolerHeight > maxCoolerHeight * 0.95 ? 'warning' : 'pass';
        
        detailedChecks.push({
          check: 'クーラー高さ',
          status: heightStatus,
          details: `${coolerHeight}mm vs 上限 ${maxCoolerHeight}mm (余裕: ${maxCoolerHeight - coolerHeight}mm)`
        });
        
        if (coolerHeight > maxCoolerHeight) {
          issues.push(`CPUクーラー高 ${coolerHeight}mm がケース上限 ${maxCoolerHeight}mm を ${coolerHeight - maxCoolerHeight}mm 超えています`);
        } else if (coolerHeight > maxCoolerHeight * 0.95) {
          warnings.push(`クーラー高が上限に近いです。余裕は ${maxCoolerHeight - coolerHeight}mm です`);
        }
      }
      
      // ラジエーター取り付け位置チェック（AIOの場合）
      if (coolerType === 'aio' && coolerData?.radiatorSize) {
        const supportedPositions = caseData?.coolerSupport?.radiatorPositions || [];
        const requiredPosition = this.getRadiatorPosition(coolerData.radiatorSize);
        
        if (!supportedPositions.includes(requiredPosition)) {
          detailedChecks.push({
            check: 'ラジエーター取り付け',
            status: 'fail',
            details: `${coolerData.radiatorSize}mmラジエーター取り付け位置がありません`
          });
          issues.push(`${coolerData.radiatorSize}mmラジエーターの取り付け位置がケースにありません`);
        } else {
          detailedChecks.push({
            check: 'ラジエーター取り付け',
            status: 'pass',
            details: `${coolerData.radiatorSize}mmラジエーター対応`
          });
        }
      }
    }

    // 全体的なクリアランスチェック
    if (gpu && cooler && physicalRules) {
      const gpuCoolerClearance = this.checkGpuCoolerClearance(gpu, cooler, caseData);
      if (gpuCoolerClearance.issue) {
        detailedChecks.push({
          check: 'GPU-クーラークリアランス',
          status: 'warning',
          details: gpuCoolerClearance.issue
        });
        warnings.push(gpuCoolerClearance.issue);
      }
    }

    const compatible = issues.length === 0;
    const warningCount = warnings.length;

    // 詳細メッセージ生成
    let message = '';
    if (!compatible) {
      message = `${issues.length}件のサイズ問題があります`;
    } else if (warningCount > 0) {
      message = `物理的サイズに問題ありませんが、${warningCount}件の注意点があります`;
    } else {
      message = '物理的サイズに問題ありません';
    }

    return {
      compatible,
      issues,
      warnings,
      detailedChecks,
      caseType,
      clearanceAnalysis: detailedChecks,
      message
    };
  }

  // 互換性スコア計算（パフォーマンス要素含む）
  private calculateCompatibilityScore(
    details: CompatibilityDetails,
    criticalIssues: number,
    warnings: number,
    performancePrediction?: PerformancePredictionResult
  ): number {
    let score = 100;

    // 未選択パーツによる減点（最優先）
    const missingPartIssues = criticalIssues - (
      !details.cpuSocket.compatible && !details.cpuSocket.message.includes('待っています') ? 1 : 0
    ) - (
      !details.memoryType.compatible && !details.memoryType.message.includes('待っています') ? 1 : 0
    ) - (
      !details.powerConnectors.compatible && !details.powerConnectors.message.includes('待っています') ? 1 : 0
    ) - (
      !details.physicalFit.compatible && !details.physicalFit.message.includes('待っています') ? 1 : 0
    );
    
    const missingPartCount = criticalIssues - missingPartIssues;
    
    // 未選択パーツは1つあたり20点減点
    score -= missingPartCount * 20;

    // 重要な互換性チェック結果による減点
    if (!details.cpuSocket.compatible && !details.cpuSocket.message.includes('待っています')) score -= 30;
    if (!details.memoryType.compatible && !details.memoryType.message.includes('待っています')) score -= 25;
    if (!details.powerConnectors.compatible && !details.powerConnectors.message.includes('待っています')) score -= 20;
    if (!details.physicalFit.compatible && !details.physicalFit.message.includes('待っています')) score -= 15;

    // パフォーマンス要素の反映（新機能）
    if (performancePrediction) {
      // パフォーマンススコアを互換性スコアに反映
      const performanceBonus = (performancePrediction.overallScore - 50) * 0.2; // -10 to +10の範囲
      score += performanceBonus;
      
      // ボトルネックの重大度による減点
      if (performancePrediction.bottleneckAnalysis.severity === 'severe') {
        score -= 15;
      } else if (performancePrediction.bottleneckAnalysis.severity === 'moderate') {
        score -= 8;
      }
      
      // ゲーミング性能クラスによるボーナス
      if (performancePrediction.gamingPerformance.performanceClass === 'flagship') {
        score += 5;
      } else if (performancePrediction.gamingPerformance.performanceClass === 'high-end') {
        score += 3;
      }
    }

    if (!details.performanceMatch.balanced && !details.performanceMatch.message.includes('待っています')) {
      // パフォーマンス予測がある場合は軽い減点（詳細は上記で処理）
      score -= performancePrediction ? 2 : 5;
    }

    // 追加の問題による減点
    score -= missingPartIssues * 10;
    score -= warnings * 2;

    return Math.max(0, Math.min(100, score));
  }

  // パフォーマンス予測結果を互換性チェック形式に変換
  private convertPerformancePredictionToCompatibility(prediction: PerformancePredictionResult): PerformanceCompatibility {
    const bottleneck = prediction.bottleneckAnalysis;
    const balanced = bottleneck.severity === 'none' || bottleneck.severity === 'mild';
    
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    
    if (!balanced) {
      bottlenecks.push(bottleneck.message);
      
      // 推奨事項を簡潔なメッセージに変換
      prediction.recommendations.forEach(rec => {
        recommendations.push(`${rec.title}: ${rec.expectedImprovement}`);
      });
    }
    
    let message = '';
    if (balanced) {
      message = `パフォーマンスバランスが良く取れています（総合スコア: ${prediction.overallScore}）`;
    } else {
      message = `${bottlenecks.length}件のパフォーマンス課題があります（総合スコア: ${prediction.overallScore}）`;
    }
    
    return {
      balanced,
      bottlenecks,
      recommendations,
      severity: bottleneck.severity,
      performanceScore: prediction.overallScore,
      useCaseScores: prediction.useCaseScores,
      bottleneckAnalysis: bottleneck,
      gamingPerformance: prediction.gamingPerformance,
      message
    };
  }

  // ヘルパーメソッド: specification値を安全に取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getSpecValue(spec: Record<string, any>, key: string): unknown {
    return spec[key] || null;
  }

  // ヘルパーメソッド: specification配列を安全に取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getSpecArray(spec: Record<string, any>, key: string): string[] {
    const value = spec[key];
    if (Array.isArray(value)) {
      return value as string[];
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  }

  // ヘルパーメソッド: specificationオブジェクトを安全に取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getSpecObject(spec: Record<string, any>, key: string): Record<string, unknown> {
    const value = spec[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  // 未選択パーツのチェック
  private checkMissingParts(config: PCConfiguration): string[] {
    const requiredParts = ['cpu', 'motherboard', 'memory', 'psu'];
    const missingParts: string[] = [];
    
    requiredParts.forEach(partType => {
      if (!config.parts[partType as keyof typeof config.parts]) {
        missingParts.push(partType);
      }
    });
    
    return missingParts;
  }

  // パーツ表示名の取得
  private getPartDisplayName(partType: string): string {
    const displayNames: Record<string, string> = {
      cpu: 'CPU',
      motherboard: 'マザーボード',
      memory: 'メモリ',
      gpu: 'グラフィックボード',
      psu: '電源ユニット',
      case: 'PCケース',
      cooler: 'CPUクーラー',
      storage: 'ストレージ'
    };
    return displayNames[partType] || partType;
  }

  // PSU分類判定（電源コネクタチェック強化用）
  private determinePsuCategory(psu: { name?: string; specifications: Record<string, unknown>; price?: number }): string {
    const wattage = (this.getSpecValue(psu.specifications, 'wattage') as number) || 0;
    const price = psu.price || 0;
    
    if (wattage >= 1300 || price >= 40000) {
      return 'enthusiast_psu';
    } else if (wattage >= 1000 || price >= 25000) {
      return 'highend_psu';
    } else if (wattage >= 650 || price >= 15000) {
      return 'mainstream_psu';
    } else {
      return 'budget_psu';
    }
  }

  // GPUモデル名抽出（電源要件データベース照合用）
  private extractGpuModel(gpuName: string): string {
    // 一般的なGPUモデル名の抽出パターン
    const patterns = [
      /RTX\s*(\d{4}\s*(?:Ti|SUPER)?)/i,
      /GTX\s*(\d{4}\s*(?:Ti|SUPER)?)/i,
      /RX\s*(\d{4}\s*(?:XT|XTX)?)/i,
      /Radeon\s*RX\s*(\d{4}\s*(?:XT|XTX)?)/i
    ];
    
    for (const pattern of patterns) {
      const match = gpuName.match(pattern);
      if (match) {
        const modelPart = match[1].replace(/\s+/g, ' ').trim();
        return match[0].replace(match[1], modelPart).replace(/\s+/g, ' ');
      }
    }
    
    // フォールバック: 最初の意味のある部分を抽出
    const words = gpuName.split(' ');
    if (words.length >= 2) {
      return `${words[0]} ${words[1]}`;
    }
    
    return gpuName;
  }

  // 電源コネクタ互換性チェック（詳細）
  private isConnectorCompatible(required: string, available: string): boolean {
    // 完全一致
    if (required === available) {
      return true;
    }
    
    // 互換性のあるコネクタパターン
    const compatibilityMap: Record<string, string[]> = {
      '8pin': ['8pin', '6+2pin', '8pin_pcie'],
      '6pin': ['6pin', '6pin_pcie'],
      '8pin_cpu': ['8pin_cpu', '4+4pin'],
      '4pin': ['4pin', '4+4pin'],
      '12pin_pcie': ['12pin_pcie', '12VHPWR'],
      '16pin_pcie': ['16pin_pcie', '12V-2x6']
    };
    
    const compatibleConnectors = compatibilityMap[required] || [required];
    return compatibleConnectors.includes(available);
  }

  // ケースタイプ判定（物理サイズチェック強化用）
  private determineCaseType(pcCase: { name?: string; specifications: Record<string, unknown>; price?: number }): string {
    const formFactor = this.getSpecValue(pcCase.specifications, 'formFactor') as string | undefined;
    const volume = (this.getSpecValue(pcCase.specifications, 'volume') as number) || 0;
    const height = (this.getSpecValue(pcCase.specifications, 'height') as number) || 0;
    const caseName = (pcCase.name || '').toLowerCase();
    
    // 名前からの判定
    if (caseName.includes('full tower') || caseName.includes('フルタワー')) {
      return 'Full Tower';
    }
    if (caseName.includes('mid tower') || caseName.includes('ミッドタワー')) {
      return 'Mid Tower';
    }
    if (caseName.includes('mini tower') || caseName.includes('ミニタワー')) {
      return 'Mini Tower';
    }
    if (caseName.includes('mini-itx') || caseName.includes('itx') || caseName.includes('ミニ')) {
      return 'Mini-ITX';
    }
    if (caseName.includes('sff') || caseName.includes('small form')) {
      return 'SFF';
    }
    
    // フォームファクタからの判定
    if (formFactor) {
      const formFactorLower = formFactor.toLowerCase();
      if (formFactorLower.includes('full')) return 'Full Tower';
      if (formFactorLower.includes('mid')) return 'Mid Tower';
      if (formFactorLower.includes('mini')) return 'Mini Tower';
      if (formFactorLower.includes('itx')) return 'Mini-ITX';
      if (formFactorLower.includes('sff')) return 'SFF';
    }
    
    // サイズからの推定
    if (volume > 0) {
      if (volume > 60) return 'Full Tower';
      if (volume > 35) return 'Mid Tower';
      if (volume > 20) return 'Mini Tower';
      if (volume > 10) return 'Mini-ITX';
      return 'SFF';
    }
    
    if (height > 0) {
      if (height > 500) return 'Full Tower';
      if (height > 400) return 'Mid Tower';
      if (height > 300) return 'Mini Tower';
      if (height > 200) return 'Mini-ITX';
      return 'SFF';
    }
    
    // デフォルト
    return 'Mid Tower';
  }

  // クーラータイプ判定（物理サイズチェック強化用）
  private determineCoolerType(cooler: { name?: string; specifications: Record<string, unknown> }): string {
    const coolerName = (cooler.name || '').toLowerCase();
    const coolerType = this.getSpecValue(cooler.specifications, 'type') as string | undefined;
    
    // 名前からの判定
    if (coolerName.includes('aio') || coolerName.includes('簡易水冷') || 
        coolerName.includes('liquid') || coolerName.includes('water')) {
      return 'aio';
    }
    if (coolerName.includes('air') || coolerName.includes('空冷') || 
        coolerName.includes('tower') || coolerName.includes('タワー')) {
      return 'air';
    }
    
    // 仕様からの判定
    if (coolerType) {
      const typeLower = coolerType.toLowerCase();
      if (typeLower.includes('liquid') || typeLower.includes('aio')) return 'aio';
      if (typeLower.includes('air')) return 'air';
    }
    
    // デフォルトは空冷
    return 'air';
  }

  // クーラーモデル名抽出（物理サイズチェック強化用）
  private extractCoolerModel(coolerName: string): string {
    // 一般的なクーラーモデル名の抽出
    const patterns = [
      /NH-([DU]\d+[A-Z]*)/i, // Noctua
      /Dark Rock( Pro)?( \d+)?/i, // be quiet!
      /Hyper (\d+)/i, // Cooler Master
      /H(\d+)i?/i, // Corsair
      /Kraken [XZ](\d+)/i // NZXT
    ];
    
    for (const pattern of patterns) {
      const match = coolerName.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // フォールバック: 最初の2単語
    const words = coolerName.split(' ');
    if (words.length >= 2) {
      return `${words[0]} ${words[1]}`;
    }
    
    return coolerName;
  }

  // ラジエーター位置判定（AIOクーラー用）
  private getRadiatorPosition(radiatorSize: number): string {
    if (radiatorSize >= 360) {
      return 'front_360';
    } else if (radiatorSize >= 280) {
      return 'front_280';
    } else if (radiatorSize >= 240) {
      return 'front_240';
    } else {
      return 'rear_120';
    }
  }

  // GPU-クーラークリアランスチェック（物理サイズ強化用）
  private checkGpuCoolerClearance(
    gpu: { name?: string; specifications: Record<string, unknown> },
    cooler: { name?: string; specifications: Record<string, unknown> },
    caseData: { clearanceRules?: { gpuCoolerMinDistance?: number } } | null
  ): { issue?: string } {
    const gpuLength = (this.getSpecValue(gpu.specifications, 'length') as number) || 0;
    const coolerHeight = (this.getSpecValue(cooler.specifications, 'height') as number) || 0;
    const coolerWidth = (this.getSpecValue(cooler.specifications, 'width') as number) || 0;
    
    const minDistance = caseData?.clearanceRules?.gpuCoolerMinDistance || 20; // デフォルト20mm
    
    // 大型GPUと大型クーラーの組み合わせでの競合チェック
    if (gpuLength > 300 && coolerHeight > 160) {
      const estimatedClearance = 350 - gpuLength; // 簡易推定
      if (estimatedClearance < minDistance) {
        return {
          issue: `大型GPU(${gpuLength}mm)と大型クーラー(${coolerHeight}mm)の組み合わせでクリアランス不足の可能性があります`
        };
      }
    }
    
    // クーラー幅とGPUの競合
    if (coolerWidth > 140 && gpuLength > 250) {
      return {
        issue: `大型クーラー(${coolerWidth}mm幅)と長いGPU(${gpuLength}mm)でメモリスロットへのアクセスに制限がある可能性があります`
      };
    }
    
    return {};
  }
}

export default CompatibilityCheckerService;

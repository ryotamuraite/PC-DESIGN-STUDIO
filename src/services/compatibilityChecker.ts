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

export class CompatibilityCheckerService {
  private static instance: CompatibilityCheckerService;
  
  // シングルトンパターン
  public static getInstance(): CompatibilityCheckerService {
    if (!CompatibilityCheckerService.instance) {
      CompatibilityCheckerService.instance = new CompatibilityCheckerService();
    }
    return CompatibilityCheckerService.instance;
  }

  // メイン互換性チェック関数
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
    const performanceMatch = this.checkPerformanceCompatibility(config);

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

    if (!performanceMatch.balanced) {
      performanceMatch.bottlenecks.forEach((bottleneck: string, index: number) => {
        warnings.push({
          id: `performance_bottleneck_${index}`,
          message: bottleneck,
          recommendation: 'バランスの取れた構成を検討してください',
          priority: 'low'
        });
      });
    }

    // 互換性スコアを計算
    const score = this.calculateCompatibilityScore({
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

    return {
      isCompatible: issues.filter(issue => issue.severity === 'critical').length === 0,
      issues,
      warnings,
      score,
      checkedAt: new Date(),
      details
    };
  }

  // CPUソケット互換性チェック
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

    if (!cpuSocket || !motherboardSocket) {
      return {
        compatible: false,
        cpuSocket,
        motherboardSocket,
        message: 'ソケット情報が不完全です'
      };
    }

    const compatible = cpuSocket === motherboardSocket;

    return {
      compatible,
      cpuSocket,
      motherboardSocket,
      message: compatible 
        ? `ソケット ${cpuSocket} で互換性があります` 
        : `ソケットが一致しません (CPU: ${cpuSocket}, マザーボード: ${motherboardSocket})`
    };
  }

  // メモリ互換性チェック
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
    const supportedTypes = this.getSpecArray(motherboard.specifications, 'memoryType');
    const maxCapacity = (this.getSpecValue(motherboard.specifications, 'maxMemory') as number) || 128;
    const memoryCapacity = (this.getSpecValue(memory.specifications, 'capacity') as number) || 0;

    if (!memoryType) {
      return {
        compatible: false,
        message: 'メモリタイプ情報が不完全です'
      };
    }

    const typeCompatible = supportedTypes.includes(memoryType);
    const capacityCompatible = memoryCapacity <= maxCapacity;

    const compatible = typeCompatible && capacityCompatible;

    let message = '';
    if (!typeCompatible) {
      message = `メモリタイプが対応していません (メモリ: ${memoryType}, 対応: ${supportedTypes.join(', ')})`;
    } else if (!capacityCompatible) {
      message = `メモリ容量が上限を超えています (${memoryCapacity}GB > ${maxCapacity}GB)`;
    } else {
      message = `${memoryType} メモリで互換性があります`;
    }

    return {
      compatible,
      memoryType,
      supportedTypes,
      maxCapacity,
      message
    };
  }

  // 電源コネクタ互換性チェック
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
    const availableConnectors = this.getSpecObject(psu.specifications, 'connectors');

    // マザーボード電源コネクタ
    if (motherboard) {
      requiredConnectors.push('24pin'); // ATX電源コネクタ
      const cpuPower = (this.getSpecValue(motherboard.specifications, 'cpuPowerConnector') as string) || '8pin';
      requiredConnectors.push(cpuPower);
    }

    // GPU電源コネクタ
    if (gpu) {
      const gpuConnectors = this.getSpecArray(gpu.specifications, 'powerConnectors');
      requiredConnectors.push(...gpuConnectors);
    }

    // 利用可能なコネクタをリスト化
    const availableList: string[] = [];
    Object.entries(availableConnectors).forEach(([type, count]) => {
      const numCount = typeof count === 'number' ? count : 0;
      for (let i = 0; i < numCount; i++) {
        availableList.push(type);
      }
    });

    // 不足コネクタを確認
    const missingConnectors: string[] = [];
    const availableCopy = [...availableList];

    requiredConnectors.forEach(required => {
      const index = availableCopy.indexOf(required);
      if (index === -1) {
        missingConnectors.push(required);
      } else {
        availableCopy.splice(index, 1);
      }
    });

    const compatible = missingConnectors.length === 0;

    const message = compatible
      ? '電源コネクタに問題ありません'
      : `不足している電源コネクタ: ${missingConnectors.join(', ')}`;

    return {
      compatible,
      requiredConnectors,
      availableConnectors: availableList,
      missingConnectors,
      message
    };
  }

  // 物理的互換性チェック
  private checkPhysicalCompatibility(config: PCConfiguration): PhysicalCompatibility {
    const pcCase = config.parts.case;
    const motherboard = config.parts.motherboard;
    const gpu = config.parts.gpu;
    const cooler = config.parts.cooler;

    const issues: string[] = [];
    const warnings: string[] = [];

    if (!pcCase) {
      return {
        compatible: true,
        issues: [],
        warnings: [],
        message: 'ケースの選択を待っています'
      };
    }

    // マザーボードサイズチェック
    if (motherboard) {
      const motherboardSize = this.getSpecValue(motherboard.specifications, 'formFactor') as string | undefined;
      const supportedSizes = this.getSpecArray(pcCase.specifications, 'supportedFormFactors');
      
      if (motherboardSize && !supportedSizes.includes(motherboardSize)) {
        issues.push(`マザーボード ${motherboardSize} がケースに対応していません`);
      }
    }

    // GPU長さチェック
    if (gpu) {
      const gpuLength = (this.getSpecValue(gpu.specifications, 'length') as number) || 0;
      const maxGpuLength = (this.getSpecValue(pcCase.specifications, 'maxGpuLength') as number) || 1000;
      
      if (gpuLength > maxGpuLength) {
        issues.push(`GPU長 ${gpuLength}mm がケース上限 ${maxGpuLength}mm を超えています`);
      } else if (gpuLength > maxGpuLength * 0.9) {
        warnings.push(`GPU長が上限に近いです (${gpuLength}mm / ${maxGpuLength}mm)`);
      }
    }

    // CPUクーラー高さチェック
    if (cooler) {
      const coolerHeight = (this.getSpecValue(cooler.specifications, 'height') as number) || 0;
      const maxCoolerHeight = (this.getSpecValue(pcCase.specifications, 'maxCoolerHeight') as number) || 1000;
      
      if (coolerHeight > maxCoolerHeight) {
        issues.push(`CPUクーラー高 ${coolerHeight}mm がケース上限 ${maxCoolerHeight}mm を超えています`);
      }
    }

    const compatible = issues.length === 0;

    return {
      compatible,
      issues,
      warnings,
      message: compatible 
        ? '物理的サイズに問題ありません' 
        : `${issues.length}件のサイズ問題があります`
    };
  }

  // パフォーマンスバランスチェック
  private checkPerformanceCompatibility(config: PCConfiguration): PerformanceCompatibility {
    const cpu = config.parts.cpu;
    const gpu = config.parts.gpu;
    const memory = config.parts.memory;

    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    if (!cpu || !gpu) {
      return {
        balanced: true,
        bottlenecks: [],
        recommendations: [],
        message: 'CPU/GPUの選択を待っています'
      };
    }

    // 簡易的なパフォーマンスバランスチェック
    const cpuPrice = cpu.price || 0;
    const gpuPrice = gpu.price || 0;

    // CPU/GPU価格比率による簡易バランスチェック
    const ratio = cpuPrice / gpuPrice;
    
    if (ratio > 2) {
      bottlenecks.push('CPUが高価すぎる可能性があります（GPU性能とのバランス）');
      recommendations.push('よりバランスの取れたCPU/GPU構成を検討してください');
    } else if (ratio < 0.3) {
      bottlenecks.push('GPUが高価すぎる可能性があります（CPU性能とのバランス）');
      recommendations.push('よりバランスの取れたCPU/GPU構成を検討してください');
    }

    // メモリ容量チェック
    if (memory) {
      const memoryCapacity = (this.getSpecValue(memory.specifications, 'totalCapacity') as number) || 0;
      if (memoryCapacity < 16) {
        recommendations.push('現代のゲームや作業には16GB以上のメモリを推奨します');
      }
    }

    const balanced = bottlenecks.length === 0;

    return {
      balanced,
      bottlenecks,
      recommendations,
      message: balanced 
        ? 'パフォーマンスバランスに問題ありません' 
        : `${bottlenecks.length}件のバランス課題があります`
    };
  }

  // 互換性スコア計算
  private calculateCompatibilityScore(
    details: CompatibilityDetails,
    criticalIssues: number,
    warnings: number
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
    if (!details.performanceMatch.balanced && !details.performanceMatch.message.includes('待っています')) score -= 5;

    // 追加の問題による減点
    score -= missingPartIssues * 10;
    score -= warnings * 2;

    return Math.max(0, Math.min(100, score));
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
}

export default CompatibilityCheckerService;

// src/services/compatibilityChecker.ts
// 互換性チェックサービス - 基本版（1-2時間実装用）

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
  public checkFullCompatibility(config: PCConfiguration): CompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityWarning[] = [];
    
    // 各種互換性チェックを実行
    const cpuSocket = this.checkCpuSocketCompatibility(config);
    const memoryType = this.checkMemoryCompatibility(config);
    const powerConnectors = this.checkPowerConnectorCompatibility(config);
    const physicalFit = this.checkPhysicalCompatibility(config);
    const performanceMatch = this.checkPerformanceBalance(config);

    // チェック結果から issues と warnings を収集
    if (!cpuSocket.compatible && !cpuSocket.message.includes('待っています')) {
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

    if (!memoryType.compatible && !memoryType.message.includes('待っています')) {
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

    if (!powerConnectors.compatible && !powerConnectors.message.includes('待っています')) {
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

    if (!physicalFit.compatible && !physicalFit.message.includes('待っています')) {
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
    if (!performanceMatch.balanced && !performanceMatch.message.includes('待っています')) {
      performanceMatch.bottlenecks.forEach((bottleneck: string, index: number) => {
        warnings.push({
          id: `performance_bottleneck_${index}`,
          message: bottleneck,
          recommendation: 'バランスの取れた構成を検討してください',
          priority: 'medium'
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

    // 🔧 改良版 isCompatible 判定
    const hasCriticalIssues = issues.filter(issue => issue.severity === 'critical').length > 0;
    const hasUnselectedParts = [
      cpuSocket.message.includes('待っています'),
      memoryType.message.includes('待っています'), 
      powerConnectors.message.includes('待っています'),
      physicalFit.message.includes('待っています'),
      performanceMatch.message.includes('待っています')
    ].some(isWaiting => isWaiting);

    return {
      isCompatible: !hasCriticalIssues && !hasUnselectedParts,
      issues,
      warnings,
      score,
      checkedAt: new Date(),
      details
    };
  }

  // CPUソケット互換性チェック（基本版）
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

    const message = compatible 
      ? `ソケット ${cpuSocket} で互換性があります` 
      : `ソケットが一致しません (CPU: ${cpuSocket}, マザーボード: ${motherboardSocket})`;

    return {
      compatible,
      cpuSocket,
      motherboardSocket,
      message
    };
  }

  // メモリ互換性チェック（基本版）
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

    const typeCompatible = supportedTypes.length === 0 || supportedTypes.includes(memoryType);
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

  // 電源コネクタ互換性チェック（基本版）
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

    // 不足コネクタの確認
    const missingConnectors: string[] = [];
    const availableCopy = [...availableList];

    requiredConnectors.forEach(required => {
      const availableIndex = availableCopy.findIndex(available => 
        this.isConnectorCompatible(required, available)
      );
      
      if (availableIndex === -1) {
        missingConnectors.push(required);
      } else {
        availableCopy.splice(availableIndex, 1);
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

  // 物理的互換性チェック（基本版）
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
      
      if (motherboardSize && supportedSizes.length > 0 && !supportedSizes.includes(motherboardSize)) {
        issues.push(`マザーボード ${motherboardSize} がケースに対応していません`);
      }
    }

    // GPUサイズチェック
    if (gpu) {
      const gpuLength = (this.getSpecValue(gpu.specifications, 'length') as number) || 0;
      const maxGpuLength = (this.getSpecValue(pcCase.specifications, 'maxGpuLength') as number) || 1000;
      
      if (gpuLength > 0 && gpuLength > maxGpuLength) {
        issues.push(`GPU長 ${gpuLength}mm がケース上限 ${maxGpuLength}mm を超えています`);
      } else if (gpuLength > 0 && gpuLength > maxGpuLength * 0.9) {
        warnings.push(`GPU長がケース上限に近いです (${gpuLength}mm / ${maxGpuLength}mm)`);
      }
    }

    // CPUクーラーサイズチェック
    if (cooler) {
      const coolerHeight = (this.getSpecValue(cooler.specifications, 'height') as number) || 0;
      const maxCoolerHeight = (this.getSpecValue(pcCase.specifications, 'maxCoolerHeight') as number) || 1000;
      
      if (coolerHeight > 0 && coolerHeight > maxCoolerHeight) {
        issues.push(`CPUクーラー高 ${coolerHeight}mm がケース上限 ${maxCoolerHeight}mm を超えています`);
      } else if (coolerHeight > 0 && coolerHeight > maxCoolerHeight * 0.95) {
        warnings.push(`クーラー高がケース上限に近いです (${coolerHeight}mm / ${maxCoolerHeight}mm)`);
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
      message
    };
  }

  // パフォーマンスバランスチェック（基本版）
  private checkPerformanceBalance(config: PCConfiguration): PerformanceCompatibility {
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

    // 簡易的なパフォーマンスバランスチェック
    const cpuPrice = cpu.price || 0;
    const gpuPrice = gpu.price || 0;

    // 価格比率によるバランスチェック（簡易版）
    if (cpuPrice > 0 && gpuPrice > 0) {
      const ratio = gpuPrice / cpuPrice;
      
      if (ratio < 0.5) {
        bottlenecks.push('GPUがCPUに比べて低性能の可能性があります');
        recommendations.push('より高性能なGPUを検討してください');
      } else if (ratio > 3) {
        bottlenecks.push('CPUがGPUに比べて低性能の可能性があります');
        recommendations.push('より高性能なCPUを検討してください');
      }
    }

    const balanced = bottlenecks.length === 0;

    const message = balanced 
      ? 'パフォーマンスバランスに問題ありません'
      : `${bottlenecks.length}件のパフォーマンス課題があります`;

    return {
      balanced,
      bottlenecks,
      recommendations,
      message
    };
  }

  // 互換性スコア計算（改良版 - 未選択パーツ考慮）
  private calculateCompatibilityScore(
    details: CompatibilityDetails,
    criticalIssues: number,
    warnings: number
  ): number {
    let score = 100;

    // 🔧 未選択パーツによる減点（重要な改善）
    if (details.cpuSocket.message.includes('待っています')) score -= 30;
    if (details.memoryType.message.includes('待っています')) score -= 25;
    if (details.powerConnectors.message.includes('待っています')) score -= 20;
    if (details.physicalFit.message.includes('待っています')) score -= 15;
    if (details.performanceMatch.message.includes('待っています')) score -= 5;

    // 重要な互換性チェック結果による減点
    if (!details.cpuSocket.compatible && !details.cpuSocket.message.includes('待っています')) score -= 30;
    if (!details.memoryType.compatible && !details.memoryType.message.includes('待っています')) score -= 25;
    if (!details.powerConnectors.compatible && !details.powerConnectors.message.includes('待っています')) score -= 20;
    if (!details.physicalFit.compatible && !details.physicalFit.message.includes('待っています')) score -= 15;
    if (!details.performanceMatch.balanced && !details.performanceMatch.message.includes('待っています')) score -= 5;

    // 追加の問題による減点
    score -= criticalIssues * 10;
    score -= warnings * 2;

    return Math.max(0, Math.min(100, score));
  }

  // ヘルパーメソッド: specification値を安全に取得
  private getSpecValue(spec: Record<string, unknown> | undefined, key: string): unknown {
    if (!spec) return undefined;
    return spec[key] || undefined;
  }

  // ヘルパーメソッド: specification配列を安全に取得
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

  // ヘルパーメソッド: specificationオブジェクトを安全に取得
  private getSpecObject(spec: Record<string, unknown> | undefined, key: string): Record<string, unknown> {
    if (!spec) return {};
    const value = spec[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  // 電源コネクタ互換性チェック（基本版）
  private isConnectorCompatible(required: string, available: string): boolean {
    // 完全一致
    if (required === available) {
      return true;
    }
    
    // 基本的な互換性パターン
    const compatibilityMap: Record<string, string[]> = {
      '8pin': ['8pin', '6+2pin'],
      '6pin': ['6pin'],
      '8pin_cpu': ['8pin_cpu', '4+4pin'],
      '4pin': ['4pin', '4+4pin'],
      '24pin': ['24pin']
    };
    
    const compatibleConnectors = compatibilityMap[required] || [required];
    return compatibleConnectors.includes(available);
  }
}

export default CompatibilityCheckerService;

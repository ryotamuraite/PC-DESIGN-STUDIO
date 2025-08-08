// src/services/compatibility/basicCompatibilityChecker.ts
// 基本的な互換性チェック機能 - Phase3初期実装

import type { Part, PartCategory } from '@/types';

// 互換性問題の型定義
export interface CompatibilityIssue {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  affectedParts: string[];
  solution?: string;
}

// CPU/マザーボードソケット互換性データ（将来的な拡張用）
// const SOCKET_COMPATIBILITY = {
//   // Intel
//   'LGA1700': ['LGA1700'],
//   'LGA1200': ['LGA1200'],
//   'LGA1151': ['LGA1151'],
//   
//   // AMD
//   'AM5': ['AM5'],
//   'AM4': ['AM4'],
//   'sTRX4': ['sTRX4'],
// } as const;

// メモリ規格互換性データ（将来的な拡張用）
// const MEMORY_COMPATIBILITY = {
//   'DDR5': ['DDR5'],
//   'DDR4': ['DDR4'],
//   'DDR3': ['DDR3'],
// } as const;

export interface BasicCompatibilityResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  checks: {
    cpuSocket: {
      compatible: boolean;
      cpuSocket?: string;
      motherboardSocket?: string;
    };
    memoryType: {
      compatible: boolean;
      memoryType?: string;
      supportedType?: string;
    };
    powerAdequacy: {
      adequate: boolean;
      totalConsumption: number;
      psuWattage: number;
      headroom: number;
    };
  };
  score: number;
}

export class BasicCompatibilityChecker {
  /**
   * 基本的な互換性チェックを実行
   */
  static checkCompatibility(
    parts: Partial<Record<PartCategory, Part>>
  ): BasicCompatibilityResult {
    const issues: CompatibilityIssue[] = [];
    const result: BasicCompatibilityResult = {
      isCompatible: true,
      issues,
      checks: {
        cpuSocket: { compatible: true },
        memoryType: { compatible: true },
        powerAdequacy: { adequate: true, totalConsumption: 0, psuWattage: 0, headroom: 0 },
      },
      score: 100,
    };

    // CPUソケット互換性チェック
    this.checkCpuSocketCompatibility(parts, result);
    
    // メモリ規格互換性チェック
    this.checkMemoryCompatibility(parts, result);
    
    // 電源容量チェック
    this.checkPowerAdequacy(parts, result);

    // 全体の互換性判定
    result.isCompatible = result.issues.filter(issue => issue.severity === 'critical').length === 0;

    // スコア計算
    result.score = this.calculateCompatibilityScore(result);

    return result;
  }

  /**
   * CPUソケット互換性チェック
   */
  private static checkCpuSocketCompatibility(
    parts: Partial<Record<PartCategory, Part>>,
    result: BasicCompatibilityResult
  ): void {
    const cpu = parts.cpu;
    const motherboard = parts.motherboard;

    if (!cpu || !motherboard) {
      return; // 両方が選択されていない場合はチェックしない
    }

    const cpuSocket = this.extractSocket(cpu.specifications?.socket);
    const motherboardSocket = this.extractSocket(motherboard.specifications?.socket);

    result.checks.cpuSocket = {
      compatible: cpuSocket === motherboardSocket,
      cpuSocket,
      motherboardSocket,
    };

    if (cpuSocket && motherboardSocket && cpuSocket !== motherboardSocket) {
      result.issues.push({
        id: 'cpu_socket_mismatch',
        type: 'socket_mismatch',
        severity: 'critical',
        message: `CPUソケット（${cpuSocket}）とマザーボードソケット（${motherboardSocket}）が互換性がありません。`,
        affectedParts: [cpu.id, motherboard.id],
        solution: `${cpuSocket}対応のマザーボードまたは${motherboardSocket}対応のCPUを選択してください。`,
      });
    }
  }

  /**
   * メモリ規格互換性チェック
   */
  private static checkMemoryCompatibility(
    parts: Partial<Record<PartCategory, Part>>,
    result: BasicCompatibilityResult
  ): void {
    const memory = parts.memory;
    const motherboard = parts.motherboard;

    if (!memory || !motherboard) {
      return;
    }

    // メモリの規格を抽出
    // 1. typeプロパティを優先、なければspeedから推定
    const memoryType = memory.specifications?.type as string ||
                      this.extractMemoryType(memory.specifications?.speed);
    
    // マザーボードのソケットから対応メモリを推定
    const motherboardSocket = this.extractSocket(motherboard.specifications?.socket);
    const supportedMemoryType = this.getMemoryTypeBySocket(motherboardSocket);

    result.checks.memoryType = {
      compatible: memoryType === supportedMemoryType,
      memoryType,
      supportedType: supportedMemoryType,
    };

    if (memoryType && supportedMemoryType && memoryType !== supportedMemoryType) {
      result.issues.push({
        id: 'memory_type_mismatch',
        type: 'memory_incompatible',
        severity: 'critical',
        message: `メモリ規格（${memoryType}）がマザーボードの対応規格（${supportedMemoryType}）と互換性がありません。`,
        affectedParts: [memory.id, motherboard.id],
        solution: `${supportedMemoryType}対応のメモリを選択してください。`,
      });
    }
  }

  /**
   * 電源容量チェック
   */
  private static checkPowerAdequacy(
    parts: Partial<Record<PartCategory, Part>>,
    result: BasicCompatibilityResult
  ): void {
    const psu = parts.psu;
    
    if (!psu) {
      return;
    }

    // 総消費電力計算
    const totalConsumption = this.calculateTotalPowerConsumption(parts);
    const psuWattage = this.extractWattage(psu.specifications?.wattage);
    const headroom = psuWattage > 0 ? ((psuWattage - totalConsumption) / psuWattage) * 100 : 0;
    const adequate = headroom >= 20; // 20%以上の余裕が必要

    result.checks.powerAdequacy = {
      adequate,
      totalConsumption,
      psuWattage,
      headroom,
    };

    if (!adequate && psuWattage > 0) {
      result.issues.push({
        id: 'power_insufficient',
        type: 'psu_insufficient',
        severity: 'critical',
        message: `電源容量（${psuWattage}W）が不足しています。推定消費電力は${totalConsumption}Wです。`,
        affectedParts: [psu.id],
        solution: `${Math.ceil(totalConsumption * 1.3)}W以上の電源ユニットを選択してください。`,
      });
    } else if (headroom < 30 && headroom >= 20) {
      result.issues.push({
        id: 'power_marginal',
        type: 'psu_insufficient',
        severity: 'warning',
        message: `電源容量の余裕が少なめです（余裕：${headroom.toFixed(1)}%）。`,
        affectedParts: [psu.id],
        solution: 'より大容量の電源ユニットを検討することをお勧めします。',
      });
    }
  }

  /**
   * 総消費電力計算
   */
  private static calculateTotalPowerConsumption(
    parts: Partial<Record<PartCategory, Part>>
  ): number {
    let total = 0;
    
    Object.values(parts).forEach(part => {
      if (part?.powerConsumption) {
        total += part.powerConsumption;
      }
    });

    // 基本システム消費電力を追加（ファン、LED等）
    total += 50;

    return total;
  }

  /**
   * ソケットから対応メモリ規格を取得
   */
  private static getMemoryTypeBySocket(socket: string): string {
    switch (socket) {
      case 'LGA1700':
      case 'LGA1200':
      case 'AM4':
        return 'DDR4';
      case 'AM5':
        return 'DDR5';
      case 'LGA1151':
        return 'DDR4';
      default:
        return 'DDR4'; // デフォルト
    }
  }

  /**
   * メモリ規格を安全に抽出
   */
  private static extractMemoryType(speedSpec: unknown): string {
    // 文字列の場合
    if (typeof speedSpec === 'string') {
      return speedSpec.split('-')[0] || '';
    }
    
    // 数値の場合（例: 3200 → "DDR4"と推定）
    if (typeof speedSpec === 'number') {
      if (speedSpec >= 4800) return 'DDR5';
      if (speedSpec >= 2133) return 'DDR4';
      return 'DDR3';
    }
    
    // 配列の場合（最初の要素を使用）
    if (Array.isArray(speedSpec) && speedSpec.length > 0) {
      return this.extractMemoryType(speedSpec[0]);
    }
    
    // オブジェクトの場合
    if (typeof speedSpec === 'object' && speedSpec !== null) {
      const obj = speedSpec as Record<string, unknown>;
      if ('type' in obj) return this.extractMemoryType(obj.type);
      if ('speed' in obj) return this.extractMemoryType(obj.speed);
      if ('standard' in obj) return this.extractMemoryType(obj.standard);
    }
    
    // デフォルトは DDR4
    return 'DDR4';
  }

  /**
   * ソケットを安全に抽出
   */
  private static extractSocket(socketSpec: unknown): string {
    if (typeof socketSpec === 'string') {
      return socketSpec;
    }
    
    if (typeof socketSpec === 'object' && socketSpec !== null) {
      const obj = socketSpec as Record<string, unknown>;
      if ('socket' in obj && typeof obj.socket === 'string') {
        return obj.socket;
      }
      if ('type' in obj && typeof obj.type === 'string') {
        return obj.type;
      }
    }
    
    return '';
  }

  /**
   * 電源ワット数を安全に抽出
   */
  private static extractWattage(wattageSpec: unknown): number {
    if (typeof wattageSpec === 'number') {
      return wattageSpec;
    }
    
    if (typeof wattageSpec === 'string') {
      const parsed = parseInt(wattageSpec.replace(/[^0-9]/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    if (typeof wattageSpec === 'object' && wattageSpec !== null) {
      const obj = wattageSpec as Record<string, unknown>;
      if ('wattage' in obj) return this.extractWattage(obj.wattage);
      if ('power' in obj) return this.extractWattage(obj.power);
      if ('watts' in obj) return this.extractWattage(obj.watts);
    }
    
    return 0;
  }

  /**
   * 互換性スコア計算（0-100）
   */
  static calculateCompatibilityScore(result: BasicCompatibilityResult): number {
    let score = 100;
    
    result.issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }
}

export default BasicCompatibilityChecker;
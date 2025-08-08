// src/hooks/compatibility/useCompatibilityCheck.ts
// 互換性チェック用React Hook

import { useMemo } from 'react';
import type { Part, PartCategory } from '@/types';
import { BasicCompatibilityChecker, type BasicCompatibilityResult } from '@/services/compatibility/basicCompatibilityChecker';

export interface UseCompatibilityCheckReturn {
  compatibilityResult: BasicCompatibilityResult;
  isFullyCompatible: boolean;
  hasCriticalIssues: boolean;
  hasWarnings: boolean;
  compatibilityScore: number;
  getStatusForCheck: (checkType: 'cpuSocket' | 'memoryType' | 'powerAdequacy') => {
    status: 'compatible' | 'incompatible' | 'warning' | 'unknown';
    message: string;
    icon: '✅' | '❌' | '⚠️' | '❓';
  };
}

/**
 * 互換性チェック用React Hook
 * PC構成の互換性を自動的にチェックし、結果を返す
 */
export const useCompatibilityCheck = (
  currentConfig: Partial<Record<PartCategory, Part>>
): UseCompatibilityCheckReturn => {
  
  // 互換性チェック結果を計算（メモ化）
  const compatibilityResult = useMemo(() => {
    return BasicCompatibilityChecker.checkCompatibility(currentConfig);
  }, [currentConfig]);

  // 互換性スコアを計算
  const compatibilityScore = useMemo(() => {
    return BasicCompatibilityChecker.calculateCompatibilityScore(compatibilityResult);
  }, [compatibilityResult]);

  // 各種状態を判定
  const isFullyCompatible = compatibilityResult.isCompatible;
  const hasCriticalIssues = compatibilityResult.issues.some(issue => issue.severity === 'critical');
  const hasWarnings = compatibilityResult.issues.some(issue => issue.severity === 'warning');

  /**
   * 特定のチェック項目の状態を取得
   */
  const getStatusForCheck = (
    checkType: 'cpuSocket' | 'memoryType' | 'powerAdequacy'
  ) => {
    const check = compatibilityResult.checks[checkType];
    
    switch (checkType) {
      case 'cpuSocket': {
        if (!currentConfig.cpu || !currentConfig.motherboard) {
          return {
            status: 'unknown' as const,
            message: 'CPUまたはマザーボードが選択されていません',
            icon: '❓' as const,
          };
        }
        
        const cpuSocketCheck = check as { compatible: boolean; cpuSocket?: string; motherboardSocket?: string };
        
        if (cpuSocketCheck.compatible) {
          return {
            status: 'compatible' as const,
            message: `ソケット互換性OK（${cpuSocketCheck.cpuSocket}）`,
            icon: '✅' as const,
          };
        } else {
          return {
            status: 'incompatible' as const,
            message: `ソケット不一致（CPU: ${cpuSocketCheck.cpuSocket}, MB: ${cpuSocketCheck.motherboardSocket}）`,
            icon: '❌' as const,
          };
        }
      }

      case 'memoryType': {
        if (!currentConfig.memory || !currentConfig.motherboard) {
          return {
            status: 'unknown' as const,
            message: 'メモリまたはマザーボードが選択されていません',
            icon: '❓' as const,
          };
        }
        
        const memoryTypeCheck = check as { compatible: boolean; memoryType?: string; supportedType?: string };
        
        if (memoryTypeCheck.compatible) {
          return {
            status: 'compatible' as const,
            message: `メモリ規格OK（${memoryTypeCheck.memoryType}）`,
            icon: '✅' as const,
          };
        } else {
          return {
            status: 'incompatible' as const,
            message: `メモリ規格不一致（${memoryTypeCheck.memoryType} ≠ ${memoryTypeCheck.supportedType}）`,
            icon: '❌' as const,
          };
        }
      }

      case 'powerAdequacy': {
        if (!currentConfig.psu) {
          return {
            status: 'unknown' as const,
            message: '電源ユニットが選択されていません',
            icon: '❓' as const,
          };
        }

        const powerAdequacyCheck = check as { adequate: boolean; totalConsumption: number; psuWattage: number; headroom: number };
        const { adequate, totalConsumption, psuWattage, headroom } = powerAdequacyCheck;
        
        if (adequate && headroom >= 30) {
          return {
            status: 'compatible' as const,
            message: `電源容量OK（余裕: ${headroom.toFixed(1)}%）`,
            icon: '✅' as const,
          };
        } else if (adequate) {
          return {
            status: 'warning' as const,
            message: `電源容量やや不足（余裕: ${headroom.toFixed(1)}%）`,
            icon: '⚠️' as const,
          };
        } else {
          return {
            status: 'incompatible' as const,
            message: `電源容量不足（${totalConsumption}W > ${psuWattage}W）`,
            icon: '❌' as const,
          };
        }
      }

      default:
        return {
          status: 'unknown' as const,
          message: '不明なチェック項目',
          icon: '❓' as const,
        };
    }
  };

  return {
    compatibilityResult,
    isFullyCompatible,
    hasCriticalIssues,
    hasWarnings,
    compatibilityScore,
    getStatusForCheck,
  };
};

export default useCompatibilityCheck;
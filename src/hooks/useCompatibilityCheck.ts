// src/hooks/useCompatibilityCheck.ts
// 互換性チェック用Reactフック

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PCConfiguration, CompatibilityResult } from '@/types';
import { CompatibilityCheckerService } from '@/services/compatibilityChecker';

interface UseCompatibilityCheckReturn {
  result: CompatibilityResult | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  checkSpecificCompatibility: (category: string) => boolean;
}

export const useCompatibilityCheck = (
  configuration: PCConfiguration,
  options?: {
    autoCheck?: boolean;
    debounceMs?: number;
  }
): UseCompatibilityCheckReturn => {
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // デフォルト設定
  const autoCheck = options?.autoCheck ?? true;
  const debounceMs = options?.debounceMs ?? 300;

  // 互換性チェックサービスのインスタンス
  const compatibilityService = useMemo(() => new CompatibilityCheckerService(), []);

  // 互換性チェック実行
  const performCheck = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const checkResult = compatibilityService.checkFullCompatibility(configuration);
      setResult(checkResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '互換性チェックエラー';
      setError(errorMessage);
      console.error('Compatibility check error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [compatibilityService, configuration]);

  // 手動更新関数
  const refresh = useCallback(() => {
    performCheck();
  }, [performCheck]);

  // 特定カテゴリの互換性チェック
  const checkSpecificCompatibility = (category: string): boolean => {
    if (!result) return false;
    
    switch (category) {
      case 'socket':
        return result.details.cpuSocket.compatible;
      case 'memory':
        return result.details.memoryType.compatible;
      case 'power':
        return result.details.powerConnectors.compatible;
      case 'physical':
        return result.details.physicalFit.compatible;
      case 'performance':
        return result.details.performanceMatch.balanced;
      default:
        return result.isCompatible;
    }
  };

  // 構成変更時の自動チェック（デバウンス付き）
  useEffect(() => {
    if (!autoCheck) return;

    const timer = setTimeout(() => {
      // パーツが1つ以上選択されている場合のみチェック実行
      const hasAnyPart = Object.values(configuration.parts).some(part => part !== null);
      if (hasAnyPart) {
        performCheck();
      } else {
        // パーツが全て未選択の場合はリセット
        setResult(null);
        setError(null);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [autoCheck, debounceMs, performCheck, configuration.parts]);

  // 初回マウント時のチェック
  useEffect(() => {
    if (autoCheck) {
      const hasAnyPart = Object.values(configuration.parts).some(part => part !== null);
      if (hasAnyPart) {
        performCheck();
      }
    }
  }, [autoCheck, configuration.parts, performCheck]); // 初回のみ実行

  return {
    result,
    isLoading,
    error,
    refresh,
    checkSpecificCompatibility
  };
};

// 互換性スコア計算用のヘルパー関数
export const getCompatibilityScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

// 互換性ステータス表示用のヘルパー関数
export const getCompatibilityStatusText = (isCompatible: boolean, hasIssues: boolean): string => {
  if (isCompatible && !hasIssues) return '互換性あり';
  if (isCompatible && hasIssues) return '注意が必要';
  return '互換性なし';
};

// 互換性問題の重要度別フィルタ
export const filterIssuesBySeverity = (
  result: CompatibilityResult | null,
  severity: 'critical' | 'warning' | 'info'
) => {
  if (!result) return [];
  return result.issues.filter(issue => issue.severity === severity);
};

export default useCompatibilityCheck;

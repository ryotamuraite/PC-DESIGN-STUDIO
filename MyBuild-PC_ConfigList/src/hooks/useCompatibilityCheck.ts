// src/hooks/useCompatibilityCheck.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PCConfiguration } from '@/types';
import { CompatibilityCheckerService } from '@/services/compatibilityChecker';
import {
  CompatibilityResult
} from '@/types/compatibility';

interface UseCompatibilityCheckOptions {
  autoCheck?: boolean;
  debounceMs?: number;
}

interface UseCompatibilityCheckReturn {
  compatibilityResult: CompatibilityResult | null;
  isChecking: boolean;
  error: string | null;
  checkCompatibility: (config: PCConfiguration) => void;
  recheckCompatibility: () => void;
  clearError: () => void;
}

export const useCompatibilityCheck = (
  configuration: PCConfiguration | null,
  options: UseCompatibilityCheckOptions = {}
): UseCompatibilityCheckReturn => {
  const { autoCheck = true, debounceMs = 500 } = options;
  
  // State
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CompatibilityChecker service instance
  const compatibilityChecker = useMemo(() => CompatibilityCheckerService.getInstance(), []);

  // 互換性チェックを実行
  const checkCompatibility = useCallback(async (config: PCConfiguration) => {
    if (!config) return;

    setIsChecking(true);
    setError(null);

    try {
      // 少し遅延を入れてUI応答性を向上
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = compatibilityChecker.checkCompatibility(config);
      setCompatibilityResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? 
        err.message : '互換性チェック中にエラーが発生しました';
      setError(errorMessage);
      console.error('Compatibility check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, [compatibilityChecker]);

  // デバウンス付きのチェック関数
  const debouncedCheck = useMemo(
    () => debounce((config: PCConfiguration) => {
      checkCompatibility(config);
    }, debounceMs),
    [checkCompatibility, debounceMs]
  );

  // 構成が変更された時の自動チェック
  useEffect(() => {
    if (autoCheck && configuration) {
      debouncedCheck(configuration);
    }
  }, [configuration, autoCheck, debouncedCheck]);

  // 再チェック
  const recheckCompatibility = useCallback(() => {
    if (configuration) {
      checkCompatibility(configuration);
    }
  }, [configuration, checkCompatibility]);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    compatibilityResult,
    isChecking,
    error,
    checkCompatibility,
    recheckCompatibility,
    clearError
  };
};

// デバウンス用ユーティリティ関数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 互換性スコア評価用のヘルパーフック
export const useCompatibilityRating = (compatibilityResult: CompatibilityResult | null) => {
  return useMemo(() => {
    if (!compatibilityResult) return null;

    const score = compatibilityResult.score;
    let rating: 'excellent' | 'good' | 'fair' | 'poor';
    let color: string;
    let description: string;

    if (score >= 95) {
      rating = 'excellent';
      color = 'text-green-600';
      description = '完全に互換性があります';
    } else if (score >= 85) {
      rating = 'good';
      color = 'text-blue-600';
      description = '互換性に問題ありません';
    } else if (score >= 70) {
      rating = 'fair';
      color = 'text-yellow-600';
      description = '注意が必要な項目があります';
    } else {
      rating = 'poor';
      color = 'text-red-600';
      description = '重要な互換性問題があります';
    }

    return {
      rating,
      color,
      description,
      score
    };
  }, [compatibilityResult]);
};

// 互換性問題の分析用ヘルパーフック
export const useCompatibilityAnalysis = (compatibilityResult: CompatibilityResult | null) => {
  return useMemo(() => {
    if (!compatibilityResult) return null;

    const criticalIssues = compatibilityResult.issues.filter(issue => issue.severity === 'critical');
    const warningIssues = compatibilityResult.issues.filter(issue => issue.severity === 'warning');
    const infoIssues = compatibilityResult.issues.filter(issue => issue.severity === 'info');

    const hasBlockingIssues = criticalIssues.length > 0;
    const needsAttention = warningIssues.length > 0;
    
    const priorityActions = criticalIssues.map(issue => ({
      action: issue.solution || '対応が必要です',
      category: issue.category,
      urgency: 'high' as const
    }));

    const suggestions = warningIssues.map(issue => ({
      action: issue.solution || '改善を推奨します',
      category: issue.category,
      urgency: 'medium' as const
    }));

    return {
      criticalIssues,
      warningIssues,
      infoIssues,
      hasBlockingIssues,
      needsAttention,
      priorityActions,
      suggestions,
      totalIssues: compatibilityResult.issues.length
    };
  }, [compatibilityResult]);
};

export default useCompatibilityCheck;

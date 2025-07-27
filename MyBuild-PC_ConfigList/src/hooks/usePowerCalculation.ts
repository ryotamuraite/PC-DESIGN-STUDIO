// src/hooks/usePowerCalculation.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PCConfiguration, PowerCalculationResult, PSUSpecification } from '@/types';
import { PowerCalculatorService } from '@/services/powerCalculator';

interface UsePowerCalculationOptions {
  autoCalculate?: boolean;
  debounceMs?: number;
}

interface UsePowerCalculationReturn {
  powerResult: PowerCalculationResult | null;
  isCalculating: boolean;
  error: string | null;
  recommendedPSUs: PSUSpecification[];
  monthlyCost: {
    idle: number;
    normal: number;
    peak: number;
    total: number;
  } | null;
  calculatePower: (config: PCConfiguration) => void;
  recalculate: () => void;
  clearError: () => void;
  updateUsageSettings: (hours: number, rate: number) => void;
}

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

export const usePowerCalculation = (
  configuration: PCConfiguration | null,
  options: UsePowerCalculationOptions = {}
): UsePowerCalculationReturn => {
  const { autoCalculate = true, debounceMs = 300 } = options;
  
  // State
  const [powerResult, setPowerResult] = useState<PowerCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageHours, setUsageHours] = useState(8);
  const [electricityRate, setElectricityRate] = useState(27);

  // PowerCalculator service instance
  const powerCalculator = useMemo(() => PowerCalculatorService.getInstance(), []);

  // 電力計算を実行
  const calculatePower = useCallback(async (config: PCConfiguration) => {
    if (!config) return;

    setIsCalculating(true);
    setError(null);

    try {
      // 少し遅延を入れてUI応答性を向上
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = powerCalculator.calculatePowerConsumption(config);
      setPowerResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? 
        err.message : '電力計算中にエラーが発生しました';
      setError(errorMessage);
      console.error('Power calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [powerCalculator]);

  // デバウンス付きの計算関数
  const debouncedCalculate = useMemo(
    () => debounce((config: PCConfiguration) => {
      calculatePower(config);
    }, debounceMs),
    [calculatePower, debounceMs]
  );

  // 推奨電源リストを取得
  const recommendedPSUs = useMemo(() => {
    if (!powerResult) return [];
    return powerCalculator.getRecommendedPSUs(powerResult.recommendedPSU);
  }, [powerResult, powerCalculator]);

  // 月間電気代を計算
  const monthlyCost = useMemo(() => {
    if (!powerResult) return null;
    
    const costs = powerCalculator.calculateMonthlyCost(
      powerResult,
      usageHours,
      electricityRate
    );
    
    return {
      ...costs,
      total: costs.idle + costs.normal + costs.peak
    };
  }, [powerResult, usageHours, electricityRate, powerCalculator]);

  // 構成が変更された時の自動計算
  useEffect(() => {
    if (autoCalculate && configuration) {
      debouncedCalculate(configuration);
    }
  }, [configuration, autoCalculate, debouncedCalculate]);

  // 再計算
  const recalculate = useCallback(() => {
    if (configuration) {
      calculatePower(configuration);
    }
  }, [configuration, calculatePower]);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 使用設定の更新
  const updateUsageSettings = useCallback((hours: number, rate: number) => {
    setUsageHours(hours);
    setElectricityRate(rate);
  }, []);

  return {
    powerResult,
    isCalculating,
    error,
    recommendedPSUs,
    monthlyCost,
    calculatePower,
    recalculate,
    clearError,
    updateUsageSettings
  };
};

// 電力効率評価用のヘルパーフック
export const usePowerEfficiencyRating = (powerResult: PowerCalculationResult | null) => {
  return useMemo(() => {
    if (!powerResult) return null;

    const efficiency = powerResult.powerEfficiency;
    let rating: 'excellent' | 'good' | 'fair' | 'poor';
    let color: string;
    let description: string;

    if (efficiency >= 90) {
      rating = 'excellent';
      color = 'text-green-600';
      description = '非常に効率的な構成です';
    } else if (efficiency >= 85) {
      rating = 'good';
      color = 'text-blue-600';
      description = '効率的な構成です';
    } else if (efficiency >= 80) {
      rating = 'fair';
      color = 'text-yellow-600';
      description = 'まずまずの効率です';
    } else {
      rating = 'poor';
      color = 'text-red-600';
      description = '効率を改善できる余地があります';
    }

    return {
      rating,
      color,
      description,
      percentage: efficiency
    };
  }, [powerResult]);
};

// 電源選択支援用のヘルパーフック
export const usePSURecommendation = (powerResult: PowerCalculationResult | null) => {
  return useMemo(() => {
    if (!powerResult) return null;

    const requiredPower = powerResult.recommendedPSU;
    const categories = [
      {
        name: 'エコノミー',
        range: [requiredPower, requiredPower + 100],
        efficiency: '80+ Bronze',
        description: 'コストを重視した基本的な構成'
      },
      {
        name: 'バランス',
        range: [requiredPower + 50, requiredPower + 150],
        efficiency: '80+ Gold',
        description: 'コストと効率のバランスが良い構成'
      },
      {
        name: 'プレミアム',
        range: [requiredPower + 100, requiredPower + 200],
        efficiency: '80+ Platinum',
        description: '高効率で将来性も考慮した構成'
      }
    ];

    return categories;
  }, [powerResult]);
};

// 電力警告の重要度別分類用フック
export const usePowerWarningsByPriority = (powerResult: PowerCalculationResult | null) => {
  return useMemo(() => {
    if (!powerResult) return { critical: [], high: [], medium: [], low: [] };

    return powerResult.warnings.reduce(
      (acc, warning) => {
        acc[warning.severity].push(warning);
        return acc;
      },
      { critical: [], high: [], medium: [], low: [] } as Record<string, typeof powerResult.warnings>
    );
  }, [powerResult]);
};
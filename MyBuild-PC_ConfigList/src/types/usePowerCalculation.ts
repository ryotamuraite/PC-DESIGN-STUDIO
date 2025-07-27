// src/hooks/usePowerCalculation.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PowerCalculationResult, 
  PowerCalculationConfig, 
  PowerConnectorCheck 
} from '../types/power';
import { Part, PartCategory } from '../types/parts';
import { PowerCalculatorService } from '../services/powerCalculator';

interface UsePowerCalculationOptions {
  autoCalculate?: boolean;      // 自動計算するか
  debounceMs?: number;         // デバウンス時間
  initialConfig?: Partial<PowerCalculationConfig>;
}

interface UsePowerCalculationReturn {
  result: PowerCalculationResult | null;
  connectorCheck: PowerConnectorCheck | null;
  config: PowerCalculationConfig;
  loading: boolean;
  error: string | null;
  calculate: () => Promise<void>;
  updateConfig: (config: Partial<PowerCalculationConfig>) => void;
  resetConfig: () => void;
}

export function usePowerCalculation(
  parts: Partial<Record<PartCategory, Part | Part[]>>,
  options: UsePowerCalculationOptions = {}
): UsePowerCalculationReturn {
  const {
    autoCalculate = true,
    debounceMs = 500,
    initialConfig = {}
  } = options;

  const [result, setResult] = useState<PowerCalculationResult | null>(null);
  const [connectorCheck, setConnectorCheck] = useState<PowerConnectorCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultConfig: PowerCalculationConfig = {
    scenario: 'gaming',
    safetyMargin: 0.2,
    futureUpgradeMargin: 0.1,
    includePeripherals: true,
    peripheralsPower: 50
  };

  const [config, setConfig] = useState<PowerCalculationConfig>({
    ...defaultConfig,
    ...initialConfig
  });

  const powerService = useMemo(() => new PowerCalculatorService(), []);

  // デバウンス用のタイマー
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [powerResult, connectorResult] = await Promise.all([
        powerService.calculatePower(parts, config),
        powerService.checkPowerConnectors(parts)
      ]);
      
      setResult(powerResult);
      setConnectorCheck(connectorResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '電源計算中にエラーが発生しました';
      setError(errorMessage);
      console.error('電源計算エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [parts, config, powerService]);

  const debouncedCalculate = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      calculate();
    }, debounceMs);

    setDebounceTimer(timer);
  }, [calculate, debounceMs, debounceTimer]);

  // パーツまたは設定が変更されたら自動計算
  useEffect(() => {
    if (autoCalculate) {
      debouncedCalculate();
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [parts, config, autoCalculate, debouncedCalculate]);

  const updateConfig = useCallback((newConfig: Partial<PowerCalculationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...defaultConfig, ...initialConfig });
  }, [initialConfig]);

  return {
    result,
    connectorCheck,
    config,
    loading,
    error,
    calculate,
    updateConfig,
    resetConfig
  };
}

// 電源計算結果の評価ユーティリティ
export function evaluatePowerCalculation(result: PowerCalculationResult | null) {
  if (!result) {
    return {
      overall: 'unknown',
      issues: [],
      recommendations: []
    };
  }

  const issues: string[] = [];
  const recommendations: string[] = [];
  let overall: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

  // 負荷率チェック
  if (result.loadPercentage > 95) {
    overall = 'critical';
    issues.push('電源容量が不足しています');
    recommendations.push('より大容量の電源に交換してください');
  } else if (result.loadPercentage > 85) {
    overall = overall === 'excellent' ? 'warning' : overall;
    issues.push('電源の負荷率が高すぎます');
    recommendations.push('余裕のある電源を検討してください');
  }

  // 余裕チェック
  if (result.headroom < 5) {
    overall = overall === 'excellent' ? 'critical' : overall;
    issues.push('将来のアップグレード余裕がありません');
  } else if (result.headroom < 15) {
    overall = overall === 'excellent' ? 'warning' : overall;
    recommendations.push('将来のアップグレードを考慮してより大容量の電源を検討してください');
  }

  // 効率チェック
  if (result.efficiency < 0.8) {
    overall = overall === 'excellent' ? 'warning' : overall;
    recommendations.push('より高効率な電源を検討してください');
  }

  // 警告数チェック
  const criticalWarnings = result.warnings.filter(w => w.severity === 'critical').length;
  const warningCount = result.warnings.filter(w => w.severity === 'warning').length;

  if (criticalWarnings > 0) {
    overall = 'critical';
  } else if (warningCount > 2) {
    overall = overall === 'excellent' ? 'warning' : overall;
  } else if (warningCount === 0 && result.loadPercentage < 70 && result.headroom > 25) {
    overall = 'excellent';
  } else if (overall === 'excellent') {
    overall = 'good';
  }

  return {
    overall,
    issues,
    recommendations
  };
}

// 電源効率の説明を取得
export function getPowerEfficiencyDescription(efficiency: string): string {
  const descriptions: Record<string, string> = {
    '80+': '基本的な80Plus認証。最低限の効率保証。',
    '80+ Bronze': 'Bronze認証。一般的な効率レベル。',
    '80+ Silver': 'Silver認証。良好な効率。',
    '80+ Gold': 'Gold認証。高効率でおすすめ。',
    '80+ Platinum': 'Platinum認証。非常に高効率。',
    '80+ Titanium': 'Titanium認証。最高レベルの効率。'
  };

  return descriptions[efficiency] || '効率情報が不明です。';
}

// 負荷率に基づく色を取得
export function getLoadPercentageColor(percentage: number): string {
  if (percentage > 90) return 'red';
  if (percentage > 75) return 'orange';
  if (percentage > 60) return 'yellow';
  return 'green';
}

// 電源容量の推奨事項を取得
export function getPowerRecommendation(
  totalConsumption: number,
  currentPsuWattage?: number
): {
  recommended: number;
  reason: string;
  alternatives: number[];
} {
  const recommended = Math.ceil(totalConsumption * 1.3 / 50) * 50; // 30%マージンで50W単位で切り上げ
  const alternatives = [
    Math.ceil(totalConsumption * 1.2 / 50) * 50,  // 20%マージン
    Math.ceil(totalConsumption * 1.4 / 50) * 50,  // 40%マージン
    Math.ceil(totalConsumption * 1.5 / 50) * 50   // 50%マージン
  ].filter(w => w !== recommended && w >= 400 && w <= 1500);

  let reason = `総消費電力${totalConsumption}Wに対して30%の安全マージンを考慮`;
  
  if (currentPsuWattage) {
    if (currentPsuWattage < totalConsumption) {
      reason = '現在の電源では容量不足です';
    } else if (currentPsuWattage < recommended) {
      reason = '将来のアップグレードを考慮すると容量不足の可能性があります';
    } else {
      reason = '現在の電源で十分ですが、より効率的な運用のための推奨値です';
    }
  }

  return {
    recommended,
    reason,
    alternatives
  };
}
// src/components/calculators/PowerCalculator.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PowerCalculationResult, 
  PowerCalculationConfig, 
  PowerConnectorCheck,
  LOAD_SCENARIOS 
} from '../../types/power';
import { Part, PartCategory } from '../../types/parts';
import { PowerCalculatorService } from '../../services/powerCalculator';

interface PowerCalculatorProps {
  parts: Partial<Record<PartCategory, Part | Part[]>>;
  onConfigChange?: (config: PowerCalculationConfig) => void;
  className?: string;
}

export const PowerCalculator: React.FC<PowerCalculatorProps> = ({
  parts,
  onConfigChange,
  className = ''
}) => {
  const [result, setResult] = useState<PowerCalculationResult | null>(null);
  const [connectorCheck, setConnectorCheck] = useState<PowerConnectorCheck | null>(null);
  const [config, setConfig] = useState<PowerCalculationConfig>({
    scenario: 'gaming',
    safetyMargin: 0.2,
    futureUpgradeMargin: 0.1,
    includePeripherals: true,
    peripheralsPower: 50
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const powerService = useMemo(() => new PowerCalculatorService(), []);

  // パーツが変更されたら再計算
  useEffect(() => {
    calculatePower();
  }, [parts, config]);

  const calculatePower = async () => {
    setLoading(true);
    try {
      const [powerResult, connectorResult] = await Promise.all([
        powerService.calculatePower(parts, config),
        powerService.checkPowerConnectors(parts)
      ]);
      
      setResult(powerResult);
      setConnectorCheck(connectorResult);
    } catch (error) {
      console.error('電源計算エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (newConfig: Partial<PowerCalculationConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLoadColor = (percentage: number) => {
    if (percentage > 90) return 'text-red-600';
    if (percentage > 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">電源計算</h3>
        <p className="text-gray-600">パーツを選択すると電源計算が表示されます</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">電源計算</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {expanded ? '詳細を隠す' : '詳細を表示'}
        </button>
      </div>

      {/* メイン情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {result.totalConsumption}W
          </div>
          <div className="text-sm text-gray-600">総消費電力</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {result.recommendedPsu}W
          </div>
          <div className="text-sm text-gray-600">推奨電源容量</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getLoadColor(result.loadPercentage)}`}>
            {result.loadPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">負荷率</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {result.headroom.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">余裕</div>
        </div>
      </div>

      {/* 警告 */}
      {result.warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {result.warnings.map((warning, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getSeverityColor(warning.severity)}`}
            >
              <div className="font-medium">{warning.message}</div>
              {warning.suggestion && (
                <div className="text-sm mt-1">{warning.suggestion}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* コネクタチェック */}
      {connectorCheck && !connectorCheck.sufficient && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">電源コネクタ不足</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {connectorCheck.missing.map((missing, index) => (
              <li key={index}>• {missing}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 設定パネル */}
      {expanded && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">計算設定</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 使用シナリオ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                使用シナリオ
              </label>
              <select
                value={config.scenario}
                onChange={(e) => handleConfigChange({ scenario: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LOAD_SCENARIOS.map((scenario) => (
                  <option key={scenario.name} value={scenario.name}>
                    {scenario.description}
                  </option>
                ))}
              </select>
            </div>

            {/* 安全マージン */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                安全マージン ({(config.safetyMargin * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={config.safetyMargin * 100}
                onChange={(e) => handleConfigChange({ safetyMargin: parseInt(e.target.value) / 100 })}
                className="w-full"
              />
            </div>

            {/* 将来のアップグレードマージン */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アップグレードマージン ({(config.futureUpgradeMargin * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={config.futureUpgradeMargin * 100}
                onChange={(e) => handleConfigChange({ futureUpgradeMargin: parseInt(e.target.value) / 100 })}
                className="w-full"
              />
            </div>

            {/* 周辺機器を含む */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includePeripherals"
                checked={config.includePeripherals}
                onChange={(e) => handleConfigChange({ includePeripherals: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="includePeripherals" className="text-sm font-medium text-gray-700">
                周辺機器を含む ({config.peripheralsPower}W)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 消費電力内訳 */}
      {expanded && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">消費電力内訳</h4>
          <div className="space-y-2">
            {/* CPU */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="text-sm text-gray-700">{result.breakdown.cpu.component}</div>
              <div className="text-sm font-medium text-gray-900">
                {result.breakdown.cpu.idle}W / {result.breakdown.cpu.typical}W / {result.breakdown.cpu.peak}W
              </div>
            </div>

            {/* GPU */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="text-sm text-gray-700">{result.breakdown.gpu.component}</div>
              <div className="text-sm font-medium text-gray-900">
                {result.breakdown.gpu.idle}W / {result.breakdown.gpu.typical}W / {result.breakdown.gpu.peak}W
              </div>
            </div>

            {/* マザーボード */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="text-sm text-gray-700">{result.breakdown.motherboard.component}</div>
              <div className="text-sm font-medium text-gray-900">
                {result.breakdown.motherboard.idle}W / {result.breakdown.motherboard.typical}W / {result.breakdown.motherboard.peak}W
              </div>
            </div>

            {/* メモリ */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="text-sm text-gray-700">{result.breakdown.memory.component}</div>
              <div className="text-sm font-medium text-gray-900">
                {result.breakdown.memory.idle}W / {result.breakdown.memory.typical}W / {result.breakdown.memory.peak}W
              </div>
            </div>

            {/* ストレージ */}
            {result.breakdown.storage.map((storage, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="text-sm text-gray-700">{storage.component}</div>
                <div className="text-sm font-medium text-gray-900">
                  {storage.idle}W / {storage.typical}W / {storage.peak}W
                </div>
              </div>
            ))}

            {/* 冷却 */}
            {result.breakdown.cooling.map((cooling, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="text-sm text-gray-700">{cooling.component}</div>
                <div className="text-sm font-medium text-gray-900">
                  {cooling.idle}W / {cooling.typical}W / {cooling.peak}W
                </div>
              </div>
            ))}

            {/* その他 */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="text-sm text-gray-700">{result.breakdown.other.component}</div>
              <div className="text-sm font-medium text-gray-900">
                {result.breakdown.other.idle}W / {result.breakdown.other.typical}W / {result.breakdown.other.peak}W
              </div>
            </div>

            {/* 合計 */}
            <div className="flex justify-between items-center py-2 font-semibold text-gray-900 bg-gray-50 px-2 rounded">
              <div>合計</div>
              <div>
                {result.breakdown.total.idle}W / {result.breakdown.total.typical}W / {result.breakdown.total.peak}W
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            アイドル時 / 通常時 / ピーク時
          </div>
        </div>
      )}

      {/* 推奨事項 */}
      {result.recommendations.length > 0 && expanded && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">推奨事項</h4>
          <div className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-800 mb-1">{rec.title}</div>
                <div className="text-blue-700 text-sm mb-2">{rec.description}</div>
                {rec.alternatives && rec.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-blue-800">代替案:</div>
                    {rec.alternatives.map((alt, altIndex) => (
                      <div key={altIndex} className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                        <div className="font-medium">{alt.name} - ¥{alt.price.toLocaleString()}</div>
                        <div>{alt.wattage}W, {alt.efficiency}</div>
                        <div className="text-xs">{alt.improvement}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { 
  usePowerCalculation, 
  usePowerEfficiencyRating, 
  usePSURecommendation,
  usePowerWarningsByPriority 
} from '../../hooks/usePowerCalculation';
import { PCConfiguration, PowerWarning } from '../../types';

interface PowerCalculatorProps {
  configuration: PCConfiguration;
  className?: string;
}

export const PowerCalculator: React.FC<PowerCalculatorProps> = ({ 
  configuration, 
  className = '' 
}) => {
  const [usageHours, setUsageHours] = useState(8);
  const [electricityRate, setElectricityRate] = useState(27);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    powerResult,
    isCalculating,
    error,
    recommendedPSUs,
    monthlyCost,
    recalculate,
    clearError,
    updateUsageSettings
  } = usePowerCalculation(configuration);

  const efficiencyRating = usePowerEfficiencyRating(powerResult);
  const psuRecommendations = usePSURecommendation(powerResult);
  const warningsByPriority = usePowerWarningsByPriority(powerResult);

  // 使用設定の更新
  const handleUsageUpdate = (hours: number, rate: number) => {
    setUsageHours(hours);
    setElectricityRate(rate);
    updateUsageSettings(hours, rate);
  };

  if (isCalculating) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">電力を計算中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-red-800">計算エラー</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => { clearError(); recalculate(); }}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              再計算
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!powerResult) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          パーツを選択して電力計算を開始してください
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">電力計算結果</h2>
          <button
            onClick={recalculate}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            再計算
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* メイン結果表示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PowerMetricCard
            title="アイドル時"
            value={powerResult.totalIdlePower}
            unit="W"
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <PowerMetricCard
            title="通常使用時"
            value={powerResult.totalBasePower}
            unit="W"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <PowerMetricCard
            title="最大消費電力"
            value={powerResult.totalMaxPower}
            unit="W"
            color="text-red-600"
            bgColor="bg-red-50"
          />
        </div>

        {/* 推奨電源容量 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">推奨電源容量</h3>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-gray-900">
              {powerResult.recommendedPSU}W
            </span>
            <span className="text-sm text-gray-600">
              (安全マージン {powerResult.safetyMargin}% 含む)
            </span>
          </div>
        </div>

        {/* 効率評価 */}
        {efficiencyRating && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">電力効率</h3>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${efficiencyRating.percentage}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${efficiencyRating.color}`}>
                {efficiencyRating.percentage}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{efficiencyRating.description}</p>
          </div>
        )}

        {/* 警告表示 */}
        <PowerWarningsSection warnings={warningsByPriority} />

        {/* 詳細表示トグル */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? '詳細を非表示' : '詳細を表示'}
          <svg 
            className={`inline-block ml-1 w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 詳細セクション */}
        {showAdvanced && (
          <div className="space-y-6 border-t pt-6">
            {/* パーツ別内訳 */}
            <PowerBreakdownSection breakdown={powerResult.breakdown} />

            {/* 月間電気代計算 */}
            <MonthlyCostSection
              monthlyCost={monthlyCost}
              usageHours={usageHours}
              electricityRate={electricityRate}
              onUsageUpdate={handleUsageUpdate}
            />

            {/* 推奨電源リスト */}
            {recommendedPSUs.length > 0 && (
              <RecommendedPSUSection psus={recommendedPSUs} />
            )}

            {/* PSU推奨カテゴリ */}
            {psuRecommendations && (
              <PSURecommendationSection recommendations={psuRecommendations} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// メトリクスカードコンポーネント
const PowerMetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  color: string;
  bgColor: string;
}> = ({ title, value, unit, color, bgColor }) => (
  <div className={`${bgColor} rounded-lg p-4`}>
    <h3 className="text-sm font-medium text-gray-700">{title}</h3>
    <div className="mt-1">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-gray-600 ml-1">{unit}</span>
    </div>
  </div>
);

// 警告セクション
const PowerWarningsSection: React.FC<{
  warnings: Record<string, PowerWarning[]>;
}> = ({ warnings }) => {
  const { critical, high, medium, low } = warnings;
  
  if (critical.length === 0 && high.length === 0 && medium.length === 0 && low.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-green-800">問題は検出されませんでした</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {critical.length > 0 && (
        <WarningList warnings={critical} type="critical" color="red" />
      )}
      {high.length > 0 && (
        <WarningList warnings={high} type="high" color="orange" />
      )}
      {medium.length > 0 && (
        <WarningList warnings={medium} type="medium" color="yellow" />
      )}
      {low.length > 0 && (
        <WarningList warnings={low} type="low" color="blue" />
      )}
    </div>
  );
};

// 警告リスト
const WarningList: React.FC<{
  warnings: PowerWarning[];
  type: string;
  color: string;
}> = ({ warnings, type, color }) => (
  <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
    <h4 className={`text-sm font-medium text-${color}-800 mb-2`}>
      {type === 'critical' ? '重要な問題' : type === 'high' ? '注意が必要' : type === 'medium' ? '改善推奨' : '情報'}
    </h4>
    <ul className="space-y-2">
      {warnings.map((warning, index) => (
        <li key={index} className={`text-sm text-${color}-700`}>
          <div>{warning.message}</div>
          {warning.recommendation && (
            <div className={`text-${color}-600 mt-1 text-xs`}>
              推奨: {warning.recommendation}
            </div>
          )}
        </li>
      ))}
    </ul>
  </div>
);

// パーツ別内訳セクション
const PowerBreakdownSection: React.FC<{
  breakdown: any[];
}> = ({ breakdown }) => (
  <div>
    <h3 className="text-sm font-medium text-gray-900 mb-3">パーツ別消費電力</h3>
    <div className="space-y-2">
      {breakdown.map((item, index) => (
        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
          <div>
            <span className="text-sm font-medium text-gray-900">{item.partName}</span>
            <span className="text-xs text-gray-500 ml-2">({item.category})</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-900">{item.maxPower}W</div>
            <div className="text-xs text-gray-500">最大</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 月間電気代セクション
const MonthlyCostSection: React.FC<{
  monthlyCost: any;
  usageHours: number;
  electricityRate: number;
  onUsageUpdate: (hours: number, rate: number) => void;
}> = ({ monthlyCost, usageHours, electricityRate, onUsageUpdate }) => (
  <div>
    <h3 className="text-sm font-medium text-gray-900 mb-3">月間電気代試算</h3>
    
    {/* 設定 */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">1日の使用時間</label>
        <input
          type="number"
          value={usageHours}
          onChange={(e) => onUsageUpdate(usageHours, Number(e.target.value))}
          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
          min="10" max="50"
        />
      </div>
    </div>

    {/* 電気代表示 */}
    {monthlyCost && (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-600">アイドル時</div>
            <div className="text-sm font-medium text-gray-900">¥{Math.round(monthlyCost.idle)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">通常使用時</div>
            <div className="text-sm font-medium text-gray-900">¥{Math.round(monthlyCost.normal)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">ピーク時</div>
            <div className="text-sm font-medium text-gray-900">¥{Math.round(monthlyCost.peak)}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 text-center">
          <div className="text-xs text-gray-600">月間合計</div>
          <div className="text-lg font-bold text-gray-900">¥{Math.round(monthlyCost.total)}</div>
        </div>
      </div>
    )}
  </div>
);

// 推奨電源セクション
const RecommendedPSUSection: React.FC<{
  psus: any[];
}> = ({ psus }) => (
  <div>
    <h3 className="text-sm font-medium text-gray-900 mb-3">推奨電源ユニット</h3>
    <div className="space-y-3">
      {psus.slice(0, 3).map((psu, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{psu.name}</h4>
              <div className="text-xs text-gray-600 mt-1">
                {psu.capacity}W • {psu.efficiency} • {psu.modular ? 'モジュラー' : '非モジュラー'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">¥{psu.price.toLocaleString()}</div>
              <div className="text-xs text-gray-600">効率 {psu.efficiencyPercentage}%</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// PSU推奨カテゴリセクション
const PSURecommendationSection: React.FC<{
  recommendations: any[];
}> = ({ recommendations }) => (
  <div>
    <h3 className="text-sm font-medium text-gray-900 mb-3">電源選択ガイド</h3>
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">{rec.name}</h4>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {rec.range[0]}W - {rec.range[1]}W
            </span>
          </div>
          <div className="text-xs text-gray-600 mb-2">{rec.description}</div>
          <div className="text-xs text-blue-600 font-medium">推奨効率: {rec.efficiency}</div>
        </div>
      ))}
    </div>
  </div>
);

export default PowerCalculator;Update(Number(e.target.value), electricityRate)}
          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
          min="1" max="24"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">電気料金 (円/kWh)</label>
        <input
          type="number"
          value={electricityRate}
          onChange={(e) => onUsage
// src/components/calculators/PowerCalculator.tsx
import React, { useState } from 'react';
import { 
  usePowerCalculation, 
  usePowerEfficiencyRating, 
  usePSURecommendation,
  usePowerWarningsByPriority 
} from '@/hooks/usePowerCalculation';
import { PCConfiguration, PowerWarning, PowerConsumption, PSUSpecification } from '@/types';

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

        {/* 効率評価と推奨電源 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">電源効率評価</h3>
            {efficiencyRating && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">総合効率</span>
                  <span className={`text-sm font-medium ${efficiencyRating.color}`}>
                    {Math.round(efficiencyRating.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      efficiencyRating.rating === 'excellent' ? 'bg-green-500' :
                      efficiencyRating.rating === 'good' ? 'bg-blue-500' :
                      efficiencyRating.rating === 'fair' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${efficiencyRating.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">{efficiencyRating.description}</p>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">推奨電源容量</h4>
              <div className="text-2xl font-bold text-blue-600">
                {powerResult.recommendedPSU}W
              </div>
              <p className="text-xs text-gray-600 mt-1">
                20%の安全マージンを含む
              </p>
            </div>
          </div>

          {/* 電気代計算 */}
          {monthlyCost && (
            <UsageCostCalculator
              monthlyCost={monthlyCost}
              usageHours={usageHours}
              electricityRate={electricityRate}
              onUsageUpdate={handleUsageUpdate}
            />
          )}
        </div>

        {/* 警告とエラー */}
        {warningsByPriority && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">問題と警告</h3>
            <PowerWarningsSection warnings={warningsByPriority} />
          </div>
        )}

        {/* 推奨電源ユニット */}
        {recommendedPSUs && recommendedPSUs.length > 0 && (
          <RecommendedPSUSection psus={recommendedPSUs} />
        )}

        {/* PSU選択ガイド */}
        {psuRecommendations && (
          <PSURecommendationSection recommendations={psuRecommendations} />
        )}

        {/* 詳細表示 */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <span>詳細表示</span>
            <svg 
              className={`ml-1 w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <PowerBreakdownTable breakdown={powerResult.consumptions} />
            </div>
          )}
        </div>
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
      <span className={`text-2xl font-bold ${color}`}>{Math.round(value)}</span>
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
      {type === 'critical' ? '重要な問題' : 
       type === 'high' ? '注意が必要' : 
       type === 'medium' ? '改善可能' : 
       '情報'}
    </h4>
    <ul className="space-y-2">
      {warnings.map((warning, index) => (
        <li key={index} className={`text-sm text-${color}-700`}>
          <div className="flex items-start">
            <svg className={`w-4 h-4 text-${color}-400 mr-2 mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{warning.message}</span>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

// 使用量計算機
const UsageCostCalculator: React.FC<{
  monthlyCost: {
    idle: number;
    normal: number;
    peak: number;
    total: number;
  };
  usageHours: number;
  electricityRate: number;
  onUsageUpdate: (hours: number, rate: number) => void;
}> = ({ monthlyCost, usageHours, electricityRate, onUsageUpdate }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-gray-900">月間電気代</h3>
    
    {/* 設定 */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">使用時間 (時/日)</label>
        <input
          type="number"
          value={usageHours}
          onChange={(e) => onUsageUpdate(Number(e.target.value), electricityRate)}
          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
          min="1" max="24"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">電気料金 (円/kWh)</label>
        <input
          type="number"
          value={electricityRate}
          onChange={(e) => onUsageUpdate(usageHours, Number(e.target.value))}
          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
          min="10" max="50"
        />
      </div>
    </div>

    {/* 結果表示 */}
    <div className="border border-gray-200 rounded-lg p-4">
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
  </div>
);

// 推奨電源セクション
const RecommendedPSUSection: React.FC<{
  psus: PSUSpecification[];
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
  recommendations: Array<{
    name: string;
    range: number[];
    efficiency: string;
    description: string;
  }>;
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

// 電力詳細表
const PowerBreakdownTable: React.FC<{
  breakdown: PowerConsumption[];
}> = ({ breakdown }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-4 py-2">
      <h4 className="text-sm font-medium text-gray-900">コンポーネント別消費電力</h4>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              コンポーネント
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
              アイドル時
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
              通常時
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
              最大
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {breakdown.map((consumption, index) => (
            <tr key={index}>
              <td className="px-4 py-2 text-sm text-gray-900">{consumption.component}</td>
              <td className="px-4 py-2 text-sm text-gray-500 text-right">{Math.round(consumption.idlePower)}W</td>
              <td className="px-4 py-2 text-sm text-gray-500 text-right">{Math.round(consumption.basePower)}W</td>
              <td className="px-4 py-2 text-sm text-gray-500 text-right">{Math.round(consumption.maxPower)}W</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default PowerCalculator;
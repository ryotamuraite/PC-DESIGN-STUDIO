// src/components/summary/ConfigSummary.tsx
// 互換性チェック機能統合版ConfigSummary

import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Zap,
  Info,
  Minus
} from 'lucide-react';
import type { PCConfiguration, PartCategory, Part } from '@/types';
import { useCompatibilityCheck } from '@/hooks/compatibility/useCompatibilityCheck';

interface ConfigSummaryProps {
  configuration: PCConfiguration;
  className?: string;
}

export const ConfigSummary: React.FC<ConfigSummaryProps> = ({ 
  configuration, 
  className = '' 
}) => {
  // PCConfiguration から Partial<Record<PartCategory, Part>> に変換（null除去）
  const currentParts: Partial<Record<PartCategory, Part>> = {};
  Object.entries(configuration.parts || {}).forEach(([category, part]) => {
    if (part !== null && part !== undefined) {
      currentParts[category as PartCategory] = part;
    }
  });

  // 互換性チェック結果を取得
  const { 
    compatibilityResult, 
    isFullyCompatible,
    hasCriticalIssues,
    hasWarnings,
    compatibilityScore,
    getStatusForCheck 
  } = useCompatibilityCheck(currentParts);

  // 電源計算関連（既存のロジック）
  const totalPowerConsumption = calculateTotalPower(configuration);
  const psu = configuration.parts.psu;
  const psuWattage = (psu?.specifications?.wattage as number) || 0;
  const recommendedWattage = totalPowerConsumption * 1.2; // 20%マージン
  const isPowerAdequate = psuWattage >= recommendedWattage;
  const powerUsagePercentage = psuWattage > 0 ? (totalPowerConsumption / psuWattage) * 100 : 0;
  const powerMargin = psuWattage - totalPowerConsumption;

  // 各互換性チェック項目の状態を取得
  const cpuSocketStatus = getStatusForCheck('cpuSocket');
  const memoryTypeStatus = getStatusForCheck('memoryType');
  const powerAdequacyStatus = getStatusForCheck('powerAdequacy');

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">構成サマリー</h2>
      
      <div className="space-y-6">
        {/* 価格情報 */}
        <div className="bg-blue-50 rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-sm">価格情報</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>合計価格:</span>
              <span className="font-semibold">¥{(configuration.totalPrice || 0).toLocaleString()}</span>
            </div>
            
            {configuration.budget && (
              <div className="flex justify-between">
                <span>予算:</span>
                <span className={
                  (configuration.totalPrice || 0) > configuration.budget ? 
                    'text-red-600 font-semibold' : 'text-green-600'
                }>
                  ¥{configuration.budget.toLocaleString()}
                  {(configuration.totalPrice || 0) > configuration.budget && (
                    <span className="ml-2 text-red-600">
                      (¥{((configuration.totalPrice || 0) - configuration.budget).toLocaleString()} オーバー)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 電力計算情報 */}
        <div className="bg-yellow-50 rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-sm">電力情報</span>
          </div>
          
          {psu ? (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>消費電力:</span>
                  <span>{totalPowerConsumption}W</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>電源容量:</span>
                  <span>{psuWattage}W</span>
                </div>
              </div>

              {/* 電力使用率バー */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    powerUsagePercentage > 85 ? 'bg-red-500' : 
                    powerUsagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(powerUsagePercentage, 100)}%` }}
                />
              </div>

              {/* 電源容量判定 */}
              <div className={`flex items-center gap-2 text-sm ${
                isPowerAdequate ? 'text-green-600' : 'text-orange-600'
              }`}>
                {isPowerAdequate ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>
                  {isPowerAdequate 
                    ? `電源容量は十分です（余裕: ${powerMargin}W）` 
                    : `電源容量が不足している可能性があります（推奨: ${Math.ceil(recommendedWattage)}W以上）`
                  }
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">電源ユニットを選択してください</p>
          )}
        </div>

        {/* 互換性チェック（新機能統合版） */}
        <div className="bg-gray-50 rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            {isFullyCompatible ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : hasCriticalIssues ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : hasWarnings ? (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            ) : (
              <Info className="w-4 h-4 text-gray-400" />
            )}
            <span className="font-medium text-sm">互換性チェック</span>
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              compatibilityScore >= 90 ? 'bg-green-100 text-green-700' :
              compatibilityScore >= 70 ? 'bg-yellow-100 text-yellow-700' :
              compatibilityScore >= 50 ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              {compatibilityScore}点
            </span>
          </div>
          
          <div className="space-y-2">
            {/* 全体ステータス */}
            <div className={`text-sm font-medium ${
              isFullyCompatible ? 'text-green-600' : 
              hasCriticalIssues ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {isFullyCompatible ? 
                '✅ 互換性に問題はありません' : 
                hasCriticalIssues ? '❌ 重要な互換性問題があります' :
                '⚠️ 互換性に注意が必要です'
              }
            </div>

            {/* 詳細チェック項目 */}
            <div className="space-y-1 text-sm">
              <CompatibilityStatusItem
                label="CPUソケット"
                status={cpuSocketStatus}
              />
              <CompatibilityStatusItem
                label="メモリ規格"
                status={memoryTypeStatus}
              />
              <CompatibilityStatusItem
                label="電源容量"
                status={powerAdequacyStatus}
              />
            </div>

            {/* 重要な問題がある場合の詳細表示 */}
            {hasCriticalIssues && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <div className="font-medium text-red-800 mb-2 text-sm">
                  解決が必要な問題:
                </div>
                <div className="space-y-1">
                  {compatibilityResult.issues
                    .filter(issue => issue.severity === 'critical')
                    .slice(0, 3)
                    .map((issue, index) => (
                      <div key={index} className="text-red-700 text-sm">
                        • {issue.message}
                        {issue.solution && (
                          <div className="text-red-600 text-xs mt-1 ml-2">
                            💡 {issue.solution}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* 警告がある場合の表示 */}
            {hasWarnings && !hasCriticalIssues && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-medium text-yellow-800 mb-2 text-sm">
                  推奨改善事項:
                </div>
                <div className="space-y-1">
                  {compatibilityResult.issues
                    .filter(issue => issue.severity === 'warning')
                    .slice(0, 2)
                    .map((issue, index) => (
                      <div key={index} className="text-yellow-700 text-sm">
                        • {issue.message}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 互換性ステータス表示コンポーネント
const CompatibilityStatusItem: React.FC<{
  label: string;
  status: {
    status: 'compatible' | 'incompatible' | 'warning' | 'unknown';
    message: string;
    icon: '✅' | '❌' | '⚠️' | '❓';
  };
}> = ({ label, status }) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'compatible':
        return 'text-green-600';
      case 'incompatible':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
    }
  };

  const getIcon = () => {
    switch (status.status) {
      case 'compatible':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'incompatible':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-700">{label}:</span>
      <div className="flex items-center gap-1">
        {getIcon()}
        <span className={`text-xs ${getStatusColor()}`}>
          {status.status === 'unknown' ? '未選択' : status.message}
        </span>
      </div>
    </div>
  );
};

// 電力計算関数（既存のロジックを改良）
function calculateTotalPower(configuration: PCConfiguration): number {
  let totalPower = 0;
  
  Object.values(configuration.parts).forEach(part => {
    if (part) {
      // powerConsumption プロパティを優先、なければデフォルト値
      const power = part.powerConsumption || getDefaultPowerConsumption(part.category);
      totalPower += power;
    }
  });
  
  // システムベース消費電力を追加
  totalPower += 50; // マザーボード、ファン等

  return totalPower;
}

// パーツカテゴリ別のデフォルト消費電力
function getDefaultPowerConsumption(category: string): number {
  const defaults: Record<string, number> = {
    cpu: 100,
    gpu: 200,
    motherboard: 50,
    memory: 10,
    storage: 15,
    psu: 0, // 電源自体は消費電力に含めない
    case: 20, // ケースファン等
    cooling: 15,
  };
  
  return defaults[category] || 20;
}

export default ConfigSummary;
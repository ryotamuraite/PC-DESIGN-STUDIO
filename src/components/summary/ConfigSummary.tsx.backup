// src/components/summary/ConfigSummary.tsx
import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Zap,
  Info,
  Minus
} from 'lucide-react';
import { PCConfiguration } from '@/types';
import { useCompatibilityCheck } from '@/hooks/useCompatibilityCheck';

interface ConfigSummaryProps {
  configuration: PCConfiguration;
  className?: string;
}

export const ConfigSummary: React.FC<ConfigSummaryProps> = ({ 
  configuration, 
  className = '' 
}) => {
  // 互換性チェック結果を取得
  const { compatibilityResult, isChecking } = useCompatibilityCheck(configuration);

  // 電源計算関連（既存のロジック）
  const totalPowerConsumption = calculateTotalPower(configuration);
  const psu = configuration.parts.psu;
  const psuWattage = (psu?.specifications?.wattage as number) || 0;
  const recommendedWattage = totalPowerConsumption * 1.2; // 20%マージン
  const isPowerAdequate = psuWattage >= recommendedWattage;
  const powerUsagePercentage = psuWattage > 0 ? (totalPowerConsumption / psuWattage) * 100 : 0;
  const powerMargin = psuWattage - totalPowerConsumption;

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

        {/* 互換性チェック */}
        <div className="bg-gray-50 rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            {isChecking ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : compatibilityResult?.isCompatible ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : compatibilityResult && !compatibilityResult.isCompatible ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <Info className="w-4 h-4 text-gray-400" />
            )}
            <span className="font-medium text-sm">互換性チェック</span>
            {compatibilityResult && (
              <span className={`text-xs px-2 py-1 rounded ${
                compatibilityResult.score >= 90 ? 'bg-green-100 text-green-700' :
                compatibilityResult.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {compatibilityResult.score}点
              </span>
            )}
          </div>
          
          {isChecking ? (
            <p className="text-sm text-gray-600">互換性をチェック中...</p>
          ) : compatibilityResult ? (
            <div className="space-y-2">
              {/* 互換性ステータス */}
              <div className={`text-sm font-medium ${
                compatibilityResult.isCompatible ? 'text-green-600' : 'text-red-600'
              }`}>
                {compatibilityResult.isCompatible ? 
                  '✓ 互換性に問題はありません' : 
                  '⚠ 互換性に問題があります'
                }
              </div>

              {/* 詳細情報 */}
              <div className="space-y-1 text-sm text-gray-600">
                <CompatibilityItem
                  label="CPUソケット"
                  status={compatibilityResult.details.cpuSocket.compatible}
                  message={compatibilityResult.details.cpuSocket.message}
                  configuration={configuration}
                />
                <CompatibilityItem
                  label="メモリ規格"
                  status={compatibilityResult.details.memoryType.compatible}
                  message={compatibilityResult.details.memoryType.message}
                  configuration={configuration}
                />
                <CompatibilityItem
                  label="電源コネクタ"
                  status={compatibilityResult.details.powerConnectors.compatible}
                  message={compatibilityResult.details.powerConnectors.message}
                  configuration={configuration}
                />
                <CompatibilityItem
                  label="ケースサイズ"
                  status={compatibilityResult.details.physicalFit.compatible}
                  message={compatibilityResult.details.physicalFit.message}
                  configuration={configuration}
                />
                <CompatibilityItem
                  label="性能バランス"
                  status={compatibilityResult.details.performanceMatch.balanced}
                  message={compatibilityResult.details.performanceMatch.message}
                  configuration={configuration}
                />
              </div>

              {/* 重要な問題がある場合の警告 */}
              {!compatibilityResult.isCompatible && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <div className="font-medium text-red-800 mb-1">
                    {compatibilityResult.issues.filter(i => i.severity === 'critical').length}件の重要な問題
                  </div>
                  {compatibilityResult.issues
                    .filter(issue => issue.severity === 'critical')
                    .slice(0, 2)
                    .map((issue, index) => (
                      <div key={index} className="text-red-700">
                        • {issue.message}
                      </div>
                    ))
                  }
                  {compatibilityResult.issues.filter(i => i.severity === 'critical').length > 2 && (
                    <div className="text-red-600 mt-1 text-xs">
                      他 {compatibilityResult.issues.filter(i => i.severity === 'critical').length - 2}件...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>CPUソケット:</span>
                <span className="text-gray-400">パーツ選択中...</span>
              </div>
              <div className="flex justify-between">
                <span>メモリ規格:</span>
                <span className="text-gray-400">パーツ選択中...</span>
              </div>
              <div className="flex justify-between">
                <span>ケースサイズ:</span>
                <span className="text-gray-400">パーツ選択中...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 互換性項目表示コンポーネント
const CompatibilityItem: React.FC<{
  label: string;
  status: boolean;
  message: string;
  configuration: PCConfiguration;
}> = ({ label, status, message, configuration }) => {
  // 未選択状態のチェック
  const isPending = message.includes('待っています');
  
  // 実際に不足しているパーツの取得
  const getMissingParts = (label: string, config: PCConfiguration): string => {
    const missingParts: string[] = [];
    
    switch (label) {
      case 'CPUソケット':
        if (!config.parts.cpu) missingParts.push('CPU');
        if (!config.parts.motherboard) missingParts.push('マザーボード');
        break;
      case 'メモリ規格':
        if (!config.parts.memory) missingParts.push('メモリ');
        if (!config.parts.motherboard) missingParts.push('マザーボード');
        break;
      case '電源コネクタ':
        if (!config.parts.psu) missingParts.push('電源ユニット');
        break;
      case 'ケースサイズ':
        if (!config.parts.case) missingParts.push('PCケース');
        break;
      case '性能バランス':
        if (!config.parts.cpu) missingParts.push('CPU');
        if (!config.parts.gpu) missingParts.push('GPU');
        break;
    }
    
    if (missingParts.length === 0) return '';
    if (missingParts.length === 1) return `${missingParts[0]}が必要`;
    return `${missingParts.join('、')}が必要`;
  };
  
  return (
    <div className="flex justify-between items-center">
      <span>{label}:</span>
      <div className="flex items-center gap-1">
        {isPending ? (
          <>
            <Minus className="w-3 h-3 text-gray-400" />
            <div className="text-right">
              <div className="text-xs text-gray-500">未選択</div>
              {getMissingParts(label, configuration) && (
                <div className="text-xs text-gray-400 mt-0.5">
                  ({getMissingParts(label, configuration)})
                </div>
              )}
            </div>
          </>
        ) : status ? (
          <>
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-600">互換</span>
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 text-red-500" />
            <span className="text-xs text-red-600">非互換</span>
          </>
        )}
      </div>
    </div>
  );
};

// 簡易電力計算関数（既存のロジック）
function calculateTotalPower(configuration: PCConfiguration): number {
  let totalPower = 0;
  
  Object.values(configuration.parts).forEach(part => {
    if (part) {
      // 各パーツの消費電力を取得（specifications.powerまたはtdp）
      const power = (part.specifications?.power as number) || 
                   (part.specifications?.tdp as number) || 
                   getDefaultPowerConsumption(part.category);
      totalPower += power;
    }
  });
  
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
    case: 20, // ファン等
    cooler: 15,
    monitor: 0 // 外部デバイス
  };
  
  return defaults[category] || 20;
}

export default ConfigSummary;
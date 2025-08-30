// src/components/summary/ConfigSummary.tsx
// 📱 レスポンシブ対応・グラデーションデザイン適用版 + 互換性チェック統合

import React from 'react';
import { Zap, ShoppingBag, AlertTriangle, CheckCircle, Cpu, HardDrive, Monitor, XCircle, Minus } from 'lucide-react';
import type { PCConfiguration } from '@/types';
import { useCompatibilityCheck } from '@/hooks/useCompatibilityCheck';

interface ConfigSummaryProps {
  configuration: PCConfiguration;
  className?: string;
}

export const ConfigSummary: React.FC<ConfigSummaryProps> = ({ 
  configuration, 
  className = '' 
}) => {
  // 選択済みパーツ数をカウント
  const selectedPartsCount = Object.values(configuration.parts).filter(part => part !== null).length;
  const totalPartsCount = 9; // 全パーツカテゴリ数

  // 互換性チェックフック
  const {
    result: compatibilityResult,
    isLoading: isCompatibilityLoading,
    checkSpecificCompatibility
  } = useCompatibilityCheck(configuration, { autoCheck: true, debounceMs: 500 });

  // 電力計算（簡易版）
  const calculateTotalPower = () => {
    let totalPower = 0;
    const parts = configuration.parts;
    
    // 各パーツの推定電力消費
    if (parts.cpu) totalPower += 100;      // CPU
    if (parts.gpu) totalPower += 200;      // GPU 
    if (parts.motherboard) totalPower += 30;
    if (parts.memory) totalPower += 10;
    if (parts.storage) totalPower += 15;
    if (parts.cooler) totalPower += 20;
    if (parts.case) totalPower += 20;      // ケースファン等
    
    return totalPower;
  };

  const totalPowerConsumption = calculateTotalPower();
  const psu = configuration.parts.psu;
  const psuWattage = psu ? 650 : 0; // PSUが選択されていない場合は0W、選択されている場合は推定650W
  const powerUsagePercentage = psuWattage > 0 ? (totalPowerConsumption / psuWattage) * 100 : 0;

  // カテゴリ表示名マッピング
  const categoryNames: Record<string, string> = {
    cpu: 'CPU',
    gpu: 'GPU',
    motherboard: 'マザーボード',
    memory: 'メモリ',
    storage: 'ストレージ',
    psu: '電源',
    case: 'ケース',
    cooler: 'クーラー',
    monitor: 'モニター'
  };

  // カテゴリアイコンマッピング
  const categoryIcons: Record<string, React.ReactNode> = {
    cpu: <Cpu className="w-3 h-3" />,
    gpu: <Monitor className="w-3 h-3" />,
    motherboard: <HardDrive className="w-3 h-3" />,
    memory: <HardDrive className="w-3 h-3" />,
    storage: <HardDrive className="w-3 h-3" />,
    psu: <Zap className="w-3 h-3" />,
    case: <HardDrive className="w-3 h-3" />,
    cooler: <HardDrive className="w-3 h-3" />,
    monitor: <Monitor className="w-3 h-3" />
  };

  return (
    <div className={`${className}`}>
      {/* 🔥 強制キャッシュクリアマーカー - v2.0 */}
      <div className="px-3 space-y-4">
        {/* タイトルヘッダー */}
        <div className="pb-2">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            🔧 構成サマリー
            <div className="text-xs text-brand-accent-200 ml-auto">
              {selectedPartsCount}/{totalPartsCount}
            </div>
          </h2>
        </div>

        {/* カスタムHR */}
        <div className="custom-hr"></div>

        {/* 互換性チェック - summary-section適用 */}
        <div className="summary-section mx-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className={`w-4 h-4 ${
              compatibilityResult?.isCompatible ? 'text-green-300' : 
              compatibilityResult ? 'text-red-300' : 'text-gray-400'
            }`} />
            <span className="font-semibold text-white">🔄 互換性チェック</span>
            {isCompatibilityLoading && (
              <div className="text-xs text-brand-accent-200">チェック中...</div>
            )}
          </div>
          
          <div className="custom-hr"></div>
          
          <div className="space-y-2 mt-3">
            {compatibilityResult ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-accent-200">互換性スコア:</span>
                  <span className={`font-semibold ${
                    compatibilityResult.score >= 90 ? 'text-green-300' :
                    compatibilityResult.score >= 70 ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                    {compatibilityResult.score}/100
                  </span>
                </div>
                
                {/* メインステータス */}
                <div className={`text-sm flex items-center gap-2 mt-2 ${
                  compatibilityResult.isCompatible ? 'text-green-300' : 'text-red-300'
                }`}>
                  {compatibilityResult.isCompatible ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>互換性に問題なし</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>{compatibilityResult.issues.filter(i => i.severity === 'critical').length}件の問題あり</span>
                    </>
                  )}
                </div>
                
                {/* 簡易互換性チェック結果 */}
                <div className="space-y-1 mt-3">
                  <CompatibilityItem
                    label="CPUソケット"
                    status={checkSpecificCompatibility('socket')}
                    message={compatibilityResult.details?.cpuSocket?.message || ''}
                    configuration={configuration}
                  />
                  <CompatibilityItem
                    label="メモリ規格"
                    status={checkSpecificCompatibility('memory')}
                    message={compatibilityResult.details?.memoryType?.message || ''}
                    configuration={configuration}
                  />
                  <CompatibilityItem
                    label="電源コネクタ"
                    status={checkSpecificCompatibility('power')}
                    message={compatibilityResult.details?.powerConnectors?.message || ''}
                    configuration={configuration}
                  />
                  <CompatibilityItem
                    label="ケースサイズ"
                    status={checkSpecificCompatibility('physical')}
                    message={compatibilityResult.details?.physicalFit?.message || ''}
                    configuration={configuration}
                  />
                  <CompatibilityItem
                    label="性能バランス"
                    status={checkSpecificCompatibility('performance')}
                    message={compatibilityResult.details?.performanceMatch?.message || ''}
                    configuration={configuration}
                  />
                  <CompatibilityItem
                    label="冷却互換"
                    status={checkSpecificCompatibility('cooling')}
                    message={compatibilityResult.details?.cooling?.message || ''}
                    configuration={configuration}
                  />
                </div>
              </>
            ) : (
              <div className="text-sm text-cyan-300">
                パーツを選択して互換性チェックを開始
              </div>
            )}
          </div>
        </div>

        {/* カスタムHR */}
        <div className="custom-hr"></div>

        {/* 価格情報 - summary-section適用 */}
        <div className="summary-section mx-3">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="font-semibold text-white">💰 価格情報</span>
          </div>
          
          <div className="custom-hr"></div>
          
          <div className="space-y-2 mt-3">
            <div className="flex justify-between">
            <span className="text-sm text-brand-accent-200">合計価格:</span>
              <span className="font-semibold text-lg text-white">¥{configuration.totalPrice.toLocaleString()}</span>
            </div>
            
            {configuration.budget && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-brand-accent-200">予算:</span>
                  <span className="text-sm text-brand-accent-100">¥{configuration.budget.toLocaleString()}</span>
                </div>
                
                {configuration.totalPrice > configuration.budget && (
                  <div className="flex items-center gap-1 text-red-300 text-sm mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>¥{(configuration.totalPrice - configuration.budget).toLocaleString()} オーバー</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* カスタムHR */}
        <div className="custom-hr"></div>

        {/* 構成進捗 - summary-section適用 */}
        <div className="summary-section mx-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className={`w-4 h-4 ${selectedPartsCount === totalPartsCount ? 'text-green-300' : 'text-blue-300'}`} />
            <span className="font-semibold text-white">⚙️ 構成進捗</span>
          </div>
          
          <div className="custom-hr"></div>
          
          <div className="space-y-3 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-brand-accent-200">選択済みパーツ</span>
              <span className="font-medium text-white">{selectedPartsCount}/{totalPartsCount}</span>
            </div>
            
            {/* 改良プログレスバー */}
            <div className="progress-bar-improved">
              <div
                className={`progress-bar-fill ${
                  selectedPartsCount === totalPartsCount ? 'success' : 
                  selectedPartsCount >= 5 ? 'warning' : 'success'
                }`}
                style={{ width: `${(selectedPartsCount / totalPartsCount) * 100}%` }}
              />
            </div>

            {/* 選択済みパーツ一覧 - アイコン付き */}
            <div className="space-y-1 mt-3">
              {Object.entries(configuration.parts).slice(0, 6).map(([category, part]) => (
                <div key={category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`${part ? 'text-green-300' : 'text-gray-400'}`}>
                      {categoryIcons[category]}
                    </div>
                    <span className="text-brand-accent-200">
                      {categoryNames[category]}:
                    </span>
                  </div>
                  <span className={part ? 'text-green-300' : 'text-gray-400'}>
                    {part ? '✓' : '未選択'}
                  </span>
                </div>
              ))}
              {Object.keys(configuration.parts).length > 6 && (
                <div className="text-xs text-brand-accent-300 text-center mt-2">
                  +{Object.keys(configuration.parts).length - 6}項目...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* カスタムHR */}
        <div className="custom-hr"></div>

        {/* 電力情報 - summary-section適用 */}
        <div className="summary-section mx-3">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="font-semibold text-white">⚡ 電力詳細</span>
          </div>
          
          <div className="custom-hr"></div>
          
          <div className="space-y-3 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-cyan-200">推定消費電力:</span>
              <span className="font-medium text-white">{totalPowerConsumption}W</span>
            </div>
            
            {psu ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-200">電源容量:</span>
                  <span className="text-cyan-100">{psuWattage}W</span>
                </div>
                
                {/* 改良電力使用率バー */}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-cyan-200">使用率</span>
                    <span className="text-white">{Math.round(powerUsagePercentage)}%</span>
                  </div>
                  <div className="progress-bar-improved">
                    <div
                      className={`progress-bar-fill ${
                        powerUsagePercentage > 85 ? 'danger' : 
                        powerUsagePercentage > 60 ? 'warning' : 'success'
                      }`}
                      style={{ width: `${Math.min(powerUsagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className={`text-xs flex items-center gap-2 mt-2 ${
                  powerUsagePercentage > 85 ? 'text-red-300' : 
                  powerUsagePercentage > 60 ? 'text-yellow-300' : 'text-green-300'
                }`}>
                  {powerUsagePercentage > 85 ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span>電源容量に注意</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>電源容量は十分です</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-cyan-300">電源ユニットを選択してください</p>
            )}
          </div>
        </div>

        {/* カスタムHR */}
        <div className="custom-hr"></div>

        {/* 更新通知 - summary-section適用 */}
        <div className="summary-section mx-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-semibold text-white">📢 更新通知</span>
          </div>
          
          <div className="custom-hr"></div>
          
          <div className="text-xs text-cyan-100 mt-3 space-y-1">
            <div>• パーツ価格を更新しました</div>
            <div>• 新規パーツを追加しました</div>
            <div className="text-xs text-cyan-300 mt-2">
              最終更新: {new Date().toLocaleTimeString()}
            </div>
          </div>
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
  const isPending = message.includes('待っています') || message === '';
  
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
      case '冷却互換':
        if (!config.parts.cooler) missingParts.push('CPUクーラー');
        if (!config.parts.cpu) missingParts.push('CPU');
        if (!config.parts.case) missingParts.push('PCケース');
        break;
    }
    
    if (missingParts.length === 0) return '';
    if (missingParts.length === 1) return `${missingParts[0]}が必要`;
    return `${missingParts.join('、')}が必要`;
  };
  
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-cyan-200">{label}:</span>
      <div className="flex items-center gap-1">
        {isPending ? (
          <>
            <Minus className="w-3 h-3 text-gray-400" />
            <div className="text-right">
              <div className="text-gray-400">未選択</div>
              {getMissingParts(label, configuration) && (
                <div className="text-cyan-300 mt-0.5 text-xs">
                  ({getMissingParts(label, configuration)})
                </div>
              )}
            </div>
          </>
        ) : status ? (
          <>
            <CheckCircle className="w-3 h-3 text-green-300" />
            <div className="text-green-300">OK</div>
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 text-red-300" />
            <div className="text-red-300">問題</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfigSummary;
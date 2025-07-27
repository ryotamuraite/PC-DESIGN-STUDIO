// src/components/summary/ConfigSummary.tsx
import React from 'react';
import { Cpu, Zap, Save, CheckCircle, AlertTriangle, Monitor } from 'lucide-react';
import { useConfigStore } from '@/hooks/useConfigStore';
import { categoryNames } from '@/data/sampleParts';

const ConfigSummary: React.FC = () => {
  const { currentConfig, saveConfig } = useConfigStore();
  
  const handleSaveConfig = () => {
    const name = prompt('構成に名前を付けてください:', '新しい構成');
    if (name) {
      saveConfig(name);
      alert('構成を保存しました！');
    }
  };

  const selectedPartsCount = Object.keys(currentConfig.parts).length;
  const totalCategories = 5; // 主要カテゴリ数

  // 電源容量チェック
  const psuWattage = currentConfig.parts.psu?.specs?.wattage || 0;
  const totalPowerConsumption = currentConfig.totalPowerConsumption;
  const powerMargin = psuWattage - totalPowerConsumption;
  const recommendedWattage = totalPowerConsumption * 1.2; // 20%マージン推奨
  const isPowerAdequate = psuWattage >= recommendedWattage;
  const powerUsagePercentage = psuWattage > 0 ? (totalPowerConsumption / psuWattage) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">構成サマリー</h2>
        <button
          onClick={handleSaveConfig}
          disabled={selectedPartsCount === 0}
          className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>保存</span>
        </button>
      </div>

      {/* 進捗状況 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>構成進捗</span>
          <span>{selectedPartsCount}/{totalCategories}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(selectedPartsCount / totalCategories) * 100}%` }}
          />
        </div>
      </div>

      {/* 選択済みパーツ一覧 */}
      <div className="space-y-3 mb-6">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          選択済みパーツ
        </h3>
        
        {Object.entries(currentConfig.parts).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(currentConfig.parts).map(([category, part]) => (
              <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {categoryNames[category]}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {part.name}
                  </p>
                </div>
                {/* 消費電力表示（価格は削除） */}
                {part.powerConsumption && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {part.powerConsumption}W
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            パーツが選択されていません
          </p>
        )}
      </div>

      {/* 技術仕様サマリー */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          技術仕様
        </h3>

        {/* 消費電力サマリー */}
        <div className="bg-gray-50 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-sm">消費電力</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {totalPowerConsumption}W
            </span>
          </div>

          {/* 電源容量チェック */}
          {currentConfig.parts.psu && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>電源容量: {psuWattage}W</span>
                <span>使用率: {powerUsagePercentage.toFixed(1)}%</span>
              </div>
              
              {/* プログレスバー */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    powerUsagePercentage > 80 ? 'bg-red-500' : 
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
          )}
        </div>

        {/* 互換性チェック（今後拡張予定） */}
        <div className="bg-gray-50 rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium text-sm">互換性チェック</span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {/* TODO: Phase 2で実装予定の互換性チェック */}
            <div className="flex justify-between">
              <span>CPUソケット:</span>
              <span className="text-gray-400">チェック中...</span>
            </div>
            <div className="flex justify-between">
              <span>メモリ規格:</span>
              <span className="text-gray-400">チェック中...</span>
            </div>
            <div className="flex justify-between">
              <span>ケースサイズ:</span>
              <span className="text-gray-400">チェック中...</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 詳細な互換性チェック機能はPhase 2で実装予定です
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigSummary;
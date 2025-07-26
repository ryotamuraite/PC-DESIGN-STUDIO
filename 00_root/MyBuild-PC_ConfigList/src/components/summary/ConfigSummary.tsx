// src/components/summary/ConfigSummary.tsx
import React from 'react';
import { Cpu, Zap, Save } from 'lucide-react';
import { useConfigStore } from '@/hooks/useConfigStore';
import { categoryNames } from '@/data/sampleParts';

const ConfigSummary: React.FC = () => {
  const { currentConfig, saveConfig } = useConfigStore();
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('ja-JP');
  };

  const handleSaveConfig = () => {
    const name = prompt('構成に名前を付けてください:', '新しい構成');
    if (name) {
      saveConfig(name);
      alert('構成を保存しました！');
    }
  };

  const selectedPartsCount = Object.keys(currentConfig.parts).length;
  const totalCategories = 5; // 主要カテゴリ数

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
        <h3 className="font-medium text-gray-900">選択済みパーツ</h3>
        
        {Object.entries(currentConfig.parts).length > 0 ? (
          Object.entries(currentConfig.parts).map(([category, part]) => (
            <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">
                  {categoryNames[category]}
                </p>
                <p className="text-sm text-gray-600">
                  {part.name}
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                ¥{formatPrice(part.price)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            パーツが選択されていません
          </p>
        )}
      </div>

      {/* 合計金額・電力 */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span className="font-medium">合計金額</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            ¥{formatPrice(currentConfig.totalPrice)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">合計消費電力</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            {currentConfig.totalPowerConsumption}W
          </span>
        </div>

        {/* 電源容量チェック */}
        {currentConfig.parts.psu && (
          <div className="mt-2 p-2 rounded bg-gray-100">
            {(() => {
              const psuWattage = currentConfig.parts.psu?.specs?.wattage || 0;
              const powerMargin = psuWattage - currentConfig.totalPowerConsumption;
              const isAdequate = powerMargin >= currentConfig.totalPowerConsumption * 0.2; // 20%マージン推奨
              
              return (
                <p className={`text-sm ${isAdequate ? 'text-green-600' : 'text-orange-600'}`}>
                  電源容量: {psuWattage}W 
                  ({isAdequate ? '適切' : '余裕が少ない'} - 余裕:{powerMargin}W)
                </p>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigSummary;
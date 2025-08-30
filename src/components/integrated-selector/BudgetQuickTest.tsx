// src/components/integrated-selector/BudgetQuickTest.tsx
// 予算設定＋クイックテスト統合コンポーネント

import React from 'react';

interface BudgetQuickTestProps {
  budget: number;
  totalPrice: number;
  onBudgetChange: (budget: number) => void;
  onQuickTest: (type: 'intel' | 'amd' | 'clear') => void;
  className?: string;
}

export const BudgetQuickTest: React.FC<BudgetQuickTestProps> = ({
  budget,
  totalPrice,
  onBudgetChange,
  onQuickTest,
  className = ''
}) => {
  const remaining = budget - totalPrice;
  const isOver = remaining < 0;
  
  // 数値入力のバリデーション
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      onBudgetChange(value);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 space-y-3">
        {/* 上部：予算設定エリア */}
        <div className="space-y-2">
          {/* タイトル */}
          <div className="text-xs text-gray-600 mb-1">
            設定した予算によって実際に選択したパーツ等の価格合計からオーバーしてるか判断できます。
          </div>
          
          {/* 予算入力 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span>💰</span>
              <span>予算上限:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budget || ''}
                onChange={handleBudgetChange}
                className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="150000"
                min="0"
                step="10000"
              />
              <span className="text-sm text-gray-600">円</span>
            </div>
          </div>
          
          {/* 現在合計 */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 flex items-center gap-1">
              <span>📊</span>
              <span>現在合計:</span>
            </label>
            <div className={`text-sm font-semibold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
              ¥{totalPrice.toLocaleString()}
              {budget > 0 && (
                <span className="ml-2 text-xs font-normal">
                  {isOver 
                    ? `(${Math.abs(remaining).toLocaleString()}円オーバー)`
                    : `(残り ${remaining.toLocaleString()}円)`
                  }
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 区切り線 */}
        <div className="border-t border-gray-200"></div>
        
        {/* 下部：クイックテストエリア */}
        <div className="space-y-2">
          <div className="text-xs text-gray-600">
            クイックテスト: パーツを仮設定して機能を手軽に体験可能です。
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <span>⚡</span>
              <span>クイックテスト:</span>
            </span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <button
                onClick={() => onQuickTest('intel')}
                className="px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-md transition-colors"
              >
                Intel構成
              </button>
              <button
                onClick={() => onQuickTest('amd')}
                className="px-2 sm:px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded-md transition-colors"
              >
                AMD構成
              </button>
              <button
                onClick={() => onQuickTest('clear')}
                className="px-2 sm:px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs sm:text-sm rounded-md transition-colors"
              >
                構成クリア
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetQuickTest;
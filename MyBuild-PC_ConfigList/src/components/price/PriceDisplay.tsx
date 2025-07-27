// src/components/price/PriceDisplay.tsx
import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useConfigStore } from '@/hooks/useConfigStore';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { categoryNames } from '@/data/sampleParts';

interface PriceDisplayProps {
  className?: string;
  showBudgetComparison?: boolean;
  showBreakdown?: boolean;
  compact?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  className = '',
  showBudgetComparison = true,
  showBreakdown = false,
  compact = false
}) => {
  const { currentConfig } = useConfigStore();
  const { budget } = useBudgetStore();

  const formatPrice = (price: number) => {
    return price.toLocaleString('ja-JP');
  };

  // 予算比較計算
  const totalPrice = currentConfig.totalPrice;
  const budgetUsagePercentage = budget > 0 ? (totalPrice / budget) * 100 : 0;
  const remainingBudget = budget - totalPrice;
  const isOverBudget = totalPrice > budget && budget > 0;

  // パーツ別価格内訳（showBreakdown=trueの場合のみ）
  const priceBreakdown = showBreakdown 
    ? Object.entries(currentConfig.parts).map(([category, part]) => ({
        category,
        name: part.name,
        price: part.price,
        percentage: totalPrice > 0 ? (part.price / totalPrice) * 100 : 0
      }))
    : [];

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-lg">
              ¥{formatPrice(totalPrice)}
            </span>
          </div>
          {showBudgetComparison && budget > 0 && (
            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    ¥{formatPrice(Math.abs(remainingBudget))} オーバー
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    ¥{formatPrice(remainingBudget)} 残り
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">価格サマリー</h3>
        </div>

        {/* 合計金額表示 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              ¥{formatPrice(totalPrice)}
            </span>
            <span className="text-gray-500">（税込）</span>
          </div>
          
          {showBudgetComparison && budget > 0 && (
            <div className="space-y-3">
              {/* 予算比較 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">予算: ¥{formatPrice(budget)}</span>
                <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {isOverBudget ? '+' : ''}¥{formatPrice(Math.abs(remainingBudget))}
                </span>
              </div>

              {/* プログレスバー */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-red-500' : budgetUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
                  />
                </div>
                <span className="absolute right-0 top-3 text-xs text-gray-500">
                  {budgetUsagePercentage.toFixed(1)}%
                </span>
              </div>

              {/* 予算オーバー警告 */}
              {isOverBudget && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">
                    予算を¥{formatPrice(Math.abs(remainingBudget))}オーバーしています
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* パーツ別価格内訳 */}
        {showBreakdown && priceBreakdown.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">価格内訳</h4>
            <div className="space-y-2">
              {priceBreakdown.map(({ category, name, price, percentage }) => (
                <div key={category} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {categoryNames[category]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{formatPrice(price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceDisplay;
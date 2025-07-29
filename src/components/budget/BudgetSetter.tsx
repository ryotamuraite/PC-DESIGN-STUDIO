// src/components/budget/BudgetSetter.tsx
import React, { useState } from 'react';
import { DollarSign, Target } from 'lucide-react';
import { useConfigStore } from '@/hooks/useConfigStore';

const BudgetSetter: React.FC = () => {
  const { budget, setBudget, currentConfig } = useConfigStore();
  const [inputBudget, setInputBudget] = useState(budget.toString());
  
  const handleBudgetChange = (value: string) => {
    setInputBudget(value);
    const numValue = parseInt(value.replace(/,/g, '')) || 0;
    setBudget(numValue);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ja-JP');
  };

  const budgetUsagePercent = (currentConfig.totalPrice / budget) * 100;
  const isOverBudget = currentConfig.totalPrice > budget;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <Target className="w-6 h-6 text-green-600 mr-2" />
        <h2 className="text-xl font-semibold">予算設定</h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* 予算入力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            予算
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={inputBudget}
              onChange={(e) => handleBudgetChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="200000"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ¥{formatPrice(budget)}
          </p>
        </div>

        {/* 使用状況 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            使用状況
          </label>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>使用額: ¥{formatPrice(currentConfig.totalPrice)}</span>
              <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                {budgetUsagePercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  isOverBudget
                    ? 'bg-red-500'
                    : budgetUsagePercent > 80
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              />
            </div>
            {isOverBudget && (
              <p className="text-red-600 text-sm font-medium">
                予算を¥{formatPrice(currentConfig.totalPrice - budget)}オーバーしています
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSetter;
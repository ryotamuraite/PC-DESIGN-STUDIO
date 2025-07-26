// src/components/parts/PartSelector.tsx
import React, { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useConfigStore } from '@/hooks/useConfigStore';
import { getPartsByCategory, categoryNames } from '@/data/sampleParts';
import type { PartCategory, Part } from '@/types/index';

const PartSelector: React.FC = () => {
  const { currentConfig, addPart, removePart } = useConfigStore();
  const [expandedCategory, setExpandedCategory] = useState<PartCategory | null>(null);

  const categories: PartCategory[] = ['cpu', 'gpu', 'memory', 'storage', 'psu'];

  const handlePartSelect = (category: PartCategory, part: Part) => {
    addPart(category, part);
    setExpandedCategory(null);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ja-JP');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">パーツ選択</h2>
      
      <div className="space-y-4">
        {categories.map((category) => {
          const selectedPart = currentConfig.parts[category];
          const availableParts = getPartsByCategory(category);
          const isExpanded = expandedCategory === category;

          return (
            <div key={category} className="border border-gray-200 rounded-lg">
              {/* カテゴリヘッダー */}
              <div className="p-4 bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {categoryNames[category]}
                  </h3>
                  
                  {selectedPart ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedPart.name} - ¥{formatPrice(selectedPart.price)}
                      </span>
                      <button
                        onClick={() => removePart(category)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>選択</span>
                    </button>
                  )}
                </div>
              </div>

              {/* パーツリスト */}
              {isExpanded && (
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                  {availableParts.map((part) => (
                    <div
                      key={part.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePartSelect(category, part)}
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{part.name}</h4>
                        <p className="text-sm text-gray-600">{part.brand}</p>
                        {part.powerConsumption && (
                          <p className="text-xs text-gray-500">
                            消費電力: {part.powerConsumption}W
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ¥{formatPrice(part.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {availableParts.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      このカテゴリにはパーツがありません
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PartSelector;
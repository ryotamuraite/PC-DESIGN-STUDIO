// src/components/multi-part/PartSelectionDialog.tsx
// 🚀 Phase 2.5: パーツ選択ダイアログ - IntegratedPartSelector統合版

import React, { useState, useCallback } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { IntegratedPartSelector } from '@/components/integrated-selector';
import type { 
  Part, 
  PartCategory, 
  PCConfiguration,
  ExtendedPCConfiguration,
  convertToLegacyConfiguration 
} from '@/types';

export interface PartSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPartSelect: (part: Part) => void;
  targetCategory?: PartCategory;
  currentConfiguration: ExtendedPCConfiguration;
  title?: string;
  description?: string;
}

export const PartSelectionDialog: React.FC<PartSelectionDialogProps> = ({
  isOpen,
  onClose,
  onPartSelect,
  targetCategory,
  currentConfiguration,
  title = "パーツを選択",
  description = "構成に追加するパーツを選択してください"
}) => {
  const [searchMode, setSearchMode] = useState<'category' | 'all'>('category');
  
  // ExtendedPCConfigurationを既存のIntegratedPartSelectorで使用するため
  // PCConfigurationに変換
  const legacyConfig: PCConfiguration = convertToLegacyConfiguration(currentConfiguration);

  // パーツ選択処理
  const handlePartSelection = useCallback((category: PartCategory, part: Part | null) => {
    if (part) {
      onPartSelect(part);
      onClose();
    }
  }, [onPartSelect, onClose]);

  // ダイアログが閉じられている場合は何も表示しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* バックドロップ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* ダイアログコンテナ */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
              {targetCategory && (
                <p className="text-sm text-gray-600 mt-1">
                  カテゴリ: {targetCategory} | {description}
                </p>
              )}
              {!targetCategory && (
                <p className="text-sm text-gray-600 mt-1">
                  {description}
                </p>
              )}
            </div>
            
            {/* 検索モード切り替え */}
            {!targetCategory && (
              <div className="flex items-center space-x-2 mr-4">
                <button
                  onClick={() => setSearchMode('category')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'category'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4 inline mr-1" />
                  カテゴリ別
                </button>
                <button
                  onClick={() => setSearchMode('all')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'all'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-1" />
                  全体検索
                </button>
              </div>
            )}
            
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="ダイアログを閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* メインコンテンツ - IntegratedPartSelector統合 */}
          <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
            <IntegratedPartSelector
              configuration={legacyConfig}
              onPartSelect={handlePartSelection}
              className="w-full"
            />
          </div>
          
          {/* フッター */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              💡 ヒント: パーツをクリックして選択し、構成に追加できます
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartSelectionDialog;
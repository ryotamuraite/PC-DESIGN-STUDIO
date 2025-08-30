// src/components/integrated-selector/PartCategoryRow.tsx
// パーツカテゴリ別の行UI

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Search, Edit2, AlertCircle } from 'lucide-react';
import type { Part } from '@/types';

interface PartCategoryRowProps {
  category: string;
  categoryKey: string;  // cpu, gpu, storage等のキー
  displayName: string;  // 表示名（日本語）
  required: boolean;
  multiple: boolean;
  parts: Part | Part[] | null;  // 単一または複数
  slotInfo?: {
    m2?: { used: number; max: number; };
    sata?: { used: number; max: number; };
    total?: { used: number; max: number; };
  };
  compatibilityWarning?: string;
  onSearchClick: () => void;
  onManualAddClick: () => void;
  onChangeClick: (part: Part) => void;
  onDeleteClick: (part: Part) => void;
  onAddMoreClick?: () => void;  // 複数選択時の追加
  className?: string;
}

export const PartCategoryRow: React.FC<PartCategoryRowProps> = ({
  displayName,
  required,
  multiple,
  parts,
  slotInfo,
  compatibilityWarning,
  onSearchClick,
  onManualAddClick,
  onChangeClick,
  onDeleteClick,
  onAddMoreClick,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // パーツ配列を正規化
  const partsList = Array.isArray(parts) ? parts : (parts ? [parts] : []);
  const isEmpty = partsList.length === 0;
  
  // スロット使用状況の表示文字列を生成
  const getSlotInfoText = () => {
    if (!slotInfo) return null;
    
    const infoParts = [];
    if (slotInfo.m2) {
      infoParts.push(`M.2: ${slotInfo.m2.used}/${slotInfo.m2.max}`);
    }
    if (slotInfo.sata) {
      infoParts.push(`SATA: ${slotInfo.sata.used}/${slotInfo.sata.max}`);
    }
    if (slotInfo.total && !slotInfo.m2 && !slotInfo.sata) {
      infoParts.push(`${slotInfo.total.used}/${slotInfo.total.max} 使用中`);
    }
    
    return infoParts.length > 0 ? infoParts.join(' | ') : null;
  };
  
  const slotInfoText = getSlotInfoText();
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* ヘッダー部分 */}
      <div 
        className={`px-4 py-3 ${isEmpty && required ? 'bg-yellow-50' : 'bg-gray-50'} 
                   border-b border-gray-200 cursor-pointer select-none`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 展開/折りたたみアイコン */}
            <button className="text-gray-500 hover:text-gray-700">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {/* カテゴリ名 */}
            <span className="font-medium text-gray-900">
              {displayName}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
            
            {/* 状態表示 */}
            {isEmpty && required ? (
              <span className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertCircle size={12} />
                未選択（必須）
              </span>
            ) : !isEmpty && (
              <span className="text-xs text-green-600">
                ✓ {partsList.length}件選択中
              </span>
            )}
            
            {/* スロット情報 */}
            {slotInfoText && (
              <span className="text-xs text-gray-500 ml-2">
                ({slotInfoText})
              </span>
            )}
          </div>
          
          {/* アクションボタン */}
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {isEmpty ? (
              <>
                <button
                  onClick={onSearchClick}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 transition-colors"
                >
                  <Search size={14} />
                  検索追加
                </button>
                <button
                  onClick={onManualAddClick}
                  className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={14} />
                  手動追加
                </button>
              </>
            ) : multiple && onAddMoreClick ? (
              <button
                onClick={onAddMoreClick}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                追加
              </button>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* コンテンツ部分（展開時のみ表示） */}
      {isExpanded && (
        <div className="p-4">
          {isEmpty ? (
            <div className="text-gray-400 text-sm text-center py-4">
              {required ? '必須パーツが選択されていません' : '未選択'}
            </div>
          ) : (
            <div className="space-y-3">
              {partsList.map((part, index) => (
                <div key={part.id || index} 
                     className="flex items-start justify-between py-2 px-3 hover:bg-gray-50 rounded-md">
                  <div className="flex-1">
                    {/* パーツ名 */}
                    <div className="font-medium text-gray-900">
                      {part.name}
                    </div>
                    {/* メーカー・仕様・価格 */}
                    <div className="text-sm text-gray-600 mt-1">
                      <span>{part.manufacturer}</span>
                      {part.specifications?.interface ? (
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {String(part.specifications.interface)}
                        </span>
                      ) : null}
                      <span className="ml-2 font-semibold text-gray-900">
                        ¥{part.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onChangeClick(part)}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      変更
                    </button>
                    <button
                      onClick={() => onDeleteClick(part)}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 互換性警告 */}
          {compatibilityWarning && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-sm text-red-800">{compatibilityWarning}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartCategoryRow;
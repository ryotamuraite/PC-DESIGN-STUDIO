// src/components/search/SearchBar.tsx
import React, { useState } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { PartCategory } from '@/types';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
  category?: PartCategory;
  onCategoryChange: (category: PartCategory | undefined) => void;
  isSearching?: boolean;
  placeholder?: string;
  showCategoryFilter?: boolean;
  showAdvancedFilters?: boolean;
  onToggleFilters?: () => void;
  className?: string;
}

const categoryNames: Record<PartCategory, string> = {
  cpu: 'CPU',
  motherboard: 'マザーボード', 
  memory: 'メモリ',
  storage: 'ストレージ',
  gpu: 'グラフィックボード',
  psu: '電源ユニット',
  case: 'PCケース',
  cooler: 'CPUクーラー',
  monitor: 'モニター',
  other: 'その他'
};

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch,
  category,
  onCategoryChange,
  isSearching = false,
  placeholder = "パーツ名、ブランド、型番で検索...",
  showCategoryFilter = true,
  showAdvancedFilters = true,
  onToggleFilters,
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleClear = () => {
    onSearchChange('');
    onCategoryChange(undefined);
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center">
        {/* カテゴリセレクタ */}
        {showCategoryFilter && (
          <div className="relative border-r border-gray-200">
            <select
              value={category || ''}
              onChange={(e) => onCategoryChange(e.target.value as PartCategory || undefined)}
              className="appearance-none bg-transparent pl-4 pr-8 py-3 text-sm text-gray-700 focus:outline-none focus:ring-0 min-w-[120px]"
            >
              <option value="">全カテゴリ</option>
              {Object.entries(categoryNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* 検索入力フィールド */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full pl-10 pr-10 py-3 text-sm border-0 focus:ring-0 focus:outline-none ${
                isFocused ? 'bg-gray-50' : 'bg-transparent'
              }`}
              disabled={isSearching}
            />
            
            {/* クリアボタン */}
            {(searchTerm || category) && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ローディングインジケーター */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* 高度な検索ボタン */}
        {showAdvancedFilters && onToggleFilters && (
          <button
            type="button"
            onClick={onToggleFilters}
            className="px-4 py-3 text-sm text-gray-600 hover:text-gray-800 border-l border-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        )}

        {/* 検索ボタン */}
        <button
          type="submit"
          disabled={isSearching}
          className="px-6 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
        >
          {isSearching ? '検索中...' : '検索'}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;

// src/components/search/SearchResults.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Package, ExternalLink } from 'lucide-react';
import { Part, PartCategory } from '@/types';
import { SearchResult } from '@/types/search';

interface SearchResultsProps {
  searchResult: SearchResult | null;
  onPartSelect?: (part: Part) => void;
  onPageChange: (page: number) => void;
  isSearching: boolean;
  showAddButton?: boolean;
  addButtonText?: string;
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

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResult,
  onPartSelect,
  onPageChange,
  isSearching,
  showAddButton = false,
  addButtonText = "選択",
  className = ""
}) => {
  if (isSearching) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">検索中...</span>
        </div>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>検索条件を入力してパーツを探しましょう</p>
        </div>
      </div>
    );
  }

  if (searchResult.parts.length === 0) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">検索結果が見つかりませんでした</h3>
          <p>検索条件を変更してお試しください</p>
          {searchResult.suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">検索のヒント:</p>
              <ul className="space-y-1">
                {searchResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-blue-600">
                    {suggestion.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 検索結果ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              検索結果 ({searchResult.totalCount.toLocaleString()}件)
            </h3>
            <p className="text-sm text-gray-600">
              {searchResult.currentPage} / {searchResult.totalPages} ページ
              {searchResult.executionTime && (
                <span className="ml-2">
                  ({Math.round(searchResult.executionTime)}ms)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 検索結果リスト */}
      <div className="divide-y divide-gray-200">
        {searchResult.parts.map((part) => (
          <SearchResultItem
            key={part.id}
            part={part}
            onSelect={onPartSelect}
            showAddButton={showAddButton}
            addButtonText={addButtonText}
          />
        ))}
      </div>

      {/* ページネーション */}
      {searchResult.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {((searchResult.currentPage - 1) * 20) + 1} - {Math.min(searchResult.currentPage * 20, searchResult.totalCount)} / {searchResult.totalCount} 件
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(searchResult.currentPage - 1)}
                disabled={!searchResult.hasPreviousPage}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {getPaginationPages(searchResult.currentPage, searchResult.totalPages).map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
                    disabled={page === '...'}
                    className={`px-3 py-1 text-sm rounded ${
                      page === searchResult.currentPage
                        ? 'bg-blue-600 text-white'
                        : page === '...'
                        ? 'text-gray-400 cursor-default'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => onPageChange(searchResult.currentPage + 1)}
                disabled={!searchResult.hasNextPage}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 検索結果アイテムコンポーネント
const SearchResultItem: React.FC<{
  part: Part;
  onSelect?: (part: Part) => void;
  showAddButton: boolean;
  addButtonText: string;
}> = ({ part, onSelect, showAddButton, addButtonText }) => {
  const availability = part.availability || 'in_stock';
  const availabilityConfig = {
    in_stock: { text: '在庫あり', color: 'text-green-600' },
    out_of_stock: { text: '在庫なし', color: 'text-red-600' },
    limited: { text: '残りわずか', color: 'text-yellow-600' }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {categoryNames[part.category]}
            </span>
            <span className={`text-xs font-medium ${availabilityConfig[availability].color}`}>
              {availabilityConfig[availability].text}
            </span>
          </div>
          
          <h4 className="text-lg font-medium text-gray-900 mb-1">
            {part.name}
          </h4>
          
          <p className="text-sm text-gray-600 mb-2">
            {part.manufacturer} {part.model && `• ${part.model}`}
          </p>
          
          {part.specifications && (
            <div className="text-sm text-gray-500 mb-3">
              {Object.entries(part.specifications).slice(0, 3).map(([key, value]) => (
                <span key={key} className="mr-4">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold text-gray-900">
              ¥{part.price.toLocaleString()}
            </div>
            
            {part.rating && (
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="text-sm text-gray-600 ml-1">
                  {part.rating} ({part.reviewCount || 0}件)
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {part.url && (
            <a
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          
          {showAddButton && onSelect && (
            <button
              onClick={() => onSelect(part)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              {addButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ページネーション用のヘルパー関数
function getPaginationPages(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  
  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  }
  
  return pages;
}

export default SearchResults;

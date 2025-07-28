// src/components/search/PartSearch.tsx
import React, { useState, useCallback } from 'react';
import { Part, PartCategory } from '@/types';
import { useSearch } from '@/hooks/useSearch';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import { sampleParts } from '@/data/sampleParts';

interface PartSearchProps {
  onPartSelect?: (part: Part) => void;
  selectedCategory?: PartCategory;
  showAddButton?: boolean;
  addButtonText?: string;
  className?: string;
  allParts?: Part[];
}

export const PartSearch: React.FC<PartSearchProps> = ({
  onPartSelect,
  selectedCategory,
  showAddButton = true,
  addButtonText = "選択",
  className = "",
  allParts = sampleParts
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // 検索フック
  const {
    searchResult,
    isSearching,
    searchError,
    searchQuery,
    search,
    updateQuery,
    resetSearch,
    totalResults
  } = useSearch(allParts, {
    debounceMs: 300,
    autoSearch: false,
    initialQuery: {
      category: selectedCategory,
      limit: 20
    }
  });

  // 検索実行
  const handleSearch = useCallback(() => {
    search();
  }, [search]);

  // 検索テキスト変更
  const handleSearchChange = useCallback((term: string) => {
    updateQuery({ term });
  }, [updateQuery]);

  // カテゴリ変更
  const handleCategoryChange = useCallback((category: PartCategory | undefined) => {
    updateQuery({ category });
  }, [updateQuery]);

  // ページ変更
  const handlePageChange = useCallback((page: number) => {
    search({ page });
  }, [search]);

  // フィルタ表示切り替え
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // リセット
  const handleReset = useCallback(() => {
    resetSearch();
    setShowFilters(false);
  }, [resetSearch]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 検索バー */}
      <SearchBar
        searchTerm={searchQuery.term}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        category={searchQuery.category}
        onCategoryChange={handleCategoryChange}
        isSearching={isSearching}
        showAdvancedFilters={true}
        onToggleFilters={handleToggleFilters}
      />

      {/* エラー表示 */}
      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">検索エラー</h3>
              <p className="mt-1 text-sm text-red-700">{searchError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={handleSearch}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 高度なフィルタ（今後実装予定） */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">高度な検索フィルタ</h3>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              リセット
            </button>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <p>高度なフィルタ機能は実装中です</p>
            <p className="text-sm mt-1">価格範囲、ブランド、詳細仕様でのフィルタリングが利用可能になります</p>
          </div>
        </div>
      )}

      {/* 検索統計 */}
      {(searchResult || isSearching) && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {totalResults > 0 && (
              <span>
                {totalResults.toLocaleString()}件の製品が見つかりました
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {searchQuery.term && (
              <span>
                検索語: "{searchQuery.term}"
              </span>
            )}
            
            {searchQuery.category && (
              <span>
                カテゴリ: {searchQuery.category}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 検索結果 */}
      <SearchResults
        searchResult={searchResult}
        onPartSelect={onPartSelect}
        onPageChange={handlePageChange}
        isSearching={isSearching}
        showAddButton={showAddButton}
        addButtonText={addButtonText}
      />
    </div>
  );
};

export default PartSearch;

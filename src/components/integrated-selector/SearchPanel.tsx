// src/components/integrated-selector/SearchPanel.tsx
// パーツ検索パネル

import React, { useState, useCallback } from 'react';
import { Search, X, Check, Loader } from 'lucide-react';
import type { Part } from '@/types';

interface SearchPanelProps {
  category: string;
  categoryKey: string;
  isOpen: boolean;
  onClose: () => void;
  onPartSelect: (part: Part) => void;
  existingParts?: Part[];  // 既に選択済みのパーツ（重複チェック用）
  className?: string;
}

// モックデータ（後で実データに置き換え）
const mockSearchResults: Part[] = [
  {
    id: 'cpu-001',
    name: 'Intel Core i5-13400F',
    manufacturer: 'Intel',
    category: 'cpu',
    price: 32000,
    specifications: { socket: 'LGA1700', cores: 10, threads: 16 }
  },
  {
    id: 'cpu-002',
    name: 'AMD Ryzen 7 7700X',
    manufacturer: 'AMD',
    category: 'cpu',
    price: 45000,
    specifications: { socket: 'AM5', cores: 8, threads: 16 }
  },
  {
    id: 'cpu-003',
    name: 'Intel Core i7-13700K',
    manufacturer: 'Intel',
    category: 'cpu',
    price: 58000,
    specifications: { socket: 'LGA1700', cores: 16, threads: 24 }
  }
];

export const SearchPanel: React.FC<SearchPanelProps> = ({
  category,
  categoryKey,
  isOpen,
  onClose,
  onPartSelect,
  existingParts = [],
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Part[]>([]);
  const [showMore, setShowMore] = useState(false);
  
  // 検索実行（モック）
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // モック: 1秒待機してからフィルタリング
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // カテゴリとクエリでフィルタリング（実際はAPIコール）
    const filtered = mockSearchResults.filter(part => 
      part.category === categoryKey &&
      (part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       part.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setSearchResults(filtered);
    setIsSearching(false);
  }, [searchQuery, categoryKey]);
  
  // Enter キーで検索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // パーツ選択
  const handlePartSelect = (part: Part) => {
    onPartSelect(part);
    // 選択後にパネルを閉じるか、開いたままにするかは要検討
    // 複数選択の場合は開いたままが便利
    if (!showMore) {
      onClose();
    }
  };
  
  // 既に選択済みかチェック
  const isAlreadySelected = (part: Part) => {
    return existingParts.some(p => p.id === part.id);
  };
  
  if (!isOpen) return null;
  
  // 表示する検索結果（最初は3件、もっと見るで全件）
  const displayResults = showMore ? searchResults : searchResults.slice(0, 3);
  
  return (
    <div className={`bg-white border-t border-x border-b rounded-b-lg shadow-lg ${className}`}>
      <div className="p-4 space-y-4">
        {/* 検索入力エリア */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`${category}を検索...`}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader className="animate-spin" size={16} />
                検索中...
              </>
            ) : (
              <>
                <Search size={16} />
                検索
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 検索結果表示 */}
        {searchResults.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              {searchResults.length}件の検索結果
            </div>
            
            <div className="border rounded-md divide-y">
              {displayResults.map((part) => {
                const selected = isAlreadySelected(part);
                
                return (
                  <div 
                    key={part.id}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 ${
                      selected ? 'bg-gray-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {part.name}
                        {selected && (
                          <span className="ml-2 text-xs text-green-600">
                            （選択済み）
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {part.manufacturer}
                        {part.specifications && (
                          <>
                            {part.specifications.socket && (
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {String(part.specifications.socket)}
                              </span>
                            )}
                            {part.specifications.interface && (
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {String(part.specifications.interface)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        ¥{part.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handlePartSelect(part)}
                        disabled={selected}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          selected 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {selected ? (
                          <>
                            <Check size={14} className="inline mr-1" />
                            選択済み
                          </>
                        ) : (
                          '選択'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* もっと見る */}
            {searchResults.length > 3 && !showMore && (
              <button
                onClick={() => setShowMore(true)}
                className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                もっと見る（残り{searchResults.length - 3}件）
              </button>
            )}
            
            {showMore && searchResults.length > 3 && (
              <button
                onClick={() => setShowMore(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                折りたたむ
              </button>
            )}
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">検索結果がありません</div>
            <div className="text-sm">別のキーワードで検索してみてください</div>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            検索キーワードを入力してください
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchPanel;
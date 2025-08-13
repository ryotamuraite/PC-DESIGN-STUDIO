// src/components/integrated-selector/IntegratedPartSelector.tsx
// 🚀 統合パーツ選択UI - 検索タブ機能完全統合版

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Filter,
  RefreshCw,
  Check,
  Eye,
  ShoppingCart,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { PartCategory, Part, PCConfiguration } from '@/types';
import { getPartsByCategory, categoryNames } from '@/data/sampleParts';
import { sampleParts } from '@/data/sampleParts';
import { useSearch } from '@/hooks/useSearch';

export interface IntegratedPartSelectorProps {
  configuration: PCConfiguration;
  onPartSelect: (category: PartCategory, part: Part | null) => void;
  className?: string;
}

type ViewMode = 'category' | 'search' | 'selected' | 'add';
type SearchMode = 'all' | 'category';

export const IntegratedPartSelector: React.FC<IntegratedPartSelectorProps> = ({
  configuration,
  onPartSelect,
  className = ''
}) => {
  // ビューモード管理
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [searchMode, setSearchMode] = useState<SearchMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<PartCategory | null>(null);
  
  // 新パーツ追加フォーム状態
  interface NewPartForm {
    name: string;
    manufacturer: string;
    price: number;
    category: PartCategory;
    specifications: Record<string, unknown>; // any → unknown に修正
    imageUrl: string;
    description: string;
  }
  
  const [newPart, setNewPart] = useState<NewPartForm>({
    name: '',
    manufacturer: '',
    price: 0,
    category: 'cpu',
    specifications: {},
    imageUrl: '',
    description: ''
  });
  
  // 検索状態
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<PartCategory | null>(null);
  const [priceRange, setPriceRange] = useState<{min: number; max: number}>({min: 0, max: 1000000});
  const [showFilters, setShowFilters] = useState(false);

  // 🚀 新機能: 高度な検索機能統合
  const {
    searchResult,
    isSearching,
    searchError,
    searchQuery,
    search,
    updateQuery,
    resetSearch,
    totalResults
  } = useSearch(sampleParts, {
    debounceMs: 300,
    autoSearch: false,
    initialQuery: {
      category: filterCategory || undefined,
      limit: 12
    }
  });

  // カテゴリリスト
  const categories: PartCategory[] = [
    'cpu', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'case', 'cooler'
  ];

  // 🚀 統合検索結果の計算（高度検索 + フィルタ統合）
  const searchResults = useMemo(() => {
    // 高度検索が実行済みの場合はその結果を使用
    if (searchResult && searchResult.parts) {
      return searchResult.parts;
    }

    // フォールバック: 基本フィルタリング
    let results = [...sampleParts];

    // テキスト検索
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(part => 
        part.name.toLowerCase().includes(term) ||
        part.manufacturer.toLowerCase().includes(term) ||
        part.category.toLowerCase().includes(term)
      );
    }

    // カテゴリフィルタ
    if (filterCategory) {
      results = results.filter(part => part.category === filterCategory);
    }

    // 価格フィルタ
    results = results.filter(part => 
      part.price >= priceRange.min && part.price <= priceRange.max
    );

    return results;
  }, [searchTerm, filterCategory, priceRange, searchResult]);

  // 選択済みパーツの取得
  const selectedParts = useMemo(() => {
    return Object.entries(configuration.parts)
      .filter(([, part]) => part !== null)
      .map(([category, part]) => ({ category: category as PartCategory, part: part! }));
  }, [configuration.parts]);

  // 🚀 高度検索実行
  const handleAdvancedSearch = useCallback(() => {
    updateQuery({ 
      term: searchTerm,
      category: filterCategory || undefined 
    });
    search();
  }, [searchTerm, filterCategory, search, updateQuery]);

  // 🚀 検索エラーハンドリング
  const handleSearchRetry = useCallback(() => {
    search();
  }, [search]);

  // 🚀 ページネーション
  const handlePageChange = useCallback((page: number) => {
    search({ page });
  }, [search]);

  // カテゴリ選択
  const handleCategorySelect = useCallback((category: PartCategory) => {
    setSelectedCategory(category);
    setFilterCategory(category);
    setViewMode('search');
    setSearchMode('category');
    // 高度検索クエリも更新
    updateQuery({ category: category });
  }, [updateQuery]);

  // 検索モード切り替え
  const handleSearchModeChange = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    if (mode === 'all') {
      setFilterCategory(null);
      updateQuery({ category: undefined });
    }
    setViewMode('search');
  }, [updateQuery]);

  // パーツ選択処理
  const handlePartSelect = useCallback((part: Part) => {
    onPartSelect(part.category, part);
    if (searchMode === 'category' && selectedCategory) {
      // カテゴリ選択モードの場合は元のビューに戻る
      setViewMode('category');
      setSelectedCategory(null);
      setSearchTerm('');
    }
  }, [onPartSelect, searchMode, selectedCategory]);

  // パーツ削除処理
  const handlePartRemove = useCallback((category: PartCategory) => {
    onPartSelect(category, null);
  }, [onPartSelect]);

  // 新パーツ追加処理
  const handleAddNewPart = useCallback(() => {
    if (!newPart.name || !newPart.manufacturer || !newPart.price) {
      alert('名前、メーカー、価格は必須です。');
      return;
    }

    // 基本パーツを作成（Part型に準拠）
    const partToAdd: Part = {
      id: `custom-${Date.now()}`,
      name: newPart.name,
      manufacturer: newPart.manufacturer, // manufacturer が正しいプロパティ名
      category: newPart.category,
      price: newPart.price,
      specifications: {
        // カテゴリ固有の仕様をspecificationsに含める
        ...newPart.specifications,
        // カテゴリ別のデフォルト仕様
        ...(newPart.category === 'cpu' && {
          socket: 'LGA1700',
          cores: 8,
          threads: 16,
          baseClock: 3.0,
          tdp: 65,
          memorySupport: ['DDR4-3200'],
          pcieLanes: 16
        }),
        ...(newPart.category === 'gpu' && {
          chipset: 'Custom',
          memory: 8,
          memoryType: 'GDDR6',
          coreClock: 1500,
          tdp: 150,
          powerConnectors: ['8pin'],
          length: 280,
          slots: 2,
          outputs: ['HDMI', 'DisplayPort'],
          rayTracing: false
        }),
        ...(newPart.category === 'motherboard' && {
          socket: 'LGA1700',
          chipset: 'Z790',
          formFactor: 'ATX',
          memorySlots: 4,
          maxMemory: 128,
          memoryType: ['DDR4', 'DDR5'],
          memorySpeed: [3200, 3600, 4000],
          pciSlots: { pcie16: 2, pcie8: 1, pcie4: 2, pcie1: 1 },
          sataConnectors: 6,
          m2Slots: 3,
          usbPorts: { usb2: 4, usb3: 8, usbC: 2 },
          networking: { ethernet: true, wifi: true, bluetooth: true },
          audio: 'Realtek ALC1220',
          powerConnectors: ['24pin', '8pin']
        }),
        ...(newPart.category === 'memory' && {
          type: 'DDR4',
          capacity: 16,
          speed: 3200,
          timings: 'CL16-18-18-38',
          voltage: 1.35,
          sticks: 2,
          totalCapacity: 32,
          heatspreader: true,
          rgb: false
        }),
        ...(newPart.category === 'storage' && {
          type: 'SSD',
          capacity: 1000,
          interface: 'NVMe',
          formFactor: 'M.2 2280',
          readSpeed: 3500,
          writeSpeed: 3000,
          endurance: 600,
          powerConsumption: 5
        }),
        ...(newPart.category === 'psu' && {
          wattage: 750,
          efficiency: '80+ Gold',
          modular: 'fully-modular',
          formFactor: 'ATX',
          connectors: {
            cpu: ['8pin'],
            pcie: ['8pin', '6+2pin'],
            sata: 8,
            molex: 4,
            floppy: 1
          },
          cables: { length: 600, sleeved: true },
          fan: { size: 140, bearing: 'Fluid Dynamic', rpm: 1200, noise: 20 }
        }),
        ...(newPart.category === 'case' && {
          formFactor: ['ATX', 'micro-ATX', 'mini-ITX'],
          maxGpuLength: 350,
          maxCpuCoolerHeight: 165,
          maxPsuLength: 200,
          driveBays: { ssd25: 4, hdd35: 2 },
          expansionSlots: 7,
          frontPorts: { usb2: 2, usb3: 2, usbC: 1, audio: true },
          fans: { included: 2, maxFront: 3, maxRear: 1, maxTop: 3, maxBottom: 2 },
          radiatorSupport: { front: [240, 280, 360], top: [240, 280], rear: [120] },
          tempered_glass: true,
          rgb: false
        }),
        ...(newPart.category === 'cooler' && {
          type: 'Air',
          height: 155,
          sockets: ['LGA1700', 'AM4', 'AM5'],
          tdpRating: 150,
          fanSize: 120,
          fanSpeed: 1500,
          noiseLevel: 25,
          power: 15
        })
      },
      availability: 'in_stock',
      // オプションプロパティ
      ...(newPart.imageUrl && { imageUrl: newPart.imageUrl }),
      ...(newPart.description && { description: newPart.description })
    };

    // サンプルパーツに追加（一時的な実装）
    sampleParts.push(partToAdd);
    
    // 追加後に自動選択する
    onPartSelect(newPart.category, partToAdd);
    
    // フォームをリセット
    setNewPart({
      name: '',
      manufacturer: '',
      price: 0,
      category: 'cpu',
      specifications: {},
      imageUrl: '',
      description: ''
    });
    
    // カテゴリビューに戻る
    setViewMode('category');
    
    alert(`パーツ「${partToAdd.name}」を追加しました！`);
  }, [newPart]);

  // 🚀 検索リセット（高度検索統合）
  const handleResetSearch = useCallback(() => {
    setSearchTerm('');
    setFilterCategory(null);
    setPriceRange({min: 0, max: 1000000});
    setSelectedCategory(null);
    resetSearch(); // 高度検索もリセット
    setShowFilters(false);
  }, [resetSearch]);

  // 価格フォーマット
  const formatPrice = (price: number) => price.toLocaleString('ja-JP');

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* ヘッダー・ナビゲーション */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            🚀 統合パーツ選択
          </h2>
          
          {/* 🚀 新機能: 統合状態表示 */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              ✅ 検索タブ統合済み
            </span>
            <span className="text-xs text-gray-500">
              機能強化版
            </span>
          </div>
          
          {/* ビューモード切り替え */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'category' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              カテゴリ選択
            </button>
            <button
              onClick={() => handleSearchModeChange('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'search' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全体検索
            </button>
            <button
              onClick={() => setViewMode('selected')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'selected' 
                  ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              選択済み ({selectedParts.length})
            </button>
            <button
              onClick={() => setViewMode('add')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'add' 
                  ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              + パーツ追加
            </button>
          </div>
        </div>

        {/* 検索バー（検索モード時のみ表示） */}
        {viewMode === 'search' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchMode === 'category' && selectedCategory 
                    ? `${categoryNames[selectedCategory]}を検索...`
                    : 'パーツ名、メーカー名で検索...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 🚀 高度検索ボタン */}
              <button
                onClick={handleAdvancedSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleResetSearch}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* 高度フィルタ */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">検索フィルタ</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* カテゴリフィルタ */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      カテゴリ
                    </label>
                    <select
                      value={filterCategory || ''}
                      onChange={(e) => setFilterCategory(e.target.value as PartCategory || null)}
                      className="w-full text-sm border border-gray-300 rounded px-3 py-1"
                    >
                      <option value="">すべて</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {categoryNames[category]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 価格範囲 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      最低価格
                    </label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({...prev, min: parseInt(e.target.value) || 0}))}
                      className="w-full text-sm border border-gray-300 rounded px-3 py-1"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      最高価格
                    </label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({...prev, max: parseInt(e.target.value) || 1000000}))}
                      className="w-full text-sm border border-gray-300 rounded px-3 py-1"
                      placeholder="1000000"
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  {searchResult ? totalResults : searchResults.length}件の製品が見つかりました
                </div>
              </div>
            )}

            {/* 🚀 新機能: 検索エラー表示 */}
            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">検索エラー</h3>
                    <p className="mt-1 text-sm text-red-700">{searchError}</p>
                  </div>
                  <button
                    onClick={handleSearchRetry}
                    className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                  >
                    再試行
                  </button>
                </div>
              </div>
            )}

            {/* 🚀 新機能: 検索統計表示 */}
            {(searchResult || isSearching || searchResults.length > 0) && (
              <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-4">
                  {(searchResult || searchResults.length > 0) && (
                    <span>
                      {searchResult ? totalResults : searchResults.length}件の製品が見つかりました
                    </span>
                  )}
                  {isSearching && (
                    <span className="flex items-center">
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      検索中...
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-xs">
                  {searchQuery.term && (
                    <span>
                      検索語: "{searchQuery.term}"
                    </span>
                  )}
                  
                  {(searchQuery.category || filterCategory) && (
                    <span>
                      カテゴリ: {categoryNames[searchQuery.category || filterCategory!]}
                    </span>
                  )}

                  {searchResult && searchResult.totalPages && (
                    <span>
                      ページ: {searchResult.currentPage}/{searchResult.totalPages}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* メインコンテンツエリア */}
      <div className="p-6">
        {/* カテゴリ選択モード */}
        {viewMode === 'category' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-6">
              パーツの種類を選択してください。選択したカテゴリの製品検索画面に移動します。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const selectedPart = configuration.parts[category];
                const availableCount = getPartsByCategory(category).length;
                
                return (
                  <div
                    key={category}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedPart 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {categoryNames[category]}
                      </h3>
                      {selectedPart ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {selectedPart ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-800">{selectedPart.name}</p>
                        <p className="text-xs text-gray-600">{selectedPart.manufacturer}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-green-600">
                            ¥{formatPrice(selectedPart.price)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePartRemove(category);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">未選択</p>
                        <p className="text-xs text-gray-500">{availableCount}製品が利用可能</p>
                        <div className="pt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            選択して検索
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 検索結果モード */}
        {viewMode === 'search' && (
          <div className="space-y-4">
            {searchMode === 'category' && selectedCategory && (
              <div className="flex items-center space-x-2 mb-4">
                <button
                  onClick={() => setViewMode('category')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← カテゴリ選択に戻る
                </button>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-gray-700">
                  {categoryNames[selectedCategory]}を検索中
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((part: Part) => {
                const isSelected = configuration.parts[part.category as PartCategory]?.id === part.id;
                
                return (
                  <div
                    key={part.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{part.name}</h3>
                        <p className="text-xs text-gray-600">{part.manufacturer}</p>
                        <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          {categoryNames[part.category]}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">
                          ¥{formatPrice(part.price)}
                        </p>
                        
                        {isSelected ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-green-600 font-medium">選択済み</span>
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePartSelect(part)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>選択</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🚀 新機能: ページネーション */}
            {searchResult && searchResult.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => handlePageChange(searchResult.currentPage - 1)}
                  disabled={searchResult.currentPage <= 1 || isSearching}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  前へ
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, searchResult.totalPages) }, (_, i) => {
                    const page = i + 1;
                    const isCurrentPage = page === searchResult.currentPage;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isSearching}
                        className={`px-3 py-1 text-sm rounded-md ${
                          isCurrentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(searchResult.currentPage + 1)}
                  disabled={searchResult.currentPage >= searchResult.totalPages || isSearching}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">検索条件に一致する製品がありません</p>
                <p className="text-sm text-gray-500 mt-2">
                  検索条件を変更するか、フィルタをリセットしてお試しください
                </p>
              </div>
            )}
          </div>
        )}

        {/* パーツ手動追加モード */}
        {viewMode === 'add' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                新しいパーツを追加
              </h3>
              <button
                onClick={() => setViewMode('category')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← カテゴリ選択に戻る
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本情報 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">基本情報</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      パーツ名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPart.name}
                      onChange={(e) => setNewPart(prev => ({...prev, name: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例: Core i7-13700K"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メーカー <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPart.manufacturer}
                      onChange={(e) => setNewPart(prev => ({...prev, manufacturer: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例: Intel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      価格 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newPart.price}
                      onChange={(e) => setNewPart(prev => ({...prev, price: parseInt(e.target.value) || 0}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="例: 50000"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newPart.category}
                      onChange={(e) => setNewPart(prev => ({...prev, category: e.target.value as PartCategory}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {categoryNames[category]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 追加情報 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">追加情報</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      画像URL
                    </label>
                    <input
                      type="url"
                      value={newPart.imageUrl}
                      onChange={(e) => setNewPart(prev => ({...prev, imageUrl: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={newPart.description}
                      onChange={(e) => setNewPart(prev => ({...prev, description: e.target.value}))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="パーツの詳細説明を入力してください..."
                    />
                  </div>

                  {/* プレビュー */}
                  <div className="bg-white border border-gray-200 rounded-md p-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">プレビュー</h5>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{newPart.name || '（パーツ名未入力）'}</p>
                      <p className="text-xs text-gray-600">{newPart.manufacturer || '（メーカー未入力）'}</p>
                      <p className="text-sm font-bold text-blue-600">¥{formatPrice(newPart.price)}</p>
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        {categoryNames[newPart.category]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setNewPart({
                      name: '',
                      manufacturer: '',
                      price: 0,
                      category: 'cpu',
                      specifications: {},
                      imageUrl: '',
                      description: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  リセット
                </button>
                <button
                  onClick={handleAddNewPart}
                  disabled={!newPart.name || !newPart.manufacturer || !newPart.price}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  パーツを追加
                </button>
              </div>

              {/* バリデーションメッセージ */}
              {(!newPart.name || !newPart.manufacturer || !newPart.price) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    パーツ名、メーカー、価格は必須項目です。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 選択済みパーツモード */}
        {viewMode === 'selected' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                選択済みパーツ ({selectedParts.length}/8)
              </h3>
              <div className="text-sm text-gray-600">
                合計: ¥{formatPrice(configuration.totalPrice)}
              </div>
            </div>

            {selectedParts.length > 0 ? (
              <div className="space-y-3">
                {selectedParts.map(({ category, part }) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-green-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {categoryNames[category]}
                        </span>
                        <h4 className="font-medium text-gray-900">{part.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{part.manufacturer}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-900">
                        ¥{formatPrice(part.price)}
                      </span>
                      <button
                        onClick={() => handlePartRemove(category)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">まだパーツが選択されていません</p>
                <p className="text-sm text-gray-500 mt-2">
                  カテゴリ選択または検索からパーツを選択してください
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedPartSelector;
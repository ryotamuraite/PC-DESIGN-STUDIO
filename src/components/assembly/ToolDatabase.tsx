// src/components/assembly/ToolDatabase.tsx
// Phase 3: 工具データベース - 組み立て備品システム

import React, { useState, useMemo } from 'react';
import { Search, Package, ShoppingCart, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { PCConfiguration, PartCategory } from '@/types';

interface AssemblyTool {
  id: string;
  name: string;
  category: 'screwdriver' | 'cable' | 'screw' | 'standoff' | 'thermal' | 'other';
  type: 'required' | 'recommended' | 'optional';
  description: string;
  specification?: string;
  compatibleWith: PartCategory[];
  estimatedPrice: number;
  quantity: number;
  purchaseLinks: PurchaseLink[];
  imageUrl?: string;
  tips?: string[];
  alternatives?: string[];
}

interface PurchaseLink {
  store: 'amazon' | 'rakuten' | 'kakaku' | 'other';
  url: string;
  price: number;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  shippingDays: number;
}

interface ToolDatabaseProps {
  configuration: PCConfiguration;
  showPrices?: boolean;
  groupByCategory?: boolean;
  filterByNecessity?: 'all' | 'required' | 'recommended';
  onToolSelect?: (tool: AssemblyTool) => void;
  onPurchaseClick?: (tool: AssemblyTool, link: PurchaseLink) => void;
}

export const ToolDatabase: React.FC<ToolDatabaseProps> = ({
  configuration,
  showPrices = true,
  groupByCategory = true,
  filterByNecessity = 'all',
  onToolSelect,
  onPurchaseClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  // 工具データベース（実際の運用では外部データソースから取得）
  const toolDatabase: AssemblyTool[] = useMemo(() => [
    // 必須工具
    {
      id: 'phillips-screwdriver',
      name: 'プラスドライバー（#1, #2）',
      category: 'screwdriver',
      type: 'required',
      description: 'PC組み立ての基本工具。マザーボード、ケース、電源の固定に必須',
      specification: '#1（細ネジ用）、#2（太ネジ用）のセット',
      compatibleWith: ['motherboard', 'case', 'psu', 'cooler', 'storage'],
      estimatedPrice: 800,
      quantity: 1,
      purchaseLinks: [
        {
          store: 'amazon',
          url: 'https://amazon.co.jp/dp/example1',
          price: 780,
          availability: 'in_stock',
          shippingDays: 1
        },
        {
          store: 'rakuten',
          url: 'https://rakuten.co.jp/example1',
          price: 850,
          availability: 'in_stock',
          shippingDays: 2
        }
      ],
      tips: [
        'マグネット付きを選ぶとネジを落としにくい',
        '柄が滑りにくい材質のものを選択',
        '先端の摩耗に注意'
      ],
      alternatives: ['電動ドライバー（上級者向け）']
    },
    {
      id: 'anti-static-wrist-strap',
      name: '静電気防止リストストラップ',
      category: 'other',
      type: 'recommended',
      description: '静電気によるパーツ破損を防ぐ安全装備',
      specification: 'アース線付き、調整可能なストラップ',
      compatibleWith: ['cpu', 'gpu', 'memory', 'motherboard'],
      estimatedPrice: 300,
      quantity: 1,
      purchaseLinks: [
        {
          store: 'amazon',
          url: 'https://amazon.co.jp/dp/example2',
          price: 250,
          availability: 'in_stock',
          shippingDays: 1
        }
      ],
      tips: [
        'ケース金属部分にアースを接続',
        '組み立て前に必ず装着',
        '定期的な導通チェックを推奨'
      ]
    },
    {
      id: 'thermal-paste',
      name: 'サーマルペースト',
      category: 'thermal',
      type: 'required',
      description: 'CPU とクーラー間の熱伝導を向上させる',
      specification: '高熱伝導率、シリコン系またはメタル系',
      compatibleWith: ['cpu', 'cooler'],
      estimatedPrice: 1200,
      quantity: 1,
      purchaseLinks: [
        {
          store: 'amazon',
          url: 'https://amazon.co.jp/dp/example3',
          price: 1180,
          availability: 'in_stock',
          shippingDays: 1
        }
      ],
      tips: [
        '米粒大程度の量で十分',
        '均等に塗布することが重要',
        '古いペーストは必ず除去'
      ]
    },
    {
      id: 'cable-ties',
      name: 'ケーブルタイ',
      category: 'cable',
      type: 'recommended',
      description: 'ケーブル配線の整理整頓に使用',
      specification: '様々な長さのセット、再利用可能タイプ',
      compatibleWith: ['case', 'psu'],
      estimatedPrice: 500,
      quantity: 20,
      purchaseLinks: [
        {
          store: 'amazon',
          url: 'https://amazon.co.jp/dp/example4',
          price: 450,
          availability: 'in_stock',
          shippingDays: 1
        }
      ],
      tips: [
        'きつく締めすぎないよう注意',
        '将来のメンテナンス性を考慮',
        '色分けで用途別に管理'
      ]
    },
    {
      id: 'motherboard-standoffs',
      name: 'マザーボードスタンドオフ',
      category: 'standoff',
      type: 'required',
      description: 'マザーボードをケースに固定するための支柱',
      specification: '真鍮製、M3ネジ対応',
      compatibleWith: ['motherboard', 'case'],
      estimatedPrice: 400,
      quantity: 9,
      purchaseLinks: [
        {
          store: 'amazon',
          url: 'https://amazon.co.jp/dp/example5',
          price: 380,
          availability: 'in_stock',
          shippingDays: 1
        }
      ],
      tips: [
        'ケースに付属している場合が多い',
        '必要数を事前に確認',
        'ネジ山の損傷に注意'
      ]
    },
    {
      id: 'sata-cables',
      name: 'SATAケーブル',
      category: 'cable',
      type: 'required',
      description: 'ストレージデバイスとマザーボードを接続',
      specification: 'SATA 3.0対応、L字コネクタ推奨',
      compatibleWith: ['storage', 'motherboard'],
      estimatedPrice: 300,
      quantity: 2,
      purchaseLinks: [
        {
          store: 'amazon',
          url: 'https://amazon.co.jp/dp/example6',
          price: 280,
          availability: 'in_stock',
          shippingDays: 1
        }
      ],
      tips: [
        'ストレージ数 + 1本を用意',
        'L字コネクタで配線がスッキリ',
        'ケーブル長は最小限に'
      ]
    }
  ], []);

  // 構成に基づいた必要工具の自動算出
  const requiredTools = useMemo(() => {
    const needed = new Set<string>();
    const { parts } = configuration;

    // 基本工具は常に必要
    needed.add('phillips-screwdriver');
    needed.add('anti-static-wrist-strap');

    // CPU関連
    if (parts.cpu) {
      needed.add('thermal-paste');
    }

    // ストレージ関連
    if (parts.storage) {
      const storageSpecs = parts.storage.specifications;
      const storageInterface = storageSpecs?.interface as string;
      if (storageInterface?.includes('SATA')) {
        needed.add('sata-cables');
      }
    }

    // マザーボード関連
    if (parts.motherboard && parts.case) {
      needed.add('motherboard-standoffs');
    }

    // ケーブル管理
    if (Object.keys(parts).length > 3) {
      needed.add('cable-ties');
    }

    return Array.from(needed);
  }, [configuration]);

  // フィルタリングされた工具リスト
  const filteredTools = useMemo(() => {
    const filtered = toolDatabase.filter(tool => {
      // 構成に基づく必要性フィルタ
      if (filterByNecessity === 'required' && !requiredTools.includes(tool.id)) {
        return false;
      }
      if (filterByNecessity === 'recommended' && tool.type === 'optional') {
        return false;
      }

      // 検索クエリフィルタ
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return tool.name.toLowerCase().includes(query) ||
               tool.description.toLowerCase().includes(query);
      }

      // カテゴリフィルタ
      if (selectedCategory !== 'all') {
        return tool.category === selectedCategory;
      }

      return true;
    });

    // 必要性順でソート
    filtered.sort((a, b) => {
      const aRequired = requiredTools.includes(a.id);
      const bRequired = requiredTools.includes(b.id);
      
      if (aRequired && !bRequired) return -1;
      if (!aRequired && bRequired) return 1;
      
      const typeOrder = { required: 0, recommended: 1, optional: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return filtered;
  }, [toolDatabase, requiredTools, searchQuery, selectedCategory, filterByNecessity]);

  // カテゴリグループ化
  const groupedTools = useMemo(() => {
    if (!groupByCategory) return { all: filteredTools };

    return filteredTools.reduce((groups, tool) => {
      const category = tool.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(tool);
      return groups;
    }, {} as Record<string, AssemblyTool[]>);
  }, [filteredTools, groupByCategory]);

  // 工具詳細の展開/折りたたみ
  const toggleToolExpansion = (toolId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  // 総費用計算
  const totalCost = filteredTools
    .filter(tool => requiredTools.includes(tool.id) || tool.type === 'required')
    .reduce((sum, tool) => sum + tool.estimatedPrice, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-500" />
          組み立て工具・備品データベース
        </h2>
        <p className="text-sm text-gray-600">
          PC組み立てに必要な工具と備品を自動算出。価格比較と購入リンクも提供。
        </p>
      </div>

      {/* 検索・フィルタコントロール */}
      <div className="mb-6 space-y-4">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="工具・備品を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* フィルタボタン群 */}
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全カテゴリ</option>
            <option value="screwdriver">ドライバー</option>
            <option value="cable">ケーブル</option>
            <option value="screw">ネジ類</option>
            <option value="standoff">スタンドオフ</option>
            <option value="thermal">熱関連</option>
            <option value="other">その他</option>
          </select>

          <select
            value={filterByNecessity}
            onChange={() => {/* フィルタ変更は親コンポーネントで制御 */}}
            className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全て</option>
            <option value="required">必須のみ</option>
            <option value="recommended">推奨以上</option>
          </select>
        </div>

        {/* サマリー情報 */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="text-sm">
            <span className="font-medium text-blue-900">
              必要工具: {requiredTools.length}点
            </span>
            {showPrices && (
              <span className="ml-4 text-blue-700">
                推定費用: ¥{totalCost.toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-xs text-blue-600">
            検索結果: {filteredTools.length}点
          </div>
        </div>
      </div>

      {/* 工具リスト */}
      <div className="space-y-4">
        {groupByCategory ? (
          Object.entries(groupedTools).map(([category, tools]) => (
            <ToolCategoryGroup
              key={category}
              category={category}
              tools={tools}
              requiredTools={requiredTools}
              expandedTools={expandedTools}
              showPrices={showPrices}
              onToggleExpansion={toggleToolExpansion}
              onToolSelect={onToolSelect}
              onPurchaseClick={onPurchaseClick}
            />
          ))
        ) : (
          <div className="space-y-3">
            {filteredTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isRequired={requiredTools.includes(tool.id)}
                isExpanded={expandedTools.has(tool.id)}
                showPrices={showPrices}
                onToggleExpansion={() => toggleToolExpansion(tool.id)}
                onToolSelect={onToolSelect}
                onPurchaseClick={onPurchaseClick}
              />
            ))}
          </div>
        )}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>条件に一致する工具・備品が見つかりませんでした。</p>
          <p className="text-sm mt-1">検索条件を変更してお試しください。</p>
        </div>
      )}
    </div>
  );
};

// カテゴリグループコンポーネント
const ToolCategoryGroup: React.FC<{
  category: string;
  tools: AssemblyTool[];
  requiredTools: string[];
  expandedTools: Set<string>;
  showPrices: boolean;
  onToggleExpansion: (toolId: string) => void;
  onToolSelect?: (tool: AssemblyTool) => void;
  onPurchaseClick?: (tool: AssemblyTool, link: PurchaseLink) => void;
}> = ({ 
  category, 
  tools, 
  requiredTools, 
  expandedTools, 
  showPrices, 
  onToggleExpansion, 
  onToolSelect, 
  onPurchaseClick 
}) => {
  const categoryLabels: Record<string, string> = {
    screwdriver: 'ドライバー類',
    cable: 'ケーブル類',
    screw: 'ネジ・固定具',
    standoff: 'スタンドオフ',
    thermal: '熱対策用品',
    other: 'その他工具'
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          {categoryLabels[category] || category} ({tools.length}点)
        </h3>
      </div>
      <div className="divide-y divide-gray-200">
        {tools.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            isRequired={requiredTools.includes(tool.id)}
            isExpanded={expandedTools.has(tool.id)}
            showPrices={showPrices}
            onToggleExpansion={() => onToggleExpansion(tool.id)}
            onToolSelect={onToolSelect}
            onPurchaseClick={onPurchaseClick}
          />
        ))}
      </div>
    </div>
  );
};

// 工具カードコンポーネント
const ToolCard: React.FC<{
  tool: AssemblyTool;
  isRequired: boolean;
  isExpanded: boolean;
  showPrices: boolean;
  onToggleExpansion: () => void;
  onToolSelect?: (tool: AssemblyTool) => void;
  onPurchaseClick?: (tool: AssemblyTool, link: PurchaseLink) => void;
}> = ({ 
  tool, 
  isRequired, 
  isExpanded, 
  showPrices, 
  onToggleExpansion, 
  onToolSelect, 
  onPurchaseClick 
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'required': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'recommended': return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'required': return '必須';
      case 'recommended': return '推奨';
      default: return '任意';
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getTypeIcon(tool.type)}
            <h4 
              className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => {
                onToggleExpansion();
                onToolSelect?.(tool);
              }}
            >
              {tool.name}
              {isRequired && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">構成に必要</span>}
            </h4>
            <span className={`text-xs px-2 py-1 rounded ${
              tool.type === 'required' ? 'bg-red-100 text-red-800' :
              tool.type === 'recommended' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getTypeLabel(tool.type)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
          
          {tool.specification && (
            <p className="text-xs text-gray-500 mb-2">
              <strong>仕様:</strong> {tool.specification}
            </p>
          )}

          {showPrices && (
            <div className="text-sm font-medium text-gray-900">
              推定価格: ¥{tool.estimatedPrice.toLocaleString()}
              {tool.quantity > 1 && <span className="text-gray-500 ml-1">({tool.quantity}個)</span>}
            </div>
          )}
        </div>

        <button
          onClick={onToggleExpansion}
          className="text-gray-400 hover:text-gray-600"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* 展開された詳細情報 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {/* 使用のコツ */}
          {tool.tips && tool.tips.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">💡 使用のコツ</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                {tool.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 代替品 */}
          {tool.alternatives && tool.alternatives.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">🔄 代替品</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                {tool.alternatives.map((alt, index) => (
                  <li key={index}>• {alt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 購入リンク */}
          {showPrices && tool.purchaseLinks.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">🛒 購入先</h5>
              <div className="space-y-2">
                {tool.purchaseLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium capitalize">{link.store}</span>
                      <span className="text-xs text-gray-500">
                        ¥{link.price.toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        link.availability === 'in_stock' ? 'bg-green-100 text-green-800' :
                        link.availability === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {link.availability === 'in_stock' ? '在庫あり' :
                         link.availability === 'limited' ? '在庫僅少' : '在庫なし'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {link.shippingDays}日配送
                      </span>
                    </div>
                    <button
                      onClick={() => onPurchaseClick?.(tool, link)}
                      disabled={link.availability === 'out_of_stock'}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      <span>購入</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolDatabase;
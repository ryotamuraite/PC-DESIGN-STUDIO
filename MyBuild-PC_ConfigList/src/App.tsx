// src/App.tsx
import React, { useState } from 'react';
import { PCConfiguration, Part, PartCategory } from './types';
import PowerCalculator from './components/calculators/PowerCalculator';
import CompatibilityChecker from './components/checkers/CompatibilityChecker';
import ConfigSummary from './components/summary/ConfigSummary';
import { sampleParts, getPartsByCategory, compatibleCombinations } from './data/sampleParts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'power' | 'compatibility'>('builder');
  const [configuration, setConfiguration] = useState<PCConfiguration>({
    id: 'config-1',
    name: 'My PC Build',
    parts: {
      cpu: null,
      gpu: null,
      motherboard: null,
      memory: null,
      storage: null,
      psu: null,
      case: null,
      cooler: null,
      monitor: null
    },
    totalPrice: 0,
    budget: 150000,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: '',
    tags: []
  });

  // パーツ選択処理
  const selectPart = (category: PartCategory, part: Part | null) => {
    setConfiguration(prev => {
      const newParts = { ...prev.parts, [category]: part };
      const totalPrice = Object.values(newParts).reduce((sum, p) => sum + (p?.price || 0), 0);
      return {
        ...prev,
        parts: newParts,
        totalPrice,
        updatedAt: new Date()
      };
    });
  };

  // テスト用構成ロード
  const loadTestConfiguration = (configType: 'intel' | 'amd') => {
    const testConfig = compatibleCombinations[configType];
    const newParts: Partial<Record<PartCategory, Part>> = {};
    let totalPrice = 0;

    Object.entries(testConfig).forEach(([category, partId]) => {
      const part = sampleParts.find(p => p.id === partId);
      if (part) {
        newParts[category as PartCategory] = part;
        totalPrice += part.price;
      }
    });

    setConfiguration(prev => ({
      ...prev,
      parts: newParts,
      totalPrice,
      updatedAt: new Date()
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">MyBuild PC Config</h1>
            </div>
            
            {/* タブナビゲーション */}
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'builder'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                構成作成
              </button>
              <button
                onClick={() => setActiveTab('power')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'power'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                電力計算
              </button>
              <button
                onClick={() => setActiveTab('compatibility')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'compatibility'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                互換性チェック
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインエリア */}
          <div className="lg:col-span-2">
            {activeTab === 'builder' && (
              <div className="space-y-6">
                {/* 予算設定 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">予算設定</h2>
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">
                      予算上限:
                    </label>
                    <input
                      type="number"
                      value={configuration.budget || ''}
                      onChange={(e) => setConfiguration(prev => ({
                        ...prev,
                        budget: parseInt(e.target.value) || 0
                      }))}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm w-32"
                      placeholder="150000"
                    />
                    <span className="text-sm text-gray-600">円</span>
                  </div>
                  
                  {configuration.budget && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600">
                        現在の合計: 
                        <span className={`ml-2 font-semibold ${
                          configuration.totalPrice > configuration.budget ? 
                            'text-red-600' : 'text-green-600'
                        }`}>
                          ¥{configuration.totalPrice.toLocaleString()}
                          {configuration.totalPrice > configuration.budget && (
                            <span className="ml-2">
                              (¥{(configuration.totalPrice - configuration.budget).toLocaleString()} オーバー)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* クイックテスト機能 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックテスト</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    互換性チェックのテスト用に、事前設定された構成をロードできます。
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => loadTestConfiguration('intel')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Intel構成をロード
                    </button>
                    <button
                      onClick={() => loadTestConfiguration('amd')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      AMD構成をロード
                    </button>
                    <button
                      onClick={() => setConfiguration(prev => ({
                        ...prev,
                        parts: {
                          cpu: null,
                          gpu: null,
                          motherboard: null,
                          memory: null,
                          storage: null,
                          psu: null,
                          case: null,
                          cooler: null,
                          monitor: null
                        },
                        totalPrice: 0
                      }))}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
                    >
                      クリア
                    </button>
                  </div>
                </div>

                {/* 簡易パーツ選択 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">パーツ選択</h2>
                  <div className="space-y-6">
                    {(['cpu', 'motherboard', 'memory', 'gpu', 'psu', 'case'] as PartCategory[]).map(category => (
                      <PartSelector
                        key={category}
                        category={category}
                        selectedPart={configuration.parts[category]}
                        onSelect={(part) => selectPart(category, part)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'power' && (
              <div className="space-y-6">
                {/* PowerCalculatorコンポーネント */}
                <PowerCalculator 
                  configuration={configuration}
                  className="w-full"
                />

                {/* 追加情報パネル */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 電力効率tips */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">
                      💡 電力効率を向上させるコツ
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li>• 80+ Gold以上の認証電源を選択する</li>
                      <li>• 電源容量は必要量の1.2〜1.5倍程度に抑える</li>
                      <li>• 高効率なパーツを組み合わせる</li>
                      <li>• 適切な冷却で熱による効率低下を防ぐ</li>
                    </ul>
                  </div>

                  {/* 環境負荷情報 */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">
                      🌱 環境への影響
                    </h3>
                    <div className="text-sm text-green-800 space-y-2">
                      <p>年間CO₂排出量: 約520kg</p>
                      <p>年間電気代: 約¥15,600</p>
                      <p className="text-xs text-green-700 mt-3">
                        ※ 1日8時間使用、電力量料金27円/kWh、CO₂排出係数0.518kg-CO₂/kWhで計算
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compatibility' && (
              <div className="space-y-6">
                {/* CompatibilityCheckerコンポーネント */}
                <CompatibilityChecker 
                  configuration={configuration}
                  className="w-full"
                />

                {/* 互換性ガイド */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 互換性チェック項目 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      🔍 チェック項目
                    </h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• CPUソケット互換性</li>
                      <li>• メモリ規格・容量</li>
                      <li>• 電源コネクタ</li>
                      <li>• ケース内サイズ</li>
                      <li>• 冷却クリアランス</li>
                      <li>• 性能バランス</li>
                    </ul>
                  </div>

                  {/* 互換性のコツ */}
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-3">
                      💡 互換性確保のコツ
                    </h3>
                    <ul className="text-sm text-yellow-800 space-y-2">
                      <li>• マザーボード選択が最重要</li>
                      <li>• ケースサイズは余裕を持って</li>
                      <li>• 電源容量は20%以上のマージン</li>
                      <li>• 最新規格への対応を確認</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* サイドバー（構成サマリー） */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ConfigSummary 
                configuration={configuration}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// パーツ選択コンポーネント
const PartSelector: React.FC<{
  category: PartCategory;
  selectedPart: Part | null;
  onSelect: (part: Part | null) => void;
}> = ({ category, selectedPart, onSelect }) => {
  const parts = getPartsByCategory(category);
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

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {categoryNames[category]}
      </label>
      <select
        value={selectedPart?.id || ''}
        onChange={(e) => {
          const partId = e.target.value;
          if (partId) {
            const part = parts.find(p => p.id === partId);
            onSelect(part || null);
          } else {
            onSelect(null);
          }
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
      >
        <option value="">選択してください</option>
        {parts.map(part => (
          <option key={part.id} value={part.id}>
            {part.name} - ¥{part.price.toLocaleString()}
          </option>
        ))}
      </select>
      {selectedPart && (
        <p className="mt-1 text-xs text-gray-500">
          {selectedPart.manufacturer} | ¥{selectedPart.price.toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default App;
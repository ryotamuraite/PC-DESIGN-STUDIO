// src/App.tsx
import React, { useState } from 'react';
import { PowerCalculator } from './components/calculators/PowerCalculator';
import { PCConfiguration, Part, PartCategory } from './types';

// サンプルデータ（実際にはストアから取得）
const sampleConfiguration: PCConfiguration = {
  id: 'config-1',
  name: 'サンプル構成',
  parts: {
    cpu: {
      id: 'intel-i7-13700k',
      name: 'Intel Core i7-13700K',
      category: 'cpu' as PartCategory,
      price: 45000,
      manufacturer: 'Intel',
      specifications: {
        cores: 16,
        baseFreq: 3.4,
        maxFreq: 5.4,
        socket: 'LGA1700'
      }
    },
    gpu: {
      id: 'rtx-4080',
      name: 'NVIDIA GeForce RTX 4080',
      category: 'gpu' as PartCategory,
      price: 120000,
      manufacturer: 'NVIDIA',
      specifications: {
        memory: 16,
        memoryType: 'GDDR6X'
      }
    },
    motherboard: {
      id: 'mb-asus-z790',
      name: 'ASUS ROG STRIX Z790-E',
      category: 'motherboard' as PartCategory,
      price: 35000,
      manufacturer: 'ASUS',
      specifications: {
        socket: 'LGA1700',
        formFactor: 'ATX'
      }
    },
    memory: {
      id: 'ddr5-32gb-5600',
      name: 'Corsair Vengeance 32GB DDR5-5600',
      category: 'memory' as PartCategory,
      price: 25000,
      manufacturer: 'Corsair',
      specifications: {
        capacity: 32,
        speed: 5600,
        type: 'DDR5'
      }
    },
    storage: {
      id: 'nvme-2tb-980pro',
      name: 'Samsung 980 PRO 2TB NVMe SSD',
      category: 'storage' as PartCategory,
      price: 30000,
      manufacturer: 'Samsung',
      specifications: {
        capacity: 2000,
        type: 'NVMe'
      }
    },
    psu: {
      id: 'psu-corsair-rm850x',
      name: 'Corsair RM850x 850W 80+ Gold',
      category: 'psu' as PartCategory,
      price: 15000,
      manufacturer: 'Corsair',
      specifications: {
        capacity: 850,
        efficiency: '80+ Gold',
        modular: true
      }
    },
    case: {
      id: 'case-fractal-define-7',
      name: 'Fractal Design Define 7 Mid Tower',
      category: 'case' as PartCategory,
      price: 18000,
      manufacturer: 'Fractal Design',
      specifications: {
        formFactor: 'Mid Tower'
      }
    },
    cooler: {
      id: 'cooler-noctua-nh-d15',
      name: 'Noctua NH-D15 Air Cooler',
      category: 'cooler' as PartCategory,
      price: 12000,
      manufacturer: 'Noctua',
      specifications: {
        type: 'Air',
        maxTDP: 200
      }
    },
    monitor: {
      id: 'monitor-lg-27gp950',
      name: 'LG 27GP950-B 27" 4K 144Hz',
      category: 'monitor' as PartCategory,
      price: 65000,
      manufacturer: 'LG',
      specifications: {
        screenSize: 27,
        resolution: '3840x2160',
        refreshRate: 144
      }
    }
  },
  totalPrice: 365000,
  budget: 400000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: 'ハイエンドゲーミング構成'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'power'>('builder');
  const [configuration, setConfiguration] = useState<PCConfiguration>(sampleConfiguration);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">PC Builder</h1>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'builder'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                パーツ選択
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
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'builder' && (
          <div className="space-y-6">
            {/* 構成サマリー */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">現在の構成</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(configuration.parts).map(([category, part]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 capitalize mb-2">
                      {category}
                    </h3>
                    {part ? (
                      <div>
                        <p className="text-sm text-gray-800">{part.name}</p>
                        <p className="text-xs text-gray-600">¥{part.price.toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">未選択</p>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 価格サマリー */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">合計金額</span>
                  <span className="text-xl font-bold text-gray-900">
                    ¥{configuration.totalPrice.toLocaleString()}
                  </span>
                </div>
                {configuration.budget && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">予算</span>
                    <span className={
                      configuration.totalPrice > configuration.budget
                        ? 'text-red-600'
                        : 'text-green-600'
                    }>
                      ¥{configuration.budget.toLocaleString()}
                      {configuration.totalPrice > configuration.budget && (
                        <span className="ml-2">
                          (¥{(configuration.totalPrice - configuration.budget).toLocaleString()} オーバー)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* パーツ選択UI（実装省略） */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">パーツ選択</h2>
              <p className="text-gray-600">
                ここにパーツ選択UIが表示されます（Phase 1で実装済み）
              </p>
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
      </main>
    </div>
  );
};

export default App;
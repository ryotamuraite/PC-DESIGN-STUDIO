import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Part, PartCategory, PCConfiguration } from '@/types';
import type { UpgradeProposal } from '../../hooks/useUpgradeSimulatorWrapper';
import type { CurrentPCConfiguration } from '@/types/upgrade';

interface UpgradeInterfaceProps {
  currentConfig: PCConfiguration | CurrentPCConfiguration;
  selectedUpgrades: UpgradeProposal[];
  onUpgradesChange: (upgrades: UpgradeProposal[]) => void;
  budget: number;
  onBudgetChange: (budget: number) => void;
  targetUsage: string;
  onTargetUsageChange: (usage: string) => void;
  isSimulating: boolean;
  className?: string;
}

export const UpgradeInterface: React.FC<UpgradeInterfaceProps> = ({
  currentConfig,
  selectedUpgrades,
  onUpgradesChange,
  budget: _budget,
  onBudgetChange: _onBudgetChange,
  targetUsage: _targetUsage,
  onTargetUsageChange: _onTargetUsageChange,
  isSimulating: _isSimulating,
  className = ''
}) => {
  // 未使用のpropsを意図的に参照
  console.debug('UpgradeInterface props:', { _budget, _targetUsage, _isSimulating });
  void _onBudgetChange;
  void _onTargetUsageChange;
  
  // 型判定ヘルパー
  const isCurrentPCConfig = (config: PCConfiguration | CurrentPCConfiguration): config is CurrentPCConfiguration => {
    return 'currentParts' in config;
  };
  
  // パーツアクセスヘルパー
  const getPartForCategory = (config: PCConfiguration | CurrentPCConfiguration, category: PartCategory) => {
    if (isCurrentPCConfig(config)) {
      // CurrentPCConfigurationの場合、存在しないプロパティのチェック
      const validCategories = ['cpu', 'motherboard', 'memory', 'gpu', 'storage', 'psu', 'case', 'cooler', 'other'] as const;
      if (!validCategories.includes(category as (typeof validCategories)[number])) {
        return null;
      }
      const part = config.currentParts[category as keyof typeof config.currentParts];
      return Array.isArray(part) ? part[0] : part;
    }
    return config.parts?.[category];
  };
  const [activeTab, setActiveTab] = useState<PartCategory>('cpu');
  
  // パーツ選択ハンドラー実装
  const handlePartSelect = (category: PartCategory, part: Part) => {
    const upgradeProposal: UpgradeProposal = {
      category: category,
      currentPart: getPartForCategory(currentConfig, category) || null,
      newPart: part,
      reason: `${part.name}への交換により性能向上が期待されます`,
      priority: 'medium',
      cost: part.price,
      estimatedGain: Math.floor(Math.random() * 20) + 5 // 5-25%向上
    };
    
    const updatedUpgrades = [...selectedUpgrades, upgradeProposal];
    onUpgradesChange(updatedUpgrades);
  };
  
  // モックデータ（実際は外部から受け取る）
  const mockParts: Record<PartCategory, Part[]> = {
    cpu: [
      {
        id: 'cpu-1',
        name: 'Intel Core i7-13700K',
        category: 'cpu',
        manufacturer: 'Intel',
        price: 52800,
        specifications: {
          cores: 16,
          threads: 24,
          baseClock: 3.4,
          boostClock: 5.4,
          socket: 'LGA1700'
        }
      }
    ],
    gpu: [
      {
        id: 'gpu-1', 
        name: 'RTX 4070',
        category: 'gpu',
        manufacturer: 'NVIDIA',
        price: 89800,
        specifications: {
          memorySize: 12,
          memoryType: 'GDDR6X',
          coreClock: 2475,
          memoryClock: 21000
        }
      }
    ],
    memory: [],
    storage: [],
    motherboard: [],
    psu: [],
    case: [],
    cooler: [],
    monitor: [],
    other: []
  };

  const categories: { key: PartCategory; label: string; icon: string }[] = [
    { key: 'cpu', label: 'CPU', icon: '🔲' },
    { key: 'gpu', label: 'GPU', icon: '🎮' },
    { key: 'memory', label: 'メモリ', icon: '💾' },
    { key: 'storage', label: 'ストレージ', icon: '💿' },
    { key: 'motherboard', label: 'マザーボード', icon: '🔌' },
    { key: 'psu', label: '電源', icon: '⚡' },
    { key: 'case', label: 'ケース', icon: '📦' },
    { key: 'cooler', label: 'クーラー', icon: '🌀' },
  ];

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>アップグレード選択</span>
          <Badge variant="secondary">パーツを選択</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PartCategory)}>
          <TabsList className="grid w-full grid-cols-4 gap-1">
            {categories.slice(0, 4).map((category) => (
              <TabsTrigger key={category.key} value={category.key} className="text-xs">
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="mt-2">
            <TabsList className="grid w-full grid-cols-4 gap-1">
              {categories.slice(4).map((category) => (
                <TabsTrigger key={category.key} value={category.key} className="text-xs">
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="mt-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  {category.label}を選択
                </h3>
                
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {mockParts[category.key].length > 0 ? (
                    mockParts[category.key].map((part) => (
                      <div
                        key={part.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => handlePartSelect(category.key, part)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {part.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {part.manufacturer}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {Object.entries(part.specifications).slice(0, 2).map(([key, value]) => 
                                `${key}: ${value}`
                              ).join(' | ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-blue-600">
                              ¥{part.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-2xl mb-2">🔍</div>
                      <div className="text-sm">
                        {category.label}のデータを読み込み中...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UpgradeInterface;

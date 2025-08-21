// src/components/multi-part/MultiPartManager.tsx
// 🚧 Phase 2.5: 複数搭載対応システム管理UI

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle,
  Info,
  HardDrive,
  Monitor,
  Fan,
  Cpu,
  Layers,
  Settings,
  ShoppingCart
} from 'lucide-react';
import type { 
  ExtendedPCConfiguration, 
  Part, 
  PartCategory, 
  CoreComponents,
  AdditionalComponents,
  PhysicalLimits,
  SlotUsage 
} from '@/types';
import { categoryNames } from '@/data/sampleParts';
import { getMotherboardSpec, defaultMotherboardSpec } from '@/data/motherboardSpecs';
import { getCaseSpec, defaultCaseSpec } from '@/data/caseSpecs';
import PartSelectionDialog from './PartSelectionDialog';

export interface MultiPartManagerProps {
  configuration: ExtendedPCConfiguration;
  onConfigurationChange: (config: ExtendedPCConfiguration) => void;
  className?: string;
}

// 🚀 パーツ選択状態管理
interface PartSelectionState {
  isOpen: boolean;
  mode: 'core' | 'additional';
  category: PartCategory | keyof AdditionalComponents | null;
  title: string;
  description: string;
}

export const MultiPartManager: React.FC<MultiPartManagerProps> = ({
  configuration,
  onConfigurationChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'core' | 'additional' | 'limits'>('core');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['storage']));
  
  // 🎨 アニメーション状態管理
  const [animatingParts, setAnimatingParts] = useState<Set<string>>(new Set());
  const [recentChanges, setRecentChanges] = useState<Set<string>>(new Set());
  const [pulsingLimits, setPulsingLimits] = useState<Set<string>>(new Set());
  
  // 🚀 パーツ選択ダイアログ状態管理
  const [partSelection, setPartSelection] = useState<PartSelectionState>({
    isOpen: false,
    mode: 'core',
    category: null,
    title: '',
    description: ''
  });

  // 🚀 物理制限の自動計算（精密化版）
  const calculatedLimits = useMemo((): PhysicalLimits => {
    const { motherboard, case: pcCase } = configuration.coreComponents;
    
    // マザーボード仕様をデータベースから取得
    const mbSpec = getMotherboardSpec(motherboard?.specifications?.chipset as string) || defaultMotherboardSpec;
    
    // ケース仕様をデータベースから取得
    const caseSpec = getCaseSpec(pcCase?.specifications?.caseType as string) || defaultCaseSpec;
    
    return {
      maxM2Slots: mbSpec.physicalLimits.m2Slots,
      maxSataConnectors: mbSpec.physicalLimits.sataConnectors,
      maxMemorySlots: mbSpec.physicalLimits.memorySlots,
      maxFanMounts: caseSpec.fanSupport.totalMaxFans,
      maxGpuLength: caseSpec.componentLimits.maxGpuLength,
      maxCpuCoolerHeight: caseSpec.componentLimits.maxCpuCoolerHeight,
      maxPsuLength: caseSpec.componentLimits.maxPsuLength,
      maxExpansionSlots: mbSpec.physicalLimits.expansionSlots,
      maxPowerConnectors: 8 // PSU仕様から計算、とりあえずデフォルト値
    };
  }, [configuration.coreComponents]);

  // 🚀 スロット使用状況の自動計算
  const calculatedUsage = useMemo((): SlotUsage => {
    const { additionalComponents, coreComponents } = configuration;
    
    // M.2スロット使用数（NVMe SSDをカウント）
    const m2SlotsUsed = additionalComponents.storage.filter(
      storage => storage.specifications?.interface === 'NVMe'
    ).length;
    
    // SATAコネクタ使用数（SATA SSD/HDDをカウント）
    const sataConnectorsUsed = additionalComponents.storage.filter(
      storage => ['SATA', 'SATA3'].includes(storage.specifications?.interface as string)
    ).length;
    
    // メモリスロット使用数（基本 + 追加メモリ）
    const memorySlotUsed = (coreComponents.memory ? 1 : 0) + additionalComponents.memory.length;
    
    // ファンマウント使用数
    const fanMountsUsed = additionalComponents.fans.length;
    
    // 拡張スロット使用数
    const expansionSlotsUsed = additionalComponents.expansion.length;
    
    // 電源コネクタ使用数（概算）
    const powerConnectorsUsed = 
      (coreComponents.cpu ? 1 : 0) +
      (coreComponents.gpu ? 2 : 0) + // GPU は通常2つのコネクタ
      additionalComponents.expansion.length;
    
    return {
      m2SlotsUsed,
      sataConnectorsUsed,
      memorySlotUsed,
      fanMountsUsed,
      expansionSlotsUsed,
      powerConnectorsUsed
    };
  }, [configuration]);

  // 🚀 制限チェック
  const limitChecks = useMemo(() => {
    const violations: Array<{
      type: 'slot_overflow' | 'power_shortage' | 'physical_incompatible' | 'budget_exceeded';
      message: string;
      severity: 'warning' | 'error';
    }> = [];

    // スロット超過チェック
    if (calculatedUsage.m2SlotsUsed > calculatedLimits.maxM2Slots) {
      violations.push({
        type: 'slot_overflow',
        message: `M.2スロット数が超過しています (${calculatedUsage.m2SlotsUsed}/${calculatedLimits.maxM2Slots})`,
        severity: 'error'
      });
    }

    if (calculatedUsage.sataConnectorsUsed > calculatedLimits.maxSataConnectors) {
      violations.push({
        type: 'slot_overflow',
        message: `SATAコネクタ数が超過しています (${calculatedUsage.sataConnectorsUsed}/${calculatedLimits.maxSataConnectors})`,
        severity: 'error'
      });
    }

    if (calculatedUsage.memorySlotUsed > calculatedLimits.maxMemorySlots) {
      violations.push({
        type: 'slot_overflow',
        message: `メモリスロット数が超過しています (${calculatedUsage.memorySlotUsed}/${calculatedLimits.maxMemorySlots})`,
        severity: 'error'
      });
    }

    if (calculatedUsage.fanMountsUsed > calculatedLimits.maxFanMounts) {
      violations.push({
        type: 'slot_overflow',
        message: `ファンマウント数が超過しています (${calculatedUsage.fanMountsUsed}/${calculatedLimits.maxFanMounts})`,
        severity: 'warning'
      });
    }

    // 予算チェック
    if (configuration.budget && configuration.totalPrice > configuration.budget) {
      violations.push({
        type: 'budget_exceeded',
        message: `予算を超過しています (¥${configuration.totalPrice.toLocaleString()}/${configuration.budget.toLocaleString()})`,
        severity: 'warning'
      });
    }

    return {
      isValid: violations.filter(v => v.severity === 'error').length === 0,
      violations
    };
  }, [calculatedLimits, calculatedUsage, configuration.totalPrice, configuration.budget]);

  // 🚀 設定更新ヘルパー
  const updateConfiguration = useCallback((updates: Partial<ExtendedPCConfiguration>) => {
    const updatedConfig: ExtendedPCConfiguration = {
      ...configuration,
      ...updates,
      physicalLimits: calculatedLimits,
      slotUsage: calculatedUsage,
      limitChecks,
      updatedAt: new Date()
    };
    onConfigurationChange(updatedConfig);
  }, [configuration, calculatedLimits, calculatedUsage, limitChecks, onConfigurationChange]);

  // 🚀 パーツ選択ダイアログを開く関数
  const openPartSelectionDialog = useCallback(({
    mode,
    category,
    title,
    description
  }: {
    mode: 'core' | 'additional';
    category: PartCategory | keyof AdditionalComponents;
    title: string;
    description: string;
  }) => {
    setPartSelection({
      isOpen: true,
      mode,
      category,
      title,
      description
    });
  }, []);

  // 🎨 アニメーション効果
  const triggerPartAnimation = useCallback((partId: string) => {
    setAnimatingParts(prev => new Set(prev).add(partId));
    setRecentChanges(prev => new Set(prev).add(partId));
    
    setTimeout(() => {
      setAnimatingParts(prev => {
        const newSet = new Set(prev);
        newSet.delete(partId);
        return newSet;
      });
    }, 300);
    
    setTimeout(() => {
      setRecentChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(partId);
        return newSet;
      });
    }, 2000);
  }, []);
  
  const triggerLimitPulse = useCallback((limitType: string) => {
    setPulsingLimits(prev => new Set(prev).add(limitType));
    
    setTimeout(() => {
      setPulsingLimits(prev => {
        const newSet = new Set(prev);
        newSet.delete(limitType);
        return newSet;
      });
    }, 1000);
  }, []);
  
  // 制限違反時のパルス効果
  useEffect(() => {
    limitChecks.violations.forEach(violation => {
      if (violation.type === 'slot_overflow') {
        triggerLimitPulse('slots');
      }
    });
  }, [limitChecks.violations, triggerLimitPulse]);

  // 🚀 パーツ選択処理
  const handlePartSelection = useCallback((part: Part) => {
    if (partSelection.mode === 'core') {
      // 必須パーツの選択
      const updatedCoreComponents = {
        ...configuration.coreComponents,
        [partSelection.category as keyof CoreComponents]: part
      };
      
      updateConfiguration({
        coreComponents: updatedCoreComponents,
        totalPrice: calculateTotalPrice(updatedCoreComponents, configuration.additionalComponents)
      });
      
      // 🎨 アニメーション効果
      triggerPartAnimation(part.id);
    } else if (partSelection.mode === 'additional') {
      // 追加パーツの選択
      const category = partSelection.category as keyof AdditionalComponents;
      const updatedAdditionalComponents = {
        ...configuration.additionalComponents,
        [category]: [...configuration.additionalComponents[category], part]
      };
      
      updateConfiguration({
        additionalComponents: updatedAdditionalComponents,
        totalPrice: calculateTotalPrice(configuration.coreComponents, updatedAdditionalComponents)
      });
      
      // 🎨 アニメーション効果
      triggerPartAnimation(part.id);
    }
    
    // ダイアログを閉じる
    setPartSelection(prev => ({ ...prev, isOpen: false }));
  }, [partSelection, configuration, updateConfiguration]);

  // 🚀 必須パーツ管理
  const handleCorePartSelect = useCallback((category: keyof CoreComponents) => {
    openPartSelectionDialog({
      mode: 'core',
      category: category as PartCategory,
      title: `${categoryNames[category as PartCategory] || category}を選択`,
      description: `必須パーツの${categoryNames[category as PartCategory] || category}を選択してください`
    });
  }, [openPartSelectionDialog]);

  const handleCorePartRemove = useCallback((category: keyof CoreComponents) => {
    const removedPart = configuration.coreComponents[category];
    
    const updatedCoreComponents = {
      ...configuration.coreComponents,
      [category]: null
    };
    
    updateConfiguration({
      coreComponents: updatedCoreComponents,
      totalPrice: calculateTotalPrice(updatedCoreComponents, configuration.additionalComponents)
    });
    
    // 🎨 アニメーション効果
    if (removedPart) {
      triggerPartAnimation(removedPart.id);
    }
  }, [configuration, updateConfiguration, triggerPartAnimation]);

  // 🚀 追加パーツ管理
  const handleAdditionalPartAdd = useCallback((category: keyof AdditionalComponents) => {
    openPartSelectionDialog({
      mode: 'additional',
      category,
      title: `${categoryNames[category as PartCategory] || category}を追加`,
      description: `追加する${categoryNames[category as PartCategory] || category}を選択してください`
    });
  }, [openPartSelectionDialog]);

  const handleAdditionalPartRemove = useCallback((category: keyof AdditionalComponents, index: number) => {
    const removedPart = configuration.additionalComponents[category][index];
    const updatedParts = [...configuration.additionalComponents[category]];
    updatedParts.splice(index, 1);
    
    const updatedAdditionalComponents = {
      ...configuration.additionalComponents,
      [category]: updatedParts
    };
    
    updateConfiguration({
      additionalComponents: updatedAdditionalComponents,
      totalPrice: calculateTotalPrice(configuration.coreComponents, updatedAdditionalComponents)
    });
    
    // 🎨 アニメーション効果
    if (removedPart) {
      triggerPartAnimation(removedPart.id);
    }
  }, [configuration, updateConfiguration, triggerPartAnimation]);

  // 🚀 価格計算ヘルパー
  const calculateTotalPrice = (coreComponents: CoreComponents, additionalComponents: AdditionalComponents): number => {
    let total = 0;
    
    // 必須パーツの価格
    Object.values(coreComponents).forEach(part => {
      if (part) total += part.price;
    });
    
    // 追加パーツの価格
    Object.values(additionalComponents).forEach(partArray => {
      partArray.forEach(part => total += part.price);
    });
    
    return total;
  };

  // 🚀 カテゴリ展開管理
  const toggleCategory = useCallback((category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  }, [expandedCategories]);

  // 🚀 価格フォーマット
  const formatPrice = (price: number) => price.toLocaleString('ja-JP');

  // 🚀 使用率計算
  const getUsagePercentage = (used: number, max: number) => Math.min((used / max) * 100, 100);
  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-100';
    if (percentage >= 80) return 'text-orange-600 bg-orange-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            🚧 複数搭載対応システム
          </h2>
          
          <div className="flex items-center space-x-2">
            {!limitChecks.isValid && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                制限違反あり
              </span>
            )}
            {limitChecks.isValid && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                制限OK
              </span>
            )}
            <span className="text-sm text-gray-600">
              合計: ¥{formatPrice(configuration.totalPrice)}
            </span>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('core')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'core'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Cpu className="w-4 h-4 inline mr-2" />
            必須パーツ
          </button>
          <button
            onClick={() => setActiveTab('additional')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'additional'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            追加パーツ
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'limits'
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            制限状況
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-6">
        {/* 必須パーツタブ */}
        {activeTab === 'core' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-6">
              各カテゴリ1つずつ必要な基本パーツです。マザーボードとケースの選択で物理制限が決まります。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(configuration.coreComponents).map(([category, part]) => (
                <div
                  key={category}
                  className={`border-2 rounded-lg p-4 transition-all duration-300 transform ${
                    part 
                      ? 'border-green-200 bg-green-50 scale-100' 
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:scale-105'
                  } ${
                    part && recentChanges.has(part.id) 
                      ? 'ring-2 ring-green-400 ring-opacity-75 animate-pulse' 
                      : ''
                  } ${
                    part && animatingParts.has(part.id)
                      ? 'transform scale-110 transition-transform duration-300'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {categoryNames[category as PartCategory] || category}
                    </h3>
                    {part ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  {part ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-800">{part.name}</p>
                      <p className="text-xs text-gray-600">{part.manufacturer}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-green-600">
                          ¥{formatPrice(part.price)}
                        </p>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleCorePartSelect(category as keyof CoreComponents)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="変更"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCorePartRemove(category as keyof CoreComponents)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="削除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">未選択</p>
                      <button
                        onClick={() => handleCorePartSelect(category as keyof CoreComponents)}
                        className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        パーツを選択
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 追加パーツタブ */}
        {activeTab === 'additional' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 mb-6">
              複数搭載可能なパーツです。物理制限内で自由に追加できます。
            </p>
            
            {Object.entries(configuration.additionalComponents).map(([category, parts]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryIcon = {
                storage: HardDrive,
                memory: Cpu,
                fans: Fan,
                monitors: Monitor,
                accessories: ShoppingCart,
                expansion: Layers
              }[category] || Plus;
              
              const IconComponent = categoryIcon;
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">
                        {categoryNames[category as PartCategory] || category}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {parts.length}個
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdditionalPartAdd(category as keyof AdditionalComponents);
                        }}
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="追加"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-gray-400">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4">
                      {parts.length > 0 ? (
                        <div className="space-y-3">
                          {parts.map((part, index) => (
                            <div
                            key={`${part.id}-${index}`}
                            className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 transition-all duration-300 transform ${
                            recentChanges.has(part.id) 
                              ? 'ring-2 ring-blue-400 ring-opacity-75 animate-pulse' 
                              : ''
                          } ${
                            animatingParts.has(part.id)
                              ? 'scale-110 shadow-lg'
                              : 'hover:shadow-md hover:scale-105'
                          }`}
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{part.name}</p>
                                <p className="text-xs text-gray-600">{part.manufacturer}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-bold text-gray-900">
                                  ¥{formatPrice(part.price)}
                                </span>
                                <button
                                  onClick={() => handleAdditionalPartRemove(category as keyof AdditionalComponents, index)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="削除"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <IconComponent className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 text-sm">まだパーツが追加されていません</p>
                          <button
                            onClick={() => handleAdditionalPartAdd(category as keyof AdditionalComponents)}
                            className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            最初のパーツを追加
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 制限状況タブ */}
        {activeTab === 'limits' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 mb-6">
              現在の物理制限と使用状況です。マザーボードとケースの仕様に基づいて自動計算されます。
            </p>
            
            {/* 制限警告 */}
            {limitChecks.violations.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className="text-sm font-semibold text-red-800">制限違反</h3>
                </div>
                <div className="space-y-1">
                  {limitChecks.violations.map((violation, index) => (
                    <p key={index} className="text-sm text-red-700">
                      {violation.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {/* 使用状況グリッド */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* M.2スロット */}
              <div className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                pulsingLimits.has('slots') ? 'ring-2 ring-red-400 ring-opacity-75 animate-pulse' : ''
              }`}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">M.2スロット</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {calculatedUsage.m2SlotsUsed}/{calculatedLimits.maxM2Slots}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    getUsageColor(getUsagePercentage(calculatedUsage.m2SlotsUsed, calculatedLimits.maxM2Slots))
                  }`}>
                    {Math.round(getUsagePercentage(calculatedUsage.m2SlotsUsed, calculatedLimits.maxM2Slots))}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage(calculatedUsage.m2SlotsUsed, calculatedLimits.maxM2Slots) >= 100 
                        ? 'bg-red-600' 
                        : getUsagePercentage(calculatedUsage.m2SlotsUsed, calculatedLimits.maxM2Slots) >= 80 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${getUsagePercentage(calculatedUsage.m2SlotsUsed, calculatedLimits.maxM2Slots)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* SATAコネクタ */}
              <div className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                pulsingLimits.has('slots') ? 'ring-2 ring-red-400 ring-opacity-75 animate-pulse' : ''
              }`}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">SATAコネクタ</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {calculatedUsage.sataConnectorsUsed}/{calculatedLimits.maxSataConnectors}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    getUsageColor(getUsagePercentage(calculatedUsage.sataConnectorsUsed, calculatedLimits.maxSataConnectors))
                  }`}>
                    {Math.round(getUsagePercentage(calculatedUsage.sataConnectorsUsed, calculatedLimits.maxSataConnectors))}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage(calculatedUsage.sataConnectorsUsed, calculatedLimits.maxSataConnectors) >= 100 
                        ? 'bg-red-600' 
                        : getUsagePercentage(calculatedUsage.sataConnectorsUsed, calculatedLimits.maxSataConnectors) >= 80 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${getUsagePercentage(calculatedUsage.sataConnectorsUsed, calculatedLimits.maxSataConnectors)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* メモリスロット */}
              <div className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                pulsingLimits.has('slots') ? 'ring-2 ring-red-400 ring-opacity-75 animate-pulse' : ''
              }`}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">メモリスロット</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {calculatedUsage.memorySlotUsed}/{calculatedLimits.maxMemorySlots}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    getUsageColor(getUsagePercentage(calculatedUsage.memorySlotUsed, calculatedLimits.maxMemorySlots))
                  }`}>
                    {Math.round(getUsagePercentage(calculatedUsage.memorySlotUsed, calculatedLimits.maxMemorySlots))}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage(calculatedUsage.memorySlotUsed, calculatedLimits.maxMemorySlots) >= 100 
                        ? 'bg-red-600' 
                        : getUsagePercentage(calculatedUsage.memorySlotUsed, calculatedLimits.maxMemorySlots) >= 80 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${getUsagePercentage(calculatedUsage.memorySlotUsed, calculatedLimits.maxMemorySlots)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* ファンマウント */}
              <div className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                pulsingLimits.has('slots') ? 'ring-2 ring-orange-400 ring-opacity-75 animate-pulse' : ''
              }`}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">ファンマウント</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {calculatedUsage.fanMountsUsed}/{calculatedLimits.maxFanMounts}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    getUsageColor(getUsagePercentage(calculatedUsage.fanMountsUsed, calculatedLimits.maxFanMounts))
                  }`}>
                    {Math.round(getUsagePercentage(calculatedUsage.fanMountsUsed, calculatedLimits.maxFanMounts))}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage(calculatedUsage.fanMountsUsed, calculatedLimits.maxFanMounts) >= 100 
                        ? 'bg-red-600' 
                        : getUsagePercentage(calculatedUsage.fanMountsUsed, calculatedLimits.maxFanMounts) >= 80 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${getUsagePercentage(calculatedUsage.fanMountsUsed, calculatedLimits.maxFanMounts)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* 拡張スロット */}
              <div className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                pulsingLimits.has('slots') ? 'ring-2 ring-red-400 ring-opacity-75 animate-pulse' : ''
              }`}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">拡張スロット</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {calculatedUsage.expansionSlotsUsed}/{calculatedLimits.maxExpansionSlots}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    getUsageColor(getUsagePercentage(calculatedUsage.expansionSlotsUsed, calculatedLimits.maxExpansionSlots))
                  }`}>
                    {Math.round(getUsagePercentage(calculatedUsage.expansionSlotsUsed, calculatedLimits.maxExpansionSlots))}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage(calculatedUsage.expansionSlotsUsed, calculatedLimits.maxExpansionSlots) >= 100 
                        ? 'bg-red-600' 
                        : getUsagePercentage(calculatedUsage.expansionSlotsUsed, calculatedLimits.maxExpansionSlots) >= 80 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${getUsagePercentage(calculatedUsage.expansionSlotsUsed, calculatedLimits.maxExpansionSlots)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* 電源コネクタ */}
              <div className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                pulsingLimits.has('slots') ? 'ring-2 ring-red-400 ring-opacity-75 animate-pulse' : ''
              }`}>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">電源コネクタ</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {calculatedUsage.powerConnectorsUsed}/{calculatedLimits.maxPowerConnectors}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    getUsageColor(getUsagePercentage(calculatedUsage.powerConnectorsUsed, calculatedLimits.maxPowerConnectors))
                  }`}>
                    {Math.round(getUsagePercentage(calculatedUsage.powerConnectorsUsed, calculatedLimits.maxPowerConnectors))}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage(calculatedUsage.powerConnectorsUsed, calculatedLimits.maxPowerConnectors) >= 100 
                        ? 'bg-red-600' 
                        : getUsagePercentage(calculatedUsage.powerConnectorsUsed, calculatedLimits.maxPowerConnectors) >= 80 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${getUsagePercentage(calculatedUsage.powerConnectorsUsed, calculatedLimits.maxPowerConnectors)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* 制限情報 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Info className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-sm font-semibold text-blue-800">制限について</h3>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• 物理制限は選択したマザーボードとケースの仕様に基づいて自動計算されます</p>
                <p>• M.2スロットとSATAコネクタの使用数はストレージの接続方式で決まります</p>
                <p>• メモリスロットは基本メモリ + 追加メモリの合計数です</p>
                <p>• 制限を超過した場合、警告またはエラーが表示されます</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 🚀 パーツ選択ダイアログ */}
      <PartSelectionDialog
        isOpen={partSelection.isOpen}
        onClose={() => setPartSelection(prev => ({ ...prev, isOpen: false }))}
        onPartSelect={handlePartSelection}
        targetCategory={partSelection.category as PartCategory}
        currentConfiguration={configuration}
        title={partSelection.title}
        description={partSelection.description}
      />
    </div>
  );
};

export default MultiPartManager;
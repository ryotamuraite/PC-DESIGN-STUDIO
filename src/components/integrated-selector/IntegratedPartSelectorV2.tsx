// src/components/integrated-selector/IntegratedPartSelectorV2.tsx
// 🎯 統合パーツ選択UI v2 - 新UIコンポーネント統合版

import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import type { Part, PartCategory, PCConfiguration } from '@/types';

// 新規作成したコンポーネント
import BudgetQuickTest from './BudgetQuickTest';
import PartCategoryRow from './PartCategoryRow';
import SearchPanel from './SearchPanel';

// サンプルデータ（後で実データに置き換え）
import { sampleParts, compatibleCombinations } from '@/data/sampleParts';

interface IntegratedPartSelectorV2Props {
  configuration: PCConfiguration;
  onPartSelect: (category: PartCategory, part: Part | null) => void;
  budget: number;
  onBudgetChange: (budget: number) => void;
  className?: string;
}

// カテゴリ設定
const CATEGORIES_CONFIG = {
  // 必須・単一選択カテゴリ
  single: [
    { key: 'cpu', name: 'CPU', required: true },
    { key: 'motherboard', name: 'マザーボード', required: true },
    { key: 'gpu', name: 'グラフィックボード', required: true },
    { key: 'psu', name: '電源ユニット', required: true },
    { key: 'case', name: 'PCケース', required: true },
    { key: 'cooler', name: 'CPUクーラー', required: true },
  ],
  // 複数選択可能カテゴリ
  multiple: [
    { key: 'storage', name: 'ストレージ', required: false },
    { key: 'memory', name: 'メモリ', required: false },
  ],
  // オプションカテゴリ
  optional: [
    { key: 'monitor', name: 'モニター', required: false },
  ]
};

export const IntegratedPartSelectorV2: React.FC<IntegratedPartSelectorV2Props> = ({
  configuration,
  onPartSelect,
  budget,
  onBudgetChange,
  className = ''
}) => {
  // 検索パネルの開閉状態（排他制御）
  const [activeSearchCategory, setActiveSearchCategory] = useState<string | null>(null);
  
  // 手動追加モーダル状態
  const [, setManualAddCategory] = useState<string | null>(null);

  // スロット情報の計算（マザーボード選択時）
  const getSlotInfo = useCallback((category: string) => {
    const motherboard = configuration.parts.motherboard;
    if (!motherboard || !motherboard.specifications) return undefined;
    
    const specs = motherboard.specifications;
    
    if (category === 'storage') {
      const m2Slots = specs.m2Slots || 2;
      const sataSlots = specs.sataConnectors || 4;
      
      // 現在の使用状況を計算（簡易版）
      const storageArray = Array.isArray(configuration.parts.storage) 
        ? configuration.parts.storage 
        : (configuration.parts.storage ? [configuration.parts.storage] : []);
      
      const m2Used = storageArray.filter(s => s?.specifications?.interface === 'M.2').length;
      const sataUsed = storageArray.filter(s => s?.specifications?.interface === 'SATA').length;
      
      return {
        m2: { used: m2Used, max: m2Slots },
        sata: { used: sataUsed, max: sataSlots }
      };
    }
    
    if (category === 'memory') {
      const memorySlots = specs.memorySlots || 4;
      const memoryArray = Array.isArray(configuration.parts.memory)
        ? configuration.parts.memory
        : (configuration.parts.memory ? [configuration.parts.memory] : []);
      
      return {
        total: { used: memoryArray.length, max: memorySlots }
      };
    }
    
    return undefined;
  }, [configuration.parts]);

  // 互換性警告の取得（簡易版）
  const getCompatibilityWarning = useCallback((category: string) => {
    // CPUとマザーボードのソケット互換性チェック
    if (category === 'cpu' || category === 'motherboard') {
      const cpu = configuration.parts.cpu;
      const motherboard = configuration.parts.motherboard;
      
      if (cpu && motherboard) {
        const cpuSocket = cpu.specifications?.socket;
        const mbSocket = motherboard.specifications?.socket;
        
        if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
          return `ソケット不一致: CPU(${cpuSocket}) ≠ マザーボード(${mbSocket})`;
        }
      }
    }
    
    return undefined;
  }, [configuration.parts]);

  // クイックテスト処理
  const handleQuickTest = useCallback((type: 'intel' | 'amd' | 'clear') => {
    if (type === 'clear') {
      // 全パーツクリア
      Object.keys(configuration.parts).forEach(category => {
        onPartSelect(category as PartCategory, null);
      });
      return;
    }
    
    // テスト構成ロード
    const testConfig = compatibleCombinations[type];
    Object.entries(testConfig).forEach(([category, partId]) => {
      const part = sampleParts.find(p => p.id === partId);
      if (part) {
        onPartSelect(category as PartCategory, part);
      }
    });
  }, [configuration.parts, onPartSelect]);

  // 検索パネル開閉
  const handleSearchClick = useCallback((category: string) => {
    setActiveSearchCategory(activeSearchCategory === category ? null : category);
  }, [activeSearchCategory]);

  // 手動追加
  const handleManualAddClick = useCallback((category: string) => {
    setManualAddCategory(category);
    // TODO: 手動追加モーダル表示
    alert(`手動追加機能は実装中です: ${category}`);
  }, []);

  // パーツ変更
  const handleChangeClick = useCallback((category: string) => {
    // 変更ボタンクリックで検索パネルを開く
    setActiveSearchCategory(category);
  }, []);

  // パーツ削除  
  const handleDeleteClick = useCallback((category: string) => {
    onPartSelect(category as PartCategory, null);
  }, [onPartSelect]);

  // パーツ選択（検索パネルから）
  const handlePartSelectFromSearch = useCallback((category: string, part: Part) => {
    onPartSelect(category as PartCategory, part);
    setActiveSearchCategory(null); // 選択後に検索パネルを閉じる
  }, [onPartSelect]);

  // 複数選択カテゴリの追加
  const handleAddMore = useCallback((category: string) => {
    setActiveSearchCategory(category);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 予算設定＋クイックテスト */}
      <BudgetQuickTest
        budget={budget}
        totalPrice={configuration.totalPrice}
        onBudgetChange={onBudgetChange}
        onQuickTest={handleQuickTest}
      />

      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            🚀 構成パーツ選択
          </h2>
          <button
            onClick={() => handleManualAddClick('other')}
            className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
          >
            <Plus size={16} />
            パーツ追加
          </button>
        </div>
      </div>

      {/* パーツカテゴリリスト */}
      <div className="space-y-3">
        {/* 必須・単一選択カテゴリ */}
        {CATEGORIES_CONFIG.single.map(category => {
          const part = configuration.parts[category.key as PartCategory];
          const compatibilityWarning = getCompatibilityWarning(category.key);
          
          return (
            <div key={category.key}>
              <PartCategoryRow
                category={category.name}
                categoryKey={category.key}
                displayName={category.name}
                required={category.required}
                multiple={false}
                parts={part || null}
                compatibilityWarning={compatibilityWarning}
                onSearchClick={() => handleSearchClick(category.key)}
                onManualAddClick={() => handleManualAddClick(category.key)}
                onChangeClick={() => handleChangeClick(category.key)}
                onDeleteClick={() => handleDeleteClick(category.key)}
              />
              
              {/* 検索パネル（展開時） */}
              {activeSearchCategory === category.key && (
                <SearchPanel
                  category={category.name}
                  categoryKey={category.key}
                  isOpen={true}
                  onClose={() => setActiveSearchCategory(null)}
                  onPartSelect={(part) => handlePartSelectFromSearch(category.key, part)}
                  existingParts={part ? [part] : []}
                />
              )}
            </div>
          );
        })}

        {/* 複数選択可能カテゴリ */}
        {CATEGORIES_CONFIG.multiple.map(category => {
          const parts = configuration.parts[category.key as PartCategory];
          const partsArray = Array.isArray(parts) ? parts : (parts ? [parts] : []);
          const slotInfo = getSlotInfo(category.key);
          
          return (
            <div key={category.key}>
              <PartCategoryRow
                category={category.name}
                categoryKey={category.key}
                displayName={category.name}
                required={category.required}
                multiple={true}
                parts={partsArray}
                slotInfo={slotInfo as {
                  m2?: { used: number; max: number; };
                  sata?: { used: number; max: number; };
                  total?: { used: number; max: number; };
                } | undefined}
                onSearchClick={() => handleSearchClick(category.key)}
                onManualAddClick={() => handleManualAddClick(category.key)}
                onChangeClick={() => handleChangeClick(category.key)}
                onDeleteClick={() => handleDeleteClick(category.key)}
                onAddMoreClick={() => handleAddMore(category.key)}
              />
              
              {/* 検索パネル（展開時） */}
              {activeSearchCategory === category.key && (
                <SearchPanel
                  category={category.name}
                  categoryKey={category.key}
                  isOpen={true}
                  onClose={() => setActiveSearchCategory(null)}
                  onPartSelect={(part) => handlePartSelectFromSearch(category.key, part)}
                  existingParts={partsArray}
                />
              )}
            </div>
          );
        })}

        {/* オプションカテゴリ */}
        {CATEGORIES_CONFIG.optional.map(category => {
          const part = configuration.parts[category.key as PartCategory];
          
          if (!part) return null; // 未選択の場合は表示しない
          
          return (
            <div key={category.key}>
              <PartCategoryRow
                category={category.name}
                categoryKey={category.key}
                displayName={category.name}
                required={category.required}
                multiple={false}
                parts={part}
                onSearchClick={() => handleSearchClick(category.key)}
                onManualAddClick={() => handleManualAddClick(category.key)}
                onChangeClick={() => handleChangeClick(category.key)}
                onDeleteClick={() => handleDeleteClick(category.key)}
              />
            </div>
          );
        })}
      </div>

      {/* デバッグ情報（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <div className="font-semibold mb-2">🔧 デバッグ情報</div>
          <div>選択パーツ数: {Object.values(configuration.parts).filter(p => p !== null).length}</div>
          <div>合計価格: ¥{configuration.totalPrice.toLocaleString()}</div>
          <div>予算: ¥{budget.toLocaleString()}</div>
          <div>アクティブ検索: {activeSearchCategory || 'なし'}</div>
        </div>
      )}
    </div>
  );
};

export default IntegratedPartSelectorV2;
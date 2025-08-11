// src/components/enhanced/EnhancedPartSelector.tsx
// 🎯 Phase 3-B: 構成選択とパーツ検索統合 - 手動入力対応強化版
import React, { useState, useCallback } from 'react';
import { Part, PartCategory } from '@/types';
import { getPartsByCategory } from '@/data/sampleParts';
import { useNotifications } from '@/hooks/useNotifications';

interface EnhancedPartSelectorProps {
  category: PartCategory;
  selectedPart: Part | null;
  onSelect: (part: Part | null) => void;
  allowMultiple?: boolean; // 🆕 複数選択対応（ストレージ等）
  selectedParts?: Part[]; // 🆕 複数選択時の選択済みパーツ
  onSelectMultiple?: (parts: Part[]) => void; // 🆕 複数選択コールバック
  showManualInput?: boolean; // 🆕 手動入力表示
  className?: string;
}

// 🆕 手動入力用の型
interface ManualPartInput {
  name: string;
  manufacturer: string;
  price: number;
  model?: string;
  specifications: Record<string, unknown>;
}

export const EnhancedPartSelector: React.FC<EnhancedPartSelectorProps> = ({
  category,
  selectedPart,
  onSelect,
  allowMultiple = false,
  selectedParts = [],
  onSelectMultiple,
  showManualInput = true,
  className = ""
}) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [manualInput, setManualInput] = useState<ManualPartInput>({
    name: "",
    manufacturer: "",
    price: 0,
    model: "",
    specifications: {}
  });

  const { success, warning } = useNotifications();

  // カテゴリ別パーツ一覧
  const parts = getPartsByCategory(category);
  
  // 検索フィルタリング
  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (part.model && part.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // カテゴリ表示名
  const categoryNames: Record<PartCategory, string> = {
    cpu: "CPU",
    motherboard: "マザーボード", 
    memory: "メモリ",
    storage: "ストレージ",
    gpu: "グラフィックボード",
    psu: "電源ユニット",
    case: "PCケース",
    cooler: "CPUクーラー",
    monitor: "モニター",
    other: "その他",
  };

  // 🆕 手動入力からパーツ作成
  const createManualPart = useCallback((): Part => {
    const newPart: Part = {
      id: `manual-${category}-${Date.now()}`,
      name: manualInput.name,
      category: category,
      price: manualInput.price,
      manufacturer: manualInput.manufacturer,
      specifications: {
        model: manualInput.model,
        ...manualInput.specifications,
        isManualInput: true // 🚀 手動入力フラグ
      },
      availability: 'in_stock',
      rating: 0,
      reviewCount: 0,
      lastScraped: new Date().toISOString()
    };
    return newPart;
  }, [manualInput, category]);

  // 🆕 手動入力保存
  const handleManualSave = useCallback(() => {
    if (!manualInput.name || !manualInput.manufacturer || manualInput.price <= 0) {
      warning(
        "入力不完全",
        "製品名、メーカー、価格をすべて入力してください",
        "手動入力"
      );
      return;
    }

    const newPart = createManualPart();
    
    if (allowMultiple && onSelectMultiple) {
      const newParts = [...selectedParts, newPart];
      onSelectMultiple(newParts);
    } else {
      onSelect(newPart);
    }

    // 成功通知
    success(
      "手動入力パーツを追加しました",
      `${manualInput.name} - ¥${manualInput.price.toLocaleString()}`,
      "手動入力"
    );

    // フォームリセット
    setManualInput({
      name: "",
      manufacturer: "",
      price: 0,
      model: "",
      specifications: {}
    });
    setShowManualForm(false);
  }, [manualInput, allowMultiple, selectedParts, onSelectMultiple, onSelect, success, warning, createManualPart]);

  // 通常パーツ選択
  const handlePartSelect = useCallback((part: Part) => {
    if (allowMultiple && onSelectMultiple) {
      const newParts = [...selectedParts, part];
      onSelectMultiple(newParts);
    } else {
      onSelect(part);
    }
  }, [allowMultiple, selectedParts, onSelectMultiple, onSelect]);

  // 🆕 複数選択パーツ削除
  const handleRemoveMultiplePart = useCallback((partToRemove: Part) => {
    if (allowMultiple && onSelectMultiple) {
      const newParts = selectedParts.filter(p => p.id !== partToRemove.id);
      onSelectMultiple(newParts);
    }
  }, [allowMultiple, selectedParts, onSelectMultiple]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {categoryNames[category]}
          {allowMultiple && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              複数選択可能
            </span>
          )}
        </label>
        
        {showManualInput && (
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>手動入力</span>
          </button>
        )}
      </div>

      {/* 🆕 複数選択表示エリア */}
      {allowMultiple && selectedParts.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            選択済み{categoryNames[category]} ({selectedParts.length}件)
          </h4>
          <div className="space-y-2">
            {selectedParts.map((part) => (
              <div
                key={part.id}
                className="flex items-center justify-between bg-white rounded-md p-3 border"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{part.name}</div>
                  <div className="text-xs text-gray-500">
                    {part.manufacturer} | ¥{part.price.toLocaleString()}
                    {part.specifications?.isManualInput === true && (
                      <span className="ml-2 text-orange-600">(手動入力)</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMultiplePart(part)}
                  className="ml-2 text-red-500 hover:text-red-700 p-1"
                  aria-label="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 検索バー */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`${categoryNames[category]}を検索...`}
          className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* パーツ選択ドロップダウン（単一選択モード） */}
      {!allowMultiple && (
        <select
          value={selectedPart?.id || ""}
          onChange={(e) => {
            const partId = e.target.value;
            if (partId) {
              const part = parts.find(p => p.id === partId);
              if (part) handlePartSelect(part);
            } else {
              onSelect(null);
            }
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          {filteredParts.map(part => (
            <option key={part.id} value={part.id}>
              {part.name} - ¥{part.price.toLocaleString()} ({part.manufacturer})
            </option>
          ))}
        </select>
      )}

      {/* パーツ一覧（複数選択モード） */}
      {allowMultiple && (
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
          {filteredParts.map(part => (
            <div
              key={part.id}
              className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{part.name}</div>
                <div className="text-xs text-gray-500">
                  {part.manufacturer} | ¥{part.price.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handlePartSelect(part)}
                className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                disabled={selectedParts.some(p => p.id === part.id)}
              >
                {selectedParts.some(p => p.id === part.id) ? "選択済み" : "追加"}
              </button>
            </div>
          ))}
          
          {filteredParts.length === 0 && searchTerm && (
            <div className="p-4 text-center text-gray-500 text-sm">
              "{searchTerm}" に一致するパーツが見つかりません
              {showManualInput && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    手動で追加しますか？
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🆕 手動入力フォーム */}
      {showManualForm && (
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              {categoryNames[category]}を手動入力
            </h4>
            <button
              onClick={() => setShowManualForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* 製品名 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                製品名 *
              </label>
              <input
                type="text"
                value={manualInput.name}
                onChange={(e) => setManualInput(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例: Core i7-13700K"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* メーカー・価格 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  メーカー *
                </label>
                <input
                  type="text"
                  value={manualInput.manufacturer}
                  onChange={(e) => setManualInput(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="例: Intel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  価格 (円) *
                </label>
                <input
                  type="number"
                  value={manualInput.price || ""}
                  onChange={(e) => setManualInput(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  placeholder="59800"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 型番（オプション） */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                型番・モデル
              </label>
              <input
                type="text"
                value={manualInput.model}
                onChange={(e) => setManualInput(prev => ({ ...prev, model: e.target.value }))}
                placeholder="例: BX8071513700K"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* アクションボタン */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleManualSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 選択中パーツ表示（単一選択モード） */}
      {!allowMultiple && selectedPart && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-blue-900">{selectedPart.name}</h4>
              <p className="text-sm text-blue-700 mt-1">
                {selectedPart.manufacturer} | ¥{selectedPart.price.toLocaleString()}
                {selectedPart.specifications?.isManualInput === true && (
                  <span className="ml-2 text-orange-600">(手動入力)</span>
                )}
              </p>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              削除
            </button>
          </div>
        </div>
      )}

      {/* ヘルプテキスト */}
      <div className="text-xs text-gray-500">
        {allowMultiple ? (
          <p>🔄 複数選択モード: 複数の{categoryNames[category]}を選択できます</p>
        ) : (
          <p>📝 検索で見つからない場合は「手動入力」をご利用ください</p>
        )}
      </div>
    </div>
  );
};

export default EnhancedPartSelector;
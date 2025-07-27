// src/components/layout/Header.tsx
import React from 'react';
import { Monitor } from 'lucide-react';
import PriceDisplay from '@/components/price/PriceDisplay';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴエリア */}
          <div className="flex items-center space-x-3">
            <Monitor className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">
                MyBuild PC
              </h1>
              <p className="text-sm text-slate-300">
                自作PC構成見積もりツール
              </p>
            </div>
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex items-center space-x-4">
            {/* 構成一覧ボタン */}
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 shadow-sm">
              構成一覧
            </button>

            {/* その他のボタン（必要に応じて） */}
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md transition-colors duration-200 border border-slate-600">
              保存済み
            </button>

            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 shadow-sm">
              新規作成
            </button>
          </div>

          {/* コンパクト価格表示（オプション） */}
          <div className="hidden lg:block">
            <PriceDisplay 
              compact={true}
              showBudgetComparison={true}
              className="max-w-xs"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
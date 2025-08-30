// src/components/layout/MainLayout.tsx
// レスポンシブレイアウト管理 - シンプル2パターン実装

import React from 'react';

interface MainLayoutProps {
  leftMenu: React.ReactNode;
  children: React.ReactNode;
  rightSidebar: React.ReactNode;
  menuOpen: boolean;
  onMenuClose?: () => void;
  isDesktop?: boolean;  // 1280px以上
  isSummaryOpen?: boolean;
  onSummaryClose?: () => void;
  onSummaryToggle?: () => void;
  onMenuToggle?: () => void;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  leftMenu,
  children,
  rightSidebar,
  menuOpen,
  onMenuClose,
  isDesktop = false,
  isSummaryOpen = false,
  onSummaryClose,
  onSummaryToggle,
  onMenuToggle,
  className = ''
}) => {
  
  // Desktop レイアウト (1280px以上) - 3カラム固定
  if (isDesktop) {
    return (
      <div className={`w-screen h-screen fixed inset-0 overflow-hidden flex flex-col ${className}`}>
        {/* メインコンテンツエリア（3カラム） */}
        <div className="flex-1 flex overflow-hidden bg-gray-50">
          {/* 左メニューエリア - 固定幅 */}
          <div 
            className={`bg-brand-primary-800 overflow-hidden transition-[width] duration-500 ease-in-out shadow-xl flex-shrink-0 ${
              menuOpen ? 'w-56' : 'w-16'
            }`}
          >
            {leftMenu}
          </div>

          {/* メインエリア - 残り全体を占める */}
          <div className="flex-1 bg-white overflow-hidden flex flex-col min-w-0">
            {/* メインコンテンツ */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>
            
            {/* 広告エリア - メインエリア下固定 */}
            <div className="bg-gradient-to-t from-gray-50 to-white h-16 flex items-center justify-center px-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-md p-2 w-full max-w-4xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">📢</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-blue-900">
                        広告スペース
                      </div>
                      <div className="text-xs text-blue-600">
                        最新情報をチェック
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                    詳細 ›
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右サマリーエリア - 固定幅 */}
          <div className="w-72 bg-gradient-to-b from-brand-primary-800 to-brand-primary-900 overflow-y-auto flex-shrink-0">
            {rightSidebar}
          </div>
        </div>
        
        {/* フッター - 完全固定 */}
        <div className="bg-gray-800 h-10 flex items-center justify-between px-6 border-t border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="text-xs text-white font-semibold">
              PC DESIGN STUDIO
            </div>
            <div className="text-xs text-gray-400">
              © 2025 Ryo Tamura
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    );
  }

  // Tablet/Mobile レイアウト (1279px以下) - 1カラム + スライドメニュー/サマリー
  return (
    <div className={`w-screen h-screen fixed inset-0 overflow-hidden flex flex-col ${className}`}>
      {/* ヘッダーエリア（メニュー/サマリーボタン） */}
      <div className="bg-white h-14 flex items-center justify-between px-4 border-b border-gray-200 relative z-50">
        {/* メニューボタン */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="メニュー"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* センタータイトル */}
        <div className="text-sm font-semibold text-gray-800">
          PC DESIGN STUDIO
        </div>

        {/* サマリーボタン */}
        <button
          onClick={onSummaryToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="サマリー"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* メインエリア（100%幅） */}
        <div className="w-full bg-white overflow-hidden flex flex-col">
          {/* メインコンテンツ */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {children}
          </div>
          
          {/* 広告エリア - メインエリア下固定 */}
          <div className="bg-gradient-to-t from-gray-50 to-white h-14 flex items-center justify-center px-3 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-md p-1.5 w-full border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs">📢</span>
                  </div>
                  <div className="text-xs text-blue-900">
                    広告スペース
                  </div>
                </div>
                <div className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                  詳細
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 左メニュー スライドオーバーレイ */}
        {menuOpen && (
          <>
            {/* 背景オーバーレイ */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 z-40" 
              onClick={onMenuClose}
              aria-label="メニューを閉じる"
            />
            {/* メニューパネル - 左からスライドイン */}
            <div className="absolute left-0 top-0 h-full w-56 bg-brand-primary-800 shadow-xl z-50 transform transition-transform duration-500 ease-in-out animate-slide-in-left">
              {leftMenu}
            </div>
          </>
        )}

        {/* 右サマリー スライドオーバーレイ */}
        {isSummaryOpen && (
          <>
            {/* 背景オーバーレイ */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 z-40" 
              onClick={onSummaryClose}
              aria-label="サマリーを閉じる"
            />
            {/* サマリーパネル - 右からスライドイン */}
            <div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-b from-brand-primary-800 to-brand-primary-900 shadow-xl z-50 transform transition-transform duration-500 ease-in-out animate-slide-in-right overflow-y-auto">
              <div className="p-4">
                {/* 閉じるボタン */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    構成サマリー
                  </h3>
                  <button
                    onClick={onSummaryClose}
                    className="p-2 hover:bg-brand-primary-700 rounded-lg transition-colors"
                    aria-label="閉じる"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* サマリーコンテンツ */}
                {rightSidebar}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* フッター - 完全固定 */}
      <div className="bg-gray-800 h-10 flex items-center justify-center px-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          PC DESIGN STUDIO | © 2025 Ryo Tamura
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
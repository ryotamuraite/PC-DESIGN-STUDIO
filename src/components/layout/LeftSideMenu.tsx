// src/components/layout/LeftSideMenu.tsx
// 左サイドメニューコンポーネント - 開閉制御・アニメーション対応

import React from "react";
import {
  Home,          // 統合ダッシュボード
  LayoutGrid,    // パーツ構成作成（squares-plus相当）
  Box,           // 3Dシミュレーター（cube相当）
  Zap,           // 消費電力計算（bolt相当）
  ClipboardCheck, // パーツ互換性チェック
  Search,        // パーツ検索
  BookOpen,      // About
  Info,          // Information
  Settings,      // 複数搭載（暫定）
  RotateCcw,     // 診断
  FileText,      // プランナー
  Target,        // シミュレーター
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// 画像アセットのインポート
import logoSvg from '/assets/logo.svg';
import faviconSvg from '/assets/favicon.svg';

// App.tsxのTabTypeをimport
type TabType =
  | "builder"
  | "multipart"
  | "upgrade"
  | "planner"
  | "simulator"
  | "power"
  | "compatibility"
  | "search"
  | "3d"
  | "integrated"
  | "about"
  | "information";

interface LeftSideMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  shouldShowPhase3Features?: boolean;
  isMobile?: boolean;  // モバイル判定追加
  className?: string;
}

// メニュー項目の定義
interface MenuItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  category: "main" | "tools" | "advanced" | "other";
  phase: number; // Phase制御用
}

const menuItems: MenuItem[] = [
  // メイン機能
  {
    id: "integrated",
    label: "統合ダッシュボード",
    icon: <Home className="w-5 h-5" />,
    category: "main",
    phase: 2.0,
  },
  {
    id: "builder",
    label: "パーツ構成作成",
    icon: <LayoutGrid className="w-5 h-5" />,
    category: "main",
    phase: 2.0,
  },
  {
    id: "3d",
    label: "3Dシミュレーター",
    icon: <Box className="w-5 h-5" />,
    category: "main",
    phase: 2.0,
  },
  {
    id: "multipart",
    label: "複数搭載",
    icon: <Settings className="w-5 h-5" />,
    category: "main",
    phase: 2.5,
  },

  // アドバンス機能 (Phase 3)
  {
    id: "upgrade",
    label: "診断",
    icon: <RotateCcw className="w-5 h-5" />,
    category: "advanced",
    phase: 3.0,
  },
  {
    id: "planner",
    label: "プランナー",
    icon: <FileText className="w-5 h-5" />,
    category: "advanced",
    phase: 3.0,
  },
  {
    id: "simulator",
    label: "シミュレーター",
    icon: <Target className="w-5 h-5" />,
    category: "advanced",
    phase: 3.0,
  },

  // ツール機能
  {
    id: "power",
    label: "消費電力計算",
    icon: <Zap className="w-5 h-5" />,
    category: "tools",
    phase: 2.0,
  },
  {
    id: "compatibility",
    label: "互換性チェック",
    icon: <ClipboardCheck className="w-5 h-5" />,
    category: "tools",
    phase: 2.0,
  },
  {
    id: "search",
    label: "パーツ検索",
    icon: <Search className="w-5 h-5" />,
    category: "tools",
    phase: 2.0,
  },

  // その他
  {
    id: "about",
    label: "About",
    icon: <BookOpen className="w-5 h-5" />,
    category: "other",
    phase: 2.0,
  },
  {
    id: "information",
    label: "Information",
    icon: <Info className="w-5 h-5" />,
    category: "other",
    phase: 2.0,
  },
];

export const LeftSideMenu: React.FC<LeftSideMenuProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  shouldShowPhase3Features = false,
  isMobile = false,
  className = "",
}) => {
  // Phase制御を適用したメニューアイテムをフィルタリング
  const currentPhase = shouldShowPhase3Features ? 3.0 : 2.5;
  const visibleMenuItems = menuItems.filter(item => item.phase <= currentPhase);

  // カテゴリ別にグループ化
  const mainItems = visibleMenuItems.filter(item => item.category === "main");
  const toolItems = visibleMenuItems.filter(item => item.category === "tools");
  const advancedItems = visibleMenuItems.filter(
    item => item.category === "advanced"
  );
  const otherItems = visibleMenuItems.filter(item => item.category === "other");

  const handleTabChange = (tabId: TabType) => {
    onTabChange(tabId);
  };

  // モバイル時は幅を固定（オーバーレイ表示のため）
  const widthClass = isMobile ? "w-56" : isOpen ? "w-56" : "w-16";
  
  return (
    <div
      className={`
        ${widthClass} 
        bg-gradient-to-b from-brand-primary-800 to-brand-primary-900 
        transition-all duration-300 ease-in-out 
        flex flex-col
        h-full
        ${className}
      `}
    >
      {/* ヘッダー部分 */}
      <div className="p-3 border-b border-brand-primary-700/50">
        {(isOpen || isMobile) ? (
          <div className="flex items-center justify-between">
            {/* ロゴエリア - 中央配置でサイズ拡大 */}
            <div className="flex items-center justify-center flex-1">
              <img
                src={logoSvg}
                alt="PC DESIGN STUDIO"
                className="h-12 w-auto max-w-full object-contain"
                onError={e => {
                  console.error("Logo failed to load:", e);
                  // フォールバック処理 - テキストを表示
                  const fallbackDiv = document.createElement('div');
                  fallbackDiv.className = 'text-white font-bold text-lg text-center';
                  fallbackDiv.textContent = 'PC DESIGN STUDIO';
                  e.currentTarget.parentNode?.replaceChild(fallbackDiv, e.currentTarget);
                }}
              />
            </div>

            {/* トグルボタン（モバイル時は閉じるボタン、デスクトップ時は折りたたみボタン） */}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg bg-brand-primary-700 hover:bg-brand-primary-600 text-white transition-colors duration-200 flex-shrink-0"
              aria-label={isMobile ? "メニューを閉じる" : "メニューを折りたたむ"}
            >
              {isMobile ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ロゴ */}
            <div className="w-8 h-8 flex items-center justify-center mx-auto">
              <img
                src={faviconSvg}
                alt="PC DESIGN STUDIO"
                className="w-8 h-8 object-contain"
                onError={e => {
                  console.error("Favicon failed to load:", e);
                  // フォールバック処理 - アイコンを表示
                  const fallbackDiv = document.createElement('div');
                  fallbackDiv.className = 'w-8 h-8 bg-brand-accent-300 text-brand-primary-900 rounded flex items-center justify-center font-bold';
                  fallbackDiv.textContent = 'PC';
                  e.currentTarget.parentNode?.replaceChild(fallbackDiv, e.currentTarget);
                }}
              />
            </div>

            {/* トグルボタン */}
            <div className="flex justify-center">
              <button
                onClick={onToggle}
                className="p-2 rounded-lg bg-brand-primary-700 hover:bg-brand-primary-600 text-white transition-colors duration-200"
                aria-label="メニューを開く"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* メニューコンテンツ */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col">
        <div className="space-y-3">
          {/* メイン機能セクション */}
          <MenuSection
            title="メイン機能"
            items={mainItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isOpen={isOpen}
            isMobile={isMobile}
          />

          {/* ツール機能セクション */}
          <MenuSection
            title="各種ツール"
            items={toolItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isOpen={isOpen}
            isMobile={isMobile}
          />

          {/* アドバンス機能セクション (Phase 3) */}
          {advancedItems.length > 0 && (
            <MenuSection
              title="アドバンス機能"
              items={advancedItems}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isOpen={isOpen}
              isMobile={isMobile}
              badge="Phase 3"
            />
          )}
        </div>
        
        {/* その他セクション - 下付けにするためのSpacer */}
        <div className="flex-1" />
        
        {/* その他セクション */}
        {otherItems.length > 0 && (
          <div className="pb-2">
            <MenuSection
              title="その他"
              items={otherItems}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isOpen={isOpen}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>

      {/* フッター部分 */}
      <div className="p-3 border-t border-brand-primary-700/50">
        {(isOpen || isMobile) ? (
          <div className="space-y-2">
            <div className="text-xs text-brand-accent-200">
              Phase {currentPhase} リリース
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-brand-accent-100">オンライン</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="text-xs text-brand-accent-200 transform -rotate-90 whitespace-nowrap">
              v{currentPhase}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// メニューセクションコンポーネント
interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
  isMobile?: boolean;
  badge?: string;
}

const MenuSection: React.FC<MenuSectionProps> = ({
  title,
  items,
  activeTab,
  onTabChange,
  isOpen,
  isMobile = false,
  badge,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="px-3">
      {/* セクションタイトル */}
      {(isOpen || isMobile) && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-brand-accent-200 uppercase tracking-wide">
            {title}
          </h3>
          {badge && (
            <span className="px-2 py-1 bg-brand-accent-300 text-brand-primary-900 text-xs rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* メニューアイテム */}
      <div className="flex flex-col gap-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              ${!isOpen ? "w-10 h-10" : "w-full"} flex items-center ${
              !isOpen ? "p-0" : "p-2"
            } rounded-lg transition-all duration-200 group
              ${
                activeTab === item.id
                  ? "bg-brand-accent-300 text-brand-primary-900"
                  : "bg-white/10 text-white hover:bg-brand-primary-700 hover:text-white backdrop-blur-sm"
              }
              ${!isOpen ? "justify-center" : "justify-start space-x-2"}
            `}
            title={!isOpen ? item.label : ""}
          >
            {/* アイコン */}
            <div
              className={`
              ${!isOpen ? "w-5 h-5 flex items-center justify-center" : ""}
              ${
                activeTab === item.id
                  ? "text-brand-primary-900"
                  : "text-current"
              }
            `}
            >
              {item.icon}
            </div>

            {/* ラベル */}
            {(isOpen || isMobile) && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LeftSideMenu;

// src/App.tsx - 広告エリア確保設計実装版
import { PCCaseViewer } from "@/components/3d";
import PowerCalculator from "@/components/calculators/PowerCalculator";
import CompatibilityChecker from "@/components/checkers/CompatibilityChecker";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { FigmaIntegratedDashboard } from "@/components/integrated";
import PartSearch from "@/components/search/PartSearch";
import ConfigSummary from "@/components/summary/ConfigSummary";
import { IntegratedPartSelector } from "@/components/integrated-selector";
// 🚧 Phase 2.5: 複数搭載対応システムインポート
import { MultiPartManager } from "@/components/multi-part";
// 🚧 Phase 3: アップグレード診断システムインポート
import { PCDiagnostic, UpgradePlanner, UpgradeSimulator } from "@/components/upgrade";
import { useUpgradePlanner } from "@/hooks/useUpgradePlanner";
import { BottleneckAnalysis, UpgradeRecommendation, SimulationResult } from "@/types/upgrade";
import {
  compatibleCombinations,
  sampleParts,
} from "@/data/sampleParts";
import { useNotifications } from "@/hooks/useNotifications";
import { useTabVisibility, TAB_VISIBILITY_PHASES } from "@/hooks/ui/useTabVisibility";
// 🚧 Phase 2.5: データ永続化統合
import { useExtendedConfiguration } from "@/hooks/useExtendedConfiguration";
import {
PCConfiguration, 
Part, 
PartCategory 
} from "@/types";
import { ExtendedPCConfiguration } from "@/types/extended";
import React, { useState } from "react";
// 🎨 ロゴファイルのimport - Viteベースパス対応
import logoSvg from "/assets/logo.svg";

// 統合ダッシュボード用の型定義（Phase 3: アップグレード診断・プランナー・シミュレータータブ追加）
type TabType =
  | "builder"
  | "multipart" // 🚧 Phase 2.5: 複数搭載対応システム
  | "upgrade"   // 🚧 Phase 3: アップグレード診断システム
  | "planner"   // 🚧 Phase 3: アップグレードプランナーシステム
  | "simulator" // 🎆 Phase 3 Week3: アップグレードシミュレーターシステム
  | "power"
  | "compatibility"
  | "search"
  | "3d"
  | "integrated";

// 🎯 新機能: 広告エリアコンポーネント
const AdArea: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 広告プレースホルダー1 */}
      <div className="bg-gradient-to-br from-orange-100 to-red-100 border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
        <div className="text-sm font-semibold text-orange-800 mb-2">
          📢 広告エリア A
        </div>
        <div className="text-xs text-orange-600 mb-3">
          推奨パーツ・セール情報等
        </div>
        <div className="w-full h-24 bg-white rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-xs">320×100 Banner</span>
        </div>
      </div>

      {/* 広告プレースホルダー2 */}
      <div className="bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
        <div className="text-sm font-semibold text-green-800 mb-2">
          🛒 広告エリア B
        </div>
        <div className="text-xs text-green-600 mb-3">
          関連商品・アフィリエイト等
        </div>
        <div className="w-full h-32 bg-white rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-xs">320×128 Banner</span>
        </div>
      </div>

      {/* 広告プレースホルダー3 */}
      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
        <div className="text-sm font-semibold text-purple-800 mb-2">
          💡 広告エリア C
        </div>
        <div className="text-xs text-purple-600 mb-3">
          スポンサー・協賛企業等
        </div>
        <div className="w-full h-40 bg-white rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-xs">320×160 Banner</span>
        </div>
      </div>
    </div>
  );
};

// 🎯 新機能: モバイル用フッター広告エリア
const MobileAdArea: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-800 mb-1">
            🎯 おすすめパーツ情報
          </div>
          <div className="text-xs text-blue-600">
            最新セール・キャンペーン情報をチェック
          </div>
        </div>
        <div className="ml-4">
          <div className="w-16 h-16 bg-white rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
            <span className="text-gray-400 text-xs">AD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("builder");
  const { success, warning } = useNotifications();

  // 🚧 Phase 3: アップグレード診断・プランナー・シミュレーター状態管理
  const [plannerState, plannerActions] = useUpgradePlanner();
  
  // 診断結果の共有状態
  const [sharedAnalysis, setSharedAnalysis] = useState<BottleneckAnalysis | null>(null);
  
  // 🎆 Phase 3 Week3: シミュレーター用状態
  const [selectedPlan, setSelectedPlan] = useState<UpgradeRecommendation | null>(null);

  // 🎯 新機能: タブ表示制御（段階的統合対応）
  const {
    isMobile,
    isTablet, 
    isDesktop,
    shouldShowSearchTab,
    deviceType
  } = useTabVisibility(TAB_VISIBILITY_PHASES.PHASE_2_MOBILE_TABLET_HIDDEN);

  // 📱 レスポンシブ状態管理
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  // 📱 レスポンシブ制御関数
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileSummary = () => {
    setIsMobileSummaryOpen(!isMobileSummaryOpen);
  };

  const closeMobileSummary = () => {
    setIsMobileSummaryOpen(false);
  };

  // タブ切り替え時にモバイルメニューを閉じる
  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    closeMobileMenu();
  };

  // 🚧 Phase 3: 診断完了後のプランナー自動遷移
  const handleDiagnosisComplete = async (analysis: BottleneckAnalysis) => {
    try {
      // 共有状態を更新
      setSharedAnalysis(analysis);
      
      // プランナーにプランをロード
      await plannerActions.loadPlans(analysis);
      
      // プランナータブに自動遷移
      setActiveTab('planner');
      
      // 成功通知
      success(
        "診断完了！プランナーに移動しました",
        `${analysis.bottlenecks.length}個のボトルネックを検出 | 総合スコア: ${analysis.overallScore}/100`,
        "診断→プランナー連携"
      );
    } catch (error) {
      warning(
        "プランナー連携でエラーが発生しました",
        error instanceof Error ? error.message : "不明なエラー",
        "連携エラー"
      );
    }
  };

  // 🚧 Phase 3: プランナーから診断に戻る
  const handleBackToDiagnosis = () => {
    setActiveTab('upgrade');
  };

  // 🚧 Phase 3: プランナーからシミュレーターに遵移
  const handleBackToPlanner = () => {
    setActiveTab('planner');
  };

  // 🚧 Phase 3: プラン採用時の処理（シミュレーター遷移追加）
  const handlePlanAdopted = (plan: UpgradeRecommendation) => {
    // プランを選択状態に設定
    setSelectedPlan(plan);
    
    // シミュレータータブに自動遷移
    setActiveTab('simulator');
    
    success(
      "アップグレードプランを採用しました",
      `プラン: ${plan.name} | 総コスト: ¥${plan.totalCost.toLocaleString()}`,
      "プラン採用→シミュレーター"
    );
    
    // プラン実行開始
    const execution = plannerActions.startExecution(plan);
    
    // 必要に応じて実行追跡タブに移動（将来実装）
    console.log('プラン実行開始:', execution);
  };

  // 🎆 Phase 3 Week3: シミュレーション完了時の処理
  const handleSimulationComplete = (result: SimulationResult) => {
    success(
      "シミュレーション完了！",
      `性能向上: ${result.overallImprovement.toFixed(1)}% | ROI: ${result.roi.toFixed(2)}`,
      "シミュレーション結果"
    );
  };

  // 🚧 Phase 2.5: 既存PCConfiguration状態管理
  const [configuration, setConfiguration] = useState<PCConfiguration>({
    id: "config-1",
    name: "My PC Build",
    parts: {
      cpu: null,
      gpu: null,
      motherboard: null,
      memory: null,
      storage: null,
      psu: null,
      case: null,
      cooler: null,
      monitor: null,
    },
    totalPrice: 0,
    budget: 150000,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: "",
    tags: [],
  });

  // 🚧 Phase 2.5: ExtendedPCConfiguration with LocalStorage persistence
  const {
    configuration: extendedConfiguration,
    updateConfiguration: setExtendedConfiguration,
    isSaving: isExtendedConfigSaving,
    hasUnsavedChanges: hasExtendedUnsavedChanges,
    lastSavedAt: extendedLastSavedAt
  } = useExtendedConfiguration({
    autoSave: true,
    autoSaveInterval: 30000, // 30秒
    onSave: (config) => {
      success(
        "ExtendedPC構成を自動保存しました",
        `構成: ${config.name} | パーツ数: ${Object.values(config.parts).filter(Boolean).length}`,
        "自動保存"
      );
    },
    onLoad: (config) => {
      success(
        "保存済み構成を読み込みました",
        `構成: ${config.name} | 最終更新: ${config.updatedAt.toLocaleDateString()}`,
        "構成読み込み"
      );
    },
    onError: (error) => {
      warning(
        "構成の保存/読み込みでエラーが発生しました",
        error.message,
        "ストレージエラー"
      );
    }
  });

  // カテゴリ表示名を取得
  const getCategoryDisplayName = (category: PartCategory): string => {
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
    return categoryNames[category];
  };

  // パーツ選択処理
  const selectPart = (category: PartCategory, part: Part | null) => {
    setConfiguration(prev => {
      const newParts = { ...prev.parts, [category]: part };
      const totalPrice = Object.values(newParts).reduce(
        (sum, p) => sum + (p?.price || 0),
        0
      );

      // 通知表示
      if (part) {
        success(
          "パーツを選択しました",
          `${getCategoryDisplayName(category)}: ${part.name}`,
          "パーツ選択"
        );
      } else {
        warning(
          "パーツを削除しました",
          `${getCategoryDisplayName(category)}を削除しました`,
          "パーツ削除"
        );
      }

      return {
        ...prev,
        parts: newParts,
        totalPrice,
        updatedAt: new Date(),
      };
    });
  };

  // 検索からのパーツ選択処理
  const handlePartSelect = (part: Part) => {
    selectPart(part.category, part);
    // 検索タブから構成作成タブに移動
    setActiveTab("builder");
  };

  // テスト用構成ロード
  const loadTestConfiguration = (configType: "intel" | "amd") => {
    const testConfig = compatibleCombinations[configType];
    const newParts: Partial<Record<PartCategory, Part>> = {};
    let totalPrice = 0;
    let loadedCount = 0;

    Object.entries(testConfig).forEach(([category, partId]) => {
      const part = sampleParts.find(p => p.id === partId);
      if (part) {
        newParts[category as PartCategory] = part;
        totalPrice += part.price;
        loadedCount++;
      }
    });

    setConfiguration(prev => ({
      ...prev,
      parts: newParts,
      totalPrice,
      updatedAt: new Date(),
    }));

    // 成功通知を表示
    success(
      `${configType.toUpperCase()}構成をロードしました`,
      `${loadedCount}件のパーツを読み込みました（合計: ¥${totalPrice.toLocaleString()}）`,
      "構成ロード"
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 統一ヘッダー（全画面共通・固定） */}
      <header className="bg-white shadow-sm border-b z-50 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              {/* 🎨 PC DESIGN STUDIOロゴ - レスポンシブ対応 */}
              <div className="flex items-center space-x-3">
                {/* メインロゴ - 全画面で表示 */}
                <div className="flex items-center">
                  <img 
                    src={logoSvg}
                    alt="PC DESIGN STUDIO" 
                    className="h-8 w-auto sm:h-10 md:h-12 max-w-none"
                    onError={(e) => {
                      console.error('Logo failed to load:', e);
                      e.currentTarget.style.display = 'none';
                      // フォールバックテキストを表示
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) (fallback as HTMLElement).style.display = 'inline';
                    }}
                    onLoad={() => console.log('Logo loaded successfully')}
                  />
                  {/* フォールバックテキスト - ロゴ読み込み失敗時のみ表示 */}
                  <span 
                    className="text-xl font-bold text-gray-900 ml-2" 
                    style={{ display: 'none' }}
                  >
                    PC DESIGN STUDIO
                  </span>
                </div>
                {/* デスクトップのみサブタイトル表示 */}
                <div className="hidden lg:block">
                  <p className="text-sm text-slate-500">
                    自作PC構成設計ツール
                  </p>
                </div>
              </div>
            </div>

            {/* 📱 レスポンシブナビゲーション */}
            {/* デスクトップナビゲーション (1024px以上) */}
            {isDesktop && (
              <nav className="flex space-x-8">
                <button
                  onClick={() => handleTabSwitch("integrated")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "integrated"
                      ? "bg-cyan-100 text-cyan-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ダッシュボード
                </button>
                <button
                  onClick={() => handleTabSwitch("builder")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "builder"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  構成作成
                </button>
                {/* 🚧 Phase 2.5: 複数搭載対応タブ */}
                <button
                  onClick={() => handleTabSwitch("multipart")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "multipart"
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🚧 複数搭載
                </button>
                {/* 🚧 Phase 3: アップグレード診断タブ */}
                <button
                  onClick={() => handleTabSwitch("upgrade")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "upgrade"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🔄 診断
                </button>
                {/* 🚧 Phase 3: アップグレードプランナータブ */}
                <button
                  onClick={() => handleTabSwitch("planner")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "planner"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📋 プランナー
                </button>
                {/* 🎆 Phase 3 Week3: アップグレードシミュレータータブ */}
                <button
                  onClick={() => handleTabSwitch("simulator")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "simulator"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🎯 シミュレーター
                </button>
                <button
                  onClick={() => handleTabSwitch("power")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "power"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  電力計算
                </button>
                <button
                  onClick={() => handleTabSwitch("compatibility")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                    (activeTab as TabType) === "compatibility"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  互換性チェック
                </button>
                {/* 🎯 段階的統合: パーツ検索タブ表示制御 */}
                {shouldShowSearchTab && (
                  <button
                    onClick={() => handleTabSwitch("search")}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible ${
                      (activeTab as TabType) === "search"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    パーツ検索
                  </button>
                )}
              </nav>
            )}

            {/* モバイルナビゲーション (1024px以下) */}
            {(isMobile || isTablet) && (
              <div className="relative">
                <button
                  onClick={toggleMobileMenu}
                  className="flex items-center px-3 py-2 border rounded text-gray-500 border-gray-600 hover:text-gray-400 hover:border-gray-500 focus-visible"
                  aria-expanded={isMobileMenuOpen}
                  aria-label="メニューを開く"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* モバイルドロップダウンメニュー */}
                {isMobileMenuOpen && (
                  <>
                    {/* 背景オーバーレイ */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={closeMobileMenu}
                      aria-hidden="true"
                    />

                    {/* ドロップダウンメニュー */}
                    <div className="absolute right-0 top-12 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
                      <button
                        onClick={() => handleTabSwitch("integrated")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "integrated"
                            ? "bg-cyan-50 text-cyan-700 font-medium"
                            : ""
                        }`}
                      >
                        🎨 ダッシュボード
                      </button>
                      <button
                        onClick={() => handleTabSwitch("builder")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "builder"
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : ""
                        }`}
                      >
                        🔧 構成作成
                      </button>
                      {/* 🚧 Phase 2.5: モバイルメニューに複数搭載対応タブ追加 */}
                      <button
                        onClick={() => handleTabSwitch("multipart")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "multipart"
                            ? "bg-orange-50 text-orange-700 font-medium"
                            : ""
                        }`}
                      >
                        🚧 複数搭載
                      </button>
                      {/* 🚧 Phase 3: モバイルメニューにアップグレード診断タブ追加 */}
                      <button
                        onClick={() => handleTabSwitch("upgrade")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "upgrade"
                            ? "bg-purple-50 text-purple-700 font-medium"
                            : ""
                        }`}
                      >
                        🔄 診断
                      </button>
                      {/* 🚧 Phase 3: モバイルメニューにアップグレードプランナータブ追加 */}
                      <button
                        onClick={() => handleTabSwitch("planner")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "planner"
                            ? "bg-green-50 text-green-700 font-medium"
                            : ""
                        }`}
                      >
                        📋 プランナー
                      </button>
                      {/* 🎆 Phase 3 Week3: モバイルメニューにアップグレードシミュレータータブ追加 */}
                      <button
                        onClick={() => handleTabSwitch("simulator")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "simulator"
                            ? "bg-purple-50 text-purple-700 font-medium"
                            : ""
                        }`}
                      >
                        🎯 シミュレーター
                      </button>
                      <button
                        onClick={() => handleTabSwitch("power")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "power"
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : ""
                        }`}
                      >
                        ⚡ 電力計算
                      </button>
                      <button
                        onClick={() => handleTabSwitch("compatibility")}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          (activeTab as TabType) === "compatibility"
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : ""
                        }`}
                      >
                        ✅ 互換性チェック
                      </button>
                      {/* 🎯 段階的統合: モバイル・タブレットでパーツ検索タブ非表示 */}
                      {shouldShowSearchTab && (
                        <button
                          onClick={() => handleTabSwitch("search")}
                          className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                            (activeTab as TabType) === "search"
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : ""
                          }`}
                        >
                          🔍 パーツ検索
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 構成状態インジケーター（統合版 + データ永続化状態） */}
            <div className="flex items-center space-x-4">
              {/* パーツ数と価格 */}
              <div className="text-sm text-gray-600">
                パーツ数:{" "}
                {Object.values(configuration.parts).filter(Boolean).length}/9
              </div>
              <div className="text-sm font-medium text-gray-900">
                ¥{configuration.totalPrice.toLocaleString()}
              </div>
              
              {/* 保存状態インジケーター */}
              <div className="flex items-center space-x-2">
                {isExtendedConfigSaving ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-yellow-600">保存中...</span>
                  </div>
                ) : hasExtendedUnsavedChanges ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span className="text-xs text-orange-600">未保存</span>
                  </div>
                ) : extendedLastSavedAt ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-600 hidden sm:inline">
                      {extendedLastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}保存済み
                    </span>
                    <span className="text-xs text-green-600 sm:hidden">保存済み</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">-</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 Tablet以下用の広告エリア (main直後、footer直前) */}
      {(isMobile || isTablet) && <MobileAdArea />}

      {/* メインコンテンツエリア（フレックス展開・スクロール制御） */}
      <main className="flex-1 overflow-hidden">
        {/* 📱 レスポンシブレイアウト: Desktop=3カラム, Mobile=1カラム */}
        <div className={`h-full flex ${isMobile ? "flex-col" : "flex-row"}`}>
          
          {/* Main Leftエリア: タブコンテンツ表示 */}
          <div
            className={`overflow-hidden ${
              isMobile ? "flex-1 w-full" : "flex-1"
            }`}
          >
            {(activeTab as TabType) === "integrated" ? (
              <FigmaIntegratedDashboard
                configuration={configuration}
                className="w-full h-full"
              />
            ) : (
              <div className="h-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
                {/* 🚧 Phase 3: アップグレード診断システムタブ */}
                {(activeTab as TabType) === "upgrade" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-sm font-bold">🔄</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-purple-800">
                            🚧 Phase 3 新機能: アップグレード診断システム
                          </h3>
                          <p className="text-xs text-purple-700 mt-1">
                            既存PCの詳細分析とボトルネック診断で、最適なアップグレードプランを提案します。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PCDiagnosticコンポーネント - 連携機能付き */}
                    <PCDiagnostic 
                      onDiagnosisComplete={handleDiagnosisComplete}
                    />
                  </div>
                )}

                {/* 🚧 Phase 3: アップグレードプランナーシステムタブ */}
                {(activeTab as TabType) === "planner" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm font-bold">📋</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            🚧 Phase 3 新機能: アップグレードプランナーシステム
                          </h3>
                          <p className="text-xs text-green-700 mt-1">
                            診断結果から最適なアップグレードプランを策定・比較・カスタマイズします。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 診断結果の状態チェック */}
                    {!sharedAnalysis ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                          診断結果が必要です
                        </h3>
                        <p className="text-sm text-yellow-700 mb-4">
                          プランナーを使用するには、まずアップグレード診断を実行してください。
                        </p>
                        <button
                          onClick={handleBackToDiagnosis}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          🔄 診断タブに移動
                        </button>
                      </div>
                    ) : (
                      /* UpgradePlannerコンポーネント */
                      <UpgradePlanner
                        analysis={sharedAnalysis}
                        recommendations={plannerState.availablePlans}
                        onBack={handleBackToDiagnosis}
                        onPlanGenerated={handlePlanAdopted}
                      />
                    )}
                  </div>
                )}

                {/* 🎆 Phase 3 Week3: アップグレードシミュレーターシステムタブ */}
                {(activeTab as TabType) === "simulator" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-sm font-bold">🎯</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-purple-800">
                            🎆 Phase 3 Week3 新機能: アップグレードシミュレーターシステム
                          </h3>
                          <p className="text-xs text-purple-700 mt-1">
                            プランの性能向上をインタラクティブにシミュレーションし、Before/After比較やROI分析を実行します。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* プラン選択の状態チェック */}
                    {!selectedPlan || !sharedAnalysis ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-lg font-semibold text-orange-800 mb-2">
                          プラン選択が必要です
                        </h3>
                        <p className="text-sm text-orange-700 mb-4">
                          シミュレーターを使用するには、まずアップグレードプランを選択してください。
                        </p>
                        <div className="flex justify-center space-x-4">
                          {!sharedAnalysis ? (
                            <button
                              onClick={handleBackToDiagnosis}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                              🔄 診断タブに移動
                            </button>
                          ) : (
                            <button
                              onClick={handleBackToPlanner}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                              📋 プランナーに移動
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* UpgradeSimulatorコンポーネント */
                      <UpgradeSimulator
                        plan={selectedPlan}
                        currentConfig={{
                          id: configuration.id,
                          name: configuration.name,
                          currentParts: {
                            cpu: configuration.parts.cpu,
                            motherboard: configuration.parts.motherboard,
                            memory: configuration.parts.memory ? [configuration.parts.memory] : [],
                            gpu: configuration.parts.gpu,
                            storage: configuration.parts.storage ? [configuration.parts.storage] : [],
                            psu: configuration.parts.psu,
                            case: configuration.parts.case,
                            cooler: configuration.parts.cooler,
                            other: []
                          },
                          pcInfo: {
                            condition: 'good' as const,
                            usage: 'gaming' as const,
                            dailyUsageHours: 8,
                            location: 'home' as const
                          },
                          constraints: {
                            budget: configuration.budget || 150000,
                            timeframe: 'flexible' as const,
                            priority: 'performance' as const,
                            keepParts: [],
                            replaceParts: [],
                            maxComplexity: 'moderate' as const
                          },
                          createdAt: configuration.createdAt,
                          lastUpdated: configuration.updatedAt,
                          version: '1.0'
                        }}
                        onBack={handleBackToPlanner}
                        onSimulationComplete={handleSimulationComplete}
                      />
                    )}
                  </div>
                )}

                {/* 🚧 Phase 2.5: 複数搭載対応システムタブ */}
                {(activeTab as TabType) === "multipart" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 text-sm font-bold">🚧</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-orange-800">
                            🚧 Phase 2.5 新機能: 複数搭載対応システム
                          </h3>
                          <p className="text-xs text-orange-700 mt-1">
                            ストレージ・PCファン・モニター等の複数搭載に対応し、物理制限をリアルタイム監視します。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MultiPartManagerコンポーネント - LocalStorage連携対応 */}
                    <MultiPartManager
                      configuration={extendedConfiguration}
                      onConfigurationChange={(newConfig) => {
                        setExtendedConfiguration(() => ({
                          ...newConfig,
                          updatedAt: new Date()
                        }));
                      }}
                      className="w-full"
                    />

                    {/* 追加情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">
                          🚀 新機能の特徴
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-2">
                          <li>• ストレージ、メモリ、ファンの複数搭載</li>
                          <li>• M.2スロット、SATAコネクタの自動管理</li>
                          <li>• 物理制限のリアルタイム監視</li>
                          <li>• 制限超過警告システム</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-green-900 mb-3">
                          📊 監視項目
                        </h3>
                        <ul className="text-sm text-green-800 space-y-2">
                          <li>• M.2スロット使用状況</li>
                          <li>• メモリスロット使用状況</li>
                          <li>• ファンマウント使用状況</li>
                          <li>• 電源コネクタ使用状況</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab as TabType) === "builder" && (
                  <div className="space-y-6">
                    {/* 予算設定 */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        予算設定
                      </h2>
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">
                          予算上限:
                        </label>
                        <input
                          type="number"
                          value={configuration.budget || ""}
                          onChange={e => {
                            const newBudget = parseInt(e.target.value) || 0;
                            setConfiguration(prev => ({
                              ...prev,
                              budget: newBudget,
                            }));
                            // 予算変更通知
                            if (newBudget > 0) {
                              success(
                                "予算を設定しました",
                                `予算上限: ¥${newBudget.toLocaleString()}`,
                                "予算設定"
                              );
                            }
                          }}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm w-32"
                          placeholder="150000"
                        />
                        <span className="text-sm text-gray-600">円</span>
                      </div>

                      {configuration.budget && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-600">
                            現在の合計:
                            <span
                              className={`ml-2 font-semibold ${
                                configuration.totalPrice > configuration.budget
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              ¥{configuration.totalPrice.toLocaleString()}
                              {configuration.totalPrice >
                                configuration.budget && (
                                <span className="ml-2">
                                  (¥
                                  {(
                                    configuration.totalPrice -
                                    configuration.budget
                                  ).toLocaleString()}{" "}
                                  オーバー)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* メイン構成エリア - パーツ選択メイン */}
                    <div className="space-y-6">
                      {/* クイックテスト機能 */}
                      <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                          クイックテスト
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                          互換性チェックのテスト用に、事前設定された構成をロードできます。右側の3Dビューで即座に確認できます。
                        </p>
                        <div className="flex space-x-4">
                          <button
                            onClick={() => loadTestConfiguration("intel")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            Intel構成をロード
                          </button>
                          <button
                            onClick={() => loadTestConfiguration("amd")}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            AMD構成をロード
                          </button>
                          <button
                            onClick={() => {
                              setConfiguration(prev => ({
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
                                  monitor: null,
                                },
                                totalPrice: 0,
                              }));

                              // クリア通知を表示
                              warning(
                                "構成をクリアしました",
                                "すべてのパーツが削除されました",
                                "構成クリア"
                              );
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
                          >
                            クリア
                          </button>
                        </div>
                      </div>

                      {/* 🎉 新機能: 統合パーツ選択UI */}
                      <IntegratedPartSelector
                        configuration={configuration}
                        onPartSelect={selectPart}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {(activeTab as TabType) === "power" && (
                  <div className="space-y-6">
                    <PowerCalculator
                      configuration={configuration}
                      className="w-full"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                      <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-green-900 mb-3">
                          🌱 環境への影響
                        </h3>
                        <div className="text-sm text-green-800 space-y-2">
                          <p>年間CO₂排出量: 約520kg</p>
                          <p>年間電気代: 約¥15,600</p>
                          <p className="text-xs text-green-700 mt-3">
                            ※
                            1日8時間使用、電力量料金27円/kWh、CO₂排出係数0.518kg-CO₂/kWhで計算
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab as TabType) === "compatibility" && (
                  <div className="space-y-6">
                    <CompatibilityChecker
                      configuration={configuration}
                      className="w-full"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {(activeTab as TabType) === "3d" && (
                  <div className="space-y-6">
                    <ErrorBoundary componentName="3Dビュー">
                      <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                          🎆 3D PC構成ビュー
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                          選択したPCパーツをリアルタイムで3D表示します。マウスで回転・ズームして構成を確認できます。
                        </p>
                        <PCCaseViewer
                          configuration={configuration}
                          className="w-full h-96"
                          showGrid={true}
                          enableControls={true}
                          showUIOverlay={true}
                        />
                      </div>
                    </ErrorBoundary>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-purple-50 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-purple-900 mb-3">
                          🎮 3Dビュー操作方法
                        </h3>
                        <ul className="text-sm text-purple-800 space-y-2">
                          <li>• ドラッグ: ケースを回転</li>
                          <li>• ホイール: ズームイン/アウト</li>
                          <li>• 右クリック+ドラッグ: パン</li>
                          <li>• ダブルクリック: フォーカスリセット</li>
                        </ul>
                      </div>

                      <div className="bg-indigo-50 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-indigo-900 mb-3">
                          ✨ 3Dビューの特徴
                        </h3>
                        <ul className="text-sm text-indigo-800 space-y-2">
                          <li>• リアルタイムパーツ表示</li>
                          <li>• サイズ感と配置確認</li>
                          <li>• パーツ情報ホバー表示</li>
                          <li>• 互換性問題の視覚化</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        🚀 3D可視化システム状態
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {
                              Object.values(configuration.parts).filter(Boolean)
                                .length
                            }
                          </div>
                          <div className="text-gray-600">表示中パーツ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            60
                          </div>
                          <div className="text-gray-600">FPS</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            3D
                          </div>
                          <div className="text-gray-600">レンダリング</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            ✓
                          </div>
                          <div className="text-gray-600">互換性連動</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎯 段階的統合: パーツ検索タブコンテンツ表示制御 */}
                {(activeTab as TabType) === "search" && shouldShowSearchTab && (
                  <div className="space-y-6">
                    {/* 🎯 段階的統合情報表示 */}
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 text-sm font-bold">⚠️</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-orange-800">
                            🎯 段階的統合進行中 - Phase 2
                          </h3>
                          <p className="text-xs text-orange-700 mt-1">
                            デバイス: {deviceType} | パーツ検索タブ: {shouldShowSearchTab ? '表示中' : '非表示'} | モバイル・タブレットでは統合UIをご利用ください
                          </p>
                        </div>
                      </div>
                    </div>

                    <PartSearch
                      onPartSelect={handlePartSelect}
                      showAddButton={true}
                      addButtonText="構成に追加"
                      className="w-full"
                      allParts={sampleParts}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">
                          🔍 検索のコツ
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-2">
                          <li>• 製品名、ブランド、型番で検索</li>
                          <li>• カテゴリを選択して絞り込み</li>
                          <li>• 複数キーワードでAND検索</li>
                          <li>• あいまい検索に対応</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-green-900 mb-3">
                          💡 パーツ選択のヒント
                        </h3>
                        <ul className="text-sm text-green-800 space-y-2">
                          <li>• 予算と性能のバランスを考慮</li>
                          <li>• レビューと評価を参考に</li>
                          <li>• 在庫状況を確認</li>
                          <li>• 構成に追加して互換性チェック</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎯 段階的統合: パーツ検索タブ非表示時のメッセージ */}
                {(activeTab as TabType) === "search" && !shouldShowSearchTab && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">🔄</span>
                        </div>
                        <h2 className="text-lg font-semibold text-blue-900 mb-2">
                          🎯 統合UIでパーツ検索をご利用ください
                        </h2>
                        <p className="text-sm text-blue-700 mb-4">
                          {deviceType === 'mobile' ? 'モバイル' : 'タブレット'}では、パーツ検索機能が統合UIに統合されました。
                          より直感的で効率的なパーツ選択が可能です。
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button
                            onClick={() => handleTabSwitch("builder")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            🔧 構成作成タブへ
                          </button>
                          <button
                            onClick={() => handleTabSwitch("integrated")}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            🎨 ダッシュボードへ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🎯 Desktop用 Middle Rightエリア: 構成サマリー (w-80) */}
          {!isMobile && !isTablet && (
            <div className="w-80 bg-cyan-700 border-l border-gray-200 flex-shrink-0">
              <div className="h-full p-4 space-y-6 overflow-y-auto">
                {/* 3Dビューをサマリー最上部に移動 */}
                {(activeTab as TabType) !== "integrated" && (
                  <ErrorBoundary componentName="3Dビュー">
                    <div className="rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          🎆 3Dビュー
                        </h3>
                        <div className="text-xs text-gray-200">
                          パーツ:{" "}
                          {
                            Object.values(configuration.parts).filter(Boolean)
                              .length
                          }
                          /9
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-xl h-64">
                        <PCCaseViewer
                          configuration={configuration}
                          className="w-full h-full"
                          showGrid={false}
                          enableControls={true}
                          showUIOverlay={false}
                          showCaseLabel={false}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-200">
                        ドラッグ: 回転 | ホイール: ズーム
                      </div>
                    </div>
                  </ErrorBoundary>
                )}

                {/* 構成サマリー */}
                <ErrorBoundary componentName="構成サマリー">
                  <ConfigSummary
                    configuration={configuration}
                    className="w-full"
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* 🎯 Desktop用 Far Rightエリア: 広告エリア (w-80) */}
          {!isMobile && !isTablet && (
            <div className="w-80 bg-gray-100 border-l border-gray-200 flex-shrink-0">
              <div className="h-full p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    📢 おすすめ情報
                  </h3>
                  <div className="text-xs text-gray-500">
                    広告エリア
                  </div>
                </div>
                
                {/* 広告エリアコンポーネント */}
                <AdArea className="w-full" />
                
                {/* 統計・フィードバック情報 */}
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    💡 おすすめ機能
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 価格履歴グラフ</li>
                    <li>• 互換性スコア詳細</li>
                    <li>• 省エネ度診断</li>
                    <li>• 類似構成の比較</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 📱 モバイル用スライド式サマリーパネル (768px以下) */}
      {isMobileSummaryOpen && isMobile && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50" style={{ top: '80px', bottom: '48px' }}>
          {/* 背景オーバーレイ */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeMobileSummary}
            aria-hidden="true"
          />

          {/* サマリーコンテンツ */}
          <div className="absolute right-0 top-0 h-full w-80 bg-cyan-700 transform transition-transform duration-300 ease-in-out z-40">
            <div className="h-full p-4 space-y-6 overflow-y-auto">
              {/* ヘッダー */}
              <div className="flex items-center justify-between pb-4 border-b border-cyan-600">
                <h3 className="text-lg font-semibold text-white">
                  🔧 構成サマリー
                </h3>
                <button
                  onClick={closeMobileSummary}
                  className="p-2 rounded-md text-cyan-200 hover:text-white focus-visible"
                  aria-label="サマリーを閉じる"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 3Dビュー（ダッシュボード以外のみ） */}
              {(activeTab as TabType) !== "integrated" && (
                <ErrorBoundary componentName="3Dビュー">
                  <div className="rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-white">
                        🎆 3Dビュー
                      </h4>
                      <div className="text-xs text-cyan-200">
                        パーツ:{" "}
                        {
                          Object.values(configuration.parts).filter(Boolean)
                            .length
                        }
                        /9
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-xl h-64">
                      <PCCaseViewer
                        configuration={configuration}
                        className="w-full h-full"
                        showGrid={false}
                        enableControls={true}
                        showUIOverlay={false}
                        showCaseLabel={false}
                      />
                    </div>
                    <div className="mt-2 text-xs text-cyan-200">
                      ドラッグ: 回転 | ホイール: ズーム
                    </div>
                  </div>
                </ErrorBoundary>
              )}

              {/* 構成サマリー */}
              <ErrorBoundary componentName="構成サマリー">
                <ConfigSummary
                  configuration={configuration}
                  className="w-full"
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {/* 統一フッター（全画面共通・固定表示） */}
      <footer className="bg-gray-800 text-white z-40 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">自動保存済み</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300 hidden sm:inline">
                  互換性チェック完了
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-300 hidden md:inline">
                  3Dレンダリング中
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 🎯 段階的統合ステータス表示 */}
              <span className="text-gray-400 hidden lg:inline">
                {deviceType.toUpperCase()} | 検索タブ: {shouldShowSearchTab ? '表示' : '統合済み'}
              </span>
              <span className="text-gray-400 hidden md:inline">
                最終更新: {new Date().toLocaleTimeString()}
              </span>
              <span className="text-green-400">✅ Phase 2実行中</span>
              
              {/* 📱 Tablet以下でサマリーボタンを最右端に表示 */}
              {(isMobile || isTablet) && (
                <button
                  onClick={toggleMobileSummary}
                  className="bg-cyan-600 text-white px-3 py-2 rounded-md hover:bg-cyan-700 transition-colors focus-visible flex items-center space-x-2"
                  aria-label="構成サマリーを開く"
                >
                  <span className="text-xs font-medium">サマリー</span>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
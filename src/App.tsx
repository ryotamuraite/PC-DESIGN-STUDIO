// src/App.tsx - 左メニューレイアウト統合版
import { PCCaseViewer } from "@/components/3d";
import PowerCalculator from "@/components/calculators/PowerCalculator";
import CompatibilityChecker from "@/components/checkers/CompatibilityChecker";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { FigmaIntegratedDashboard } from "@/components/integrated";
import PartSearch from "@/components/search/PartSearch";
import ConfigSummary from "@/components/summary/ConfigSummary";
import { IntegratedPartSelectorV2 } from "@/components/integrated-selector";
// 🏗️ 左メニューレイアウト統合
import { MainLayout } from "@/components/layout/MainLayout";
import { LeftSideMenu } from "@/components/layout/LeftSideMenu";
// 🚧 Phase 2.5: 複数搭載対応システムインポート
import { MultiPartManager } from "@/components/multi-part";
// 🚧 Phase 3: アップグレード診断システムインポート
import {
  PCDiagnostic,
  UpgradePlanner,
  UpgradeSimulator,
} from "@/components/upgrade";
import { useUpgradePlanner } from "@/hooks/useUpgradePlanner";
import {
  BottleneckAnalysis,
  UpgradeRecommendation,
  SimulationResult,
} from "@/types/upgrade";
import { sampleParts } from "@/data/sampleParts";
import { useNotifications } from "@/hooks/useNotifications";
import {
  useTabVisibility,
  TAB_VISIBILITY_PHASES,
} from "@/hooks/ui/useTabVisibility";
// 🚧 Phase 2.5: データ永続化統合
import { useExtendedConfiguration } from "@/hooks/useExtendedConfiguration";
import { PCConfiguration, Part, PartCategory } from "@/types";
import type { CurrentPCConfiguration } from "@/types/upgrade";
import React, { useState } from "react";

// 統合ダッシュボード用の型定義（Phase 3: アップグレード診断・プランナー・シミュレータータブ追加）
type TabType =
  | "builder"
  | "multipart" // 🚧 Phase 2.5: 複数搭載対応システム
  | "upgrade" // 🚧 Phase 3: アップグレード診断システム
  | "planner" // 🚧 Phase 3: アップグレードプランナーシステム
  | "simulator" // 🎆 Phase 3 Week3: アップグレードシミュレーターシステム
  | "power"
  | "compatibility"
  | "search"
  | "3d"
  | "integrated"
  | "about"
  | "information";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("integrated");
  const { success, warning } = useNotifications();

  // 🎯 Phase管理制御 - 環境変数ベース
  const currentPhase = import.meta.env.VITE_PHASE || "2.5";
  const shouldShowPhase3Features = parseFloat(currentPhase) >= 3.0;
  const isDebugMode = import.meta.env.VITE_DEBUG_PHASE_CONTROL === "true";

  // デバッグログ出力
  React.useEffect(() => {
    if (isDebugMode) {
      console.log("🎯 Phase管理制御:");
      console.log("Current Phase:", currentPhase);
      console.log("Show Phase 3 Features:", shouldShowPhase3Features);
      console.log("Environment:", import.meta.env.MODE);
    }
  }, [currentPhase, shouldShowPhase3Features, isDebugMode]);

  // PCConfigurationをCurrentPCConfigurationに変換するヘルパー関数
  const convertToCurrentPCConfiguration = (
    config: PCConfiguration
  ): CurrentPCConfiguration => {
    return {
      id: config.id,
      name: config.name,
      currentParts: {
        cpu: config.parts.cpu ?? null,
        motherboard: config.parts.motherboard ?? null,
        memory: config.parts.memory ? [config.parts.memory] : [],
        gpu: config.parts.gpu ?? null,
        storage: config.parts.storage ? [config.parts.storage] : [],
        psu: config.parts.psu ?? null,
        case: config.parts.case ?? null,
        cooler: config.parts.cooler ?? null,
        other: [],
      },
      pcInfo: {
        condition: "good" as const,
        usage: "mixed" as const,
        dailyUsageHours: 8,
        location: "home" as const,
      },
      constraints: {
        budget: config.budget || 150000,
        timeframe: "flexible" as const,
        priority: "performance" as const,
        keepParts: [],
        replaceParts: [],
        maxComplexity: "moderate" as const,
      },
      createdAt: config.createdAt ?? new Date(),
      lastUpdated: config.updatedAt ?? new Date(),
      version: "1.0",
    };
  };

  // 🚧 Phase 3: アップグレード診断・プランナー・シミュレーター状態管理
  const [plannerState, plannerActions] = useUpgradePlanner();

  // 診断結果の共有状態
  const [sharedAnalysis, setSharedAnalysis] =
    useState<BottleneckAnalysis | null>(null);

  // 🎆 Phase 3 Week3: シミュレーター用状態
  const [selectedPlan, setSelectedPlan] =
    useState<UpgradeRecommendation | null>(null);

  // 🎯 レスポンシブ判定拡張（4段階）
  const { shouldShowSearchTab, deviceType } =
    useTabVisibility(TAB_VISIBILITY_PHASES.PHASE_2_MOBILE_TABLET_HIDDEN);
  
  // レスポンシブブレークポイント判定（シンプル化：2パターン）
  const [responsiveState, setResponsiveState] = useState(() => {
    const width = window.innerWidth;
    return {
      isDesktop: width >= 1280,      // Desktop: 1280px以上
      isMobile: width < 1280,        // Tablet/Mobile: 1279px以下
      screenWidth: width
    };
  });
  
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setResponsiveState({
        isDesktop: width >= 1280,
        isMobile: width < 1280,
        screenWidth: width
      });
    };
    
    // デバウンス処理でパフォーマンス最適化
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  // 🏗️ 左メニューレイアウト状態管理
  const [menuOpen, setMenuOpen] = useState(() => {
    // モバイル時はメニューを閉じた状態から開始
    return window.innerWidth > 768;
  });

  // 📱 サマリー表示状態管理（Tablet/Mobile用）
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // 📱 サマリー制御関数
  const toggleSummary = () => {
    setIsSummaryOpen(!isSummaryOpen);
    // メニューが開いていたら閉じる
    if (menuOpen && responsiveState.isMobile) {
      setMenuOpen(false);
    }
  };

  const closeSummary = () => {
    setIsSummaryOpen(false);
  };

  // メニュー制御関数の拡張
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    // サマリーが開いていたら閉じる
    if (isSummaryOpen && responsiveState.isMobile) {
      setIsSummaryOpen(false);
    }
  };

  // タブ切り替え時の処理
  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 🚧 Phase 3: 診断完了後のプランナー自動遷移
  const handleDiagnosisComplete = async (analysis: BottleneckAnalysis) => {
    try {
      // 共有状態を更新
      setSharedAnalysis(analysis);

      // プランナーにプランをロード
      await plannerActions.loadPlans(analysis);

      // プランナータブに自動遷移
      setActiveTab("planner");

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
    setActiveTab("upgrade");
  };

  // 🚧 Phase 3: プランナーからシミュレーターに遵移
  const handleBackToPlanner = () => {
    setActiveTab("planner");
  };

  // 🚧 Phase 3: プラン採用時の処理（シミュレーター遷移追加）
  const handlePlanAdopted = (plan: UpgradeRecommendation) => {
    // プランを選択状態に設定
    setSelectedPlan(plan);

    // シミュレータータブに自動遷移
    setActiveTab("simulator");

    success(
      "アップグレードプランを採用しました",
      `プラン: ${plan.name} | 総コスト: ¥${plan.totalCost.toLocaleString()}`,
      "プラン採用→シミュレーター"
    );

    // プラン実行開始
    const execution = plannerActions.startExecution(plan);

    // 必要に応じて実行追跡タブに移動（将来実装）
    console.log("プラン実行開始:", execution);
  };

  // 🎆 Phase 3 Week3: シミュレーション完了時の処理
  const handleSimulationComplete = (result: SimulationResult) => {
    success(
      "シミュレーション完了！",
      `性能向上: ${result.overallImprovement.toFixed(
        1
      )}% | ROI: ${result.roi.toFixed(2)}`,
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
  } = useExtendedConfiguration({
    autoSave: true,
    autoSaveInterval: 30000, // 30秒
    onSave: config => {
      success(
        "ExtendedPC構成を自動保存しました",
        `構成: ${config.name} | パーツ数: ${
          Object.values(config.parts).filter(Boolean).length
        }`,
        "自動保存"
      );
    },
    onLoad: config => {
      success(
        "保存済み構成を読み込みました",
        `構成: ${config.name} | 最終更新: ${
          config.updatedAt?.toLocaleDateString() || "未設定"
        }`,
        "構成読み込み"
      );
    },
    onError: error => {
      warning(
        "構成の保存/読み込みでエラーが発生しました",
        error.message,
        "ストレージエラー"
      );
    },
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



  return (
    <MainLayout
      leftMenu={
        <LeftSideMenu
          isOpen={menuOpen}
          onToggle={toggleMenu}
          activeTab={activeTab}
          onTabChange={handleTabSwitch}
          shouldShowPhase3Features={shouldShowPhase3Features}
          isMobile={responsiveState.isMobile}
        />
      }
      rightSidebar={
        <div className="h-full bg-gradient-to-b from-brand-primary-800 to-brand-primary-900 overflow-y-auto">
          {/* 3Dビューサマリー最上部に移動 */}
          {(activeTab as TabType) !== "integrated" && (
            <ErrorBoundary componentName="3Dビュー">
              <div className="px-3 pb-3">
                <div className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-white">
                      3Dビュー
                    </h3>
                    <div className="text-xs text-brand-accent-200">
                      {Object.values(configuration.parts).filter(Boolean).length}
                      /9
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg h-56">
                    <PCCaseViewer
                      configuration={configuration}
                      className="w-full h-full"
                      showGrid={false}
                      enableControls={true}
                      showUIOverlay={false}
                      showCaseLabel={false}
                    />
                  </div>
                  <div className="mt-2 text-xs text-brand-accent-200">
                    ドラッグ: 回転 | ホイール: ズーム
                  </div>
                </div>
                {/* 3Dビューとサマリーの境界線 */}
                <div className="border-b-2 border-brand-primary-700/50"></div>
              </div>
            </ErrorBoundary>
          )}

          {/* 構成サマリー */}
          <ErrorBoundary componentName="構成サマリー">
            <ConfigSummary configuration={configuration} />  
          </ErrorBoundary>
        </div>
      }
      menuOpen={menuOpen}
      onMenuClose={() => setMenuOpen(false)}
      onMenuToggle={toggleMenu}
      isDesktop={responsiveState.isDesktop}
      isSummaryOpen={isSummaryOpen}
      onSummaryClose={closeSummary}
      onSummaryToggle={toggleSummary}
    >
      {/* モバイル用ボタンはMainLayout内に統合 */}
      
      {(activeTab as TabType) === "integrated" ? (
        <FigmaIntegratedDashboard
          configuration={configuration}
          className="w-full h-full"
        />
      ) : (
        <div className="h-full px-3 py-3 overflow-y-auto">
          {(activeTab as TabType) === "upgrade" && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-bold">
                        🔄
                      </span>
                    </div>
                  </div>
                  <div className="ml-2">
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
              <PCDiagnostic onDiagnosisComplete={handleDiagnosisComplete} />
            </div>
          )}

          {/* 🚧 Phase 3: アップグレードプランナーシステムタブ */}
          {(activeTab as TabType) === "planner" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">
                        📋
                      </span>
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

          {/* Aboutページ */}
          {(activeTab as TabType) === "about" && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  PC DESIGN STUDIOについて
                </h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600">
                    PC DESIGN STUDIOは、PC自作をより簡単に、より楽しくするためのツールです。
                    初心者から上級者まで、誰でも簡単に理想のPC構成を作成できます。
                  </p>
                  
                  <h3 className="text-base font-semibold text-gray-900 mt-6">主な機能</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>パーツの互換性チェック</li>
                    <li>消費電力計算</li>
                    <li>3Dビジュアライザー</li>
                    <li>予算管理</li>
                    <li>構成の保存・共有</li>
                  </ul>

                  <h3 className="text-base font-semibold text-gray-900 mt-6">開発情報</h3>
                  <p className="text-gray-600">
                    バージョン: Phase 2.5<br />
                    最終更新: 2025年8月<br />
                    ライセンス: MIT License
                  </p>

                  <div className="bg-blue-50 rounded-lg p-4 mt-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">🎁 サポートについて</h3>
                    <p className="text-sm text-blue-800">
                      このプロジェクトはオープンソースで開発されています。
                      もしこのツールがお役に立ちましたら、寄付や貢献をご検討ください。
                    </p>
                    <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      💙 寄付する
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informationページ */}
          {(activeTab as TabType) === "information" && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  お知らせ
                </h2>
                
                {/* 最新のお知らせ */}
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">🎆 メニュー改修実施中</h3>
                      <span className="text-xs text-gray-500">2025/08/30</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      ユーザーエクスペリエンス向上のため、メニュー構造を改修しています。
                      新しい統合ダッシュボードも近日公開予定です。
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">✨ Phase 2.5 リリース</h3>
                      <span className="text-xs text-gray-500">2025/08/15</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      複数搭載対応システムが実装されました。
                      ストレージ、メモリ、ファンなどを複数搭載できるようになりました。
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">🚀 Phase 3 開発中</h3>
                      <span className="text-xs text-gray-500">2025/08/01</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      アップグレード診断システム、プランナー、シミュレーターなど、
                      新機能を開発中です。今後のアップデートにご期待ください。
                    </p>
                  </div>
                </div>

                {/* 更新履歴 */}
                <div className="mt-8">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">更新履歴</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-gray-500 mr-2">v2.5.0</span>
                        <span className="text-gray-700">複数搭載対応システム実装</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-500 mr-2">v2.0.0</span>
                        <span className="text-gray-700">3Dビューア機能追加</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-500 mr-2">v1.5.0</span>
                        <span className="text-gray-700">電力計算機能改善</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-500 mr-2">v1.0.0</span>
                        <span className="text-gray-700">初版リリース</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🎆 Phase 3 Week3: アップグレードシミュレーターシステムタブ */}
          {(activeTab as TabType) === "simulator" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-bold">
                        🎯
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-purple-800">
                      🎆 Phase 3 Week3 新機能:
                      アップグレードシミュレーターシステム
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
                  currentConfig={convertToCurrentPCConfiguration({
                    id: configuration.id,
                    name: configuration.name,
                    parts: configuration.parts,
                    totalPrice: configuration.totalPrice,
                    budget: configuration.budget,
                    createdAt: configuration.createdAt,
                    updatedAt: configuration.updatedAt,
                    description: configuration.description,
                    tags: configuration.tags,
                  })}
                  onBack={handleBackToPlanner}
                  onSimulationComplete={handleSimulationComplete}
                />
              )}
            </div>
          )}

          {/* 🚧 Phase 2.5: 複数搭載対応システムタブ */}
          {(activeTab as TabType) === "multipart" && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm font-bold">
                        🚧
                      </span>
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
                onConfigurationChange={newConfig => {
                  setExtendedConfiguration(() => ({
                    ...newConfig,
                    parts: newConfig.parts || {
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
                    updatedAt: new Date(),
                  }));
                }}
                className="w-full"
              />

              {/* 追加情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
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

                <div className="bg-green-50 rounded-lg p-3">
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
            <div className="space-y-3">
              {/* 🎉 新機能: 統合パーツ選択UI */}
              <IntegratedPartSelectorV2
                configuration={configuration}
                onPartSelect={selectPart}
                budget={configuration.budget || 150000}
                onBudgetChange={newBudget => {
                  setConfiguration(prev => ({
                    ...prev,
                    budget: newBudget,
                  }));
                }}
                className="w-full"
              />
            </div>
          )}

          {(activeTab as TabType) === "power" && (
            <div className="space-y-3">
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
            <div className="space-y-3">
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
            <div className="space-y-3">
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
                    <div className="text-2xl font-bold text-blue-600">60</div>
                    <div className="text-gray-600">FPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">3D</div>
                    <div className="text-gray-600">レンダリング</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">✓</div>
                    <div className="text-gray-600">互換性連動</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 段階的統合: パーツ検索タブコンテンツ表示制御 */}
          {(activeTab as TabType) === "search" && shouldShowSearchTab && (
            <div className="space-y-3">
              {/* 🎯 段階的統合情報表示 */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm font-bold">
                        ⚠️
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      🎯 段階的統合進行中 - Phase 2
                    </h3>
                    <p className="text-xs text-orange-700 mt-1">
                      デバイス: {deviceType} | パーツ検索タブ:{" "}
                      {shouldShowSearchTab ? "表示中" : "非表示"} |
                      モバイル・タブレットでは統合UIをご利用ください
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
                    {deviceType === "mobile" ? "モバイル" : "タブレット"}
                    では、パーツ検索機能が統合UIに統合されました。
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
                      🎨 構成作成へ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* モバイル用サマリーはMainLayout内に統合 */}
    </MainLayout>
  );
};

export default App;

// src/components/UpgradeSimulator/UpgradeSimulator.tsx
// 🎯 Phase 3F: アップグレードシミュレーターメインコンポーネント

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UpgradeInterface } from './UpgradeInterface';
import { CurrentPCPanel } from './CurrentPCPanel';
import { SimulationResults } from './SimulationResults';
import { ActionControls } from './ActionControls';
import useUpgradeSimulator from '@/hooks/useUpgradeSimulator';
import type { UpgradeRecommendation, CurrentPCConfiguration, SimulationResult } from '@/types/upgrade';

// ===========================================
// 🎯 Props 型定義
// ===========================================

export interface UpgradeSimulatorProps {
  // 必須Props
  plan: UpgradeRecommendation;
  currentConfig: CurrentPCConfiguration;
  
  // イベントハンドラー
  onBack: () => void;
  onSimulationComplete: (result: SimulationResult) => void;
  
  // オプション
  className?: string;
}

// ===========================================
// 🎯 メインコンポーネント
// ===========================================

export const UpgradeSimulator: React.FC<UpgradeSimulatorProps> = ({
  plan,
  currentConfig,
  onBack,
  onSimulationComplete,
  className = ''
}) => {
  
  // ===========================================
  // 📊 State 管理
  // ===========================================
  
  const [simulatorState, simulatorActions] = useUpgradeSimulator();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [budget, setBudget] = useState<number>(plan.totalCost * 1.2); // 20%マージン
  const [targetUsage, setTargetUsage] = useState<string>('gaming');
  
  // UI状態
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // ===========================================
  // 🔄 初期化・副作用
  // ===========================================
  
  // 初期化済みフラグ
  const initializedRef = useRef(false);
  const currentPlanIdRef = useRef<string | null>(null);
  
  // 初期化処理 - 無限ループ防止版
  useEffect(() => {
    // 重複実行防止チェック
    const shouldInitialize = (
      plan && 
      currentConfig && 
      !initializedRef.current && 
      currentPlanIdRef.current !== plan.id
    );
    
    if (!shouldInitialize) {
      return;
    }
    
    const initializeSimulator = async () => {
      try {
        console.log('🎯 UpgradeSimulator初期化開始:', plan.name);
        
        // 初期化フラグ設定
        initializedRef.current = true;
        currentPlanIdRef.current = plan.id;
        
        // シミュレーター設定更新
        simulatorActions.updateSimulationConfig({
          benchmarkSuite: 'comprehensive',
          includeStressTests: true,
          simulationPrecision: 'balanced'
        });
        
        // 使用シナリオ設定
        simulatorActions.addUsageScenario({
          name: targetUsage,
          type: targetUsage as 'gaming' | 'productivity' | 'creative' | 'development' | 'general',
          applications: getApplicationsForUsage(targetUsage),
          usage: getUsageProfileForType(targetUsage),
          weight: 80
        });
        
        setIsInitialized(true);
        console.log('✅ UpgradeSimulator初期化完了');
        
      } catch (error) {
        console.error('❌ UpgradeSimulator初期化エラー:', error);
        // エラー時はフラグをリセット
        initializedRef.current = false;
        currentPlanIdRef.current = null;
      }
    };
    
    initializeSimulator();
  }, [plan?.id, currentConfig?.id, targetUsage, simulatorActions, currentConfig, plan]); // ESLint警告修正: currentConfig, planを依存配列に追加
  
  // シミュレーション完了監視 - 無限ループ防止版
  const lastCompletedSimulationIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    const shouldNotifyComplete = (
      simulatorState.currentSimulation && 
      !simulatorState.isSimulating &&
      lastCompletedSimulationIdRef.current !== simulatorState.currentSimulation.id
    );
    
    if (shouldNotifyComplete && simulatorState.currentSimulation) {
      console.log('🎯 シミュレーション完了:', simulatorState.currentSimulation);
      
      // 完了済みIDを記録
      lastCompletedSimulationIdRef.current = simulatorState.currentSimulation.id;
      
      // 一度だけコールバック実行
      onSimulationComplete(simulatorState.currentSimulation);
    }
  }, [simulatorState.currentSimulation?.id, simulatorState.isSimulating, onSimulationComplete, simulatorState.currentSimulation]); // ESLint警告修正: simulatorState.currentSimulationを依存配列に追加
  
  // ===========================================
  // 🎮 イベントハンドラー
  // ===========================================
  
  // フルシミュレーション実行
  const handleRunFullSimulation = useCallback(async () => {
    try {
      console.log('🚀 フルシミュレーション開始');
      await simulatorActions.runFullSimulation(plan, currentConfig);
    } catch (error) {
      console.error('❌ フルシミュレーションエラー:', error);
    }
  }, [simulatorActions, plan, currentConfig]);
  
  // 基本シミュレーション実行
  const handleRunBasicSimulation = useCallback(async () => {
    try {
      console.log('🏃 基本シミュレーション開始');
      await simulatorActions.runSimulation(plan, currentConfig);
    } catch (error) {
      console.error('❌ 基本シミュレーションエラー:', error);
    }
  }, [simulatorActions, plan, currentConfig]);
  
  // ROI分析実行
  const handleAnalyzeROI = useCallback(() => {
    try {
      console.log('💰 ROI分析開始');
      const roiResult = simulatorActions.calculateROI(plan, 24); // 24ヶ月
      console.log('📊 ROI分析完了:', roiResult);
    } catch (error) {
      console.error('❌ ROI分析エラー:', error);
    }
  }, [simulatorActions, plan]);
  
  // 設定更新
  const handleBudgetChange = useCallback((newBudget: number) => {
    setBudget(newBudget);
    console.log('💰 予算更新:', newBudget);
  }, []);
  
  const handleTargetUsageChange = useCallback((newUsage: string) => {
    setTargetUsage(newUsage);
    console.log('🎯 使用用途更新:', newUsage);
  }, []);
  
  // ===========================================
  // 🎨 レンダリング
  // ===========================================
  
  // 初期化中の表示
  if (!isInitialized) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                🎯 シミュレーター初期化中...
              </h3>
              <p className="text-sm text-gray-600">
                プラン「{plan.name}」を読み込んでいます
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* ヘッダーセクション */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span>アップグレードシミュレーター</span>
                <Badge variant="secondary" className="ml-2">
                  Phase 3F
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">
                プラン「{plan.name}」の性能向上をインタラクティブにシミュレーションします
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* プラン情報サマリー */}
              <div className="text-right text-sm space-y-1">
                <div className="font-medium text-gray-900">
                  総コスト: ¥{plan.totalCost.toLocaleString()}
                </div>
                <div className="text-gray-600">
                  期間: {plan.timeframe}ヶ月 | 信頼度: {Math.round(plan.confidence * 100)}%
                </div>
              </div>
              
              {/* 戻るボタン */}
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← プランナーに戻る
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 進捗状況表示 */}
          {simulatorState.isSimulating && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">
                  シミュレーション実行中...
                </span>
                <span className="text-sm text-purple-600">
                  {simulatorState.simulationProgress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${simulatorState.simulationProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* エラー表示 */}
          {simulatorState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <div>
                  <h4 className="text-sm font-medium text-red-800">シミュレーションエラー</h4>
                  <p className="text-sm text-red-600 mt-1">{simulatorState.error}</p>
                </div>
                <button
                  onClick={simulatorActions.clearError}
                  className="ml-auto text-red-600 hover:text-red-800 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* メインタブセクション */}
      <Card className="flex-1">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            {/* タブリスト */}
            <TabsList className="grid w-full grid-cols-4 gap-1 p-1 bg-gray-100">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <span>🏠</span>
                <span>概要</span>
              </TabsTrigger>
              <TabsTrigger 
                value="simulation" 
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <span>⚡</span>
                <span>シミュレーション</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <span>📊</span>
                <span>分析</span>
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="flex items-center gap-2 data-[state=active]:bg-white"
              >
                <span>🎯</span>
                <span>結果</span>
              </TabsTrigger>
            </TabsList>
            
            {/* タブコンテンツ */}
            <div className="p-6">
              
              {/* 概要タブ */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 現在のPC情報 */}
                  <CurrentPCPanel
                    currentConfig={currentConfig}
                    className="h-full"
                  />
                  
                  {/* プラン詳細 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📋 アップグレードプラン</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{plan.name}</h4>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>
                      
                      {/* フェーズ表示 */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-800">実行フェーズ</h5>
                        {plan.phases.slice(0, 3).map((phase, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{phase.name}</div>
                              <div className="text-xs text-gray-500">
                                ¥{phase.estimatedCost.toLocaleString()} | {phase.estimatedTime}分
                              </div>
                            </div>
                          </div>
                        ))}
                        {plan.phases.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            ...他 {plan.phases.length - 3} フェーズ
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* クイックアクション */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⚡ クイックアクション</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={handleRunBasicSimulation}
                        disabled={simulatorState.isSimulating}
                        className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-2xl mb-2">🏃</div>
                        <div className="text-sm font-medium text-blue-900">基本シミュレーション</div>
                        <div className="text-xs text-blue-600 mt-1">性能向上の概算</div>
                      </button>
                      
                      <button
                        onClick={handleRunFullSimulation}
                        disabled={simulatorState.isSimulating}
                        className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-2xl mb-2">🚀</div>
                        <div className="text-sm font-medium text-purple-900">フルシミュレーション</div>
                        <div className="text-xs text-purple-600 mt-1">詳細分析・ROI含む</div>
                      </button>
                      
                      <button
                        onClick={handleAnalyzeROI}
                        disabled={simulatorState.isSimulating}
                        className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-2xl mb-2">💰</div>
                        <div className="text-sm font-medium text-green-900">ROI分析</div>
                        <div className="text-xs text-green-600 mt-1">投資対効果計算</div>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* シミュレーションタブ */}
              <TabsContent value="simulation" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* アップグレード選択UI */}
                  <UpgradeInterface
                    currentConfig={currentConfig}
                    selectedUpgrades={[]} // TODO: 実装
                    onUpgradesChange={() => {}} // TODO: 実装  
                    budget={budget}
                    onBudgetChange={handleBudgetChange}
                    targetUsage={targetUsage}
                    onTargetUsageChange={handleTargetUsageChange}
                    isSimulating={simulatorState.isSimulating}
                    className="h-full"
                  />
                  
                  {/* アクションコントロール */}
                  <ActionControls
                    onRunBasicSimulation={handleRunBasicSimulation}
                    onRunFullSimulation={handleRunFullSimulation}
                    onAnalyzeROI={handleAnalyzeROI}
                    isSimulating={simulatorState.isSimulating}
                    simulationProgress={simulatorState.simulationProgress}
                    className="h-full"
                  />
                </div>
                
                {/* 設定パネル */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">⚙️ シミュレーション設定</CardTitle>
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showAdvanced ? '簡易表示' : '詳細設定'}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* 予算設定 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          予算上限
                        </label>
                        <input
                          type="number"
                          value={budget}
                          onChange={(e) => handleBudgetChange(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          min="0"
                          step="10000"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          プラン: ¥{plan.totalCost.toLocaleString()}
                        </div>
                      </div>
                      
                      {/* 使用用途設定 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          使用用途
                        </label>
                        <select
                          value={targetUsage}
                          onChange={(e) => handleTargetUsageChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="gaming">ゲーミング</option>
                          <option value="productivity">プロダクティビティ</option>
                          <option value="content_creation">コンテンツ制作</option>
                          <option value="mixed">混合用途</option>
                        </select>
                      </div>
                      
                      {/* 精度設定 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          シミュレーション精度
                        </label>
                        <select
                          value={simulatorState.simulationConfig.simulationPrecision}
                          onChange={(e) => simulatorActions.updateSimulationConfig({
                            simulationPrecision: e.target.value as 'fast' | 'balanced' | 'high' | 'maximum'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="fast">高速</option>
                          <option value="balanced">バランス</option>
                          <option value="high">高精度</option>
                          <option value="maximum">最高精度</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* 詳細設定（展開時） */}
                    {showAdvanced && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-gray-800">分析オプション</h5>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={simulatorState.simulationConfig.includeStressTests}
                                onChange={(e) => simulatorActions.updateSimulationConfig({
                                  includeStressTests: e.target.checked
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm">ストレステスト含む</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={simulatorState.simulationConfig.includePowerMeasurement}
                                onChange={(e) => simulatorActions.updateSimulationConfig({
                                  includePowerMeasurement: e.target.checked
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm">電力測定含む</span>
                            </label>
                          </div>
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-gray-800">比較オプション</h5>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={simulatorState.simulationConfig.enableBeforeAfterComparison}
                                onChange={(e) => simulatorActions.updateSimulationConfig({
                                  enableBeforeAfterComparison: e.target.checked
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm">Before/After比較</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={simulatorState.simulationConfig.includeRealWorldBenchmarks}
                                onChange={(e) => simulatorActions.updateSimulationConfig({
                                  includeRealWorldBenchmarks: e.target.checked
                                })}
                                className="mr-2"
                              />
                              <span className="text-sm">実測ベンチマーク</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* 分析タブ */}
              <TabsContent value="analysis" className="space-y-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    分析機能開発中
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    詳細な性能分析、ベンチマーク比較、温度・電力効率分析機能を実装予定です。
                  </p>
                </div>
              </TabsContent>
              
              {/* 結果タブ */}
              <TabsContent value="results" className="space-y-6">
                {simulatorState.currentSimulation ? (
                  <SimulationResults
                    simulation={simulatorState.currentSimulation}
                    roiAnalysis={simulatorState.roiAnalysis}
                    className="w-full"
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      シミュレーション結果待ち
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      シミュレーションを実行すると、詳細な結果とROI分析がここに表示されます。
                    </p>
                    <button
                      onClick={handleRunBasicSimulation}
                      disabled={simulatorState.isSimulating}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      🏃 基本シミュレーション実行
                    </button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// ===========================================
// 🛠️ ヘルパー関数
// ===========================================

function getApplicationsForUsage(usage: string): string[] {
  const applications: Record<string, string[]> = {
    gaming: ['ゲーム', '3Dアプリケーション', 'VR'],
    productivity: ['オフィス', 'ブラウザ', 'メール'],
    content_creation: ['動画編集', '画像編集', '3DCG', 'CAD'],
    mixed: ['ゲーム', 'オフィス', 'ブラウザ', '動画視聴']
  };
  return applications[usage] || applications.mixed;
}

function getUsageProfileForType(usage: string): { cpu: number; gpu: number; memory: number; storage: number } {
  const profiles: Record<string, { cpu: number; gpu: number; memory: number; storage: number }> = {
    gaming: { cpu: 70, gpu: 90, memory: 60, storage: 30 },
    productivity: { cpu: 40, gpu: 20, memory: 50, storage: 20 },
    content_creation: { cpu: 80, gpu: 75, memory: 80, storage: 60 },
    mixed: { cpu: 60, gpu: 60, memory: 60, storage: 40 }
  };
  return profiles[usage] || profiles.mixed;
}

export default UpgradeSimulator;
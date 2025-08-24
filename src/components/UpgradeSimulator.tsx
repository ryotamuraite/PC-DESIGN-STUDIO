import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Target
} from 'lucide-react';
import type { PCConfiguration } from '@/types';
import { useUpgradeSimulatorWrapper } from '@/hooks/useUpgradeSimulatorWrapper';
import type { UpgradeProposal, SimulationResultsCompat } from '@/hooks/useUpgradeSimulatorWrapper';
import { CurrentPCPanel } from './UpgradeSimulator/CurrentPCPanel';
import { UpgradeInterface } from './UpgradeSimulator/UpgradeInterface';
import { SimulationResults } from './UpgradeSimulator/SimulationResults';
import { ActionControls } from './UpgradeSimulator/ActionControls';

interface UpgradeSimulatorProps {
  currentConfig: PCConfiguration;
  onConfigurationSave?: (config: PCConfiguration) => void;
  onUpgradeExecute?: (upgrades: UpgradeProposal[]) => void;
}

// UpgradeProposal型はuseUpgradeSimulatorWrapperからインポート

interface SimulationState {
  isSimulating: boolean;
  progress: number;
  currentResults: SimulationResultsCompat | null;
  error: string | null;
}

/**
 * 🚀 Phase 3: UpgradeSimulator - PC構成最適化シミュレーター
 * 
 * 【核心機能】
 * - リアルタイム性能シミュレーション
 * - ROI分析・投資対効果計算
 * - 直感的ドラッグ&ドロップUI
 * - 予算・用途別最適化提案
 */
export const UpgradeSimulator: React.FC<UpgradeSimulatorProps> = ({
  currentConfig,
  onConfigurationSave,
  onUpgradeExecute
}) => {
  // 🎮 シミュレーション状態管理
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isSimulating: false,
    progress: 0,
    currentResults: null,
    error: null
  });

  const [selectedUpgrades, setSelectedUpgrades] = useState<UpgradeProposal[]>([]);
  const [budget, setBudget] = useState<number>(50000); // デフォルト予算: 5万円
  const [targetUsage, setTargetUsage] = useState<string>('gaming'); // デフォルト用途

  // 🔧 カスタムHook使用（ラッパー版）
  const {
    simulateUpgrade,
    optimizeForBudget
  } = useUpgradeSimulatorWrapper();

  /**
   * ⚡ リアルタイムシミュレーション実行
   */
  const handleSimulateUpgrades = useCallback(async () => {
    if (!selectedUpgrades.length) {
      setSimulationState(prev => ({
        ...prev,
        error: 'アップグレードするパーツを選択してください'
      }));
      return;
    }

    setSimulationState(prev => ({
      ...prev,
      isSimulating: true,
      progress: 0,
      error: null
    }));

    try {
      // 段階的シミュレーション実行
      for (let i = 0; i <= 100; i += 10) {
        setSimulationState(prev => ({ ...prev, progress: i }));
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const results = await simulateUpgrade(currentConfig, selectedUpgrades, {
        targetUsage,
        budget,
        includeROI: true,
        includePerformancePrediction: true
      });

      setSimulationState(prev => ({
        ...prev,
        isSimulating: false,
        progress: 100,
        currentResults: results
      }));
    } catch (error) {
      setSimulationState(prev => ({
        ...prev,
        isSimulating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'シミュレーションエラーが発生しました'
      }));
    }
  }, [selectedUpgrades, currentConfig, targetUsage, budget, simulateUpgrade]);

  /**
   * 🎯 スマート最適化実行
   */
  const handleOptimizeForBudget = useCallback(async () => {
    try {
      const optimizedUpgrades = await optimizeForBudget(currentConfig, budget, targetUsage);
      setSelectedUpgrades(optimizedUpgrades);
      
      // 最適化後、自動的にシミュレーション実行
      setTimeout(() => {
        handleSimulateUpgrades();
      }, 500);
    } catch (error) {
      setSimulationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '最適化エラーが発生しました'
      }));
    }
  }, [currentConfig, budget, targetUsage, optimizeForBudget, handleSimulateUpgrades]);

  /**
   * 💰 総アップグレード費用計算
   */
  const totalUpgradeCost = useMemo(() => {
    return selectedUpgrades.reduce((total, upgrade) => total + upgrade.cost, 0);
  }, [selectedUpgrades]);

  /**
   * 📊 期待パフォーマンス向上率計算
   */
  const expectedPerformanceGain = useMemo(() => {
    return selectedUpgrades.reduce((total, upgrade) => total + upgrade.estimatedGain, 0);
  }, [selectedUpgrades]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 🎮 ヘッダーセクション */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8" />
                <div>
                  <CardTitle className="text-2xl">PC アップグレード シミュレーター</CardTitle>
                  <p className="text-blue-100 mt-1">最適なパーツ構成をAIが分析・提案</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">予算</div>
                <div className="text-xl font-bold">¥{budget.toLocaleString()}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 🚨 エラー表示 */}
        {simulationState.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{simulationState.error}</AlertDescription>
          </Alert>
        )}

        {/* 📊 クイックサマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">総費用</p>
                  <p className="text-xl font-bold">¥{totalUpgradeCost.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">性能向上</p>
                  <p className="text-xl font-bold">+{expectedPerformanceGain.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">選択パーツ</p>
                  <p className="text-xl font-bold">{selectedUpgrades.length}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">ROI予測</p>
                  <p className="text-xl font-bold">
                    {simulationState.currentResults?.roi ? 
                      `${simulationState.currentResults.roi.toFixed(1)}%` : 
                      '計算中...'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🎮 メインインターフェース */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 👈 左パネル: 現在のPC構成 */}
          <div className="lg:col-span-3">
            <CurrentPCPanel 
              currentConfig={currentConfig}
              className="h-full"
            />
          </div>

          {/* 🎯 中央パネル: アップグレード操作 */}
          <div className="lg:col-span-6">
            <UpgradeInterface
              currentConfig={currentConfig}
              selectedUpgrades={selectedUpgrades}
              onUpgradesChange={setSelectedUpgrades}
              budget={budget}
              onBudgetChange={setBudget}
              targetUsage={targetUsage}
              onTargetUsageChange={setTargetUsage}
              isSimulating={simulationState.isSimulating}
            />
          </div>

          {/* 👉 右パネル: シミュレーション結果 */}
          <div className="lg:col-span-3">
            <SimulationResults
              results={simulationState.currentResults}
              isCalculating={simulationState.isSimulating}
              progress={simulationState.progress}
              className="h-full"
            />
          </div>
        </div>

        {/* 🎮 アクションコントロール */}
        <ActionControls
          onSimulate={handleSimulateUpgrades}
          onOptimize={handleOptimizeForBudget}
          onSave={() => onConfigurationSave?.(currentConfig)}
          onExecute={() => onUpgradeExecute?.(selectedUpgrades)}
          isSimulating={simulationState.isSimulating}
          hasUpgrades={selectedUpgrades.length > 0}
          canAfford={totalUpgradeCost <= budget}
        />

        {/* 🔄 進行状況バー */}
        {simulationState.isSimulating && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">シミュレーション実行中...</span>
                    <span className="text-sm text-gray-600">{simulationState.progress}%</span>
                  </div>
                  <Progress value={simulationState.progress} className="w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UpgradeSimulator;
// src/components/upgrade/UpgradeSimulator.tsx
// Phase 3 Week3: アップグレードシミュレーター実装 - 世界初のBefore/After性能予測システム

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  PlayCircle, 
  TrendingUp, 
  Zap, 
  Thermometer, 
  DollarSign, 
  BarChart3, 
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

import { useUpgradeSimulator } from '../../hooks/useUpgradeSimulator';
import {
  UpgradeRecommendation,
  SimulationResult,
  BenchmarkResult,
  PowerAnalysis,
  ThermalResult,
  ComparisonResult,
  PerformanceCategory
} from '../../types/upgrade';
import { PartCategory, Part, ExtendedPCConfiguration } from '@/types';

// ===========================================
// 🎯 メインコンポーネント
// ===========================================

interface UpgradeSimulatorProps {
  plan: UpgradeRecommendation;
  currentConfig: ExtendedPCConfiguration;
  onBack?: () => void;
  onSimulationComplete?: (result: SimulationResult) => void;
}

export const UpgradeSimulator: React.FC<UpgradeSimulatorProps> = ({
  plan,
  currentConfig,
  onBack,
  onSimulationComplete
}) => {
  // フックからstate/actionsを取得
  const [simulatorState, simulatorActions] = useUpgradeSimulator();
  
  // ローカルステート
  const [activeTab, setActiveTab] = useState<'overview' | 'benchmark' | 'power' | 'thermal' | 'roi'>('overview');
  const [autoRun] = useState(true);
  
  // ExtendedPCConfiguration を CurrentPCConfiguration に変換する関数
  const convertToCurrentConfig = (config: ExtendedPCConfiguration) => {
    // currentPartsを型に合わせて生成（memory/storageは配列型）
    const currentParts = {
      cpu: config.parts?.cpu ?? null,
      gpu: config.parts?.gpu ?? null,
      motherboard: config.parts?.motherboard ?? null,
      memory: config.parts?.memory ? [config.parts.memory] : [],  // ✅ Part[]
      storage: config.parts?.storage ? [config.parts.storage] : [], // ✅ Part[]
      psu: config.parts?.psu ?? null,
      case: config.parts?.case ?? null,
      cooler: config.parts?.cooler ?? null,
      other: []
    };
    
    return {
      id: config.id || `temp-${Date.now()}`,
      name: config.name || `Config-${Date.now()}`,
      currentParts,
      pcInfo: config.pcInfo || {
        condition: 'good' as const,
        usage: 'mixed' as const,
        dailyUsageHours: 8,
        location: 'home' as const
      },
      constraints: config.constraints || {
        budget: 100000,
        timeframe: 'flexible' as const,
        priority: 'performance' as const,
        keepParts: [],
        replaceParts: [],
        maxComplexity: 'moderate' as const
      },
      createdAt: config.createdAt || new Date(),
      lastUpdated: config.lastUpdated || new Date(),
      version: config.version || '1.0'
    };
  };
  
  // PCConfigurationオブジェクトを作成（ExtendedPCConfigurationから）
  const createPCConfiguration = (config: ExtendedPCConfiguration) => {
    // partsをundefinedを完全除去 - Object.fromEntriesでPartCategory型整合性確保
    const parts = Object.fromEntries(
      Object.entries(config.parts || {}).map(([key, value]) => [
        key as PartCategory,  // ✅ PartCategory型にキャスト
        value ?? null         // ✅ undefinedをnullに統一
      ])
    ) as Record<PartCategory, Part | null>;  // ✅ undefined除去でRecord型に強化
    
    // 総額計算（Parts価格の合計）
    const calculateTotalPrice = (parts: Partial<Record<PartCategory, Part | null>>) => {
      return Object.values(parts).reduce((total, part) => {
        return total + (part?.price || 0);
      }, 0);
    };
    
    const totalPrice = config.totalPrice ?? calculateTotalPrice(parts);
    
    return {
      id: config.id || `temp-${Date.now()}`,
      name: config.name || `Config-${Date.now()}`,
      parts,
      totalPrice,
      totalPowerConsumption: config.totalPowerConsumption,
      budget: config.budget,
      createdAt: config.createdAt || new Date(),  // ✅ undefined除去
      updatedAt: config.lastUpdated || new Date(),
      description: config.description,
      tags: config.tags
    };
  };
  
  // planからアップグレード後のConfigを生成
  const createAfterConfig = (plan: UpgradeRecommendation, baseConfig: ExtendedPCConfiguration) => {
    const upgradedParts: Partial<Record<PartCategory, Part | null>> = { ...baseConfig.parts };
    
    // planの各フェーズのアップグレードを適用
    plan.phases.forEach(phase => {
      phase.partsToReplace?.forEach(partUpgrade => {
        upgradedParts[partUpgrade.category] = partUpgrade.recommendedPart;
      });
    });
    
    // undefinedをnullに変換してPCConfiguration型に適合させる
    const cleanedParts = Object.fromEntries(
      Object.entries(upgradedParts).map(([key, value]) => [
        key as PartCategory,
        value ?? null
      ])
    ) as Record<PartCategory, Part | null>;
    
    const totalPrice = (baseConfig.totalPrice || 0) + plan.totalCost;
    
    return {
      id: `${baseConfig.id}_upgraded`,
      name: `${baseConfig.name} (アップグレード後)`,
      parts: cleanedParts,  // ✅ undefined除去でPCConfiguration型適合
      totalPrice,
      totalPowerConsumption: baseConfig.totalPowerConsumption,
      budget: baseConfig.budget,
      createdAt: baseConfig.createdAt || new Date(),  // ✅ undefined除去
      updatedAt: new Date(),
      description: `${baseConfig.description || ''} - ${plan.name}アップグレード`,
      tags: [...(baseConfig.tags || []), 'upgraded']
    };
  };
  
  // 初期化完了フラグ - 重複実行防止
  const initializedRef = useRef(false);
  const lastPlanIdRef = useRef<string | null>(null);
  
  // 初期化をuseEffectで一度だけ実行（依存配列を最小限に）
  useEffect(() => {
    const shouldInitialize = (
      autoRun && 
      !initializedRef.current && 
      plan && 
      currentConfig && 
      !simulatorState.currentSimulation &&
      plan.id !== lastPlanIdRef.current
    );
    
    if (!shouldInitialize) {
      return;
    }
    
    console.log('🎯 UpgradeSimulator初期化開始:', plan.name);
    
    const initializeAsync = async () => {
      try {
        initializedRef.current = true;
        lastPlanIdRef.current = plan.id;
        
        await simulatorActions.runSimulation(plan, convertToCurrentConfig(currentConfig));
        
        console.log('✅ UpgradeSimulator初期化完了');
      } catch (error) {
        console.error('❌ UpgradeSimulator初期化エラー:', error);
        // エラー時はフラグをリセットして再試行可能にする
        initializedRef.current = false;
        lastPlanIdRef.current = null;
      }
    };
    
    initializeAsync();
  }, [plan.id, currentConfig.id, autoRun, simulatorState.currentSimulation, currentConfig, plan, simulatorActions]); // ESLint警告修正: 依存関係を追加

  // 進行状況の計算
  const progressPercentage = useMemo(() => {
    if (simulatorState.isSimulating) {
      return simulatorState.simulationProgress;
    }
    return simulatorState.currentSimulation ? 100 : 0;
  }, [simulatorState.isSimulating, simulatorState.simulationProgress, simulatorState.currentSimulation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                🎯 アップグレードシミュレーター
                <span className="ml-3 text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  世界初
                </span>
              </h1>
              <p className="text-gray-600">
                Before/After性能比較・ベンチマーク予測・ROI分析システム
              </p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span>📋 プラン: {plan.name}</span>
                <span>💰 投資額: ¥{plan.totalCost.toLocaleString()}</span>
                <span>📈 予想改善: +{plan.expectedImprovement.performanceGain.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* シミュレーション制御 */}
              <button
                onClick={() => simulatorActions.runSimulation(plan, convertToCurrentConfig(currentConfig))}
                disabled={simulatorState.isSimulating}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  simulatorState.isSimulating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {simulatorState.isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>実行中...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>シミュレーション実行</span>
                  </>
                )}
              </button>

              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>プランナーに戻る</span>
                </button>
              )}
            </div>
          </div>

          {/* 進行状況バー */}
          {(simulatorState.isSimulating || progressPercentage > 0) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {simulatorState.isSimulating ? 'シミュレーション実行中...' : 'シミュレーション完了'}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {simulatorState.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-red-800 font-medium">シミュレーションエラー</div>
                <div className="text-red-600 text-sm">{simulatorState.error}</div>
              </div>
              <button
                onClick={simulatorActions.clearError}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <SimulatorTabButton
                id="overview"
                icon={<BarChart3 className="w-4 h-4" />}
                label="概要"
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                status={simulatorState.currentSimulation ? 'completed' : 'pending'}
              />
              <SimulatorTabButton
                id="benchmark"
                icon={<TrendingUp className="w-4 h-4" />}
                label="ベンチマーク"
                isActive={activeTab === 'benchmark'}
                onClick={() => setActiveTab('benchmark')}
                status={simulatorState.benchmarkResults.length > 0 ? 'completed' : 'pending'}
              />
              <SimulatorTabButton
                id="power"
                icon={<Zap className="w-4 h-4" />}
                label="電力分析"
                isActive={activeTab === 'power'}
                onClick={() => setActiveTab('power')}
                status={simulatorState.powerAnalysis ? 'completed' : 'pending'}
              />
              <SimulatorTabButton
                id="thermal"
                icon={<Thermometer className="w-4 h-4" />}
                label="温度・冷却"
                isActive={activeTab === 'thermal'}
                onClick={() => setActiveTab('thermal')}
                status={simulatorState.thermalAnalysis ? 'completed' : 'pending'}
              />
              <SimulatorTabButton
                id="roi"
                icon={<DollarSign className="w-4 h-4" />}
                label="ROI分析"
                isActive={activeTab === 'roi'}
                onClick={() => setActiveTab('roi')}
                status={simulatorState.roiAnalysis ? 'completed' : 'pending'}
              />
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab
                plan={plan}
                currentConfig={currentConfig}
                simulation={simulatorState.currentSimulation}
                comparison={simulatorState.comparisonResult}
                isLoading={simulatorState.isSimulating}
                onRunSimulation={() => simulatorActions.runSimulation(plan, convertToCurrentConfig(currentConfig))}
              />
            )}

            {activeTab === 'benchmark' && (
              <BenchmarkTab
                results={simulatorState.benchmarkResults}
                comparison={simulatorState.benchmarkComparison as ComparisonResult | null}
                isLoading={simulatorState.loading}
                onRunBenchmark={(categories) => simulatorActions.runBenchmarkSimulation(categories as PerformanceCategory[])}
              />
            )}

            {activeTab === 'power' && (
              <PowerTab
                analysis={simulatorState.powerAnalysis}
                plan={plan}
                currentConfig={currentConfig}
                isLoading={simulatorState.loading}
                onAnalyze={() => simulatorActions.analyzePowerEfficiency(
                  createPCConfiguration(currentConfig),  // beforeConfig
                  createAfterConfig(plan, currentConfig) // afterConfig
                )}
              />
            )}

            {activeTab === 'thermal' && (
              <ThermalTab
                analysis={simulatorState.thermalAnalysis}
                plan={plan}
                currentConfig={currentConfig}
                isLoading={simulatorState.loading}
                onAnalyze={() => simulatorActions.analyzeThermalProfile(
                  createPCConfiguration(currentConfig),  // beforeConfig
                  createAfterConfig(plan, currentConfig) // afterConfig
                )}
              />
            )}

            {activeTab === 'roi' && (
              <ROITab
                roiAnalysis={simulatorState.roiAnalysis as Record<string, unknown> | null}
                costBenefitAnalysis={simulatorState.costBenefitAnalysis as Record<string, unknown> | null}
                plan={plan}
                scenarios={simulatorState.activeScenarios as unknown as Record<string, unknown>[]}
                onCalculateROI={(timeframe) => simulatorActions.calculateROI(plan, timeframe)}
                onAnalyzeCostBenefit={() => simulatorActions.performCostBenefitAnalysis(plan, simulatorState.activeScenarios)}
              />
            )}
          </div>
        </div>

        {/* アクションバー */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                シミュレーション結果をエクスポート:
              </span>
              <button
                onClick={() => simulatorActions.exportResults('json')}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200 transition-colors"
              >
                JSON
              </button>
              <button
                onClick={() => simulatorActions.exportResults('csv')}
                className="px-3 py-1 bg-green-100 text-green-600 rounded text-sm hover:bg-green-200 transition-colors"
              >
                CSV
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={simulatorActions.resetSimulator}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                リセット
              </button>
              
              {simulatorState.currentSimulation && (
                <button
                  onClick={() => onSimulationComplete?.(simulatorState.currentSimulation!)}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all"
                >
                  ✅ シミュレーション採用
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 🧭 タブボタンコンポーネント
// ===========================================

interface SimulatorTabButtonProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  status: 'pending' | 'running' | 'completed' | 'error';
}

const SimulatorTabButton: React.FC<SimulatorTabButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
  status
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'running':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-300"></div>;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors relative ${
        isActive
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <span className="flex items-center space-x-2">
        {icon}
        <span>{label}</span>
        {getStatusIcon()}
      </span>
    </button>
  );
};

// ===========================================
// 📊 概要タブ
// ===========================================

interface OverviewTabProps {
  plan: UpgradeRecommendation;
  currentConfig: ExtendedPCConfiguration;
  simulation: SimulationResult | null;
  comparison: ComparisonResult | null;
  isLoading: boolean;
  onRunSimulation: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  plan,
  // currentConfig,
  simulation,
  // comparison,
  isLoading,
  onRunSimulation
}) => {
  const beforeAfterData = useMemo(() => {
    if (!simulation) return [];
    
    return [
      {
        category: 'CPU',
        before: 75,
        after: 75 + plan.expectedImprovement.performanceGain * 0.4,
        improvement: plan.expectedImprovement.performanceGain * 0.4
      },
      {
        category: 'GPU',
        before: 60,
        after: 60 + plan.expectedImprovement.performanceGain * 0.6,
        improvement: plan.expectedImprovement.performanceGain * 0.6
      },
      {
        category: 'Memory',
        before: 70,
        after: 70 + plan.expectedImprovement.performanceGain * 0.3,
        improvement: plan.expectedImprovement.performanceGain * 0.3
      },
      {
        category: 'Storage',
        before: 65,
        after: 65 + plan.expectedImprovement.performanceGain * 0.5,
        improvement: plan.expectedImprovement.performanceGain * 0.5
      }
    ];
  }, [simulation, plan]);

  return (
    <div className="space-y-8">
      {/* シミュレーション状態 */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          🎯 シミュレーション概要
        </h3>
        
        {simulation ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                +{simulation.overallImprovement.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">総合性能向上</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {simulation.paybackMonths.toFixed(1)}ヶ月
              </div>
              <div className="text-sm text-gray-600">投資回収期間</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {simulation.confidence.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">信頼度</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {simulation.userSatisfactionPrediction?.toFixed(0) || 85}%
              </div>
              <div className="text-sm text-gray-600">満足度予測</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-600 mb-4">
              シミュレーションを実行して詳細な分析結果を確認してください
            </p>
            <button
              onClick={onRunSimulation}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              {isLoading ? 'シミュレーション中...' : 'シミュレーション開始'}
            </button>
          </div>
        )}
      </section>

      {/* Before/After比較 */}
      {simulation && beforeAfterData.length > 0 && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            📊 Before/After 性能比較
          </h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beforeAfterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === 'before' ? 'Before' : 'After'
                  ]}
                />
                <Bar dataKey="before" fill="#94a3b8" name="before" />
                <Bar dataKey="after" fill="#3b82f6" name="after" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 改善サマリー */}
      {simulation && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            🚀 改善効果サマリー
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">解決されるボトルネック</h4>
              <div className="space-y-2">
                {simulation.resolvedBottlenecks.map((bottleneck, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">{bottleneck}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">投資効果</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">月間生産性向上価値:</span>
                  <span className="font-medium">¥{simulation.monthlyProductivityGain?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">年間節約額:</span>
                  <span className="font-medium text-green-600">¥{simulation.annualSavings?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ROI:</span>
                  <span className="font-medium text-blue-600">{simulation.roi.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* リスク・注意事項 */}
      {simulation && simulation.riskFactors && simulation.riskFactors.length > 0 && (
        <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            ⚠️ リスク・注意事項
          </h3>
          
          <div className="space-y-2">
            {simulation.riskFactors.map((risk, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <span className="text-sm text-gray-700">{risk}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ===========================================
// 📈 ベンチマークタブ
// ===========================================

interface BenchmarkTabProps {
  results: BenchmarkResult[];
  comparison: ComparisonResult | null;
  isLoading: boolean;
  onRunBenchmark: (categories: string[]) => void;
}

const BenchmarkTab: React.FC<BenchmarkTabProps> = ({
  results,
  isLoading,
  onRunBenchmark
}) => {
  const [selectedCategories, setSelectedCategories] = useState(['CPU', 'GPU', 'Memory', 'Storage']);

  const benchmarkData = useMemo(() => {
    return results.map(result => ({
      category: result.category,
      beforeScore: result.beforeScore,
      afterScore: result.afterScore,
      improvement: ((result.afterScore - result.beforeScore) / result.beforeScore * 100),
      confidence: result.confidence
    }));
  }, [results]);

  return (
    <div className="space-y-8">
      {/* ベンチマーク制御 */}
      <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          🏃 ベンチマーク実行
        </h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
          {['CPU', 'GPU', 'Memory', 'Storage', 'Overall'].map(category => (
            <label key={category} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, category]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                  }
                }}
                className="rounded"
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>

        <button
          onClick={() => onRunBenchmark(selectedCategories)}
          disabled={isLoading || selectedCategories.length === 0}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isLoading || selectedCategories.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isLoading ? 'ベンチマーク実行中...' : 'ベンチマーク実行'}
        </button>
      </section>

      {/* ベンチマーク結果 */}
      {benchmarkData.length > 0 && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            📊 ベンチマーク結果
          </h3>
          
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(0)}`,
                    name === 'beforeScore' ? 'Before' : 'After'
                  ]}
                />
                <Bar dataKey="beforeScore" fill="#94a3b8" name="beforeScore" />
                <Bar dataKey="afterScore" fill="#10b981" name="afterScore" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benchmarkData.map((data, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">{data.category}</h4>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  +{data.improvement.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Before: {data.beforeScore.toFixed(0)}</div>
                  <div>After: {data.afterScore.toFixed(0)}</div>
                  <div>信頼度: {data.confidence.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 詳細分析 */}
      {results.length > 0 && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            🔍 詳細分析
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">カテゴリ</th>
                  <th className="text-center py-2">テスト名</th>
                  <th className="text-center py-2">Before</th>
                  <th className="text-center py-2">After</th>
                  <th className="text-center py-2">改善率</th>
                  <th className="text-center py-2">信頼度</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const improvement = ((result.afterScore - result.beforeScore) / result.beforeScore * 100);
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium">{result.category}</td>
                      <td className="text-center py-2 text-sm">{result.testName}</td>
                      <td className="text-center py-2">{result.beforeScore.toFixed(0)}</td>
                      <td className="text-center py-2">{result.afterScore.toFixed(0)}</td>
                      <td className="text-center py-2">
                        <span className={`font-medium ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-2">
                        <span className="text-sm text-gray-600">{result.confidence.toFixed(0)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

// ===========================================
// ⚡ 電力分析タブ
// ===========================================

interface PowerTabProps {
  analysis: PowerAnalysis | null;
  plan: UpgradeRecommendation;
  currentConfig: ExtendedPCConfiguration;
  isLoading: boolean;
  onAnalyze: () => void;
}

const PowerTab: React.FC<PowerTabProps> = ({
  analysis,
  // plan,
  // currentConfig,
  isLoading,
  onAnalyze
}) => {
  const powerData = useMemo(() => {
    if (!analysis) return [];
    
    return [
      {
        state: 'アイドル',
        before: analysis.idle.before,
        after: analysis.idle.after,
        difference: analysis.idle.after - analysis.idle.before
      },
      {
        state: '負荷時',
        before: analysis.load.before,
        after: analysis.load.after,
        difference: analysis.load.after - analysis.load.before
      }
    ];
  }, [analysis]);

  return (
    <div className="space-y-8">
      {/* 分析制御 */}
      <section className="bg-gradient-to-r from-yellow-50 to-green-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          ⚡ 電力効率分析
        </h3>
        
        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${
                analysis.efficiency === 'improved' ? 'text-green-600' : 
                analysis.efficiency === 'increased' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {analysis.efficiency === 'improved' ? '改善' : 
                 analysis.efficiency === 'increased' ? '悪化' : '変化なし'}
              </div>
              <div className="text-sm text-gray-600">電力効率</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                ¥{analysis.annualCost.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">年間電気代</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${
                (analysis.monthlyCostDifference || 0) < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(analysis.monthlyCostDifference || 0) < 0 ? '' : '+'}
                ¥{(analysis.monthlyCostDifference || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">月間差額</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚡</div>
            <p className="text-gray-600 mb-4">
              電力効率分析を実行して詳細な電力情報を確認してください
            </p>
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              {isLoading ? '分析中...' : '電力分析開始'}
            </button>
          </div>
        )}
      </section>

      {/* 電力消費比較 */}
      {analysis && powerData.length > 0 && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            📊 消費電力比較
          </h3>
          
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={powerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis label={{ value: 'W', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(0)}W`,
                    name === 'before' ? 'Before' : 'After'
                  ]}
                />
                <Bar dataKey="before" fill="#94a3b8" name="before" />
                <Bar dataKey="after" fill="#eab308" name="after" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">電力効率改善効果</h4>
              <div className="space-y-2">
                {powerData.map((data, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{data.state}:</span>
                    <span className={`font-medium ${
                      data.difference < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.difference < 0 ? '' : '+'}
                      {data.difference.toFixed(0)}W
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">環境負荷指標</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">年間CO₂削減:</span>
                  <span className="font-medium text-green-600">
                    {(Math.abs(analysis.monthlyCostDifference || 0) * 12 * 0.5).toFixed(1)}kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">電力効率ランク:</span>
                  <span className="font-medium">
                    {analysis.efficiency === 'improved' ? 'A+' : 
                     analysis.efficiency === 'increased' ? 'C' : 'B'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 電力効率最適化提案 */}
      {analysis && (
        <section className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            💡 最適化提案
          </h3>
          
          <div className="space-y-3">
            {analysis.efficiency === 'improved' ? (
              <>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    優れた電力効率改善が期待できます
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    年間電気代を約¥{Math.abs(analysis.monthlyCostDifference || 0) * 12}節約できます
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    性能向上により消費電力が増加しますが、パフォーマンスが大幅に改善されます
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    高効率電源の選択により電力効率を改善できます
                  </span>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

// ===========================================
// 🌡️ 温度・冷却タブ
// ===========================================

interface ThermalTabProps {
  analysis: ThermalResult | null;
  plan: UpgradeRecommendation;
  currentConfig: ExtendedPCConfiguration;
  isLoading: boolean;
  onAnalyze: () => void;
}

const ThermalTab: React.FC<ThermalTabProps> = ({
  analysis,
  // plan,
  // currentConfig,
  isLoading,
  onAnalyze
}) => {
  const thermalData = useMemo(() => {
    if (!analysis) return [];
    
    return [
      {
        component: 'CPU',
        before: analysis.cpu.before,
        after: analysis.cpu.after,
        difference: analysis.cpu.after - analysis.cpu.before
      },
      {
        component: 'GPU',
        before: analysis.gpu.before,
        after: analysis.gpu.after,
        difference: analysis.gpu.after - analysis.gpu.before
      }
    ];
  }, [analysis]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return '低リスク';
      case 'medium': return '中リスク';
      case 'high': return '高リスク';
      default: return '不明';
    }
  };

  return (
    <div className="space-y-8">
      {/* 分析制御 */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          🌡️ 温度・冷却分析
        </h3>
        
        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysis.coolingEfficiency.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">冷却効率</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analysis.noiseLevelDb.toFixed(0)}dB
              </div>
              <div className="text-sm text-gray-600">ノイズレベル</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${getRiskColor(analysis.thermalThrottlingRisk || 'low')}`}>
                {getRiskText(analysis.thermalThrottlingRisk || 'low')}
              </div>
              <div className="text-sm text-gray-600">スロットリング</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🌡️</div>
            <p className="text-gray-600 mb-4">
              温度・冷却分析を実行して詳細な熱特性を確認してください
            </p>
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isLoading ? '分析中...' : '温度分析開始'}
            </button>
          </div>
        )}
      </section>

      {/* 温度比較 */}
      {analysis && thermalData.length > 0 && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            📊 温度比較
          </h3>
          
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={thermalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="component" />
                <YAxis label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(0)}°C`,
                    name === 'before' ? 'Before' : 'After'
                  ]}
                />
                <Bar dataKey="before" fill="#94a3b8" name="before" />
                <Bar dataKey="after" fill="#3b82f6" name="after" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">温度変化</h4>
              <div className="space-y-2">
                {thermalData.map((data, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{data.component}:</span>
                    <span className={`font-medium ${
                      data.difference < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.difference < 0 ? '' : '+'}
                      {data.difference.toFixed(0)}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">冷却システム評価</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">冷却効率:</span>
                  <span className="font-medium text-blue-600">
                    {analysis.coolingEfficiency.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">静音性:</span>
                  <span className="font-medium">
                    {analysis.noiseLevelDb < 35 ? '優秀' : 
                     analysis.noiseLevelDb < 45 ? '良好' : '要改善'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 冷却最適化提案 */}
      {analysis && (
        <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            ❄️ 冷却最適化提案
          </h3>
          
          <div className="space-y-3">
            {analysis.thermalThrottlingRisk === 'low' ? (
              <>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    優良な温度管理が期待できます
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    現在の冷却システムで十分対応可能です
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    追加の冷却強化を検討してください
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    ケースファンの追加やCPUクーラーのアップグレードが有効です
                  </span>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

// ===========================================
// 💰 ROI分析タブ
// ===========================================

interface ROITabProps {
  roiAnalysis: Record<string, unknown> | null;
  costBenefitAnalysis: Record<string, unknown> | null;
  plan: UpgradeRecommendation;
  scenarios: Record<string, unknown>[];
  onCalculateROI: (timeframe: number) => void;
  onAnalyzeCostBenefit: () => void;
}

const ROITab: React.FC<ROITabProps> = ({
  roiAnalysis,
  costBenefitAnalysis,
  onCalculateROI,
  onAnalyzeCostBenefit
}) => {
  const [timeframe, setTimeframe] = useState(24);

  const roiData = useMemo(() => {
    if (!roiAnalysis) return [];
    
    const months = Array.from({ length: roiAnalysis.timeframe as number }, (_, i) => i + 1);
    return months.map(month => ({
      month,
      cumulative: (roiAnalysis.monthlyBenefit as number) * month - (roiAnalysis.investmentCost as number),
      monthlyBenefit: roiAnalysis.monthlyBenefit as number,
      breakeven: month >= (roiAnalysis.paybackPeriod as number)
    }));
  }, [roiAnalysis]);

  return (
    <div className="space-y-8">
      {/* ROI分析制御 */}
      <section className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          💰 ROI（投資収益率）分析
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分析期間（月）
            </label>
            <input
              type="range"
              min="6"
              max="60"
              step="6"
              value={timeframe}
              onChange={(e) => setTimeframe(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>6ヶ月</span>
              <span className="font-medium">{timeframe}ヶ月</span>
              <span>5年</span>
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => onCalculateROI(timeframe)}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              ROI計算実行
            </button>
          </div>
        </div>

        {roiAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(roiAnalysis.roi as number).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">ROI</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(roiAnalysis.paybackPeriod as number).toFixed(1)}ヶ月
              </div>
              <div className="text-sm text-gray-600">回収期間</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                ¥{(roiAnalysis.monthlyBenefit as number).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">月間便益</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${
                (roiAnalysis.netPresentValue as number) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ¥{(roiAnalysis.netPresentValue as number).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">NPV</div>
            </div>
          </div>
        )}
      </section>

      {/* ROI推移グラフ */}
      {roiAnalysis && roiData.length > 0 && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            📈 ROI推移
          </h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" label={{ value: '月', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: '円', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '累積収益']}
                  labelFormatter={(month) => `${month}ヶ月目`}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 収益内訳 */}
      {roiAnalysis && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            💡 収益内訳分析
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">性能向上価値</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">生産性向上:</span>
                  <span className="font-medium">¥{((roiAnalysis.performanceValue as Record<string, unknown>).productivityGain as number).toLocaleString()}/月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">時間節約:</span>
                  <span className="font-medium">{((roiAnalysis.performanceValue as Record<string, unknown>).timesSaved as number).toFixed(1)}時間/月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ストレス軽減:</span>
                  <span className="font-medium">¥{((roiAnalysis.performanceValue as Record<string, unknown>).frustrationReduction as number).toLocaleString()}/月</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">コスト削減</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">電力削減:</span>
                  <span className="font-medium">¥{((roiAnalysis.costSavings as Record<string, unknown>).powerSavings as number).toLocaleString()}/月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">メンテナンス削減:</span>
                  <span className="font-medium">¥{((roiAnalysis.costSavings as Record<string, unknown>).maintenanceReduction as number).toLocaleString()}/月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ダウンタイム削減:</span>
                  <span className="font-medium">¥{((roiAnalysis.costSavings as Record<string, unknown>).downtimeReduction as number).toLocaleString()}/月</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* コストベネフィット分析 */}
      <section className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          ⚖️ コストベネフィット分析
        </h3>
        
        {costBenefitAnalysis ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(costBenefitAnalysis.recommendationScore as number).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">推奨スコア</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ¥{(costBenefitAnalysis.totalBenefit as number).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">総合便益</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(costBenefitAnalysis.costEffectiveness as number).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">費用対効果</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">推奨事項</h4>
              <div className="space-y-2">
                {(costBenefitAnalysis.recommendations as string[]).map((rec: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚖️</div>
            <p className="text-gray-600 mb-4">
              コストベネフィット分析を実行して詳細な費用対効果を確認してください
            </p>
            <button
              onClick={onAnalyzeCostBenefit}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
            >
              分析開始
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default UpgradeSimulator;
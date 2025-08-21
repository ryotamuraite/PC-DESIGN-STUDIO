// src/components/upgrade/UpgradePlanner.tsx
// Phase 3 Week2: アップグレードプランナー実装 - 市場初の段階的アップグレード支援

import React, { useState, useMemo } from 'react';
import {
  BottleneckAnalysis,
  UpgradeRecommendation,
  UpgradePhase
} from '../../types/upgrade';

// ===========================================
// 🎯 メインコンポーネント
// ===========================================

interface UpgradePlannerProps {
  analysis: BottleneckAnalysis;
  recommendations: UpgradeRecommendation[];
  onBack?: () => void;
  onPlanGenerated?: (plan: UpgradeRecommendation) => void;
}

export const UpgradePlanner: React.FC<UpgradePlannerProps> = ({
  analysis,
  recommendations,
  onBack,
  onPlanGenerated
}) => {
  // ステート管理
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'comparison' | 'custom'>('overview');
  const [selectedPlan, setSelectedPlan] = useState<UpgradeRecommendation | null>(
    recommendations.length > 0 ? recommendations[0] : null
  );
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customPlanConfig, setCustomPlanConfig] = useState({
    budget: 100000,
    timeframe: '3-6months' as const,
    priority: 'performance' as const,
    complexity: 'moderate' as const
  });

  // プラン統計の計算
  const planStats = useMemo(() => {
    return recommendations.reduce((stats, plan) => {
      return {
        totalPlans: stats.totalPlans + 1,
        avgCost: stats.avgCost + plan.totalCost / recommendations.length,
        maxImprovement: Math.max(stats.maxImprovement, plan.expectedImprovement.performanceGain),
        avgPriority: stats.avgPriority + plan.priority / recommendations.length
      };
    }, {
      totalPlans: 0,
      avgCost: 0,
      maxImprovement: 0,
      avgPriority: 0
    });
  }, [recommendations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📋 アップグレードプランナー
              </h1>
              <p className="text-gray-600">
                診断結果から最適なアップグレードプランを策定・比較・カスタマイズ
              </p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span>🎯 総合スコア: {analysis.overallScore}/100</span>
                <span>🔍 検出ボトルネック: {analysis.bottlenecks.length}個</span>
                <span>📋 提案プラン: {recommendations.length}個</span>
              </div>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ← 診断に戻る
              </button>
            )}
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <TabButton
                id="overview"
                icon="📊"
                label="概要"
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              />
              <TabButton
                id="plans"
                icon="📋"
                label="提案プラン"
                isActive={activeTab === 'plans'}
                onClick={() => setActiveTab('plans')}
                badge={recommendations.length}
              />
              <TabButton
                id="comparison"
                icon="⚖️"
                label="プラン比較"
                isActive={activeTab === 'comparison'}
                onClick={() => setActiveTab('comparison')}
              />
              <TabButton
                id="custom"
                icon="🎛️"
                label="カスタムプラン"
                isActive={activeTab === 'custom'}
                onClick={() => setActiveTab('custom')}
              />
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <PlanOverview
                analysis={analysis}
                recommendations={recommendations}
                stats={planStats}
                onSelectPlan={setSelectedPlan}
              />
            )}

            {activeTab === 'plans' && (
              <PlanDetails
                recommendations={recommendations}
                selectedPlan={selectedPlan}
                onSelectPlan={setSelectedPlan}
                onPlanGenerated={onPlanGenerated}
              />
            )}

            {activeTab === 'comparison' && (
              <PlanComparison
                analysis={analysis}
                recommendations={recommendations}
                onSelectPlan={setSelectedPlan}
              />
            )}

            {activeTab === 'custom' && (
              <CustomPlanCreator
                analysis={analysis}
                config={customPlanConfig}
                onConfigChange={setCustomPlanConfig}
                isGenerating={isGeneratingCustom}
                onGenerate={() => setIsGeneratingCustom(true)}
                onPlanGenerated={onPlanGenerated}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 🧭 タブボタンコンポーネント
// ===========================================

interface TabButtonProps {
  id: string;
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

const TabButton: React.FC<TabButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
  badge
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors relative ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <span className="flex items-center space-x-2">
        <span>{icon}</span>
        <span>{label}</span>
        {badge && badge > 0 && (
          <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
};

// ===========================================
// 📊 プラン概要タブ
// ===========================================

interface PlanOverviewProps {
  analysis: BottleneckAnalysis;
  recommendations: UpgradeRecommendation[];
  stats: {
    totalPlans: number;
    avgCost: number;
    maxImprovement: number;
    avgPriority: number;
  };
  onSelectPlan: (plan: UpgradeRecommendation) => void;
}

const PlanOverview: React.FC<PlanOverviewProps> = ({
  analysis,
  recommendations,
  stats,
  onSelectPlan
}) => {
  return (
    <div className="space-y-8">
      {/* 診断サマリー */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          🎯 診断サマリー
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{analysis.overallScore}</div>
            <div className="text-sm text-gray-600">総合スコア</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{analysis.balanceScore}</div>
            <div className="text-sm text-gray-600">バランス</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{analysis.bottlenecks.length}</div>
            <div className="text-sm text-gray-600">ボトルネック</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{(analysis.confidence * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">信頼度</div>
          </div>
        </div>
      </section>

      {/* プラン統計 */}
      <section className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          📈 提案プラン統計
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="📋"
            label="提案プラン数"
            value={stats.totalPlans}
            color="blue"
          />
          <StatCard
            icon="💰"
            label="平均コスト"
            value={`¥${stats.avgCost.toLocaleString()}`}
            color="green"
          />
          <StatCard
            icon="🚀"
            label="最大改善効果"
            value={`${stats.maxImprovement.toFixed(1)}%`}
            color="purple"
          />
          <StatCard
            icon="⭐"
            label="平均優先度"
            value={`${stats.avgPriority.toFixed(0)}/100`}
            color="orange"
          />
        </div>
      </section>

      {/* 推奨プラン一覧 */}
      <section className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          🏆 推奨プラン一覧
        </h3>
        
        <div className="space-y-4">
          {recommendations.slice(0, 3).map((plan, index) => (
            <PlanSummaryCard
              key={plan.id}
              plan={plan}
              rank={index + 1}
              onClick={() => onSelectPlan(plan)}
            />
          ))}
        </div>
        
        {recommendations.length > 3 && (
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">
              他 {recommendations.length - 3} 個のプランが利用可能です
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

// ===========================================
// 📋 プラン詳細タブ
// ===========================================

interface PlanDetailsProps {
  recommendations: UpgradeRecommendation[];
  selectedPlan: UpgradeRecommendation | null;
  onSelectPlan: (plan: UpgradeRecommendation) => void;
  onPlanGenerated?: (plan: UpgradeRecommendation) => void;
}

const PlanDetails: React.FC<PlanDetailsProps> = ({
  recommendations,
  selectedPlan,
  onSelectPlan,
  onPlanGenerated
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* プラン選択リスト */}
      <div className="lg:col-span-1">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">📋 プラン選択</h3>
          <div className="space-y-2">
            {recommendations.map((plan) => (
              <button
                key={plan.id}
                onClick={() => onSelectPlan(plan)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedPlan?.id === plan.id
                    ? 'bg-blue-100 border-2 border-blue-300'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{plan.name}</span>
                  <span className="text-xs text-gray-500">{plan.priority}/100</span>
                </div>
                <div className="text-xs text-gray-600">
                  ¥{plan.totalCost.toLocaleString()} | {plan.timeframe}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 選択プラン詳細 */}
      <div className="lg:col-span-2">
        {selectedPlan ? (
          <PlanDetailView
            plan={selectedPlan}
            onPlanGenerated={onPlanGenerated}
          />
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600">左側からプランを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================
// ⚖️ プラン比較タブ
// ===========================================

interface PlanComparisonProps {
  analysis: BottleneckAnalysis;
  recommendations: UpgradeRecommendation[];
  onSelectPlan: (plan: UpgradeRecommendation) => void;
}

const PlanComparison: React.FC<PlanComparisonProps> = ({
  analysis,
  recommendations,
  onSelectPlan
}) => {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);

  const togglePlanSelection = (planId: string) => {
    setSelectedPlans(prev => 
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId].slice(0, 3) // 最大3つまで比較
    );
  };

  const compareData = useMemo(() => {
    const selected = recommendations.filter(plan => selectedPlans.includes(plan.id));
    
    return {
      plans: selected,
      metrics: [
        {
          name: 'コスト',
          key: 'totalCost' as const,
          format: (val: number) => `¥${val.toLocaleString()}`,
          lower_is_better: true
        },
        {
          name: '性能向上',
          key: 'expectedImprovement.performanceGain' as const,
          format: (val: number) => `${val.toFixed(1)}%`,
          lower_is_better: false
        },
        {
          name: 'ROI',
          key: 'roi.costPerformanceRatio' as const,
          format: (val: number) => val.toFixed(2),
          lower_is_better: false
        },
        {
          name: '優先度',
          key: 'priority' as const,
          format: (val: number) => `${val}/100`,
          lower_is_better: false
        }
      ]
    };
  }, [recommendations, selectedPlans]);

  return (
    <div className="space-y-6">
      {/* プラン選択 */}
      <section className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          📊 比較するプランを選択 (最大3つ)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((plan) => (
            <ComparisonPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlans.includes(plan.id)}
              onToggle={() => togglePlanSelection(plan.id)}
              disabled={!selectedPlans.includes(plan.id) && selectedPlans.length >= 3}
            />
          ))}
        </div>
      </section>

      {/* 比較結果 */}
      {compareData.plans.length >= 2 && (
        <section className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            ⚖️ プラン比較結果
          </h3>
          
          <ComparisonTable data={compareData} />
        </section>
      )}

      {/* ベースライン比較 */}
      <section className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          📈 現在の構成との比較
        </h3>
        
        <BaselineComparison
          currentScore={analysis.overallScore}
          plans={selectedPlans.length > 0 ? compareData.plans : recommendations.slice(0, 3)}
        />
      </section>
    </div>
  );
};

// ===========================================
// 🎛️ カスタムプラン作成タブ
// ===========================================

interface CustomPlanCreatorProps {
  analysis: BottleneckAnalysis;
  config: {
    budget: number;
    timeframe: string;
    priority: string;
    complexity: string;
  };
  onConfigChange: (config: any) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onPlanGenerated?: (plan: UpgradeRecommendation) => void;
}

const CustomPlanCreator: React.FC<CustomPlanCreatorProps> = ({
  analysis,
  config,
  onConfigChange,
  isGenerating,
  onGenerate,
  onPlanGenerated
}) => {
  return (
    <div className="space-y-6">
      {/* 設定パネル */}
      <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          🎛️ カスタムプラン設定
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予算上限
            </label>
            <input
              type="range"
              min="30000"
              max="500000"
              step="10000"
              value={config.budget}
              onChange={(e) => onConfigChange({ ...config, budget: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>¥30,000</span>
              <span className="font-medium">¥{config.budget.toLocaleString()}</span>
              <span>¥500,000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              実施時期
            </label>
            <select
              value={config.timeframe}
              onChange={(e) => onConfigChange({ ...config, timeframe: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="immediate">🚀 すぐに</option>
              <option value="1-3months">📅 1-3ヶ月</option>
              <option value="3-6months">🗓️ 3-6ヶ月</option>
              <option value="6-12months">📆 6-12ヶ月</option>
              <option value="flexible">🔄 柔軟</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              優先度
            </label>
            <select
              value={config.priority}
              onChange={(e) => onConfigChange({ ...config, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="performance">🚀 性能重視</option>
              <option value="budget">💰 コスト重視</option>
              <option value="efficiency">⚡ 効率重視</option>
              <option value="longevity">🛡️ 長寿命重視</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作業複雑度
            </label>
            <select
              value={config.complexity}
              onChange={(e) => onConfigChange({ ...config, complexity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="simple">🟢 簡単</option>
              <option value="moderate">🟡 普通</option>
              <option value="advanced">🔴 高度</option>
            </select>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                プラン生成中...
              </span>
            ) : (
              '🎯 カスタムプラン生成'
            )}
          </button>
        </div>
      </section>

      {/* 生成予測 */}
      <section className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          🔮 プラン生成予測
        </h3>
        
        <CustomPlanPreview
          analysis={analysis}
          config={config}
        />
      </section>
    </div>
  );
};

// ===========================================
// 🎯 サポートコンポーネント群
// ===========================================

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-lg font-bold ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
};

const PlanSummaryCard: React.FC<{
  plan: UpgradeRecommendation;
  rank: number;
  onClick: () => void;
}> = ({ plan, rank, onClick }) => {
  const rankColors = {
    1: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    2: 'bg-gray-100 border-gray-300 text-gray-800',
    3: 'bg-orange-100 border-orange-300 text-orange-800'
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-colors border border-gray-200"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${rankColors[rank as keyof typeof rankColors] || 'bg-blue-100 border-blue-300 text-blue-800'}`}>
            #{rank}
          </span>
          <h4 className="font-semibold text-gray-800">{plan.name}</h4>
        </div>
        <span className="text-sm text-gray-500">{plan.priority}/100</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">コスト:</span>
          <div className="font-medium">¥{plan.totalCost.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-gray-500">期間:</span>
          <div className="font-medium">{plan.timeframe}</div>
        </div>
        <div>
          <span className="text-gray-500">改善:</span>
          <div className="font-medium text-green-600">
            +{plan.expectedImprovement.performanceGain.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

const PlanDetailView: React.FC<{
  plan: UpgradeRecommendation;
  onPlanGenerated?: (plan: UpgradeRecommendation) => void;
}> = ({ plan, onPlanGenerated }) => {
  return (
    <div className="space-y-6">
      {/* プランヘッダー */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-4">{plan.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">¥{plan.totalCost.toLocaleString()}</div>
            <div className="text-sm text-gray-600">総コスト</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+{plan.expectedImprovement.performanceGain.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">性能向上</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{plan.roi.paybackPeriod}</div>
            <div className="text-sm text-gray-600">回収月数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{plan.priority}</div>
            <div className="text-sm text-gray-600">優先度</div>
          </div>
        </div>
      </div>

      {/* フェーズ詳細 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">📅 実行フェーズ</h4>
        
        <div className="space-y-4">
          {plan.phases.map((phase, index) => (
            <PhaseCard key={index} phase={phase} />
          ))}
        </div>
      </div>

      {/* ROI詳細 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">💰 投資収益分析</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">コストパフォーマンス</h5>
            <div className="text-2xl font-bold text-green-600">
              {plan.roi.costPerformanceRatio.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">1.0以上で投資効果あり</p>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-2">新規購入との差額</h5>
            <div className="text-2xl font-bold text-blue-600">
              ¥{plan.roi.totalSavings.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500">節約額</p>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="text-center">
        <button
          onClick={() => onPlanGenerated?.(plan)}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          📋 このプランを採用
        </button>
      </div>
    </div>
  );
};

const PhaseCard: React.FC<{ phase: UpgradePhase }> = ({ phase }) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    difficult: 'bg-orange-100 text-orange-800',
    expert: 'bg-red-100 text-red-800'
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-gray-800">
          フェーズ {phase.phase}: {phase.name}
        </h5>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[phase.difficulty]}`}>
          {phase.difficulty}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">コスト:</span>
          <div className="font-medium">¥{phase.estimatedCost.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-gray-500">時間:</span>
          <div className="font-medium">{phase.estimatedTime}分</div>
        </div>
        <div>
          <span className="text-gray-500">改善:</span>
          <div className="font-medium text-green-600">
            +{phase.phaseImprovement.performance}%
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonPlanCard: React.FC<{
  plan: UpgradeRecommendation;
  isSelected: boolean;
  onToggle: () => void;
  disabled: boolean;
}> = ({ plan, isSelected, onToggle, disabled }) => {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : disabled
          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">{plan.name}</h4>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="text-blue-600"
          disabled={disabled}
        />
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div>コスト: ¥{plan.totalCost.toLocaleString()}</div>
        <div>改善: +{plan.expectedImprovement.performanceGain.toFixed(1)}%</div>
      </div>
    </div>
  );
};

const ComparisonTable: React.FC<{
  data: {
    plans: UpgradeRecommendation[];
    metrics: Array<{
      name: string;
      key: string;
      format: (val: number) => string;
      lower_is_better: boolean;
    }>;
  };
}> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">項目</th>
            {data.plans.map((plan) => (
              <th key={plan.id} className="text-center py-2 px-4">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.metrics.map((metric) => (
            <tr key={metric.name} className="border-b">
              <td className="py-2 font-medium">{metric.name}</td>
              {data.plans.map((plan) => {
                const value = getNestedValue(plan, metric.key);
                return (
                  <td key={plan.id} className="text-center py-2 px-4">
                    {metric.format(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BaselineComparison: React.FC<{
  currentScore: number;
  plans: UpgradeRecommendation[];
}> = ({ currentScore, plans }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{currentScore}</div>
          <div className="text-sm text-gray-600">現在のスコア</div>
        </div>
        
        {plans.slice(0, 3).map((plan) => {
          const newScore = currentScore + plan.expectedImprovement.performanceGain;
          return (
            <div key={plan.id} className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {newScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">{plan.name}</div>
              <div className="text-xs text-green-500">
                +{plan.expectedImprovement.performanceGain.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CustomPlanPreview: React.FC<{
  analysis: BottleneckAnalysis;
  config: any;
}> = ({ analysis, config }) => {
  const predictedPlan = useMemo(() => {
    // 簡易的な予測ロジック
    const budgetFactor = config.budget / 100000; // 10万円基準
    const priorityMultiplier = {
      performance: 1.2,
      budget: 0.8,
      efficiency: 1.0,
      longevity: 1.1
    }[config.priority] || 1.0;

    const estimatedImprovement = Math.min(
      analysis.bottlenecks.length * 15 * budgetFactor * priorityMultiplier,
      50
    );

    return {
      estimatedImprovement: estimatedImprovement.toFixed(1),
      estimatedPhases: Math.max(1, Math.ceil(analysis.bottlenecks.length / 2)),
      timeEstimate: config.timeframe === 'immediate' ? '1-2週間' : 
                   config.timeframe === '1-3months' ? '1-3ヶ月' : '3-6ヶ月'
    };
  }, [analysis, config]);

  return (
    <div className="bg-purple-50 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-purple-600">
            +{predictedPlan.estimatedImprovement}%
          </div>
          <div className="text-sm text-gray-600">予想改善効果</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">
            {predictedPlan.estimatedPhases}
          </div>
          <div className="text-sm text-gray-600">実行フェーズ数</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">
            {predictedPlan.timeEstimate}
          </div>
          <div className="text-sm text-gray-600">完了目安</div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// 🛠️ ユーティリティ関数
// ===========================================

function getNestedValue(obj: any, path: string): number {
  return path.split('.').reduce((current, key) => current?.[key], obj) || 0;
}

export default UpgradePlanner;
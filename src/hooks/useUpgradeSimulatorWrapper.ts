// src/hooks/useUpgradeSimulatorWrapper.ts
// Phase 3D: UpgradeSimulator.tsx互換性ラッパーフック

import { useCallback, useMemo } from 'react';
import { useUpgradeSimulator } from './useUpgradeSimulator';
import { PCConfiguration, PerformanceMetrics } from '@/types';
import { UpgradeRecommendation, CurrentPCConfiguration } from '../types/upgrade';

/**
 * 🔧 UpgradeSimulator.tsx互換性インターフェース
 * 
 * 既存のuseUpgradeSimulatorフックをラップして、
 * UpgradeSimulator.tsxが期待する形式のAPIを提供
 */

// UpgradeSimulator.tsxが期待するUpgradeProposal型
export interface UpgradeProposal {
  category: import('@/types').PartCategory;
  currentPart: import('@/types').Part | null;
  newPart: import('@/types').Part;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedGain: number;
  cost: number;
}

// シミュレーションオプション
export interface SimulationOptions {
  targetUsage: string;
  budget: number;
  includeROI?: boolean;
  includePerformancePrediction?: boolean;
}

// シミュレーション結果（UpgradeSimulator.tsx互換）
export interface SimulationResultsCompat {
  roi: number;
  performanceGain: number;
  estimatedImprovement: PerformanceMetrics;
  recommendations: string[];
  warnings: string[];
  confidence: number;
  paybackPeriod: number;
}

// 推奨事項生成の要件定義
export interface GenerationRequirements {
  budget?: number;
  usage?: string;
  priority?: 'performance' | 'budget' | 'efficiency';
}

/**
 * 🚀 UpgradeSimulator互換性フック
 * 
 * UpgradeSimulator.tsxが期待する形式でAPIを提供する
 */
export const useUpgradeSimulatorWrapper = () => {
  const [state, actions] = useUpgradeSimulator();

  /**
   * ⚡ アップグレードシミュレーション実行
   */
  const simulateUpgrade = useCallback(async (
    currentConfig: PCConfiguration,
    upgrades: UpgradeProposal[],
    options: SimulationOptions
  ): Promise<SimulationResultsCompat> => {
    try {
      // UpgradeProposalからUpgradeRecommendationに変換
      const upgradeRecommendation: UpgradeRecommendation = {
        id: `rec_${Date.now()}`,
        name: 'Generated Recommendation',
        description: 'Generated from upgrade proposals',
        type: 'balanced',
        totalCost: upgrades.reduce((sum, up) => sum + up.cost, 0),
        timeframe: 'immediate',
        difficultyLevel: 'moderate',
        phases: upgrades.map((upgrade, index) => ({
          phase: index + 1,
          name: `${upgrade.category} Upgrade`,
          description: upgrade.reason,
          partsToReplace: [{
            currentPart: upgrade.currentPart,
            recommendedPart: upgrade.newPart,
            category: upgrade.category,
            reason: upgrade.reason,
            urgency: upgrade.priority as 'low' | 'medium' | 'high',
            performanceGain: upgrade.estimatedGain,
            compatibilityImprovement: true,
            futureProofing: 70,
            newPartCost: upgrade.cost,
            netCost: upgrade.cost,
            installationSteps: [`${upgrade.category}を交換`],
            requiredTools: ['ドライバー', '静電気防止手袋'],
            estimatedInstallTime: 30,
            risks: [],
            backupNeeded: upgrade.category === 'storage',
            dataLossRisk: upgrade.category === 'storage'
          }],
          estimatedCost: upgrade.cost,
          estimatedTime: 30,
          difficulty: 'moderate' as const,
          phaseImprovement: {
            performance: upgrade.estimatedGain,
            powerEfficiency: 5,
            stability: 10
          },
          prerequisites: [],
          dependencies: [],
          warnings: [],
          recommendations: [`${upgrade.category}のアップグレードにより${upgrade.estimatedGain}%の性能向上が期待されます`]
        })),
        expectedImprovement: {
          performanceGain: upgrades.reduce((sum, up) => sum + up.estimatedGain, 0),
          valueGain: 10,
          longevityExtension: 12,
          powerEfficiencyGain: 5
        },
        roi: {
          costPerformanceRatio: 1.2,
          paybackPeriod: 12,
          totalSavings: 20000,
          valueRetention: 0.8
        },
        risks: [],
        generatedAt: new Date(),
        confidence: 0.8,
        priority: 80
      };

      // 既存のrunSimulationを使用
      const baseConfig: CurrentPCConfiguration = {
        id: currentConfig.id,
        name: currentConfig.name || 'Current PC',
        currentParts: {
          cpu: currentConfig.parts.cpu || null,
          motherboard: currentConfig.parts.motherboard || null,
          memory: currentConfig.parts.memory ? [currentConfig.parts.memory] : [],
          gpu: currentConfig.parts.gpu || null,
          storage: currentConfig.parts.storage ? [currentConfig.parts.storage] : [],
          psu: currentConfig.parts.psu || null,
          case: currentConfig.parts.case || null,
          cooler: currentConfig.parts.cooler || null,
          other: []
        },
        pcInfo: {
          condition: 'good' as const,
          usage: options.targetUsage as 'gaming' | 'office' | 'creative' | 'development' | 'server' | 'mixed',
          dailyUsageHours: 8,
          location: 'home' as const
        },
        constraints: {
          budget: options.budget,
          timeframe: 'immediate' as const,
          priority: 'performance' as const,
          keepParts: [],
          replaceParts: [],
          maxComplexity: 'moderate' as const
        },
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: '1.0'
      };

      const result = await actions.runSimulation(upgradeRecommendation, baseConfig);

      // 結果をUpgradeSimulator.tsx形式に変換
      const compatResult: SimulationResultsCompat = {
        roi: result.roi,
        performanceGain: result.overallImprovement,
        estimatedImprovement: {
          cpu: 75 + result.overallImprovement * 0.4,
          gpu: 70 + result.overallImprovement * 0.6,
          memory: 80 + result.overallImprovement * 0.3,
          storage: 65 + result.overallImprovement * 0.5,
          overall: 72.5 + result.overallImprovement
        },
        recommendations: [
          `総合性能が${result.overallImprovement.toFixed(1)}%向上します`,
          `ROI: ${result.roi.toFixed(1)}%`,
          `投資回収期間: ${result.paybackMonths.toFixed(1)}ヶ月`
        ],
        warnings: result.riskFactors || [],
        confidence: result.confidence,
        paybackPeriod: result.paybackMonths
      };

      return compatResult;

    } catch (error) {
      console.error('Simulation error:', error);
      // エラー時のフォールバック結果
      return {
        roi: 0,
        performanceGain: 0,
        estimatedImprovement: {
          cpu: 0,
          gpu: 0,
          memory: 0,
          storage: 0,
          overall: 0
        },
        recommendations: ['シミュレーションエラーが発生しました'],
        warnings: [error instanceof Error ? error.message : 'Unknown error'],
        confidence: 0,
        paybackPeriod: 0
      };
    }
  }, [actions]);

  /**
   * 💰 ROI計算
   */
  const calculateROI = useCallback((
    upgrades: UpgradeProposal[],
    timeframe: number
  ): number => {
    try {
      const totalCost = upgrades.reduce((sum, upgrade) => sum + upgrade.cost, 0);
      const totalGain = upgrades.reduce((sum, upgrade) => sum + upgrade.estimatedGain, 0);
      
      // 簡易ROI計算
      const monthlyBenefit = totalGain * 100; // 1%向上 = 100円/月
      const totalBenefit = monthlyBenefit * timeframe;
      const roi = ((totalBenefit - totalCost) / totalCost) * 100;
      
      return Math.max(0, roi);
    } catch (error) {
      console.error('ROI calculation error:', error);
      return 0;
    }
  }, []);

  /**
   * 🎯 予算最適化
   */
  const optimizeForBudget = useCallback(async (
    _currentConfig: PCConfiguration,
    budget: number,
    targetUsage: string
  ): Promise<UpgradeProposal[]> => {
    try {
      // 簡易最適化ロジック
      const proposals: UpgradeProposal[] = [];
      
      // 予算配分例（実際の実装ではより複雑な最適化が必要）
      const budgetAllocation = {
        gpu: 0.4,     // 40%
        cpu: 0.3,     // 30%
        memory: 0.15, // 15%
        storage: 0.15 // 15%
      };

      // 各カテゴリの提案を生成
      Object.entries(budgetAllocation).forEach(([category, ratio]) => {
        const categoryBudget = budget * ratio;
        
        if (categoryBudget >= 10000) { // 最小予算閾値
          proposals.push({
            category: category as import('@/types').PartCategory,
            currentPart: null,
            newPart: {
              id: `optimized_${category}`,
              name: `最適化された${category}`,
              category: category as import('@/types').PartCategory,
              price: categoryBudget,
              manufacturer: 'Optimized',
              specifications: {}
            },
            reason: `${targetUsage}用途に最適化されたパーツです`,
            priority: 'high',
            estimatedGain: Math.min(categoryBudget / 1000, 25), // 簡易性能向上計算
            cost: categoryBudget
          });
        }
      });

      return proposals;
    } catch (error) {
      console.error('Budget optimization error:', error);
      return [];
    }
  }, []);

  /**
   * 🤖 推奨事項生成
   */
  const generateRecommendations = useCallback(async (
    _currentConfig: PCConfiguration,
    requirements?: GenerationRequirements
  ): Promise<UpgradeProposal[]> => {
    try {
      const { budget = 50000, usage = 'gaming', priority = 'performance' } = requirements || {};
      
      // 基本推奨事項生成
      const recommendations: UpgradeProposal[] = [];
      
      // 使用用途に基づく推奨
      if (usage === 'gaming') {
        // priorityに基づいて推奨内容を調整
        const budgetRatio = priority === 'budget' ? 0.3 : priority === 'efficiency' ? 0.4 : 0.5;
        const performanceGain = priority === 'performance' ? 30 : priority === 'efficiency' ? 20 : 15;
        
        recommendations.push({
          category: 'gpu',
          currentPart: null,
          newPart: {
            id: 'rec_gpu_gaming',
            name: 'ゲーミングGPU',
            category: 'gpu',
            price: budget * budgetRatio,
            manufacturer: 'Gaming Corp',
            specifications: {}
          },
          reason: `ゲーミング性能向上のため (${priority}重視)`,
          priority: priority === 'performance' ? 'high' : 'medium',
          estimatedGain: performanceGain,
          cost: budget * budgetRatio
        });
      }

      return recommendations.filter(rec => rec.cost <= budget);
    } catch (error) {
      console.error('Recommendations generation error:', error);
      return [];
    }
  }, []);

  // 計算中状態
  const isCalculating = useMemo(() => state.isSimulating || state.loading, [state.isSimulating, state.loading]);

  // 最後の計算結果
  const lastCalculation = useMemo(() => {
    if (!state.currentSimulation) return null;
    
    return {
      result: state.currentSimulation,
      timestamp: state.currentSimulation.timestamp,
      confidence: state.currentSimulation.confidence
    };
  }, [state.currentSimulation]);

  // UpgradeSimulator.tsxが期待する形式で返す
  return {
    simulateUpgrade,
    calculateROI,
    optimizeForBudget,
    generateRecommendations,
    isCalculating,
    lastCalculation
  };
};

export default useUpgradeSimulatorWrapper;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SimulationResult {
  category: string;
  currentScore: number;
  projectedScore: number;
  improvement: number;
  improvementPercent: number;
}

interface ROIAnalysis {
  totalCost: number;
  performanceGain: number;
  costPerformanceRatio: number;
  paybackPeriod: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}

interface SimulationResultsProps {
  results?: SimulationResult[] | import('../../hooks/useUpgradeSimulatorWrapper').SimulationResultsCompat | null;
  // v30.0 UpgradeSimulator.tsx対応
  simulation?: import('../../types/upgrade').SimulationResult | null;
  roiAnalysis?: ROIAnalysis | import('../../hooks/useUpgradeSimulator').ROIAnalysis | null;
  isCalculating?: boolean;
  progress?: number;
  className?: string;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({
  results = [],
  simulation,
  roiAnalysis,
  isCalculating = false,
  progress,
  className = ''
}) => {
  // v30.0: simulationプロパティがある場合はそれを優先使用
  const effectiveResults = simulation ? null : results; // simulationがある時は後で変換
  const effectiveROI = roiAnalysis || (simulation ? null : undefined);
  // デモデータ
  const defaultResults: SimulationResult[] = [
    {
      category: 'ゲーミング性能',
      currentScore: 75,
      projectedScore: 92,
      improvement: 17,
      improvementPercent: 22.7
    },
    {
      category: '動画編集',
      currentScore: 68,
      projectedScore: 85,
      improvement: 17,
      improvementPercent: 25.0
    },
    {
      category: '3Dレンダリング',
      currentScore: 62,
      projectedScore: 88,
      improvement: 26,
      improvementPercent: 41.9
    },
    {
      category: '一般作業',
      currentScore: 85,
      projectedScore: 95,
      improvement: 10,
      improvementPercent: 11.8
    }
  ];

  const defaultROI: ROIAnalysis = {
    totalCost: 142600,
    performanceGain: 23.6,
    costPerformanceRatio: 6.04,
    paybackPeriod: 18,
    recommendation: 'good'
  };

  // UpgradeSimulator互換性: SimulationResultsCompatやsimulationをSimulationResult[]に変換
  const convertResults = (data: typeof results, simData?: typeof simulation): SimulationResult[] => {
    // v30.0: simulationプロパティがある場合はそれを優先
    if (simData) {
      const improvement = simData.overallImprovement || 0;
      return [
        {
          category: 'ゲーミング性能',
          currentScore: 75,
          projectedScore: Math.min(95, 75 + improvement * 0.6),
          improvement: improvement * 0.6,
          improvementPercent: improvement * 0.6
        },
        {
          category: '動画編集',
          currentScore: 68,
          projectedScore: Math.min(95, 68 + improvement * 0.7),
          improvement: improvement * 0.7,
          improvementPercent: improvement * 0.7
        },
        {
          category: '3Dレンダリング',
          currentScore: 62,
          projectedScore: Math.min(95, 62 + improvement * 0.8),
          improvement: improvement * 0.8,
          improvementPercent: improvement * 0.8
        },
        {
          category: '一般作業',
          currentScore: 85,
          projectedScore: Math.min(95, 85 + improvement * 0.3),
          improvement: improvement * 0.3,
          improvementPercent: improvement * 0.3
        }
      ];
    }
    
    if (!data) return defaultResults;
    if (Array.isArray(data)) return data.length > 0 ? data : defaultResults;
    
    // SimulationResultsCompat形式の場合は変換
    if (typeof data === 'object' && 'performanceGain' in data) {
      return [
        {
          category: 'ゲーミング性能',
          currentScore: 75,
          projectedScore: Math.min(95, 75 + data.performanceGain * 0.6),
          improvement: data.performanceGain * 0.6,
          improvementPercent: data.performanceGain * 0.6
        },
        {
          category: '動画編集',
          currentScore: 68,
          projectedScore: Math.min(95, 68 + data.performanceGain * 0.7),
          improvement: data.performanceGain * 0.7,
          improvementPercent: data.performanceGain * 0.7
        },
        {
          category: '3Dレンダリング',
          currentScore: 62,
          projectedScore: Math.min(95, 62 + data.performanceGain * 0.8),
          improvement: data.performanceGain * 0.8,
          improvementPercent: data.performanceGain * 0.8
        },
        {
          category: '一般作業',
          currentScore: 85,
          projectedScore: Math.min(95, 85 + data.performanceGain * 0.3),
          improvement: data.performanceGain * 0.3,
          improvementPercent: data.performanceGain * 0.3
        }
      ];
    }
    
    return defaultResults;
  };
  
  const displayResults = convertResults(effectiveResults, simulation);
  // ROI分析も互換性対応 (v30.0: simulation対応追加)
  const convertROI = (data: typeof results, simData?: typeof simulation): ROIAnalysis => {
    if (effectiveROI && typeof effectiveROI === 'object') {
      // ROIAnalysis型の場合
      if ('totalCost' in effectiveROI) {
        return effectiveROI as ROIAnalysis;
      }
      // useUpgradeSimulatorのROIAnalysis型の場合
      if ('investmentCost' in effectiveROI) {
        const roi = effectiveROI as import('../../hooks/useUpgradeSimulator').ROIAnalysis;
        return {
          totalCost: roi.investmentCost,
          performanceGain: roi.totalBenefit / roi.investmentCost * 100,
          costPerformanceRatio: roi.roi / 10,
          paybackPeriod: roi.paybackPeriod,
          recommendation: roi.roi > 15 ? 'excellent' : roi.roi > 10 ? 'good' : roi.roi > 5 ? 'fair' : 'poor'
        };
      }
    }
    
    // v30.0: simulationプロパティからROI情報を抽出
    if (simData) {
      return {
        totalCost: Math.round(simData.overallImprovement * 5000), // 推定費用
        performanceGain: simData.overallImprovement,
        costPerformanceRatio: simData.roi / 10,
        paybackPeriod: simData.paybackMonths,
        recommendation: simData.roi > 15 ? 'excellent' : simData.roi > 10 ? 'good' : simData.roi > 5 ? 'fair' : 'poor'
      };
    }
    
    if (data && typeof data === 'object' && 'roi' in data) {
      return {
        totalCost: Math.round(data.performanceGain * 5000), // 推定費用
        performanceGain: data.performanceGain,
        costPerformanceRatio: data.roi / 10,
        paybackPeriod: data.paybackPeriod || 18,
        recommendation: data.roi > 15 ? 'excellent' : data.roi > 10 ? 'good' : data.roi > 5 ? 'fair' : 'poor'
      };
    }
    
    return defaultROI;
  };
  
  const displayROI = convertROI(effectiveResults, simulation);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent': return '優秀な投資';
      case 'good': return '良好な投資';
      case 'fair': return '検討要';
      case 'poor': return '推奨しない';
      default: return '評価中';
    }
  };

  if (isCalculating) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>シミュレーション結果</span>
            <Badge variant="outline">計算中...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse text-4xl mb-4">⚡</div>
            <div className="text-sm text-gray-600">性能を計算しています...</div>
            <Progress value={progress || 75} className="w-48 mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>シミュレーション結果</span>
          <Badge variant="secondary">分析完了</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 性能スコア */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">性能向上予測</h3>
          {displayResults.map((result, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{result.category}</span>
                <span className="text-sm font-medium text-green-600">
                  +{result.improvementPercent.toFixed(1)}%
                </span>
              </div>
              <div className="relative">
                <Progress value={result.currentScore} className="h-2" />
                <Progress 
                  value={result.projectedScore} 
                  className="h-2 absolute top-0 opacity-50" 
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>現在: {result.currentScore}点</span>
                <span>予測: {result.projectedScore}点</span>
              </div>
            </div>
          ))}
        </div>

        {/* ROI分析 */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">投資対効果分析</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">アップグレード費用</span>
              <span className="text-sm font-medium">
                ¥{displayROI.totalCost.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">性能向上</span>
              <span className="text-sm font-medium text-green-600">
                +{displayROI.performanceGain.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">コスパ指数</span>
              <span className="text-sm font-medium">
                {displayROI.costPerformanceRatio.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">投資回収期間</span>
              <span className="text-sm font-medium">
                約{displayROI.paybackPeriod}ヶ月
              </span>
            </div>
          </div>
        </div>

        {/* 総合評価 */}
        <Alert className={getRecommendationColor(displayROI.recommendation)}>
          <AlertDescription>
            <div className="font-medium mb-2">
              総合判定: {getRecommendationText(displayROI.recommendation)}
            </div>
            <div className="text-sm">
              このアップグレードは平均{displayROI.performanceGain.toFixed(1)}%の性能向上が期待され、
              コストパフォーマンスは{displayROI.costPerformanceRatio.toFixed(2)}と
              {displayROI.recommendation === 'excellent' || displayROI.recommendation === 'good' 
                ? '良好' : '要検討'}です。
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SimulationResults;

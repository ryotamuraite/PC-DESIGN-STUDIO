// src/services/performancePrediction.ts
// パフォーマンス予測・ボトルネック分析サービス

import { PCConfiguration } from '@/types';
import performanceData from '@/data/compatibility/performance-database.json';

// 🔧 CPU・GPU性能データの型定義（型安全性向上）
interface CpuPerformanceData {
  benchmarkScores: {
    singleCore: number;
    multiCore: number;
    gaming: number;
  };
  tier: string;
  architecture?: string;
}

interface GpuPerformanceData {
  benchmarkScores: {
    '1080': number;
    '1440': number;
    '4': number; // 4K
    productivity: number;
    rayTracing: number;
  };
  architecture: string;
  tier: string;
}

interface MemoryData {
  specifications?: {
    capacity?: number;
    modules?: number;
  };
}

// パフォーマンス予測結果の型定義
export interface PerformancePredictionResult {
  overallScore: number; // 0-100の総合スコア
  bottleneckAnalysis: BottleneckAnalysis;
  gamingPerformance: GamingPerformanceResult;
  useCaseScores: UseCaseScores;
  recommendations: PerformanceRecommendation[];
  optimizations: OptimizationSuggestion[];
  predictedAt: Date;
}

export interface BottleneckAnalysis {
  cpuUtilization: number; // 0-100%
  gpuUtilization: number; // 0-100%
  bottleneckType: 'cpu' | 'gpu' | 'balanced' | 'memory' | 'unknown';
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  ratio: number; // CPU/GPU性能比
  message: string;
  resolutionImpact: Record<string, { cpuBound: boolean; gpuBound: boolean }>;
}

export interface GamingPerformanceResult {
  averageFps: Record<string, number>; // 解像度別平均FPS
  gameSpecificFps: Record<string, Record<string, number>>; // ゲーム・解像度別FPS
  recommendedResolution: string;
  rayTracingViable: boolean;
  dlssAvailable: boolean;
  performanceClass: 'entry' | 'mainstream' | 'high-end' | 'flagship';
}

export interface UseCaseScores {
  gaming: number; // 0-100
  contentCreation: number; // 0-100  
  workstation: number; // 0-100
  overall: number; // 0-100
  details: Record<string, { score: number; explanation: string }>;
}

export interface PerformanceRecommendation {
  type: 'upgrade' | 'optimize' | 'alternative';
  priority: 'high' | 'medium' | 'low';
  component: 'cpu' | 'gpu' | 'memory' | 'storage';
  title: string;
  description: string;
  expectedImprovement: string;
  estimatedCost?: number;
}

export interface OptimizationSuggestion {
  category: 'settings' | 'hardware' | 'configuration';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
}

export class PerformancePredictionService {
  private static instance: PerformancePredictionService;
  private database: typeof performanceData;

  private constructor() {
    this.database = performanceData;
  }

  public static getInstance(): PerformancePredictionService {
    if (!PerformancePredictionService.instance) {
      PerformancePredictionService.instance = new PerformancePredictionService();
    }
    return PerformancePredictionService.instance;
  }

  // メインの予測実行関数
  public predictPerformance(config: PCConfiguration): PerformancePredictionResult {
    const cpu = config.parts.cpu;
    const gpu = config.parts.gpu;
    const memory = config.parts.memory;

    if (!cpu || !gpu) {
      return this.createEmptyResult('CPU またはGPU が選択されていません');
    }

    // CPU・GPU性能データを取得
    const cpuData = this.getCpuPerformanceData(cpu.name || '');
    const gpuData = this.getGpuPerformanceData(gpu.name || '');

    if (!cpuData || !gpuData) {
      return this.createEmptyResult('CPU または GPU の性能データが見つかりません');
    }

    // ボトルネック分析
    const bottleneckAnalysis = this.analyzeBottleneck(cpuData, gpuData);

    // ゲーミング性能予測
    const gamingPerformance = this.predictGamingPerformance(cpuData, gpuData, bottleneckAnalysis);

    // 用途別スコア算出
    const useCaseScores = this.calculateUseCaseScores(cpuData, gpuData, memory);

    // 推奨事項生成
    const recommendations = this.generateRecommendations(cpuData, gpuData, bottleneckAnalysis, useCaseScores);

    // 最適化提案生成
    const optimizations = this.generateOptimizations(cpuData, gpuData, bottleneckAnalysis);

    // 総合スコア算出
    const overallScore = this.calculateOverallScore(useCaseScores, bottleneckAnalysis, gamingPerformance);

    return {
      overallScore,
      bottleneckAnalysis,
      gamingPerformance,
      useCaseScores,
      recommendations,
      optimizations,
      predictedAt: new Date()
    };
  }

  // CPU性能データ取得（🔧 型安全性向上）
  private getCpuPerformanceData(cpuName: string): CpuPerformanceData | null {
    // CPU名を正規化して検索
    const normalizedName = this.normalizeCpuName(cpuName);
    return (this.database.cpuPerformanceData as Record<string, CpuPerformanceData>)[normalizedName] || null;
  }

  // GPU性能データ取得（🔧 型安全性向上）
  private getGpuPerformanceData(gpuName: string): GpuPerformanceData | null {
    // GPU名を正規化して検索
    const normalizedName = this.normalizeGpuName(gpuName);
    return (this.database.gpuPerformanceData as Record<string, GpuPerformanceData>)[normalizedName] || null;
  }

  // ボトルネック分析実行（🔧 型安全性向上）
  private analyzeBottleneck(cpuData: CpuPerformanceData | null, gpuData: GpuPerformanceData | null): BottleneckAnalysis {
    const cpuScore = cpuData?.benchmarkScores?.gaming || 100;
    const gpuScore = gpuData?.benchmarkScores?.['1440'] || 100; // 基準解像度
    const ratio = cpuScore / gpuScore;

    const thresholds = this.database.bottleneckAnalysis.thresholds;
    
    let bottleneckType: BottleneckAnalysis['bottleneckType'] = 'balanced';
    let severity: BottleneckAnalysis['severity'] = 'none';
    let message = '';

    if (ratio < thresholds.severe_cpu_bottleneck) {
      bottleneckType = 'cpu';
      severity = 'severe';
      message = 'CPUが深刻なボトルネックになっています。CPUのアップグレードを強く推奨します。';
    } else if (ratio < thresholds.moderate_cpu_bottleneck) {
      bottleneckType = 'cpu';
      severity = 'moderate';
      message = 'CPUがボトルネックになる可能性があります。高フレームレートでの影響が予想されます。';
    } else if (ratio > thresholds.severe_gpu_bottleneck) {
      bottleneckType = 'gpu';
      severity = 'severe';
      message = 'GPUが深刻なボトルネックになっています。GPUのアップグレードを強く推奨します。';
    } else if (ratio > thresholds.moderate_gpu_bottleneck) {
      bottleneckType = 'gpu';
      severity = 'moderate';
      message = 'GPUがボトルネックになる可能性があります。高解像度での性能向上が期待できます。';
    } else {
      message = 'CPU と GPU のバランスが良く取れています。';
    }

    // 解像度別の影響分析
    const resolutionImpact = this.analyzeResolutionImpact(cpuData, gpuData, ratio);

    // CPU・GPU使用率の推定（簡易計算）
    const cpuUtilization = Math.min(100, Math.max(0, 
      bottleneckType === 'cpu' ? 95 : 
      bottleneckType === 'gpu' ? 70 : 85
    ));
    
    const gpuUtilization = Math.min(100, Math.max(0,
      bottleneckType === 'gpu' ? 95 :
      bottleneckType === 'cpu' ? 60 : 90
    ));

    return {
      cpuUtilization,
      gpuUtilization,
      bottleneckType,
      severity,
      ratio,
      message,
      resolutionImpact
    };
  }

  // 解像度別影響分析（🔧 型安全性向上）
  private analyzeResolutionImpact(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cpuData: CpuPerformanceData | null, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _gpuData: GpuPerformanceData | null, 
    ratio: number
  ) {
    const resolutions = ['1080p', '1440p', '4K'];
    const impact: Record<string, { cpuBound: boolean; gpuBound: boolean }> = {};

    resolutions.forEach(resolution => {
      const factors = (this.database.bottleneckAnalysis.resolutionFactors as Record<string, { cpuWeight: number; gpuWeight: number }>)[resolution];
      const adjustedRatio = ratio * (factors.cpuWeight / factors.gpuWeight);
      
      impact[resolution] = {
        cpuBound: adjustedRatio < 0.8,
        gpuBound: adjustedRatio > 1.3
      };
    });

    return impact;
  }

  // ゲーミング性能予測（🔧 型安全性向上）
  private predictGamingPerformance(cpuData: CpuPerformanceData, gpuData: GpuPerformanceData, bottleneck: BottleneckAnalysis): GamingPerformanceResult {
    const resolutions = ['1080p', '1440p', '4K'];
    const games = Object.keys(this.database.gamePerformanceProfiles);
    
    // 解像度別平均FPS
    const averageFps: Record<string, number> = {};
    resolutions.forEach(resolution => {
      const gpuScore = gpuData.benchmarkScores[resolution.replace('p', '').replace('K', '')];
      const cpuScore = cpuData.benchmarkScores.gaming;
      
      // ボトルネック影響を加味したFPS計算
      let fps = gpuScore;
      if (bottleneck.bottleneckType === 'cpu') {
        fps = Math.min(fps, cpuScore * 1.2);
      }
      
      averageFps[resolution] = Math.round(fps * 0.6); // 実用FPSに調整
    });

    // ゲーム別FPS予測
    const gameSpecificFps: Record<string, Record<string, number>> = {};
    games.forEach(game => {
      const gameProfile = (this.database.gamePerformanceProfiles as Record<string, { performanceMultipliers: Record<string, number> }>)[game];
      gameSpecificFps[game] = {};
      
      resolutions.forEach(resolution => {
        const baselineScore = gpuData.benchmarkScores[resolution.replace('p', '').replace('K', '')];
        const multiplier = gameProfile.performanceMultipliers[resolution];
        const predictedFps = Math.round(baselineScore * multiplier * 0.6);
        
        gameSpecificFps[game][resolution] = predictedFps;
      });
    });

    // 推奨解像度決定
    let recommendedResolution = '1080p';
    if (averageFps['4K'] >= 60) {
      recommendedResolution = '4K';
    } else if (averageFps['1440p'] >= 60) {
      recommendedResolution = '1440p';
    }

    // レイトレ・DLSS対応判定
    const rayTracingViable = gpuData.benchmarkScores.rayTracing >= 120;
    const dlssAvailable = gpuData.architecture === 'Ada Lovelace' || 
                         gpuData.architecture === 'Ampere';

    // 性能クラス判定
    let performanceClass: GamingPerformanceResult['performanceClass'] = 'entry';
    if (averageFps['1440p'] >= 100) {
      performanceClass = 'flagship';
    } else if (averageFps['1440p'] >= 70) {
      performanceClass = 'high-end';
    } else if (averageFps['1080p'] >= 70) {
      performanceClass = 'mainstream';
    }

    return {
      averageFps,
      gameSpecificFps,
      recommendedResolution,
      rayTracingViable,
      dlssAvailable,
      performanceClass
    };
  }

  // 用途別スコア算出（🔧 型安全性向上）
  private calculateUseCaseScores(cpuData: CpuPerformanceData, gpuData: GpuPerformanceData, memory?: MemoryData): UseCaseScores {
    const useCases = this.database.useCaseProfiles;
    const scores: Record<string, number> = {};
    const details: Record<string, { score: number; explanation: string }> = {};

    Object.entries(useCases).forEach(([useCase, profile]) => {
      const cpuSingleScore = cpuData.benchmarkScores.singleCore;
      const cpuMultiScore = cpuData.benchmarkScores.multiCore;
      const gpuScore = gpuData.benchmarkScores.productivity;
      const memoryCapacity = memory ? this.getMemoryCapacity(memory) : 16;

      // 各要素のスコア計算
      const cpuSingleWeight = profile.priorities.cpuSingleCore;
      const cpuMultiWeight = profile.priorities.cpuMultiCore;
      const gpuWeight = profile.priorities.gpuPerformance;
      const ramCapacityWeight = profile.priorities.ramCapacity;

      // 正規化されたスコア（0-100）
      const normalizedCpuSingle = Math.min(100, (cpuSingleScore / 220) * 100);
      const normalizedCpuMulti = Math.min(100, (cpuMultiScore / 45000) * 100);
      const normalizedGpu = Math.min(100, (gpuScore / 200) * 100);
      const normalizedRam = Math.min(100, (memoryCapacity / 128) * 100);

      // 重み付きスコア計算
      const weightedScore = (
        normalizedCpuSingle * cpuSingleWeight +
        normalizedCpuMulti * cpuMultiWeight +
        normalizedGpu * gpuWeight +
        normalizedRam * ramCapacityWeight
      ) / (cpuSingleWeight + cpuMultiWeight + gpuWeight + ramCapacityWeight);

      scores[useCase] = Math.round(weightedScore);

      // 詳細説明生成
      let explanation = '';
      if (useCase === 'gaming') {
        explanation = scores[useCase] >= 80 ? '高性能ゲーミングに適しています' :
                     scores[useCase] >= 60 ? '一般的なゲーミングに適しています' :
                     '軽量ゲームに適していますが、重いゲームでは制限があります';
      } else if (useCase === 'content_creation') {
        explanation = scores[useCase] >= 80 ? '高度なコンテンツ制作に適しています' :
                     scores[useCase] >= 60 ? '一般的なコンテンツ制作に適しています' :
                     '軽量な編集作業に適していますが、重い処理では時間がかかります';
      } else if (useCase === 'workstation') {
        explanation = scores[useCase] >= 80 ? 'プロフェッショナルワークステーションとして優秀です' :
                     scores[useCase] >= 60 ? 'ビジネス用途に適しています' :
                     '基本的な業務には十分ですが、重い処理は苦手です';
      }

      details[useCase] = { score: scores[useCase], explanation };
    });

    const overall = Math.round((scores.gaming + scores.content_creation + scores.workstation) / 3);

    return {
      gaming: scores.gaming,
      contentCreation: scores.content_creation,
      workstation: scores.workstation,
      overall,
      details
    };
  }

  // 推奨事項生成（🔧 型安全性向上）
  private generateRecommendations(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cpuData: CpuPerformanceData, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _gpuData: GpuPerformanceData, 
    bottleneck: BottleneckAnalysis, 
    scores: UseCaseScores
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // ボトルネック解消推奨
    if (bottleneck.severity === 'severe' || bottleneck.severity === 'moderate') {
      if (bottleneck.bottleneckType === 'cpu') {
        recommendations.push({
          type: 'upgrade',
          priority: bottleneck.severity === 'severe' ? 'high' : 'medium',
          component: 'cpu',
          title: 'CPU アップグレード推奨',
          description: `現在のCPU性能がボトルネックになっています。より高性能なCPUにアップグレードすることで、${bottleneck.severity === 'severe' ? '大幅な' : ''}性能向上が期待できます。`,
          expectedImprovement: bottleneck.severity === 'severe' ? '30-50% FPS向上' : '15-25% FPS向上'
        });
      } else if (bottleneck.bottleneckType === 'gpu') {
        recommendations.push({
          type: 'upgrade',
          priority: bottleneck.severity === 'severe' ? 'high' : 'medium',
          component: 'gpu',
          title: 'GPU アップグレード推奨',
          description: `現在のGPU性能がボトルネックになっています。より高性能なGPUにアップグレードすることで、${bottleneck.severity === 'severe' ? '大幅な' : ''}性能向上が期待できます。`,
          expectedImprovement: bottleneck.severity === 'severe' ? '40-60% FPS向上' : '20-30% FPS向上'
        });
      }
    }

    // メモリ推奨
    if (scores.workstation < 70 || scores.contentCreation < 70) {
      recommendations.push({
        type: 'upgrade',
        priority: 'medium',
        component: 'memory',
        title: 'メモリ増設推奨',
        description: 'より多くのメモリを搭載することで、マルチタスクやクリエイティブ作業の性能が向上します。',
        expectedImprovement: '作業効率 20-40% 向上'
      });
    }

    return recommendations;
  }

  // 最適化提案生成（🔧 型安全性向上）
  private generateOptimizations(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cpuData: CpuPerformanceData, 
    gpuData: GpuPerformanceData, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bottleneck: BottleneckAnalysis
  ): OptimizationSuggestion[] {
    const optimizations: OptimizationSuggestion[] = [];

    // DLSS/FSR設定提案
    const architecture = gpuData.architecture;
    if (architecture === 'Ada Lovelace' || architecture === 'Ampere') {
      optimizations.push({
        category: 'settings',
        title: 'DLSS有効化推奨',
        description: 'ゲーム設定でDLSSを有効にすることで、画質を保ちつつFPSを大幅に向上できます。',
        impact: 'high',
        difficulty: 'easy'
      });
    } else if (architecture === 'RDNA 3') {
      optimizations.push({
        category: 'settings',
        title: 'FSR有効化推奨',
        description: 'ゲーム設定でFSRを有効にすることで、画質を保ちつつFPSを向上できます。',
        impact: 'medium',
        difficulty: 'easy'
      });
    }

    // メモリオーバークロック提案
    const tier = _cpuData.tier;
    if (tier === 'flagship' || tier === 'high-end') {
      optimizations.push({
        category: 'hardware',
        title: 'メモリオーバークロック',
        description: 'メモリをオーバークロックすることで、CPU性能を引き出し、フレームレートを向上できます。',
        impact: 'medium',
        difficulty: 'medium'
      });
    }

    return optimizations;
  }

  // 総合スコア算出
  private calculateOverallScore(scores: UseCaseScores, bottleneck: BottleneckAnalysis, gaming: GamingPerformanceResult): number {
    const baseScore = scores.overall;
    
    // ボトルネック影響
    let bottleneckPenalty = 0;
    if (bottleneck.severity === 'severe') {
      bottleneckPenalty = 15;
    } else if (bottleneck.severity === 'moderate') {
      bottleneckPenalty = 8;
    }

    // ゲーミング性能ボーナス
    let gamingBonus = 0;
    if (gaming.performanceClass === 'flagship') {
      gamingBonus = 5;
    } else if (gaming.performanceClass === 'high-end') {
      gamingBonus = 3;
    }

    return Math.max(0, Math.min(100, baseScore - bottleneckPenalty + gamingBonus));
  }

  // ヘルパーメソッド群
  private normalizeCpuName(name: string): string {
    // CPU名の正規化（例: "Intel Core i7-14700K" -> "Intel Core i7-14700K"）
    const patterns = [
      /Intel Core (i[359])-(\d{4,5}[A-Z]*)/i,
      /AMD Ryzen ([579]) (\d{4}[A-Z]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return name;
  }

  private normalizeGpuName(name: string): string {
    // GPU名の正規化（例: "NVIDIA RTX 4080" -> "RTX 4080"）
    const patterns = [
      /RTX (\d{4})/i,
      /GTX (\d{4})/i,
      /RX (\d{4} [A-Z]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        return match[0].toUpperCase();
      }
    }
    
    return name;
  }

  // 🔧 メモリ容量取得（型安全性向上）
  private getMemoryCapacity(memory: MemoryData): number {
    // メモリ容量を取得（GB単位）
    const capacity = memory.specifications?.capacity || 16;
    const modules = memory.specifications?.modules || 1;
    return capacity * modules;
  }

  private createEmptyResult(message: string): PerformancePredictionResult {
    return {
      overallScore: 0,
      bottleneckAnalysis: {
        cpuUtilization: 0,
        gpuUtilization: 0,
        bottleneckType: 'unknown',
        severity: 'none',
        ratio: 0,
        message,
        resolutionImpact: {}
      },
      gamingPerformance: {
        averageFps: {},
        gameSpecificFps: {},
        recommendedResolution: '1080p',
        rayTracingViable: false,
        dlssAvailable: false,
        performanceClass: 'entry'
      },
      useCaseScores: {
        gaming: 0,
        contentCreation: 0,
        workstation: 0,
        overall: 0,
        details: {}
      },
      recommendations: [],
      optimizations: [],
      predictedAt: new Date()
    };
  }
}

export default PerformancePredictionService;
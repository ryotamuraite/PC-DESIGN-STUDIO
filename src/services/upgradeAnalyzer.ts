// src/services/upgradeAnalyzer.ts
// Phase 3: 既存PCアップグレード診断エンジン - 市場初の差別化機能

import { Part, PartCategory, ExtendedPCConfiguration } from '../types/index';
import {
  CurrentPCConfiguration,
  BottleneckAnalysis,
  ComponentPerformance,
  BottleneckResult,
  PerformanceMetrics,
  CompatibilityIssue
} from '../types/upgrade';

/**
 * 🔍 アップグレード分析エンジン
 * 既存PCの詳細診断とボトルネック分析を実行
 */
export class UpgradeAnalyzer {
  private performanceDatabase: Map<string, number> = new Map();
  private compatibilityMatrix: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializePerformanceDatabase();
    this.initializeCompatibilityMatrix();
  }

  /**
   * 🎯 メイン診断実行
   * 現在のPC構成を完全分析し、ボトルネックを特定
   */
  async analyzeCurrentPC(currentPC: CurrentPCConfiguration): Promise<BottleneckAnalysis> {
    console.log('🔍 PC診断開始:', currentPC.name);
    
    try {
      // 1. コンポーネント個別分析
      const componentAnalysis = await this.analyzeComponents(currentPC);
      
      // 2. ボトルネック検出
      const bottlenecks = await this.detectBottlenecks(currentPC, componentAnalysis);
      
      // 3. パフォーマンス予測
      const performanceMetrics = await this.predictPerformance(currentPC, componentAnalysis);
      
      // 4. 互換性チェック
      const compatibilityIssues = await this.checkCompatibility(currentPC);
      
      // 5. 総合スコア計算
      const overallScore = this.calculateOverallScore(componentAnalysis);
      const balanceScore = this.calculateBalanceScore(componentAnalysis);
      
      // 6. 診断結果構築
      const analysis: BottleneckAnalysis = {
        overallScore,
        balanceScore,
        componentAnalysis,
        bottlenecks,
        performanceMetrics,
        compatibilityIssues,
        diagnosisDate: new Date(),
        confidence: this.calculateConfidence(currentPC, componentAnalysis),
        dataSource: ['internal_db', 'benchmark_data', 'compatibility_matrix']
      };
      
      console.log('✅ PC診断完了 - 総合スコア:', overallScore);
      return analysis;
      
    } catch (error) {
      console.error('❌ PC診断エラー:', error);
      throw new Error(`診断処理に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🔧 コンポーネント個別分析
   * 各パーツの性能・コスパ・現代性を詳細評価
   */
  private async analyzeComponents(
    currentPC: CurrentPCConfiguration
  ): Promise<Record<PartCategory, ComponentPerformance>> {
    const analysis: Record<string, ComponentPerformance> = {};
    
    // CPU分析
    if (currentPC.currentParts.cpu) {
      analysis.cpu = await this.analyzeComponent(currentPC.currentParts.cpu, 'cpu', currentPC);
    }
    
    // GPU分析
    if (currentPC.currentParts.gpu) {
      analysis.gpu = await this.analyzeComponent(currentPC.currentParts.gpu, 'gpu', currentPC);
    }
    
    // マザーボード分析
    if (currentPC.currentParts.motherboard) {
      analysis.motherboard = await this.analyzeComponent(
        currentPC.currentParts.motherboard, 
        'motherboard', 
        currentPC
      );
    }
    
    // メモリ分析（複数対応）
    if (currentPC.currentParts.memory.length > 0) {
      // 最も代表的なメモリモジュールを分析
      const primaryMemory = currentPC.currentParts.memory[0];
      analysis.memory = await this.analyzeComponent(primaryMemory, 'memory', currentPC);
      
      // 複数メモリの場合は容量・速度の統合評価
      if (currentPC.currentParts.memory.length > 1) {
        analysis.memory = await this.analyzeMultipleMemory(currentPC.currentParts.memory, currentPC);
      }
    }
    
    // ストレージ分析（複数対応）
    if (currentPC.currentParts.storage.length > 0) {
      const primaryStorage = currentPC.currentParts.storage[0];
      analysis.storage = await this.analyzeComponent(primaryStorage, 'storage', currentPC);
      
      // 複数ストレージの場合
      if (currentPC.currentParts.storage.length > 1) {
        analysis.storage = await this.analyzeMultipleStorage(currentPC.currentParts.storage, currentPC);
      }
    }
    
    // 電源分析
    if (currentPC.currentParts.psu) {
      analysis.psu = await this.analyzeComponent(currentPC.currentParts.psu, 'psu', currentPC);
    }
    
    // ケース分析
    if (currentPC.currentParts.case) {
      analysis.case = await this.analyzeComponent(currentPC.currentParts.case, 'case', currentPC);
    }
    
    // クーラー分析
    if (currentPC.currentParts.cooler) {
      analysis.cooler = await this.analyzeComponent(currentPC.currentParts.cooler, 'cooler', currentPC);
    }
    
    return analysis as Record<PartCategory, ComponentPerformance>;
  }

  /**
   * 🔍 単一コンポーネント分析
   */
  private async analyzeComponent(
    part: Part,
    category: PartCategory,
    currentPC: CurrentPCConfiguration
  ): Promise<ComponentPerformance> {
    
    // パフォーマンススコア計算
    const performanceScore = this.calculatePerformanceScore(part, category);
    
    // コスパスコア計算
    const valueScore = this.calculateValueScore(part, category, performanceScore);
    
    // 現代性スコア計算
    const modernityScore = this.calculateModernityScore(part, category);
    
    // 強み・弱み分析
    const { strengths, weaknesses } = this.analyzeStrengthsWeaknesses(part, category, currentPC);
    
    // 推奨アクション決定
    const recommendedAction = this.determineRecommendedAction(
      performanceScore,
      valueScore,
      modernityScore,
      currentPC
    );
    
    // 寿命予測
    const expectedLifespan = this.predictLifespan(part, category, currentPC.pcInfo.usage);
    
    // 他パーツとの相性
    const compatibilityWithOthers = this.calculateCompatibilityScore(part, currentPC);
    
    return {
      part,
      category,
      performanceScore,
      valueScore,
      modernityScore,
      strengths,
      weaknesses,
      recommendedAction,
      expectedLifespan,
      maintenanceNeeded: this.assessMaintenanceNeeded(part, currentPC),
      compatibilityWithOthers
    };
  }

  /**
   * 🚨 ボトルネック検出
   * システム全体の性能制限要因を特定
   */
  private async detectBottlenecks(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): Promise<BottleneckResult[]> {
    const bottlenecks: BottleneckResult[] = [];
    
    // CPUボトルネック検出
    const cpuBottleneck = this.detectCPUBottleneck(currentPC, componentAnalysis);
    if (cpuBottleneck) bottlenecks.push(cpuBottleneck);
    
    // GPUボトルネック検出
    const gpuBottleneck = this.detectGPUBottleneck(currentPC, componentAnalysis);
    if (gpuBottleneck) bottlenecks.push(gpuBottleneck);
    
    // メモリボトルネック検出
    const memoryBottleneck = this.detectMemoryBottleneck(currentPC, componentAnalysis);
    if (memoryBottleneck) bottlenecks.push(memoryBottleneck);
    
    // ストレージボトルネック検出
    const storageBottleneck = this.detectStorageBottleneck(currentPC, componentAnalysis);
    if (storageBottleneck) bottlenecks.push(storageBottleneck);
    
    // 電源ボトルネック検出
    const psuBottleneck = this.detectPSUBottleneck(currentPC, componentAnalysis);
    if (psuBottleneck) bottlenecks.push(psuBottleneck);
    
    // 冷却ボトルネック検出
    const coolingBottleneck = this.detectCoolingBottleneck(currentPC, componentAnalysis);
    if (coolingBottleneck) bottlenecks.push(coolingBottleneck);
    
    // 互換性ボトルネック検出
    const compatibilityBottleneck = this.detectCompatibilityBottleneck(currentPC, componentAnalysis);
    if (compatibilityBottleneck) bottlenecks.push(compatibilityBottleneck);
    
    // 重要度順にソート
    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * 💾 CPUボトルネック検出
   */
  private detectCPUBottleneck(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): BottleneckResult | null {
    const cpu = componentAnalysis.cpu;
    const gpu = componentAnalysis.gpu;
    
    if (!cpu || !gpu) return null;
    
    // CPU性能とGPU性能のバランスチェック
    const cpuGpuRatio = cpu.performanceScore / gpu.performanceScore;
    
    // CPUがGPUに対して明らかに劣る場合
    if (cpuGpuRatio < 0.6) {
      const severity = cpuGpuRatio < 0.4 ? 'critical' : cpuGpuRatio < 0.5 ? 'major' : 'moderate';
      
      return {
        type: 'cpu',
        severity,
        description: `CPUがGPUの性能を十分に活かせていません（性能比：${(cpuGpuRatio * 100).toFixed(1)}%）`,
        impact: `ゲーミング性能が最大${((1 - cpuGpuRatio) * 50).toFixed(0)}%低下している可能性があります`,
        recommendedSolution: `より高性能なCPU（${this.suggestCPUUpgrade(currentPC)}）へのアップグレードを推奨`,
        improvementPotential: Math.min(90, (1 - cpuGpuRatio) * 100),
        costEstimate: this.estimateUpgradeCost(currentPC.currentParts.cpu, 'cpu'),
        difficultyLevel: 'moderate',
        affectedParts: ['cpu'],
        dependentUpgrades: this.needsMotherboardUpgrade(currentPC) ? ['motherboard'] : []
      };
    }
    
    return null;
  }

  /**
   * 🎮 GPUボトルネック検出
   */
  private detectGPUBottleneck(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): BottleneckResult | null {
    const gpu = componentAnalysis.gpu;
    
    if (!gpu) return null;
    
    // 用途別GPU要求性能チェック
    const usage = currentPC.pcInfo.usage;
    let minimumGPUScore = 50;
    
    switch (usage) {
      case 'gaming':
        minimumGPUScore = 70;
        break;
      case 'creative':
        minimumGPUScore = 75;
        break;
      case 'development':
        minimumGPUScore = 60;
        break;
      default:
        minimumGPUScore = 40;
    }
    
    if (gpu.performanceScore < minimumGPUScore) {
      const deficit = minimumGPUScore - gpu.performanceScore;
      const severity = deficit > 30 ? 'critical' : deficit > 20 ? 'major' : 'moderate';
      
      return {
        type: 'gpu',
        severity,
        description: `${usage}用途には性能が不足しています（要求：${minimumGPUScore}、現在：${gpu.performanceScore.toFixed(1)}）`,
        impact: `描画性能が大幅に制限され、快適な作業・ゲームができません`,
        recommendedSolution: `${usage}向けの高性能GPU（${this.suggestGPUUpgrade(currentPC)}）への交換を推奨`,
        improvementPotential: Math.min(95, deficit * 2),
        costEstimate: this.estimateUpgradeCost(currentPC.currentParts.gpu, 'gpu'),
        difficultyLevel: 'easy',
        affectedParts: ['gpu'],
        dependentUpgrades: this.needsPSUUpgrade(currentPC) ? ['psu'] : []
      };
    }
    
    return null;
  }

  /**
   * 💿 メモリボトルネック検出
   */
  private detectMemoryBottleneck(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): BottleneckResult | null {
    const memory = componentAnalysis.memory;
    
    if (!memory) return null;
    
    // メモリ容量チェック
    const totalMemoryGB = this.calculateTotalMemory(currentPC.currentParts.memory);
    const usage = currentPC.pcInfo.usage;
    
    let recommendedMemoryGB = 16;
    switch (usage) {
      case 'gaming':
        recommendedMemoryGB = 32;
        break;
      case 'creative':
        recommendedMemoryGB = 64;
        break;
      case 'development':
        recommendedMemoryGB = 32;
        break;
      default:
        recommendedMemoryGB = 16;
    }
    
    if (totalMemoryGB < recommendedMemoryGB) {
      const deficit = recommendedMemoryGB - totalMemoryGB;
      const severity = deficit >= 32 ? 'critical' : deficit >= 16 ? 'major' : 'moderate';
      
      return {
        type: 'memory',
        severity,
        description: `メモリ容量が不足しています（推奨：${recommendedMemoryGB}GB、現在：${totalMemoryGB}GB）`,
        impact: `マルチタスク性能の低下、アプリケーションの動作不安定`,
        recommendedSolution: `${deficit}GB以上のメモリ増設または高容量メモリへの交換`,
        improvementPotential: Math.min(80, (deficit / recommendedMemoryGB) * 100),
        costEstimate: this.estimateMemoryUpgradeCost(deficit),
        difficultyLevel: 'easy',
        affectedParts: ['memory'],
        dependentUpgrades: []
      };
    }
    
    return null;
  }

  /**
   * 💽 ストレージボトルネック検出
   */
  private detectStorageBottleneck(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): BottleneckResult | null {
    const storage = componentAnalysis.storage;
    
    if (!storage) return null;
    
    // SSD使用状況チェック
    const hasSSD = currentPC.currentParts.storage.some(s => 
      s.specifications.type === 'SSD' || s.specifications.type === 'NVMe'
    );
    
    if (!hasSSD) {
      return {
        type: 'storage',
        severity: 'major',
        description: 'SSDが搭載されていないため、起動・読み込み速度が大幅に制限されています',
        impact: '起動時間の延長、アプリケーション読み込みの遅延、全体的な応答性の低下',
        recommendedSolution: 'SSD（特にNVMe M.2 SSD）への交換または追加を強く推奨',
        improvementPotential: 85,
        costEstimate: this.estimateStorageUpgradeCost('SSD', 500),
        difficultyLevel: 'easy',
        affectedParts: ['storage'],
        dependentUpgrades: []
      };
    }
    
    return null;
  }

  /**
   * ⚡ 電源ボトルネック検出
   */
  private detectPSUBottleneck(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): BottleneckResult | null {
    const psu = componentAnalysis.psu;
    
    if (!psu) return null;
    
    // 電源容量チェック
    const totalPowerConsumption = this.calculateTotalPowerConsumption(currentPC);
    const psuWattage = this.extractPSUWattage(currentPC.currentParts.psu);
    const utilizationRate = totalPowerConsumption / psuWattage;
    
    if (utilizationRate > 0.8) {
      const severity = utilizationRate > 0.95 ? 'critical' : utilizationRate > 0.9 ? 'major' : 'moderate';
      
      return {
        type: 'psu',
        severity,
        description: `電源容量が不足しています（使用率：${(utilizationRate * 100).toFixed(1)}%）`,
        impact: `システムの不安定化、突然のシャットダウン、アップグレード制限`,
        recommendedSolution: `${Math.ceil((totalPowerConsumption * 1.3) / 50) * 50}W以上の電源への交換`,
        improvementPotential: 70,
        costEstimate: this.estimateUpgradeCost(currentPC.currentParts.psu, 'psu'),
        difficultyLevel: 'moderate',
        affectedParts: ['psu'],
        dependentUpgrades: []
      };
    }
    
    return null;
  }

  /**
   * 🌡️ 冷却ボトルネック検出
   */
  private detectCoolingBottleneck(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): BottleneckResult | null {
    const cooler = componentAnalysis.cooler;
    const cpu = componentAnalysis.cpu;
    
    if (!cooler || !cpu) return null;
    
    // CPU-クーラー性能バランスチェック
    const coolingCapacity = this.estimateCoolingCapacity(currentPC.currentParts.cooler);
    const cpuTDP = this.extractCPUTDP(currentPC.currentParts.cpu);
    const coolingRatio = coolingCapacity / cpuTDP;
    
    if (coolingRatio < 1.2) {
      const severity = coolingRatio < 1.0 ? 'critical' : coolingRatio < 1.1 ? 'major' : 'moderate';
      
      return {
        type: 'cooling',
        severity,
        description: `CPU冷却性能が不足しています（冷却比：${coolingRatio.toFixed(2)}）`,
        impact: `CPU温度上昇による性能低下、寿命短縮、システム不安定`,
        recommendedSolution: `より高性能なCPUクーラーへの交換（推奨：${cpuTDP * 1.3}W以上の冷却性能）`,
        improvementPotential: Math.min(60, (1.3 - coolingRatio) * 100),
        costEstimate: this.estimateUpgradeCost(currentPC.currentParts.cooler, 'cooler'),
        difficultyLevel: 'moderate',
        affectedParts: ['cooler'],
        dependentUpgrades: []
      };
    }
    
    return null;
  }

  /**
   * 🔗 互換性ボトルネック検出
   */
  private detectCompatibilityBottleneck(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): BottleneckResult | null {
    // マザーボードの世代チェック
    const motherboard = currentPC.currentParts.motherboard;
    const cpu = currentPC.currentParts.cpu;
    
    if (!motherboard || !cpu) return null;
    
    const mbGeneration = this.extractMotherboardGeneration(motherboard);
    const cpuGeneration = this.extractCPUGeneration(cpu);
    
    // 世代が大きく離れている場合
    if (Math.abs(mbGeneration - cpuGeneration) > 1) {
      return {
        type: 'compatibility',
        severity: 'major',
        description: `マザーボードとCPUの世代が適合していません（MB: ${mbGeneration}世代、CPU: ${cpuGeneration}世代）`,
        impact: `最新機能の制限、拡張性の欠如、将来のアップグレード困難`,
        recommendedSolution: `CPU世代に適合するマザーボードへの交換、またはマザーボード世代に適合するCPUへの交換`,
        improvementPotential: 40,
        costEstimate: this.estimateCompatibilityFixCost(currentPC),
        difficultyLevel: 'difficult',
        affectedParts: ['motherboard', 'cpu'],
        dependentUpgrades: ['memory'] // DDR世代変更可能性
      };
    }
    
    return null;
  }

  // ===========================================
  // 📊 パフォーマンス予測関数群
  // ===========================================

  /**
   * 📈 パフォーマンス予測
   */
  private async predictPerformance(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): Promise<{gaming: PerformanceMetrics; productivity: PerformanceMetrics; general: PerformanceMetrics}> {
    
    const gaming = await this.predictGamingPerformance(currentPC, componentAnalysis);
    const productivity = await this.predictProductivityPerformance(currentPC, componentAnalysis);
    const general = await this.predictGeneralPerformance(currentPC, componentAnalysis);
    
    return { gaming, productivity, general };
  }

  /**
   * 🎮 ゲーミング性能予測
   */
  private async predictGamingPerformance(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): Promise<PerformanceMetrics> {
    const cpu = componentAnalysis.cpu;
    const gpu = componentAnalysis.gpu;
    const memory = componentAnalysis.memory;
    const storage = componentAnalysis.storage;
    
    // FPS予測（主にGPU依存）
    let baseFPS = gpu ? gpu.performanceScore * 1.2 : 30;
    
    // CPU制限考慮
    if (cpu && cpu.performanceScore < gpu.performanceScore * 0.8) {
      baseFPS *= 0.85; // CPUボトルネック補正
    }
    
    // メモリ制限考慮
    if (memory && memory.performanceScore < 60) {
      baseFPS *= 0.9; // メモリ不足補正
    }
    
    // ロード時間予測（主にストレージ依存）
    const baseLoadTime = storage ? Math.max(5, 60 - storage.performanceScore * 0.5) : 45;
    
    return {
      fps: {
        current: Math.round(baseFPS),
        predicted: Math.round(baseFPS), // 現在の構成での予測
        improvement: 0
      },
      loadTimes: {
        current: Math.round(baseLoadTime),
        predicted: Math.round(baseLoadTime),
        improvement: 0
      },
      multitasking: {
        current: memory ? memory.performanceScore : 40,
        predicted: memory ? memory.performanceScore : 40,
        improvement: 0
      },
      overall: {
        current: Math.round((baseFPS * 0.4 + (100 - baseLoadTime) * 0.3 + (memory?.performanceScore || 40) * 0.3)),
        predicted: Math.round((baseFPS * 0.4 + (100 - baseLoadTime) * 0.3 + (memory?.performanceScore || 40) * 0.3)),
        improvement: 0
      }
    };
  }

  /**
   * 💼 生産性性能予測
   */
  private async predictProductivityPerformance(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): Promise<PerformanceMetrics> {
    const cpu = componentAnalysis.cpu;
    const memory = componentAnalysis.memory;
    const storage = componentAnalysis.storage;
    
    // 生産性は主にCPU・メモリ・ストレージ依存
    const cpuScore = cpu ? cpu.performanceScore : 40;
    const memoryScore = memory ? memory.performanceScore : 40;
    const storageScore = storage ? storage.performanceScore : 40;
    
    const baseProductivity = (cpuScore * 0.4 + memoryScore * 0.3 + storageScore * 0.3);
    
    return {
      fps: {
        current: 60, // 生産性用途ではFPSは固定
        predicted: 60,
        improvement: 0
      },
      loadTimes: {
        current: Math.max(3, 30 - storageScore * 0.3),
        predicted: Math.max(3, 30 - storageScore * 0.3),
        improvement: 0
      },
      multitasking: {
        current: Math.round(baseProductivity),
        predicted: Math.round(baseProductivity),
        improvement: 0
      },
      overall: {
        current: Math.round(baseProductivity),
        predicted: Math.round(baseProductivity),
        improvement: 0
      }
    };
  }

  /**
   * 🏠 一般用途性能予測
   */
  private async predictGeneralPerformance(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): Promise<PerformanceMetrics> {
    // 一般用途は全パーツのバランス重視
    const scores = Object.values(componentAnalysis).map(comp => comp.performanceScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      fps: {
        current: 30, // 一般用途では低FPSで十分
        predicted: 30,
        improvement: 0
      },
      loadTimes: {
        current: Math.max(5, 45 - averageScore * 0.4),
        predicted: Math.max(5, 45 - averageScore * 0.4),
        improvement: 0
      },
      multitasking: {
        current: Math.round(averageScore),
        predicted: Math.round(averageScore),
        improvement: 0
      },
      overall: {
        current: Math.round(averageScore),
        predicted: Math.round(averageScore),
        improvement: 0
      }
    };
  }

  // ===========================================
  // 🛡️ 互換性チェック関数群
  // ===========================================

  /**
   * 🔗 互換性チェック
   */
  private async checkCompatibility(currentPC: CurrentPCConfiguration): Promise<CompatibilityIssue[]> {
    const issues: CompatibilityIssue[] = [];
    
    // CPU-マザーボード互換性
    const cpuMbIssue = this.checkCPUMotherboardCompatibility(currentPC);
    if (cpuMbIssue) issues.push(cpuMbIssue);
    
    // メモリ-マザーボード互換性
    const memoryMbIssue = this.checkMemoryMotherboardCompatibility(currentPC);
    if (memoryMbIssue) issues.push(memoryMbIssue);
    
    // GPU-ケース互換性
    const gpuCaseIssue = this.checkGPUCaseCompatibility(currentPC);
    if (gpuCaseIssue) issues.push(gpuCaseIssue);
    
    // 電源容量チェック
    const powerIssue = this.checkPowerCompatibility(currentPC);
    if (powerIssue) issues.push(powerIssue);
    
    return issues;
  }

  /**
   * CPU-マザーボード互換性チェック
   */
  private checkCPUMotherboardCompatibility(currentPC: CurrentPCConfiguration): CompatibilityIssue | null {
    const cpu = currentPC.currentParts.cpu;
    const motherboard = currentPC.currentParts.motherboard;
    
    if (!cpu || !motherboard) return null;
    
    const cpuSocket = this.extractCPUSocket(cpu);
    const mbSocket = this.extractMotherboardSocket(motherboard);
    
    if (cpuSocket !== mbSocket) {
      return {
        type: 'physical',
        severity: 'critical',
        description: `CPUソケット（${cpuSocket}）とマザーボードソケット（${mbSocket}）が適合しません`,
        solution: 'CPUまたはマザーボードを適合するものに交換する必要があります',
        affectedParts: ['cpu', 'motherboard'],
        mustResolve: true
      };
    }
    
    return null;
  }

  /**
   * メモリ-マザーボード互換性チェック
   */
  private checkMemoryMotherboardCompatibility(currentPC: CurrentPCConfiguration): CompatibilityIssue | null {
    const memory = currentPC.currentParts.memory;
    const motherboard = currentPC.currentParts.motherboard;
    
    if (!memory.length || !motherboard) return null;
    
    const memoryType = this.extractMemoryType(memory[0]); // DDR4, DDR5等
    const mbSupportedMemory = this.extractMotherboardMemorySupport(motherboard);
    
    if (!mbSupportedMemory.includes(memoryType)) {
      return {
        type: 'physical',
        severity: 'critical',
        description: `メモリタイプ（${memoryType}）がマザーボードでサポートされていません`,
        solution: `マザーボードが対応するメモリ（${mbSupportedMemory.join(', ')}）に交換する必要があります`,
        affectedParts: ['memory', 'motherboard'],
        mustResolve: true
      };
    }
    
    return null;
  }

  /**
   * GPU-ケース互換性チェック
   */
  private checkGPUCaseCompatibility(currentPC: CurrentPCConfiguration): CompatibilityIssue | null {
    const gpu = currentPC.currentParts.gpu;
    const pcCase = currentPC.currentParts.case;
    
    if (!gpu || !pcCase) return null;
    
    const gpuLength = this.extractGPULength(gpu);
    const caseMaxGPULength = this.extractCaseMaxGPULength(pcCase);
    
    if (gpuLength > caseMaxGPULength) {
      return {
        type: 'physical',
        severity: 'error',
        description: `GPU長（${gpuLength}mm）がケースの対応長（${caseMaxGPULength}mm）を超えています`,
        solution: `より大型のケースに交換するか、より小型のGPUに交換する必要があります`,
        affectedParts: ['gpu', 'case'],
        mustResolve: true
      };
    }
    
    return null;
  }

  /**
   * 電源互換性チェック
   */
  private checkPowerCompatibility(currentPC: CurrentPCConfiguration): CompatibilityIssue | null {
    const totalPower = this.calculateTotalPowerConsumption(currentPC);
    const psu = currentPC.currentParts.psu;
    
    if (!psu) return null;
    
    const psuWattage = this.extractPSUWattage(psu);
    const utilizationRate = totalPower / psuWattage;
    
    if (utilizationRate > 0.9) {
      return {
        type: 'electrical',
        severity: utilizationRate > 1.0 ? 'critical' : 'error',
        description: `電源容量が不足しています（必要：${totalPower}W、電源：${psuWattage}W）`,
        solution: `${Math.ceil(totalPower * 1.2 / 50) * 50}W以上の電源に交換してください`,
        affectedParts: ['psu'],
        mustResolve: utilizationRate > 1.0
      };
    }
    
    return null;
  }

  // ===========================================
  // 🧮 計算・ユーティリティ関数群
  // ===========================================

  /**
   * 総合スコア計算
   */
  private calculateOverallScore(componentAnalysis: Record<PartCategory, ComponentPerformance>): number {
    const scores = Object.values(componentAnalysis).map(comp => comp.performanceScore);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * バランススコア計算
   */
  private calculateBalanceScore(componentAnalysis: Record<PartCategory, ComponentPerformance>): number {
    const scores = Object.values(componentAnalysis).map(comp => comp.performanceScore);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 標準偏差が小さいほど（バランスが良いほど）高スコア
    return Math.round(Math.max(0, 100 - standardDeviation * 2));
  }

  /**
   * 信頼度計算
   */
  private calculateConfidence(
    currentPC: CurrentPCConfiguration,
    componentAnalysis: Record<PartCategory, ComponentPerformance>
  ): number {
    let confidence = 0.8; // ベース信頼度
    
    // コンポーネント数が多いほど信頼度向上
    const componentCount = Object.keys(componentAnalysis).length;
    confidence += Math.min(0.15, componentCount * 0.02);
    
    // 新しいPCほど信頼度高い
    if (currentPC.pcInfo.purchaseDate) {
      const ageYears = (Date.now() - currentPC.pcInfo.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      confidence -= Math.min(0.2, ageYears * 0.03);
    }
    
    return Math.round(Math.max(0.5, Math.min(1.0, confidence)) * 100) / 100;
  }

  // ===========================================
  // 🔧 初期化・ヘルパー関数群
  // ===========================================

  /**
   * パフォーマンスデータベース初期化
   */
  private initializePerformanceDatabase(): void {
    // 実際の実装では外部データベースやAPIから取得
    // ここではサンプルデータ
    
    // CPU性能データ（PassMarkスコア基準）
    this.performanceDatabase.set('cpu:intel:i9-13900k', 95);
    this.performanceDatabase.set('cpu:intel:i7-13700k', 88);
    this.performanceDatabase.set('cpu:intel:i5-13600k', 78);
    this.performanceDatabase.set('cpu:amd:ryzen9-7900x', 92);
    this.performanceDatabase.set('cpu:amd:ryzen7-7700x', 85);
    this.performanceDatabase.set('cpu:amd:ryzen5-7600x', 75);
    
    // GPU性能データ（3DMark基準）
    this.performanceDatabase.set('gpu:nvidia:rtx4090', 98);
    this.performanceDatabase.set('gpu:nvidia:rtx4080', 90);
    this.performanceDatabase.set('gpu:nvidia:rtx4070', 80);
    this.performanceDatabase.set('gpu:amd:rx7900xtx', 95);
    this.performanceDatabase.set('gpu:amd:rx7800xt', 82);
    this.performanceDatabase.set('gpu:amd:rx7700xt', 75);
    
    console.log('📊 パフォーマンスデータベース初期化完了');
  }

  /**
   * 互換性マトリックス初期化
   */
  private initializeCompatibilityMatrix(): void {
    // CPUソケット互換性
    this.compatibilityMatrix.set('socket:lga1700', ['ddr4', 'ddr5']);
    this.compatibilityMatrix.set('socket:am5', ['ddr5']);
    this.compatibilityMatrix.set('socket:am4', ['ddr4']);
    
    console.log('🔗 互換性マトリックス初期化完了');
  }

  // パーツ情報抽出関数群（実装簡略化）
  private calculatePerformanceScore(part: Part, category: PartCategory): number {
    const key = `${category}:${part.manufacturer.toLowerCase()}:${part.model?.toLowerCase()}`;
    return this.performanceDatabase.get(key) || 50; // デフォルト50
  }

  private calculateValueScore(part: Part, category: PartCategory, performanceScore: number): number {
    if (!part.price || part.price <= 0) return 50;
    
    // コスパ = 性能 / (価格/1万円)
    const priceIn10k = part.price / 10000;
    const valueScore = (performanceScore / priceIn10k) * 10;
    return Math.min(100, Math.max(0, valueScore));
  }

  private calculateModernityScore(part: Part, category: PartCategory): number {
    if (!part.releaseDate) return 60; // リリース日不明の場合
    
    const releaseDate = typeof part.releaseDate === 'string' ? new Date(part.releaseDate) : part.releaseDate;
    const ageYears = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    // 新しいほど高スコア、5年以上で大幅減点
    return Math.round(Math.max(20, 100 - ageYears * 15));
  }

  private analyzeStrengthsWeaknesses(part: Part, category: PartCategory, currentPC: CurrentPCConfiguration): {strengths: string[]; weaknesses: string[]} {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    const performanceScore = this.calculatePerformanceScore(part, category);
    const valueScore = this.calculateValueScore(part, category, performanceScore);
    const modernityScore = this.calculateModernityScore(part, category);
    
    // 強み判定
    if (performanceScore > 80) strengths.push('高性能');
    if (valueScore > 70) strengths.push('優秀なコストパフォーマンス');
    if (modernityScore > 85) strengths.push('最新技術対応');
    
    // 弱み判定
    if (performanceScore < 40) weaknesses.push('性能不足');
    if (valueScore < 30) weaknesses.push('コストパフォーマンス不良');
    if (modernityScore < 50) weaknesses.push('陳腐化');
    
    return { strengths, weaknesses };
  }

  private determineRecommendedAction(
    performanceScore: number,
    valueScore: number,
    modernityScore: number,
    _currentPC: CurrentPCConfiguration // eslint-disable-line @typescript-eslint/no-unused-vars
  ): 'keep' | 'upgrade_soon' | 'upgrade_later' | 'replace_immediately' {
    
    const overallScore = (performanceScore + valueScore + modernityScore) / 3;
    
    if (overallScore < 30) return 'replace_immediately';
    if (overallScore < 50) return 'upgrade_soon';
    if (overallScore < 70) return 'upgrade_later';
    return 'keep';
  }

  private predictLifespan(part: Part, category: PartCategory, usage: string): number {
    const modernityScore = this.calculateModernityScore(part, category);
    const performanceScore = this.calculatePerformanceScore(part, category);
    
    let baseLifespan = 60; // 5年
    
    // 性能が高いほど長寿命
    baseLifespan += (performanceScore - 50) * 0.5;
    
    // 新しいほど長寿命
    baseLifespan += (modernityScore - 50) * 0.3;
    
    // 用途により補正
    if (usage === 'gaming') baseLifespan *= 0.8; // ゲーミングは短命
    if (usage === 'office') baseLifespan *= 1.3; // オフィス用途は長寿命
    
    return Math.round(Math.max(12, Math.min(120, baseLifespan))); // 1年〜10年
  }

  private assessMaintenanceNeeded(_part: Part, currentPC: CurrentPCConfiguration): boolean { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!currentPC.pcInfo.purchaseDate) return false;
    
    const ageYears = (Date.now() - currentPC.pcInfo.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    // 3年以上経過でメンテナンス推奨
    return ageYears > 3;
  }

  private calculateCompatibilityScore(part: Part, currentPC: CurrentPCConfiguration): number {
    // 簡易実装：同メーカー・同世代ほど高スコア
    let compatibilityScore = 70; // ベーススコア
    
    // 同メーカーボーナス
    const otherParts = Object.values(currentPC.currentParts).flat().filter(p => p && p.id !== part.id);
    const sameManufacturerCount = otherParts.filter(p => p.manufacturer === part.manufacturer).length;
    compatibilityScore += sameManufacturerCount * 5;
    
    return Math.min(100, compatibilityScore);
  }

  // その他のヘルパー関数は実装簡略化...
  private analyzeMultipleMemory(memory: Part[], currentPC: CurrentPCConfiguration): Promise<ComponentPerformance> {
    // 代表的なメモリで分析（実装簡略化）
    return this.analyzeComponent(memory[0], 'memory', currentPC);
  }

  private analyzeMultipleStorage(storage: Part[], currentPC: CurrentPCConfiguration): Promise<ComponentPerformance> {
    // 代表的なストレージで分析（実装簡略化）
    return this.analyzeComponent(storage[0], 'storage', currentPC);
  }

  private suggestCPUUpgrade(_currentPC: CurrentPCConfiguration): string { // eslint-disable-line @typescript-eslint/no-unused-vars
    return '上位CPU'; // 実装簡略化
  }

  private needsMotherboardUpgrade(_currentPC: CurrentPCConfiguration): boolean { // eslint-disable-line @typescript-eslint/no-unused-vars
    return false; // 実装簡略化
  }

  private estimateUpgradeCost(currentPart: Part | null, category: PartCategory): number {
    // カテゴリ別概算費用
    const baseCosts: Record<string, number> = {
      cpu: 50000,
      gpu: 80000,
      memory: 20000,
      storage: 15000,
      psu: 15000,
      case: 10000,
      cooler: 8000,
      motherboard: 25000
    };
    
    return baseCosts[category] || 20000;
  }

  private suggestGPUUpgrade(_currentPC: CurrentPCConfiguration): string { // eslint-disable-line @typescript-eslint/no-unused-vars
    return '上位GPU'; // 実装簡略化
  }

  private needsPSUUpgrade(_currentPC: CurrentPCConfiguration): boolean { // eslint-disable-line @typescript-eslint/no-unused-vars
    return false; // 実装簡略化
  }

  private calculateTotalMemory(memory: Part[]): number {
    return memory.reduce((total, mem) => {
      const capacity = mem.specifications.capacity as number || 8;
      return total + capacity;
    }, 0);
  }

  private estimateMemoryUpgradeCost(additionalGB: number): number {
    return additionalGB * 2000; // GB当たり2000円と仮定
  }

  private estimateStorageUpgradeCost(type: string, capacityGB: number): number {
    return type === 'SSD' ? capacityGB * 100 : capacityGB * 50;
  }

  private calculateTotalPowerConsumption(currentPC: CurrentPCConfiguration): number {
    let total = 0;
    
    // 各パーツの消費電力を合計
    Object.values(currentPC.currentParts).flat().forEach(part => {
      if (part && part.powerConsumption) {
        total += part.powerConsumption;
      }
    });
    
    return total || 400; // デフォルト400W
  }

  private extractPSUWattage(psu: Part | null): number {
    if (!psu) return 500;
    return (psu.specifications.wattage as number) || 500;
  }

  private estimateCoolingCapacity(cooler: Part | null): number {
    if (!cooler) return 65;
    return (cooler.specifications.tdp as number) || 65;
  }

  private extractCPUTDP(cpu: Part | null): number {
    if (!cpu) return 65;
    return (cpu.specifications.tdp as number) || 65;
  }

  private extractMotherboardGeneration(motherboard: Part): number {
    // 実装簡略化：マザーボード名から世代を推定
    const name = motherboard.name.toLowerCase();
    if (name.includes('b550') || name.includes('x570')) return 4;
    if (name.includes('b650') || name.includes('x670')) return 5;
    return 4; // デフォルト
  }

  private extractCPUGeneration(cpu: Part): number {
    // 実装簡略化：CPU名から世代を推定
    const name = cpu.name.toLowerCase();
    if (name.includes('13th') || name.includes('7000')) return 5;
    if (name.includes('12th') || name.includes('5000')) return 4;
    return 4; // デフォルト
  }

  private estimateCompatibilityFixCost(_currentPC: CurrentPCConfiguration): number { // eslint-disable-line @typescript-eslint/no-unused-vars
    return 50000; // マザーボード交換概算費用
  }

  private extractCPUSocket(cpu: Part): string {
    return (cpu.specifications.socket as string) || 'unknown';
  }

  private extractMotherboardSocket(motherboard: Part): string {
    return (motherboard.specifications.socket as string) || 'unknown';
  }

  private extractMemoryType(memory: Part): string {
    return (memory.specifications.type as string) || 'DDR4';
  }

  private extractMotherboardMemorySupport(motherboard: Part): string[] {
    const supported = motherboard.specifications.memorySupport as string | string[];
    if (Array.isArray(supported)) return supported;
    return [supported || 'DDR4'];
  }

  private extractGPULength(gpu: Part): number {
    return (gpu.specifications.length as number) || 300;
  }

  private extractCaseMaxGPULength(pcCase: Part): number {
    return (pcCase.specifications.maxGpuLength as number) || 350;
  }
}

// シングルトンインスタンス
export const upgradeAnalyzer = new UpgradeAnalyzer();

console.log('🔍 アップグレード分析エンジン初期化完了');

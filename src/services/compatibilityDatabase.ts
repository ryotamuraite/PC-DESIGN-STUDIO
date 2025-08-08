// src/services/compatibilityDatabase.ts
// 互換性データベース読み込み・管理サービス

import cpuMotherboardData from '@/data/compatibility/cpu-motherboard.json';
import memorySpecsData from '@/data/compatibility/memory-specs.json';
import powerRequirementsData from '@/data/compatibility/power-requirements.json';
import caseDimensionsData from '@/data/compatibility/case-dimensions.json';

export interface CompatibilityDatabase {
  cpuMotherboard: typeof cpuMotherboardData;
  memorySpecs: typeof memorySpecsData;
  powerRequirements: typeof powerRequirementsData;
  caseDimensions: typeof caseDimensionsData;
  lastUpdated: Date;
  version: string;
}

export class CompatibilityDatabaseService {
  private static instance: CompatibilityDatabaseService;
  private database: CompatibilityDatabase;

  private constructor() {
    this.database = {
      cpuMotherboard: cpuMotherboardData,
      memorySpecs: memorySpecsData,
      powerRequirements: powerRequirementsData,
      caseDimensions: caseDimensionsData,
      lastUpdated: new Date(),
      version: '1.0.0'
    };
  }

  public static getInstance(): CompatibilityDatabaseService {
    if (!CompatibilityDatabaseService.instance) {
      CompatibilityDatabaseService.instance = new CompatibilityDatabaseService();
    }
    return CompatibilityDatabaseService.instance;
  }

  // CPU-マザーボード互換性データ取得
  public getCpuSocketCompatibility(socket: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.database.cpuMotherboard.socketCompatibility as any)[socket] || null;
  }

  // メモリ互換性データ取得
  public getMemoryCompatibility(memoryType: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.database.memorySpecs.memoryCompatibility as any)[memoryType] || null;
  }

  // 電源要件データ取得
  public getGpuPowerRequirements(gpuModel: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.database.powerRequirements.gpuPowerRequirements as any)[gpuModel] || null;
  }

  // ケース互換性データ取得
  public getCaseFormFactor(caseType: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.database.caseDimensions.caseFormFactors as any)[caseType] || null;
  }

  // GPUサイズ情報取得
  public getGpuDimensions(gpuModel: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.database.caseDimensions.gpuCompatibility as any)[gpuModel] || null;
  }

  // CPUクーラー互換性取得
  public getCoolerCompatibility(coolerType: string, coolerModel: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coolerData = (this.database.caseDimensions.coolerCompatibility as any)[coolerType];
    return coolerData?.[coolerModel] || null;
  }

  // 電源ユニット仕様取得
  public getPsuConnectors(psuCategory: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.database.powerRequirements.powerSupplyConnectors as any)[psuCategory] || null;
  }

  // メモリ推奨構成取得
  public getMemoryRecommendations(memoryType: string, useCase: string) {
    const memoryData = this.getMemoryCompatibility(memoryType);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return memoryData?.recommendedConfigurations.find((config: any) => 
      config.useCase.toLowerCase().includes(useCase.toLowerCase())
    ) || null;
  }

  // ソケット別対応チップセット取得
  public getSupportedChipsets(socket: string): string[] {
    const socketData = this.getCpuSocketCompatibility(socket);
    return socketData?.supportedChipsets || [];
  }

  // チップセット別メモリ対応確認
  public getChipsetMemorySupport(chipset: string) {
    // チップセットからソケットを逆引き
    for (const [socket, data] of Object.entries(this.database.cpuMotherboard.socketCompatibility)) {
      if (data.supportedChipsets.includes(chipset)) {
        return {
          socket,
          memoryTypes: data.memorySupport,
          maxCapacity: data.maxMemoryCapacity
        };
      }
    }
    return null;
  }

  // フォームファクター互換性マトリックス取得
  public getFormFactorMatrix() {
    return this.database.cpuMotherboard.formFactorCompatibility;
  }

  // 物理互換性ルール取得
  public getPhysicalCompatibilityRules() {
    return this.database.caseDimensions.physicalCompatibilityRules;
  }

  // 互換性問題一覧取得
  public getKnownCompatibilityIssues() {
    return {
      memory: this.database.memorySpecs.compatibilityIssues,
      physical: this.database.caseDimensions.physicalCompatibilityRules
    };
  }

  // データベース全体の統計情報
  public getDatabaseStats() {
    return {
      sockets: Object.keys(this.database.cpuMotherboard.socketCompatibility).length,
      memoryTypes: Object.keys(this.database.memorySpecs.memoryCompatibility).length,
      gpuModels: Object.keys(this.database.powerRequirements.gpuPowerRequirements).length,
      caseTypes: Object.keys(this.database.caseDimensions.caseFormFactors).length,
      lastUpdated: this.database.lastUpdated,
      version: this.database.version
    };
  }

  // キーワード検索機能
  public searchCompatibilityData(keyword: string, category?: string) {
    const results: Array<{
      category: string;
      item: string;
      data: unknown;
      relevance: number;
    }> = [];

    const searchInObject = (obj: Record<string, unknown>, cat: string) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (key.toLowerCase().includes(keyword.toLowerCase())) {
          results.push({
            category: cat,
            item: key,
            data: value,
            relevance: key.toLowerCase() === keyword.toLowerCase() ? 1.0 : 0.8
          });
        }
      });
    };

    if (!category || category === 'cpu') {
      searchInObject(this.database.cpuMotherboard.socketCompatibility, 'cpu-motherboard');
    }
    if (!category || category === 'memory') {
      searchInObject(this.database.memorySpecs.memoryCompatibility, 'memory');
    }
    if (!category || category === 'gpu') {
      searchInObject(this.database.powerRequirements.gpuPowerRequirements, 'gpu-power');
      searchInObject(this.database.caseDimensions.gpuCompatibility, 'gpu-size');
    }
    if (!category || category === 'case') {
      searchInObject(this.database.caseDimensions.caseFormFactors, 'case');
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // データベース整合性チェック
  public validateDatabase(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // バージョン整合性チェック
    const versions = [
      this.database.cpuMotherboard.version,
      this.database.memorySpecs.version,
      this.database.powerRequirements.version,
      this.database.caseDimensions.version
    ];

    if (new Set(versions).size > 1) {
      errors.push('データベースのバージョンが一致していません');
    }

    // 必須フィールドの存在チェック
    if (!this.database.cpuMotherboard.socketCompatibility) {
      errors.push('CPU-マザーボード互換性データが不完全です');
    }

    if (!this.database.memorySpecs.memoryCompatibility) {
      errors.push('メモリ互換性データが不完全です');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default CompatibilityDatabaseService;
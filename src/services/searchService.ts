// src/services/searchService.ts
import { Part, PartCategory } from '@/types';
import { 
  SearchQuery, 
  SearchResult, 
  SearchFilters, 
  AutocompleteResult,
  SearchHistory,
  SearchStats
} from '@/types/search';

class SearchService {
  private static instance: SearchService;
  private searchHistory: SearchHistory[] = [];
  private searchStats: SearchStats = {
    totalSearches: 0,
    popularTerms: [],
    categoryDistribution: {} as Record<PartCategory, number>,
    priceRangeDistribution: {},
    brandDistribution: {}
  };

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * メイン検索機能
   */
  async search(query: SearchQuery, allParts: Part[]): Promise<SearchResult> {
    const startTime = performance.now();
    
    try {
      // 1. テキスト検索
      let filteredParts = this.searchByText(allParts, query.term);
      
      // 2. カテゴリフィルタ
      if (query.category) {
        filteredParts = filteredParts.filter(part => part.category === query.category);
      }
      
      // 3. 詳細フィルタ適用
      filteredParts = this.applyFilters(filteredParts, query.filters);
      
      // 4. ソート
      filteredParts = this.sortParts(filteredParts, query.sortBy, query.sortOrder);
      
      // 5. ページネーション
      const totalCount = filteredParts.length;
      const startIndex = (query.page - 1) * query.limit;
      const endIndex = startIndex + query.limit;
      const paginatedParts = filteredParts.slice(startIndex, endIndex);
      
      // 6. 検索統計更新
      this.updateSearchStats(query, totalCount);
      
      const executionTime = performance.now() - startTime;
      
      return {
        parts: paginatedParts,
        totalCount,
        currentPage: query.page,
        totalPages: Math.ceil(totalCount / query.limit),
        hasNextPage: endIndex < totalCount,
        hasPreviousPage: query.page > 1,
        filters: this.getActiveFilters(filteredParts),
        suggestions: this.generateSuggestions(query, totalCount),
        executionTime
      };
      
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('検索中にエラーが発生しました');
    }
  }

  /**
   * テキスト検索
   */
  private searchByText(parts: Part[], searchTerm: string): Part[] {
    if (!searchTerm.trim()) {
      return parts;
    }

    const term = searchTerm.toLowerCase().trim();
    const keywords = term.split(/\s+/);

    return parts.filter(part => {
      const searchableText = [
        part.name,
        part.manufacturer,
        part.model || '',
        ...(part.specifications ? Object.values(part.specifications).map(String) : [])
      ].join(' ').toLowerCase();

      // すべてのキーワードが含まれている場合にマッチ
      return keywords.every(keyword => 
        searchableText.includes(keyword) ||
        this.fuzzyMatch(searchableText, keyword)
      );
    });
  }

  /**
   * あいまい検索
   */
  private fuzzyMatch(text: string, keyword: string): boolean {
    if (keyword.length < 3) return false;
    
    // 簡易的なあいまい検索（編集距離ベース）
    const maxDistance = Math.floor(keyword.length * 0.2); // 20%まで許容
    
    for (let i = 0; i <= text.length - keyword.length; i++) {
      const substring = text.substring(i, i + keyword.length);
      if (this.levenshteinDistance(substring, keyword) <= maxDistance) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * レーベンシュタイン距離計算
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // 削除
          matrix[j - 1][i] + 1,     // 挿入
          matrix[j - 1][i - 1] + indicator // 置換
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * フィルタ適用
   */
  private applyFilters(parts: Part[], filters: SearchFilters): Part[] {
    let result = parts;

    // 価格範囲フィルタ
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      result = result.filter(part => 
        part.price >= min && part.price <= max
      );
    }

    // ブランドフィルタ
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter(part => 
        filters.brands!.includes(part.manufacturer)
      );
    }

    // 在庫状況フィルタ
    if (filters.availability && filters.availability.length > 0) {
      result = result.filter(part => {
        const availability = part.availability || 'in_stock';
        return filters.availability!.includes(availability as 'in_stock' | 'out_of_stock' | 'limited');
      });
    }

    // カテゴリ固有フィルタ
    result = this.applyCategorySpecificFilters(result, filters);

    return result;
  }

  /**
   * カテゴリ固有フィルタ
   */
  private applyCategorySpecificFilters(parts: Part[], filters: SearchFilters): Part[] {
    return parts.filter(part => {
      const specs = part.specifications || {};

      switch (part.category) {
        case 'cpu':
          return this.applyCPUFilters(specs, filters);
        case 'gpu':
          return this.applyGPUFilters(specs, filters);
        case 'motherboard':
          return this.applyMotherboardFilters(specs, filters);
        case 'memory':
          return this.applyMemoryFilters(specs, filters);
        case 'storage':
          return this.applyStorageFilters(specs, filters);
        case 'psu':
          return this.applyPSUFilters(specs, filters);
        case 'case':
          return this.applyCaseFilters(specs, filters);
        case 'cooler':
          return this.applyCoolerFilters(specs, filters);
        default:
          return true;
      }
    });
  }

  private applyCPUFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // CPUソケット
    if (filters.sockets && filters.sockets.length > 0) {
      if (!filters.sockets.includes(String(specs.socket || ''))) return false;
    }

    // コア数
    if (filters.coreCount) {
      const coreCount = Number(specs.cores || 0);
      if (filters.coreCount.min && coreCount < filters.coreCount.min) return false;
      if (filters.coreCount.max && coreCount > filters.coreCount.max) return false;
    }

    // TDP
    if (filters.tdp) {
      const tdp = Number(specs.tdp || 0);
      if (filters.tdp.min && tdp < filters.tdp.min) return false;
      if (filters.tdp.max && tdp > filters.tdp.max) return false;
    }

    // 内蔵GPU
    if (filters.integratedGraphics !== undefined) {
      if (Boolean(specs.integratedGraphics) !== filters.integratedGraphics) return false;
    }

    return true;
  }

  private applyGPUFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // VRAM容量
    if (filters.memory) {
      const memory = Number(specs.memory || 0);
      if (filters.memory.min && memory < filters.memory.min) return false;
      if (filters.memory.max && memory > filters.memory.max) return false;
    }

    // レイトレーシング
    if (filters.rayTracing !== undefined) {
      if (Boolean(specs.rayTracing) !== filters.rayTracing) return false;
    }

    return true;
  }

  private applyMotherboardFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // チップセット
    if (filters.chipsets && filters.chipsets.length > 0) {
      if (!filters.chipsets.includes(String(specs.chipset || ''))) return false;
    }

    // フォームファクタ
    if (filters.formFactors && filters.formFactors.length > 0) {
      if (!filters.formFactors.includes(String(specs.formFactor || ''))) return false;
    }

    // Wi-Fi
    if (filters.wifi !== undefined) {
      if (Boolean(specs.wifi) !== filters.wifi) return false;
    }

    return true;
  }

  private applyMemoryFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // メモリタイプ
    if (filters.ramMemoryType && filters.ramMemoryType.length > 0) {
      if (!filters.ramMemoryType.includes(String(specs.type || ''))) return false;
    }

    // 容量
    if (filters.capacity) {
      const capacity = Number(specs.capacity || 0);
      if (filters.capacity.min && capacity < filters.capacity.min) return false;
      if (filters.capacity.max && capacity > filters.capacity.max) return false;
    }

    // RGB
    if (filters.rgb !== undefined) {
      if (Boolean(specs.rgb) !== filters.rgb) return false;
    }

    return true;
  }

  private applyStorageFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // ストレージタイプ
    if (filters.storageTypes && filters.storageTypes.length > 0) {
      if (!filters.storageTypes.includes(String(specs.type || ''))) return false;
    }

    // 容量
    if (filters.storageCapacity) {
      const capacity = Number(specs.capacity || 0);
      if (filters.storageCapacity.min && capacity < filters.storageCapacity.min) return false;
      if (filters.storageCapacity.max && capacity > filters.storageCapacity.max) return false;
    }

    return true;
  }

  private applyPSUFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // ワット数
    if (filters.wattage) {
      const wattage = Number(specs.wattage || 0);
      if (filters.wattage.min && wattage < filters.wattage.min) return false;
      if (filters.wattage.max && wattage > filters.wattage.max) return false;
    }

    // 効率
    if (filters.efficiency && filters.efficiency.length > 0) {
      if (!filters.efficiency.includes(String(specs.efficiency || ''))) return false;
    }

    // モジュラー
    if (filters.modular && filters.modular.length > 0) {
      const modularType = specs.modular ? 'modular' : 'non-modular';
      if (!filters.modular.includes(modularType)) return false;
    }

    return true;
  }

  private applyCaseFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // フォームファクタ
    if (filters.caseFormFactors && filters.caseFormFactors.length > 0) {
      if (!filters.caseFormFactors.includes(String(specs.formFactor || ''))) return false;
    }

    // 強化ガラス
    if (filters.temperedGlass !== undefined) {
      if (Boolean(specs.temperedGlass) !== filters.temperedGlass) return false;
    }

    return true;
  }

  private applyCoolerFilters(specs: Record<string, unknown>, filters: SearchFilters): boolean {
    // クーラータイプ
    if (filters.coolerTypes && filters.coolerTypes.length > 0) {
      if (!filters.coolerTypes.includes(String(specs.type || ''))) return false;
    }

    // 高さ
    if (filters.coolerHeight) {
      const height = Number(specs.height || 0);
      if (filters.coolerHeight.min && height < filters.coolerHeight.min) return false;
      if (filters.coolerHeight.max && height > filters.coolerHeight.max) return false;
    }

    return true;
  }

  /**
   * ソート処理
   */
  private sortParts(parts: Part[], sortBy: string, sortOrder: 'asc' | 'desc'): Part[] {
    const sortedParts = [...parts];
    
    sortedParts.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price_low':
        case 'price_high':
          comparison = a.price - b.price;
          if (sortBy === 'price_high') comparison = -comparison;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'brand':
          comparison = a.manufacturer.localeCompare(b.manufacturer);
          break;
        case 'release_date': {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          comparison = dateB - dateA; // 新しい順
          break;
        }
        case 'popularity': {
          const popularityA = a.popularity || 0;
          const popularityB = b.popularity || 0;
          comparison = popularityB - popularityA; // 人気順
          break;
        }
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sortedParts;
  }

  /**
   * アクティブフィルタ取得
   */
  private getActiveFilters(parts: Part[]): { [key: string]: { value: string | number | boolean; label: string; count: number; }[] } {
    // 実装簡略化のため、基本的な情報のみ返す
    const brands = [...new Set(parts.map(p => p.manufacturer))];
    const categories = [...new Set(parts.map(p => p.category))];
    
    return {
      brands: brands.map(brand => ({
        value: brand,
        label: brand,
        count: parts.filter(p => p.manufacturer === brand).length
      })),
      categories: categories.map(category => ({
        value: category,
        label: category,
        count: parts.filter(p => p.category === category).length
      }))
    };
  }

  /**
   * 検索候補生成
   */
  private generateSuggestions(query: SearchQuery, resultCount: number): Array<{ type: 'spelling' | 'alternative' | 'related'; text: string; query: Partial<SearchQuery> }> {
    const suggestions: Array<{ type: 'spelling' | 'alternative' | 'related'; text: string; query: Partial<SearchQuery> }> = [];
    
    if (resultCount === 0) {
      suggestions.push({
        type: 'alternative',
        text: '検索条件を緩和してみてください',
        query: { ...query, term: query.term.split(' ')[0] }
      });
    }
    
    return suggestions;
  }

  /**
   * 検索統計更新
   */
  private updateSearchStats(query: SearchQuery, resultCount: number): void {
    this.searchStats.totalSearches++;
    
    // 検索履歴に追加
    const historyEntry: SearchHistory = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      timestamp: new Date(),
      resultCount
    };
    
    this.searchHistory.unshift(historyEntry);
    // 最新100件のみ保持
    this.searchHistory = this.searchHistory.slice(0, 100);
  }

  /**
   * オートコンプリート
   */
  async autocomplete(term: string, allParts: Part[], limit = 10): Promise<AutocompleteResult> {
    const lowercaseTerm = term.toLowerCase();
    
    // 商品名からの候補
    const productSuggestions = allParts
      .filter(part => part.name.toLowerCase().includes(lowercaseTerm))
      .slice(0, limit)
      .map(part => ({
        text: part.name,
        type: 'product' as const,
        category: part.category,
        count: 1
      }));

    // ブランド名からの候補
    const brands = [...new Set(allParts.map(p => p.manufacturer))]
      .filter(brand => brand.toLowerCase().includes(lowercaseTerm))
      .slice(0, 5)
      .map(brand => ({
        text: brand,
        type: 'brand' as const,
        count: allParts.filter(p => p.manufacturer === brand).length
      }));

    return {
      suggestions: [...productSuggestions, ...brands],
      products: allParts.filter(part => 
        part.name.toLowerCase().includes(lowercaseTerm)
      ).slice(0, 3),
      categories: [],
      brands: [...new Set(allParts.map(p => p.manufacturer))]
        .filter(brand => brand.toLowerCase().includes(lowercaseTerm))
        .slice(0, 5)
    };
  }

  /**
   * 検索履歴取得
   */
  getSearchHistory(limit = 10): SearchHistory[] {
    return this.searchHistory.slice(0, limit);
  }

  /**
   * 検索履歴クリア
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * 検索統計取得
   */
  getSearchStats(): SearchStats {
    return { ...this.searchStats };
  }
}

export default SearchService;

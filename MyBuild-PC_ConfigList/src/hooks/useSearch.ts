// src/hooks/useSearch.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Part, PartCategory } from '@/types';
import { 
  SearchQuery, 
  SearchResult, 
  SearchFilters, 
  AutocompleteResult 
} from '@/types/search';
import SearchService from '@/services/searchService';

interface UseSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  initialQuery?: Partial<SearchQuery>;
}

interface UseSearchReturn {
  // 検索状態
  searchResult: SearchResult | null;
  isSearching: boolean;
  searchError: string | null;
  
  // 検索クエリ状態
  searchQuery: SearchQuery;
  
  // 検索実行関数
  search: (query?: Partial<SearchQuery>) => Promise<void>;
  updateQuery: (updates: Partial<SearchQuery>) => void;
  resetSearch: () => void;
  
  // フィルタ操作
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  
  // オートコンプリート
  autocompleteResult: AutocompleteResult | null;
  searchAutocomplete: (term: string) => Promise<void>;
  
  // ユーティリティ
  hasActiveFilters: boolean;
  totalResults: number;
}

const defaultQuery: SearchQuery = {
  term: '',
  filters: {},
  sortBy: 'relevance',
  sortOrder: 'desc',
  page: 1,
  limit: 20
};

export const useSearch = (
  allParts: Part[],
  options: UseSearchOptions = {}
): UseSearchReturn => {
  const { 
    debounceMs = 300, 
    autoSearch = false, 
    initialQuery = {} 
  } = options;

  // State
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    ...defaultQuery,
    ...initialQuery
  });
  const [autocompleteResult, setAutocompleteResult] = useState<AutocompleteResult | null>(null);

  // Search service instance
  const searchService = useMemo(() => SearchService.getInstance(), []);

  // 検索実行
  const search = useCallback(async (queryUpdates?: Partial<SearchQuery>) => {
    const finalQuery = queryUpdates ? { ...searchQuery, ...queryUpdates } : searchQuery;
    
    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await searchService.search(finalQuery, allParts);
      setSearchResult(result);
      
      // クエリを更新（ページネーション等のため）
      if (queryUpdates) {
        setSearchQuery(finalQuery);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '検索エラーが発生しました';
      setSearchError(errorMessage);
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchService, allParts]);

  // デバウンス付き検索
  const debouncedSearch = useMemo(
    () => debounce(search, debounceMs),
    [search, debounceMs]
  );

  // クエリ更新
  const updateQuery = useCallback((updates: Partial<SearchQuery>) => {
    setSearchQuery(prev => {
      const newQuery = { ...prev, ...updates };
      
      // ページをリセット（検索条件が変わった場合）
      if (updates.term !== undefined || updates.filters !== undefined || updates.category !== undefined) {
        newQuery.page = 1;
      }
      
      return newQuery;
    });
  }, []);

  // フィルタ更新
  const updateFilters = useCallback((filterUpdates: Partial<SearchFilters>) => {
    updateQuery({
      filters: { ...searchQuery.filters, ...filterUpdates },
      page: 1 // フィルタ変更時はページをリセット
    });
  }, [searchQuery.filters, updateQuery]);

  // フィルタクリア
  const clearFilters = useCallback(() => {
    updateQuery({ filters: {}, page: 1 });
  }, [updateQuery]);

  // 検索リセット
  const resetSearch = useCallback(() => {
    setSearchQuery(defaultQuery);
    setSearchResult(null);
    setSearchError(null);
    setAutocompleteResult(null);
  }, []);

  // オートコンプリート
  const searchAutocomplete = useCallback(async (term: string) => {
    if (!term.trim()) {
      setAutocompleteResult(null);
      return;
    }

    try {
      const result = await searchService.autocomplete(term, allParts);
      setAutocompleteResult(result);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setAutocompleteResult(null);
    }
  }, [searchService, allParts]);

  // 自動検索（検索条件変更時）
  useEffect(() => {
    if (autoSearch && (searchQuery.term || Object.keys(searchQuery.filters).length > 0)) {
      debouncedSearch();
    }
  }, [searchQuery, autoSearch, debouncedSearch]);

  // アクティブフィルタの判定
  const hasActiveFilters = useMemo(() => {
    const filters = searchQuery.filters;
    return Boolean(
      filters.priceRange ||
      (filters.brands && filters.brands.length > 0) ||
      (filters.availability && filters.availability.length > 0) ||
      filters.sockets ||
      filters.chipsets ||
      filters.formFactors ||
      Object.keys(filters).some(key => {
        const value = filters[key as keyof SearchFilters];
        return value !== undefined && value !== null && 
               (Array.isArray(value) ? value.length > 0 : true);
      })
    );
  }, [searchQuery.filters]);

  // 総結果数
  const totalResults = searchResult?.totalCount || 0;

  return {
    // 検索状態
    searchResult,
    isSearching,
    searchError,
    
    // 検索クエリ状態
    searchQuery,
    
    // 検索実行関数
    search,
    updateQuery,
    resetSearch,
    
    // フィルタ操作
    updateFilters,
    clearFilters,
    
    // オートコンプリート
    autocompleteResult,
    searchAutocomplete,
    
    // ユーティリティ
    hasActiveFilters,
    totalResults
  };
};

// デバウンス用ユーティリティ
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 検索クエリ構築ヘルパー
export const useSearchQueryBuilder = () => {
  const buildQuery = useCallback((
    term = '',
    category?: PartCategory,
    filters: Partial<SearchFilters> = {},
    sortBy = 'relevance' as const,
    sortOrder = 'desc' as const,
    page = 1,
    limit = 20
  ): SearchQuery => ({
    term,
    category,
    filters,
    sortBy,
    sortOrder,
    page,
    limit
  }), []);

  return { buildQuery };
};

// フィルタ構築ヘルパー
export const useFilterBuilder = () => {
  const [filters, setFilters] = useState<SearchFilters>({});

  const reset = useCallback(() => {
    setFilters({});
    return { build: () => filters };
  }, [filters]);

  const priceRange = useCallback((min: number, max: number) => {
    setFilters(prev => ({ ...prev, priceRange: { min, max } }));
    return { reset, build: () => filters };
  }, [filters, reset]);

  const brands = useCallback((brandList: string[]) => {
    setFilters(prev => ({ ...prev, brands: brandList }));
    return { reset, priceRange, build: () => filters };
  }, [filters, reset, priceRange]);

  const build = useCallback(() => filters, [filters]);

  return {
    reset,
    priceRange,
    brands,
    build
  };
};

export default useSearch;

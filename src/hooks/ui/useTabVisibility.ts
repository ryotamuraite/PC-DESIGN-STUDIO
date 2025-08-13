// src/hooks/ui/useTabVisibility.ts
// タブ表示制御フック - パーツ検索タブ段階的統合対応

import { useState, useEffect, useMemo } from 'react';

interface TabVisibilityOptions {
  // 機能フラグで制御可能な設定
  mobileSearchTabEnabled?: boolean;
  tabletSearchTabEnabled?: boolean;
  desktopSearchTabEnabled?: boolean;
  
  // ブレークポイント設定
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
}

interface TabVisibilityReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  shouldShowSearchTab: boolean;
  screenWidth: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const useTabVisibility = (
  options: TabVisibilityOptions = {}
): TabVisibilityReturn => {
  const {
    // 🎯 段階的統合: Phase 2でモバイル・タブレット非表示
    mobileSearchTabEnabled = false,    // Phase 2: false (非表示)
    tabletSearchTabEnabled = false,    // Phase 2: false (非表示)
    desktopSearchTabEnabled = true,    // Phase 3で false に変更予定
    
    // ブレークポイント
    mobileBreakpoint = 768,
    tabletBreakpoint = 1024
  } = options;

  // 画面サイズ状態管理
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // 画面サイズ変更の監視
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // 初期値設定
    handleResize();

    // イベントリスナー登録
    window.addEventListener('resize', handleResize);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // デバイス種別判定
  const deviceInfo = useMemo(() => {
    const isMobile = screenWidth <= mobileBreakpoint;
    const isTablet = screenWidth > mobileBreakpoint && screenWidth <= tabletBreakpoint;
    const isDesktop = screenWidth > tabletBreakpoint;

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';

    return {
      isMobile,
      isTablet,
      isDesktop,
      deviceType
    };
  }, [screenWidth, mobileBreakpoint, tabletBreakpoint]);

  // パーツ検索タブ表示判定
  const shouldShowSearchTab = useMemo(() => {
    const { isMobile, isTablet, isDesktop } = deviceInfo;

    // デバイス別の表示制御
    if (isMobile) return mobileSearchTabEnabled;
    if (isTablet) return tabletSearchTabEnabled;
    if (isDesktop) return desktopSearchTabEnabled;

    // フォールバック: デスクトップとして扱う
    return desktopSearchTabEnabled;
  }, [
    deviceInfo,
    mobileSearchTabEnabled,
    tabletSearchTabEnabled,
    desktopSearchTabEnabled
  ]);

  return {
    ...deviceInfo,
    shouldShowSearchTab,
    screenWidth
  };
};

// 機能フラグ定数（将来の設定ファイル移行用）
export const TAB_VISIBILITY_PHASES = {
  // Phase 2: モバイル・タブレット非表示
  PHASE_2_MOBILE_TABLET_HIDDEN: {
    mobileSearchTabEnabled: false,
    tabletSearchTabEnabled: false,
    desktopSearchTabEnabled: true
  },
  
  // Phase 3: 完全統合（全デバイス非表示）
  PHASE_3_FULL_INTEGRATION: {
    mobileSearchTabEnabled: false,
    tabletSearchTabEnabled: false,
    desktopSearchTabEnabled: false
  },
  
  // ロールバック用: 全デバイス表示
  ROLLBACK_ALL_DEVICES: {
    mobileSearchTabEnabled: true,
    tabletSearchTabEnabled: true,
    desktopSearchTabEnabled: true
  }
} as const;

// デバッグ用ヘルパー
export const getTabVisibilityDebugInfo = (
  visibility: TabVisibilityReturn
): string => {
  return `Device: ${visibility.deviceType} (${visibility.screenWidth}px) | Search Tab: ${
    visibility.shouldShowSearchTab ? 'VISIBLE' : 'HIDDEN'
  }`;
};

export default useTabVisibility;

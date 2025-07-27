# MyBuild-PC_ConfigList 開発計画詳細
---
## 概要
なんかえぇ感じの自作パソコン構成表作成ツール、サイトがなくって、
だったら自分好みでちゃんと使えるサイト作ろう！と思い立った。
---
## 開発環境の具体的構成
---
### 基本技術スタック
- 言語: TypeScript 5.x
- フレームワーク: React 18.x
- ビルドツール: Vite 5.x
- スタイリング: Tailwind CSS 3.x
- 状態管理: Zustand 4.x
- データ処理: Axios, Papa Parse
- 型チェック: TypeScript strict mode
---
### VSCode推奨拡張機能
- 必須拡張機能:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint
  - Auto Rename Tag
  - Bracket Pair Colorizer 2
---
### 開発環境セットアップ
> **プロジェクト初期化**
> npm create vite@latest MyBuild-PC_ConfigList -- --template react-ts
> cd MyBuild-PC_ConfigList
> 
> **必要パッケージインストール**
> npm install zustand axios papaparse
> npm install -D tailwindcss postcss autoprefixer @types/papaparse
> npm install -D eslint-plugin-react-hooks @typescript-eslint/eslint-plugin
> 
> **Tailwind CSS初期化**
> npx tailwindcss init -p
---
## 開発フェーズ詳細

### Phase 1: MVP基本機能 (期間: 2-3週間) ✅️完了（2025/07/26 14:38）
#### 目標
**静的データでの基本的な見積もり機能を実装**

##### MVP定義
- [x] パーツカテゴリ選択UI（CPU、GPU、メモリなど）
- [x] 静的データからのパーツ選択
- [x] 基本的な価格計算
- [x] 予算オーバー表示
- [x] ローカルストレージでの保存
- [x] 基本的なレスポンシブデザイン

##### 実装内容
- **コンポーネント構成:**
  - [x] Header: ロゴ、ナビゲーション
  - [x] BudgetSetter: 予算設定
  - [x] PartSelector: パーツ選択UI
  - [x] ConfigSummary: 構成サマリー
  - [x] PriceDisplay: 価格表示・予算比較

##### 完了基準
- [x] 5つ以上のパーツカテゴリで見積もり可能
- [x] 予算設定・オーバー警告機能
- [x] データの永続化（localStorage）
- [x] モバイル対応UI

---
### Phase 2: データ連携・高度な計算 (期間: 3-4週間)　🚧進行中
#### 目標
**外部データ取得と互換性チェック機能の実装**

##### MVP定義
- [ ] GitHub Actionsでの価格データ自動更新
- [ ] 電源容量計算・警告機能
- [ ] メモリ・マザーボード互換性チェック
- [ ] ソケット互換性検証
- [ ] データ更新日時表示
- [ ] パーツ検索・フィルタ機能

##### 実装内容
- **新機能:**
  - [ ] PowerCalculator: 消費電力計算
  - [ ] CompatibilityChecker: 互換性検証
  - [ ] DataFetcher: 外部データ取得
  - [ ] SearchFilter: パーツ検索機能
  - [ ] UpdateNotifier: データ更新通知

- **データ取得戦略**
- yaml# .github/workflows/update-data.yml
  - [ ] 価格.com商品データのスクレイピング
  - [ ] Amazon Product API連携
  - [ ] 毎日AM 6:00に自動実行
  - [ ] データはJSONファイルとしてリポジトリに保存

##### 完了基準
- [ ] 自動データ更新の仕組み完成
- [ ] 基本的な互換性チェック機能
- [ ] 電源容量の適切性判定
- [ ] 検索・フィルタ機能

---
### Phase 3: UX強化・エクスポート機能 (期間: 2-3週間)
#### 目標
**ユーザビリティ向上と実用的な機能追加**

##### MVP定義
- [ ] CSV/JSONエクスポート機能
- [ ] 構成の保存・読み込み
- [ ] 複数構成の比較機能
- [ ] ダークモード対応
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化

##### 実装内容
- **新機能:**
  - [ ] ExportManager: データエクスポート
  - [ ] ConfigManager: 構成管理
  - [ ] ComparisonTable: 構成比較
  - [ ] ThemeProvider: テーマ切り替え
  - [ ] ErrorBoundary: エラー処理

##### 完了基準
- [ ] 各種形式でのエクスポート対応
- [ ] 直感的なUI/UX
- [ ] 安定したパフォーマンス
- [ ] 包括的なエラーハンドリング

---
### Phase 4: 収益化・SEO対策 (期間: 2-3週間)
#### 目標
**広告収益とSEO最適化の実装**

##### MVP定義
- [ ] Google AdSense統合
- [ ] Amazon・楽天アフィリエイトリンク
- [ ] SEOメタタグ最適化
- [ ] サイトマップ生成
- [ ] パフォーマンス監視
- [ ] アナリティクス導入

##### 実装内容
- **収益化機能:**
  - [ ] AdBanner: 広告表示コンポーネント
  - [ ] AffiliateLink: アフィリエイトリンク
  - [ ] SEOHead: メタタグ管理
  - [ ] SitemapGenerator: サイトマップ自動生成

##### 完了基準
- [ ] 広告収益の仕組み完成
- [ ] SEOスコア80点以上
- [ ] ページ速度最適化
- [ ] 収益トラッキング機能

---
### Phase 5: コンテンツ拡充・コミュニティ (期間: 継続的)
#### 目標
**ユーザー獲得とリテンション向上**

##### MVP定義
- [ ] 構成例記事（Markdown）
- [ ] パーツレビューコンテンツ
- [ ] 構成共有機能
- [ ] ユーザーフィードバック収集
- [ ] モバイルアプリPWA化

##### 実装内容
- **コンテンツ戦略:**
  - [ ] /articles: 技術記事・構成例
  - [ ] /reviews: パーツレビュー
  - [ ] /gallery: ユーザー構成ギャラリー
  - [ ] /tools: 関連ツール群

##### 完了基準
- [ ] 月間50記事以上の投稿
- [ ] PWAとしての動作
- [ ] ユーザーエンゲージメント向上
- [ ] コミュニティ形成

---
## プロジェクト管理
### マイルストーン設定
- [ ] Week 1-3: Phase 1 完了
- [ ] Week 4-7: Phase 2 完了  
- [ ] Week 8-10: Phase 3 完了
- [ ] Week 11-13: Phase 4 完了
- [ ] Week 14~: Phase 5 継続開発

### 品質管理
- [ ] 各Phase完了時にコードレビュー
- [ ] TypeScript strict modeでの型安全性確保
- [ ] ESLint + Prettierでのコード品質維持
- [ ] GitHub Actionsでの自動テスト

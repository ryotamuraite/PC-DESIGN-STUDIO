// src/components/layout/ErrorBoundary.tsx
// Reactエラー境界コンポーネント

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import ErrorHandler from '@/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorHandler = ErrorHandler.getInstance();

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `boundary_${Date.now()}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーハンドラーでエラーを処理
    const appError = this.errorHandler.handleError(
      error,
      'unknown',
      'critical',
      {
        component: 'ErrorBoundary',
        action: 'component-crash',
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        }
      }
    );

    this.setState({
      errorInfo,
      errorId: appError.id
    });

    // プロップスで渡されたエラーハンドラーも呼び出し
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // コンソールにも詳細を出力
    console.error('💥 Error Boundary Caught Error:', error);
    console.error('📍 Component Stack:', errorInfo.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReportBug = () => {
    const errorDetails = {
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // GitHub Issues にリダイレクト（実際のリポジトリURLに変更）
    const issueUrl = new URL('https://github.com/username/MyBuild-PC_ConfigList/issues/new');
    issueUrl.searchParams.set('title', `🐛 Error Boundary: ${this.state.error?.message || 'Component Crash'}`);
    issueUrl.searchParams.set('body', `
## エラー詳細

**エラーID**: ${this.state.errorId}
**発生日時**: ${errorDetails.timestamp}
**URL**: ${errorDetails.url}

### エラーメッセージ
\`\`\`
${errorDetails.message}
\`\`\`

### スタックトレース
\`\`\`
${errorDetails.stack || 'No stack trace available'}
\`\`\`

### コンポーネントスタック
\`\`\`
${errorDetails.componentStack || 'No component stack available'}
\`\`\`

### 環境情報
- **User Agent**: ${errorDetails.userAgent}
- **ブラウザ**: ${navigator.userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || 'Unknown'}
- **OS**: ${navigator.platform || 'Unknown'}

### 再現手順
<!-- エラーが発生した操作手順を記載してください -->

### 期待される動作
<!-- 正常に動作した場合の期待される結果を記載してください -->
    `.trim());
    issueUrl.searchParams.set('labels', 'bug,error-boundary,priority: high');

    window.open(issueUrl.toString(), '_blank');
  };

  public render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
            {/* エラーアイコン */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                エラーが発生しました
              </h1>
              <p className="text-gray-600">
                アプリケーションで予期しないエラーが発生しました
              </p>
            </div>

            {/* エラー詳細（開発環境のみ） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">エラー詳細（開発用）</h3>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-gray-500 mt-2">
                    エラーID: {this.state.errorId}
                  </p>
                )}
              </div>
            )}

            {/* アクションボタン */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                再試行
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                ページを再読み込み
              </button>
              
              <button
                onClick={this.handleReportBug}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Bug className="w-4 h-4 mr-2" />
                バグを報告
              </button>
            </div>

            {/* サポート情報 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                問題が続く場合は、
                <a 
                  href="mailto:support@example.com" 
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  サポートまでお問い合わせください
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 軽量版エラー境界（個別コンポーネント用）
interface SimpleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface SimpleErrorBoundaryState {
  hasError: boolean;
}

export class SimpleErrorBoundary extends Component<SimpleErrorBoundaryProps, SimpleErrorBoundaryState> {
  private errorHandler = ErrorHandler.getInstance();

  public state: SimpleErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(): SimpleErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorHandler.handleError(
      error,
      'unknown',
      'medium',
      {
        component: this.props.componentName || 'SimpleErrorBoundary',
        action: 'component-error',
        additionalData: {
          componentStack: errorInfo.componentStack
        }
      }
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                コンポーネントエラー
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {this.props.componentName || 'このコンポーネント'}でエラーが発生しました
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="ml-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

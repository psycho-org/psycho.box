'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 text-center px-6">
          <p className="text-[15px] font-semibold text-text">페이지를 불러오는 중 오류가 발생했습니다</p>
          <p className="text-[13px] text-text-soft max-w-sm">
            {this.state.error.message || '알 수 없는 오류입니다.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-[13px] font-medium text-text transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

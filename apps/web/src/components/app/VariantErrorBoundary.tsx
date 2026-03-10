'use client';
import React from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode }
interface State { hasError: boolean }

export class VariantErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.error('[VariantErrorBoundary]', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8 text-[#94A3B8]">
          <div className="text-center">
            <p className="text-sm">Failed to load this section.</p>
            <button onClick={() => this.setState({ hasError: false })} className="mt-2 text-xs text-[#00C37B] hover:underline">
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

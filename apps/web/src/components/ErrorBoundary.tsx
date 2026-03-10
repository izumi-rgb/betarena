'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    // Future: send to Sentry/error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E1A] text-white">
          <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="mb-4 max-w-lg overflow-auto rounded bg-[#1A2235] p-4 text-sm text-red-400">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded bg-[#00C37B] px-4 py-2 font-bold text-[#0B0E1A]"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded border border-[#1E293B] px-4 py-2 text-[#94A3B8]"
            >
              Reload Page
            </button>
            <Link href="/" className="rounded border border-[#1E293B] px-4 py-2 text-[#94A3B8]">
              Go Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

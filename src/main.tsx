import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Harness Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 24,
            backgroundColor: '#0B0E14',
            color: '#E6EDF3',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: '#F28C52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 108 108" fill="none">
              <path fill="#0B0E14" d="m39 43-10 10 10 10 5-5-5-5 5-5Zm17 0-5 5 5 5-5 5 5 5 10-10Z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F28C52', marginBottom: 8 }}>
            Mobile Harness Workspace
          </h1>
          <p style={{ fontSize: 13, color: '#9AA0A6', maxWidth: 360, lineHeight: 1.5, marginBottom: 20 }}>
            An unexpected error occurred during workspace initialization:
          </p>
          <pre
            style={{
              backgroundColor: '#131821',
              border: '1px solid #2A3240',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 12,
              color: '#FF6B6B',
              maxWidth: 440,
              width: '100%',
              overflowX: 'auto',
              marginBottom: 20,
              textAlign: 'left',
              fontFamily: 'monospace',
            }}
          >
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              backgroundColor: '#F28C52',
              color: '#241107',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reset Workspace Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

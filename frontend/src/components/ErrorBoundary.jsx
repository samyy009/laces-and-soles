import React from 'react';

/**
 * ErrorBoundary - Catches runtime React errors and shows a friendly error screen
 * instead of a blank white page. Wrap your App in this.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          background: '#f6f9fc',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24, maxWidth: 500 }}>
            The app crashed. Open the browser console (F12) to see the error.
          </p>
          <pre style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '1rem', fontSize: 12, color: '#e11d48', maxWidth: 600, overflowX: 'auto', textAlign: 'left' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, background: '#111', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

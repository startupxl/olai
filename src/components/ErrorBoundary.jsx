import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-ui)', gap: 12, padding: 24, textAlign: 'center',
        }}>
          <img src="/logo.svg" alt="Olai Notes" style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 8 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 360 }}>
            An unexpected error occurred. Your notes are safe — reload the page to continue.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: '8px 20px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13,
              fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ui)',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

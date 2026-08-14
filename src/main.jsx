import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', background: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Dashboard Application Error</h1>
          <p>Please copy this error and share it with the AI assistant so it can be fixed:</p>
          <pre style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', overflowX: 'auto', marginTop: '16px', border: '1px solid #f87171' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', overflowX: 'auto', marginTop: '16px', border: '1px solid #f87171', fontSize: '12px' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)

import { Component } from 'react';

// Catches unexpected rendering errors so users see a friendly screen with a way out,
// instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Page crashed:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="gradient-text font-display text-7xl font-semibold">Oops</p>
        <h1 className="mt-4 text-2xl font-semibold">Something went wrong on this page</h1>
        <p className="mt-2 max-w-md text-slate-500">Please reload the page. If it keeps happening, go back home and try again.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => window.location.reload()} className="rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-medium text-white">Reload page</button>
          <a href="/" className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium dark:border-slate-700">Go home</a>
        </div>
      </div>
    );
  }
}

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-white p-4">
          <div className="text-center max-w-lg">
            <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
            <p className="mb-4 text-red-400 font-mono text-sm break-all">
                {this.state.error?.message || "Unknown error"}
            </p>
            <button 
              className="px-4 py-2 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

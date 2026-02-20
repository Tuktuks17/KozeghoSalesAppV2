import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-neutral-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Something went wrong</h1>
                        <p className="text-neutral-500 mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-xs text-left mb-6 overflow-auto max-h-32 font-mono">
                            {this.state.error?.message}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-neutral-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

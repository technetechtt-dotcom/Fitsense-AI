import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[fitsense] UI error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] grid place-items-center bg-surface-0 px-6 text-center">
          <div className="max-w-sm space-y-4">
            <AlertTriangle className="w-12 h-12 text-coral mx-auto" />
            <h1 className="text-lg font-bold">Something went wrong</h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                window.location.href = "/home";
              }}
              className="px-5 py-2.5 rounded-full bg-neon text-onyx text-sm font-semibold"
            >
              Back to home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("MiKa – Unbehandelter Fehler:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-5">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-8 w-8 shrink-0" />
              <h1 className="text-xl font-bold">Ein Fehler ist aufgetreten</h1>
            </div>
            <p className="text-sm text-gray-600">
              Die Anwendung konnte nicht geladen werden. Bitte laden Sie die Seite neu.
              Bleibt das Problem bestehen, wenden Sie sich an den Support.
            </p>
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-[#1a3a6b] text-white rounded-xl py-3 px-4 font-semibold text-sm hover:bg-[#2d5aa0] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

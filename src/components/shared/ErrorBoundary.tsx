import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../common/atoms/Card';
import { Button } from '../common/atoms/Button';
import { Text } from '../common/atoms/Text';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo;
}

const ERROR_BOUNDARY_LABELS = {
  en: {
    title: 'Something went wrong',
    description: 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.',
    details: 'Error Details',
    tryAgain: 'Try Again',
  },
  fr: {
    title: "Une erreur s'est produite",
    description: 'Nous avons rencontré une erreur inattendue. Veuillez rafraîchir la page ou contacter le support si le problème persiste.',
    details: "Détails de l'erreur",
    tryAgain: 'Réessayer',
  },
};

const getLabels = () => {
  const lang = typeof window !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en';
  return ERROR_BOUNDARY_LABELS[lang];
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: undefined });
  };
  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const { error, errorInfo } = this.state;
      const { showDetails = false } = this.props;
      const labels = getLabels();
      return (
        <Card className="flex flex-col items-center justify-center min-h-card p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <Text variant="heading" size="xl" weight="semibold" className="mb-2">
            {labels.title}
          </Text>
          <Text variant="body" size="sm" className="text-zinc-400 mb-6 max-w-sm">
            {labels.description}
          </Text>
          {showDetails && error && (
            <details className="w-full mb-6 text-left">
              <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300 mb-2 text-sm">
                {labels.details}
              </summary>
              <pre className="bg-zinc-900 p-3 rounded text-xs text-red-400 overflow-auto max-h-32">
                {error.message}
                {errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:'}
                    {errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
          <Button onClick={this.handleRetry} className="gap-2">
            <RefreshCw size={16} />
            {labels.tryAgain}
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

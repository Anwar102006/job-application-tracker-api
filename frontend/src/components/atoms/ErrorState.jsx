import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

/**
 * Reusable ErrorState Component (Phase 6.5A)
 */
export const ErrorState = ({
  icon: Icon = AlertCircle,
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading data.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`state-container ${className}`.trim()} role="alert">
      <div className="state-icon" style={{ color: 'var(--danger)' }} aria-hidden="true">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RotateCcw size={16} />}>
          Try Again
        </Button>
      )}
    </div>
  );
};

/**
 * Reusable Loading Indicator / Spinner Component (Phase 6.5A)
 */
export const LoadingIndicator = ({
  size = 'md',
  label = 'Loading...',
  className = '',
}) => {
  return (
    <div
      className={`loading-container ${className}`.trim()}
      role="status"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <span className={`spinner spinner-${size}`} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
};

/**
 * Reusable Badge Component (Phase 6.5A)
 * Variants: neutral, primary, success, warning, danger, info
 */
export const Badge = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};

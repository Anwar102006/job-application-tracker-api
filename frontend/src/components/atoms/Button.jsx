/**
 * Reusable Button Component (Phase 6.5A)
 * Supports variants: primary, secondary, outline, ghost, danger
 * Supports sizes: sm, md, lg
 * Supports loading indicator and accessibility attributes
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseClasses = `btn btn-${variant} btn-${size} ${className}`.trim();

  return (
    <button
      type={type}
      className={baseClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner spinner-sm" aria-hidden="true" />
      ) : (
        leftIcon && <span className="btn-icon-left" aria-hidden="true">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="btn-icon-right" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
};

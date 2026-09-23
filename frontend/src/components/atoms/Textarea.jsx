/**
 * Reusable Textarea Component (Phase 6.5A)
 */
export const Textarea = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  rows = 4,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="form-label-required" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? errorId : helperText ? helperId : undefined
        }
        className={`form-textarea ${error ? 'form-input-error' : ''}`.trim()}
        {...props}
      />
      {error ? (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className="form-helper">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

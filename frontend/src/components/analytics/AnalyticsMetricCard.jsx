import PropTypes from 'prop-types';
import { Card } from '../atoms';

/**
 * Analytics Metric KPI Card Component (Phase 6.5F)
 *
 * Displays a single key performance indicator with icon, primary value,
 * title, and descriptive context or calculation note.
 */
export const AnalyticsMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  helperText,
  dataTestId,
}) => {
  const variantStyles = {
    primary: {
      bg: 'var(--accent-subtle)',
      color: 'var(--accent)',
    },
    success: {
      bg: 'var(--success-subtle)',
      color: 'var(--success-foreground)',
    },
    warning: {
      bg: 'var(--warning-subtle)',
      color: 'var(--warning-foreground)',
    },
    danger: {
      bg: 'var(--danger-subtle, #fef2f2)',
      color: 'var(--danger)',
    },
    neutral: {
      bg: 'var(--bg-secondary)',
      color: 'var(--text-secondary)',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <Card className="analytics-metric-card" data-testid={dataTestId}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          padding: 'var(--space-lg)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            {title}
          </p>
          <div
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
            }}
            data-testid={dataTestId ? `${dataTestId}-value` : undefined}
          >
            {value}
          </div>
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                marginTop: 'var(--space-xs)',
              }}
            >
              {subtitle}
            </p>
          )}
          {helperText && (
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '0.25rem',
              }}
            >
              {helperText}
            </p>
          )}
        </div>

        {Icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: currentVariant.bg,
              color: currentVariant.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>
    </Card>
  );
};

AnalyticsMetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'neutral']),
  helperText: PropTypes.string,
  dataTestId: PropTypes.string,
};

export default AnalyticsMetricCard;

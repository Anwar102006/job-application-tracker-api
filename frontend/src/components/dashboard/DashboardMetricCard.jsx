import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../atoms';

/**
 * Dashboard Metric KPI Card (Phase 6.5G)
 *
 * Displays a summary metric with optional navigation to detail pages
 * (e.g. Applications, Interviews, or Analytics).
 */
export const DashboardMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  helperText,
  to,
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

  const cardContent = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        padding: 'var(--space-lg)',
        position: 'relative',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--space-xs)' }}>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            {title}
          </p>
          {to && (
            <ArrowUpRight
              size={14}
              style={{ color: 'var(--text-muted)', transition: 'transform var(--transition-fast)' }}
              className="metric-card-arrow"
              aria-hidden="true"
            />
          )}
        </div>

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
              marginBotton: 0,
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
              marginBottom: 0,
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
  );

  if (to) {
    return (
      <Link
        to={to}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        data-testid={dataTestId}
        aria-label={`${title}: ${value}. ${subtitle || ''} Click to view.`}
      >
        <Card className="dashboard-metric-card clickable">
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="dashboard-metric-card" data-testid={dataTestId}>
      {cardContent}
    </Card>
  );
};

DashboardMetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'neutral']),
  helperText: PropTypes.string,
  to: PropTypes.string,
  dataTestId: PropTypes.string,
};

export default DashboardMetricCard;

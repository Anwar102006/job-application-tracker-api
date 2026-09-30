import PropTypes from 'prop-types';
import { Badge } from '../atoms';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../constants/application.constants';

/**
 * StatusBadge Component (Phase 6.5D)
 *
 * Accessible status indicator rendering backend-supported application statuses.
 * Includes text, color-coded badge, and dot indicator. Status is never conveyed by color alone.
 */
export const StatusBadge = ({ status, className = '', ...props }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    variant: 'neutral',
    description: 'Status unknown',
  };

  return (
    <Badge
      variant={config.variant}
      dot
      className={`status-badge ${className}`.trim()}
      aria-label={`Status: ${config.label}`}
      title={config.description}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
};

/**
 * PriorityBadge Component (Phase 6.5D)
 */
export const PriorityBadge = ({ priority = 'Medium', className = '', ...props }) => {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority || 'Medium',
    variant: 'neutral',
  };

  return (
    <Badge
      variant={config.variant}
      className={`priority-badge ${className}`.trim()}
      aria-label={`Priority: ${config.label}`}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

PriorityBadge.propTypes = {
  priority: PropTypes.string,
  className: PropTypes.string,
};

export default StatusBadge;

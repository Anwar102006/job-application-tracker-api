import PropTypes from 'prop-types';
import { Badge } from '../atoms';
import { INTERVIEW_STATUS_CONFIG } from '../../constants/interview.constants';

/**
 * InterviewStatusBadge Component (Phase 6.5E)
 *
 * Accessible indicator for backend interview statuses.
 * Uses color-coded badge with dot indicator and screen-reader accessible label.
 */
export const InterviewStatusBadge = ({ status, className = '', ...props }) => {
  const config = INTERVIEW_STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    variant: 'neutral',
    description: 'Status unknown',
  };

  return (
    <Badge
      variant={config.variant}
      dot
      className={`interview-status-badge ${className}`.trim()}
      aria-label={`Interview Status: ${config.label}`}
      title={config.description}
      data-testid="interview-status-badge"
      {...props}
    >
      {config.label}
    </Badge>
  );
};

InterviewStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default InterviewStatusBadge;

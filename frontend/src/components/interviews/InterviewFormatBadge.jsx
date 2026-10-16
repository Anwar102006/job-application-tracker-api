import PropTypes from 'prop-types';
import { Video, Phone, Building2, Code } from 'lucide-react';
import { Badge } from '../atoms';

const FORMAT_ICONS = {
  'Video Call': Video,
  'Phone Call': Phone,
  'In-Person': Building2,
  'Online Assessment': Code,
};

/**
 * InterviewFormatBadge Component (Phase 6.5E)
 *
 * Displays the format of the interview (Video Call, Phone Call, In-Person, Online Assessment)
 * with an appropriate icon and label.
 */
export const InterviewFormatBadge = ({ format = 'Video Call', className = '', ...props }) => {
  const IconComponent = FORMAT_ICONS[format] || Video;

  return (
    <Badge
      variant="secondary"
      className={`interview-format-badge ${className}`.trim()}
      data-testid="interview-format-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 'var(--font-medium)',
      }}
      {...props}
    >
      <IconComponent size={13} aria-hidden="true" />
      <span>{format}</span>
    </Badge>
  );
};

InterviewFormatBadge.propTypes = {
  format: PropTypes.string,
  className: PropTypes.string,
};

export default InterviewFormatBadge;

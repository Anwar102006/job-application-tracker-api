import { Inbox } from 'lucide-react';

/**
 * Reusable EmptyState Component (Phase 6.5A)
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  action,
  className = '',
}) => {
  return (
    <div className={`state-container ${className}`.trim()}>
      <div className="state-icon" aria-hidden="true">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{description}</p>
      {action && <div className="state-action">{action}</div>}
    </div>
  );
};

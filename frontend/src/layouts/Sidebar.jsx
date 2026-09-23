import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  BarChart3,
  Settings,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '../components/atoms';

/**
 * Sidebar Layout Component (Phase 6.5A)
 */
export const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Design System Demo', icon: Layers, active: true },
    { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: 'Phase 6.5F' },
    { label: 'Applications', icon: Briefcase, active: false, badge: 'Phase 6.5D' },
    { label: 'Interviews', icon: Calendar, active: false, badge: 'Phase 6.5E' },
    { label: 'Analytics', icon: BarChart3, active: false, badge: 'Phase 6.5F' },
    { label: 'Profile & Settings', icon: Settings, active: false, badge: 'Phase 6.5C' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="modal-backdrop"
          onClick={onClose}
          style={{ zIndex: 'calc(var(--z-modal) - 1)' }}
          aria-hidden="true"
        />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`.trim()} aria-label="Main Navigation">
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Navigation
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close navigation sidebar"
            style={{ padding: '0.25rem' }}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        <nav style={{ padding: 'var(--space-md) var(--space-sm)', flex: 1 }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: item.active ? 'var(--accent-subtle)' : 'transparent',
                      color: item.active ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: item.active ? 'var(--font-semibold)' : 'var(--font-normal)',
                      fontSize: 'var(--text-sm)',
                      cursor: item.active ? 'default' : 'not-allowed',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <strong>Phase 6.5A Scaffold</strong>
            <br />
            Auth & API integration will be introduced in Phase 6.5B.
          </p>
        </div>
      </aside>
    </>
  );
};

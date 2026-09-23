import { Menu, Sun, Moon, Briefcase } from 'lucide-react';
import { Button } from '../components/atoms';

/**
 * Navbar Layout Component (Phase 6.5A)
 */
export const Navbar = ({ onToggleSidebar, isDarkTheme, onToggleTheme }) => {
  return (
    <header className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="menu-toggle-btn"
          style={{ padding: '0.5rem' }}
        >
          <Menu size={20} aria-hidden="true" />
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <Briefcase size={18} />
          </div>
          <span style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            CareerPulse
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleTheme}
          aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
          leftIcon={isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
        >
          {isDarkTheme ? 'Light' : 'Dark'}
        </Button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--success)',
            }}
            aria-hidden="true"
          />
          <span>Demo Session</span>
        </div>
      </div>
    </header>
  );
};

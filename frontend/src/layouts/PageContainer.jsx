/**
 * PageContainer Layout Component (Phase 6.5A)
 * Consistent page wrapper with title, subtitle, actions header, and responsive layout
 */
export const PageContainer = ({ title, subtitle, actions, children, className = '' }) => {
  return (
    <main className={`page-container ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="page-header">
          <div>
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>{actions}</div>}
        </header>
      )}
      {children}
    </main>
  );
};

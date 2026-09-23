import { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

/**
 * AppShell Layout Component (Phase 6.5A)
 * Manages responsive layout, sidebar toggle, and theme switching
 */
export const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkTheme]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="app-main-wrapper">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isDarkTheme={isDarkTheme}
          onToggleTheme={toggleTheme}
        />
        {children}
      </div>
    </div>
  );
};

import { AuthProvider } from './context/AuthContext';
import { AppShell } from './layouts';
import { DesignSystemDemoPage } from './pages/DesignSystemDemoPage';

/**
 * Root Application Component (Phase 6.5B)
 * Provides AuthProvider, layout shell, and design system demonstration view
 */
export const App = () => {
  return (
    <AuthProvider>
      <AppShell>
        <DesignSystemDemoPage />
      </AppShell>
    </AuthProvider>
  );
};

export default App;


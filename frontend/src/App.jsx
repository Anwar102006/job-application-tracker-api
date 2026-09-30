import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './layouts';
import {
  LoginPage,
  RegisterPage,
  ProfilePage,
  DesignSystemDemoPage,
  ApplicationsPage,
  ApplicationDetailsPage,
} from './pages';

/**
 * Route definitions for CareerPulse frontend (Phase 6.5D)
 */
export const AppRoutes = () => {
  return (
    <>
      <Routes>
        {/* Public Authentication Routes (Authenticated users redirected away) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell>
                <DesignSystemDemoPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <AppShell>
                <ApplicationsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <ApplicationDetailsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Catch-all Wildcard Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: 'var(--text-sm)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />
    </>
  );
};

/**
 * Root Application Component (Phase 6.5C)
 * Wraps AuthProvider and BrowserRouter around AppRoutes
 */
export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

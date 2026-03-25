import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ServerDetailPage from './pages/ServerDetailPage';
import RemoteControlPage from './pages/RemoteControlPage';
import ServerGroupsPage from './pages/ServerGroupsPage';
import AlertsPage from './pages/AlertsPage';
import AlertRuleFormPage from './pages/AlertRuleFormPage';
import SettingsPage from './pages/SettingsPage';
import SettingsUsersPage from './pages/SettingsUsersPage';
import SettingsSMTPPage from './pages/SettingsSMTPPage';
import SettingsWebhooksPage from './pages/SettingsWebhooksPage';
import SettingsGeneralPage from './pages/SettingsGeneralPage';
import NotFoundPage from './pages/NotFoundPage';
import { SocketProvider } from './providers/SocketProvider';
import { Toaster } from './components/ui/Toaster';

function ProtectedRoute({ children, minRole }: { children: React.ReactNode; minRole?: string }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleHierarchy: Record<string, number> = { viewer: 0, operator: 1, admin: 2 };
  if (minRole && user) {
    const userLevel = roleHierarchy[user.role] ?? 0;
    const requiredLevel = roleHierarchy[minRole] ?? 0;
    if (userLevel < requiredLevel) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SocketProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/servers/:id/*" element={<ServerDetailPage />} />
                    <Route path="/servers/:id/remote-control" element={<ProtectedRoute minRole="operator"><RemoteControlPage /></ProtectedRoute>} />
                    <Route path="/groups" element={<ServerGroupsPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/alerts/rules/new" element={<ProtectedRoute minRole="operator"><AlertRuleFormPage /></ProtectedRoute>} />
                    <Route path="/alerts/rules/:id/edit" element={<ProtectedRoute minRole="operator"><AlertRuleFormPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute minRole="admin"><SettingsPage /></ProtectedRoute>} />
                    <Route path="/settings/users" element={<ProtectedRoute minRole="admin"><SettingsUsersPage /></ProtectedRoute>} />
                    <Route path="/settings/smtp" element={<ProtectedRoute minRole="admin"><SettingsSMTPPage /></ProtectedRoute>} />
                    <Route path="/settings/webhooks" element={<ProtectedRoute minRole="admin"><SettingsWebhooksPage /></ProtectedRoute>} />
                    <Route path="/settings/general" element={<ProtectedRoute minRole="admin"><SettingsGeneralPage /></ProtectedRoute>} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Layout>
              </SocketProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

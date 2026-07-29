import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Layout & Components
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Views
import LoginPage from './views/LoginPage';
import DashboardView from './views/DashboardView';
import ItemsView from './views/ItemsView';
import AddItemView from './views/AddItemView';
import CurrentOrdersView from './views/CurrentOrdersView';
import OrderHistoryView from './views/OrderHistoryView';
import StaffView from './views/StaffView';
import AddStaffView from './views/AddStaffView';
import AuditLogsView from './views/AuditLogsView';
import ComplaintsView from './views/ComplaintsView';
import RiderDashboard from './views/RiderDashboard';

// Admin layout — sidebar + content
function AdminLayout() {
  return (
    <AdminProvider>
      <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route index element={<DashboardView />} />
            <Route path="items" element={<ItemsView />} />
            <Route path="items/add" element={<AddItemView />} />
            <Route path="orders/current" element={<CurrentOrdersView />} />
            <Route path="orders/history" element={<OrderHistoryView />} />
            <Route path="complaints" element={<ComplaintsView />} />
            <Route path="staff" element={<StaffView />} />
            <Route path="staff/add" element={<AddStaffView />} />
            <Route path="audit-logs" element={<AuditLogsView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </AdminProvider>
  );
}

// Root router — decides where to send user based on role
function RootRedirect() {
  const { currentUser, userRole, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole === 'delivery') return <Navigate to="/rider" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Rider route — no sidebar, standalone */}
        <Route
          path="/rider"
          element={
            <ProtectedRoute allowedRoles={['delivery']}>
              <RiderDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin routes — protected, with sidebar */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

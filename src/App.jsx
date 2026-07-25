import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';

// Layout & Components
import Sidebar from './components/Sidebar';

// Views
import DashboardView from './views/DashboardView';
import ItemsView from './views/ItemsView';
import AddItemView from './views/AddItemView';
import CurrentOrdersView from './views/CurrentOrdersView';
import OrderHistoryView from './views/OrderHistoryView';
import StaffView from './views/StaffView';
import AddStaffView from './views/AddStaffView';
import AuditLogsView from './views/AuditLogsView';

function App() {
  return (
    <AdminProvider>
      <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
        {/* Persistent Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Route Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/items" element={<ItemsView />} />
            <Route path="/items/add" element={<AddItemView />} />
            <Route path="/orders/current" element={<CurrentOrdersView />} />
            <Route path="/orders/history" element={<OrderHistoryView />} />
            <Route path="/staff" element={<StaffView />} />
            <Route path="/staff/add" element={<AddStaffView />} />
            <Route path="/audit-logs" element={<AuditLogsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </AdminProvider>
  );
}

export default App;

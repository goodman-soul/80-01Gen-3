import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RoleSelect from './pages/Home';
import VendorLogin from './pages/vendor/Login';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorBatches from './pages/vendor/Batches';
import VendorInspections from './pages/vendor/Inspections';
import VendorInventory from './pages/vendor/Inventory';
import VendorLayout from './components/VendorLayout';
import AdminLogin from './pages/admin/Login';
import AdminPatrol from './pages/admin/Patrol';
import AdminTraceDetail from './pages/admin/TraceDetail';
import AdminLayout from './components/AdminLayout';
import ConsumerHome from './pages/consumer/Home';
import ConsumerStalls from './pages/consumer/Stalls';
import ConsumerStallDetail from './pages/consumer/StallDetail';
import ConsumerTrace from './pages/consumer/Trace';
import { useAuthStore } from './store/authStore';

function VendorProtected({ children }: { children: JSX.Element }) {
  const isAuth = useAuthStore(s => s.isAuthenticated('vendor'));
  return isAuth ? children : <Navigate to="/vendor/login" replace />;
}

function AdminProtected({ children }: { children: JSX.Element }) {
  const isAuth = useAuthStore(s => s.isAuthenticated('admin'));
  return isAuth ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />

        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route
          path="/vendor"
          element={
            <VendorProtected>
              <VendorLayout />
            </VendorProtected>
          }
        >
          <Route index element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="batches" element={<VendorBatches />} />
          <Route path="inspections" element={<VendorInspections />} />
          <Route path="inventory" element={<VendorInventory />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtected>
              <AdminLayout />
            </AdminProtected>
          }
        >
          <Route index element={<Navigate to="/admin/patrol" replace />} />
          <Route path="patrol" element={<AdminPatrol />} />
          <Route path="trace/:batchId" element={<AdminTraceDetail />} />
        </Route>

        <Route path="/consumer" element={<ConsumerHome />} />
        <Route path="/consumer/stalls" element={<ConsumerStalls />} />
        <Route path="/consumer/stall/:stallId" element={<ConsumerStallDetail />} />
        <Route path="/consumer/trace/:batchId" element={<ConsumerTrace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

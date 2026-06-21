import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PackagePlus,
  ClipboardCheck,
  Warehouse,
  LogOut,
  Store,
  Leaf,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function VendorLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/vendor/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex relative z-10">
      <aside className="w-64 bg-white/90 backdrop-blur-xl border-r border-primary-100/60 shadow-lg flex flex-col">
        <div className="p-6 border-b border-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-primary-700">溯源平台</h1>
              <p className="text-xs text-gray-500">摊主管理端</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-primary-100">
          <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-xl p-4 border border-primary-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role === 'vendor' ? '摊主账号' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <NavLink
            to="/vendor/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>工作台</span>
          </NavLink>
          <NavLink
            to="/vendor/batches"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <PackagePlus className="w-5 h-5" />
            <span>批次录入</span>
          </NavLink>
          <NavLink
            to="/vendor/inspections"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <ClipboardCheck className="w-5 h-5" />
            <span>检测结果</span>
          </NavLink>
          <NavLink
            to="/vendor/inventory"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <Warehouse className="w-5 h-5" />
            <span>库存管理</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-primary-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-medium hover:bg-danger-50 hover:text-danger-600 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

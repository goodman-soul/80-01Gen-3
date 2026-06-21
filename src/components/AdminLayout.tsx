import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ScanLine,
  LogOut,
  ShieldCheck,
  Route,
  Home,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex relative z-10">
      <aside className="w-64 bg-white/90 backdrop-blur-xl border-r border-admin-100/60 shadow-lg flex flex-col">
        <div className="p-6 border-b border-admin-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-admin-500 to-blue-500 flex items-center justify-center shadow-lg shadow-admin-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-admin-500">溯源平台</h1>
              <p className="text-xs text-gray-500">市场巡检端</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-admin-100">
          <div className="bg-gradient-to-br from-admin-50 to-blue-50 rounded-xl p-4 border border-admin-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-admin-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">市场管理员</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <NavLink
            to="/admin/patrol"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-medium hover:bg-admin-50 hover:text-admin-500 transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-admin-500 to-admin-700 text-white shadow-lg shadow-admin-500/30 hover:text-white' : ''}`
            }
          >
            <ScanLine className="w-5 h-5" />
            <span>巡检扫码</span>
          </NavLink>
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-medium hover:bg-admin-50 hover:text-admin-500 transition-all duration-300"
          >
            <Route className="w-5 h-5" />
            <span>切换角色</span>
          </NavLink>
          <NavLink
            to="/consumer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-medium hover:bg-admin-50 hover:text-admin-500 transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            <span>消费者端预览</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-admin-100">
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

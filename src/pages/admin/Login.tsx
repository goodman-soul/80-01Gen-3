import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  ShieldAlert,
  ClipboardCheck,
  FileSearch,
  Loader2,
} from 'lucide-react';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import type { LoginResponse } from '../../../shared/types';

export default function AdminLogin() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [username, setUsername] = useState('admin01');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post<LoginResponse>('/auth/admin/login', { username, password });
      if (res.success && res.data) {
        login(res.data);
        navigate('/admin/patrol', { replace: true });
      } else {
        setError(res.message || '登录失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative z-10 flex items-center justify-center px-6 py-12 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #dbeafe 50%, #e0e7ff 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 10%, rgba(30, 64, 175, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 40%)',
        }}
      />
      <div className="absolute top-8 left-8 text-7xl opacity-10 animate-float pointer-events-none">
        🛡️
      </div>
      <div className="absolute top-16 right-16 text-6xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>
        🔍
      </div>
      <div className="absolute bottom-16 left-16 text-5xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>
        📋
      </div>
      <div className="absolute bottom-8 right-8 text-7xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '0.5s' }}>
        ✅
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-admin-100 text-gray-600 hover:text-admin-500 hover:bg-white transition-all duration-300 z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">返回首页</span>
      </button>

      <div className="w-full max-w-5xl card overflow-hidden animate-fade-in-up"
        style={{ boxShadow: '0 4px 20px -2px rgba(30, 64, 175, 0.12)' }}
      >
        <div className="grid md:grid-cols-2">
          <div className="relative bg-gradient-to-br from-admin-500 via-admin-600 to-blue-500 p-10 text-white overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl" />

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">溯源平台</h2>
                    <p className="text-sm text-white/70">市场巡检端</p>
                  </div>
                </div>

                <h1 className="title-display text-4xl mb-4 leading-tight">
                  守护市场<br />
                  食品安全
                </h1>
                <p className="text-white/80 leading-relaxed mb-8">
                  作为市场管理员，您的每一次巡检都是对消费者食品安全的有力保障。让我们共同守护舌尖上的安全。
                </p>

                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div>
                    <p className="font-semibold">风险防控</p>
                    <p className="text-sm text-white/70">临期预警，及时处置</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <p className="font-semibold">巡检留痕</p>
                    <p className="text-sm text-white/70">检查记录，有据可查</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <FileSearch className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <p className="font-semibold">全链溯源</p>
                    <p className="text-sm text-white/70">从产地到餐桌全透明</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-white/50 mt-10">
                © 2025 菜市场溯源平台 · 守护舌尖安全
              </p>
            </div>
          </div>

          <div className="p-10">
            <div className="mb-8">
              <h2 className="title-display text-3xl text-gray-800 mb-2">管理员登录</h2>
              <p className="text-gray-500">请输入巡检管理员账号密码</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label-base">管理员账号</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入管理员账号"
                  className="input-base focus:border-admin-400 focus:ring-admin-100"
                  style={{
                    ['--tw-ring-color' as string]: 'rgba(30, 64, 175, 0.1)',
                  }}
                  required
                />
              </div>

              <div>
                <label className="label-base">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-base focus:border-admin-400 focus:ring-admin-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-admin-500 to-admin-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 4px 20px -2px rgba(30, 64, 175, 0.25)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>登录巡检端</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 rounded-xl bg-admin-50 border border-admin-100">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-admin-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-admin-500 mb-1">演示账号</p>
                  <p className="text-gray-600">账号：<code className="px-1.5 py-0.5 rounded bg-white text-admin-600">admin01</code></p>
                  <p className="text-gray-600">密码：<code className="px-1.5 py-0.5 rounded bg-white text-admin-600">admin123</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

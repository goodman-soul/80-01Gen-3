import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, Leaf, Carrot, Apple, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import type { LoginResponse } from '../../../shared/types';

export default function VendorLogin() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [username, setUsername] = useState('vendor01');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post<LoginResponse>('/auth/vendor/login', { username, password });
      if (res.success && res.data) {
        login(res.data);
        navigate('/vendor/dashboard', { replace: true });
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
    <div className="min-h-screen relative z-10 flex items-center justify-center px-6 py-12 overflow-hidden">
      <div className="absolute top-8 left-8 text-7xl opacity-10 animate-float pointer-events-none">
        🥬
      </div>
      <div className="absolute top-16 right-16 text-6xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>
        🍎
      </div>
      <div className="absolute bottom-16 left-16 text-5xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>
        🥕
      </div>
      <div className="absolute bottom-8 right-8 text-7xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '0.5s' }}>
        🌽
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-primary-100 text-gray-600 hover:text-primary-600 hover:bg-white transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">返回首页</span>
      </button>

      <div className="w-full max-w-5xl card overflow-hidden animate-fade-in-up">
        <div className="grid md:grid-cols-2">
          <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-emerald-500 p-10 text-white overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-300/20 rounded-full blur-3xl" />

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Leaf className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">溯源平台</h2>
                    <p className="text-sm text-white/70">摊主管理端</p>
                  </div>
                </div>

                <h1 className="title-display text-4xl mb-4 leading-tight">
                  欢迎回来<br />
                  诚信摊主
                </h1>
                <p className="text-white/80 leading-relaxed mb-8">
                  登录后即可录入进货批次、上传检测报告、管理库存，让您的经营更合规、消费者更放心。
                </p>

                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <Carrot className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <p className="font-semibold">批次溯源</p>
                    <p className="text-sm text-white/70">每一批商品都有身份证</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <Apple className="w-5 h-5 text-red-200" />
                  </div>
                  <div>
                    <p className="font-semibold">检测透明</p>
                    <p className="text-sm text-white/70">报告公开，建立信任</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <Store className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div>
                    <p className="font-semibold">智能库存</p>
                    <p className="text-sm text-white/70">临期预警，减少损耗</p>
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
              <h2 className="title-display text-3xl text-gray-800 mb-2">摊主登录</h2>
              <p className="text-gray-500">请输入您的账号密码进入工作台</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label-base">账号</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入账号"
                  className="input-base"
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
                  className="input-base"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <Store className="w-5 h-5" />
                    <span>登录工作台</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">
                <strong className="text-gray-700">演示账号：</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 font-mono">
                  vendor01 / 123456
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

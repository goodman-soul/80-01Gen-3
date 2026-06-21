import { useNavigate } from 'react-router-dom';
import { Store, ShieldCheck, Users, Leaf, Sprout, Carrot, Apple } from 'lucide-react';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative z-10 flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <div className="absolute top-10 left-10 text-7xl opacity-10 animate-float pointer-events-none">
        🥬
      </div>
      <div className="absolute top-20 right-20 text-6xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>
        🍎
      </div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>
        🥕
      </div>
      <div className="absolute bottom-10 right-10 text-7xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '0.5s' }}>
        🌽
      </div>

      <div className="w-full max-w-6xl">
        <div className="text-center mb-14 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-primary-100 shadow-sm mb-6">
            <Sprout className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-semibold text-primary-600">食品安全追溯体系</span>
          </div>
          <h1 className="title-display text-5xl md:text-6xl mb-5">
            <span className="bg-gradient-to-r from-primary-600 via-emerald-500 to-accent-500 bg-clip-text text-transparent">
              菜市场摊位溯源平台
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            从产地源头到消费者餐桌，全链路透明可追溯 · 守护每一口新鲜与安全
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          <div
            onClick={() => navigate('/vendor/login')}
            className="card-interactive p-8 animate-fade-in-up relative overflow-hidden group"
            style={{ animationDelay: '100ms' }}
          >
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-gradient-to-br from-primary-400/20 to-emerald-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h2 className="title-display text-2xl text-gray-800 mb-3">摊主工作台</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[60px]">
                每日录入进货批次、上传检测报告、管理剩余库存。数字化经营，省心又合规。
              </p>
              <div className="flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
                <span>进入摊主端</span>
                <Carrot className="w-4 h-4" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-primary-50 text-primary-600 font-medium">批次录入</span>
                <span className="text-xs px-3 py-1 rounded-full bg-primary-50 text-primary-600 font-medium">检测上传</span>
                <span className="text-xs px-3 py-1 rounded-full bg-primary-50 text-primary-600 font-medium">库存管理</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/login')}
            className="card-interactive p-8 animate-fade-in-up relative overflow-hidden group"
            style={{ animationDelay: '250ms' }}
          >
            <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-gradient-to-br from-admin-400/20 to-blue-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-admin-500 to-blue-500 flex items-center justify-center mb-6 shadow-xl shadow-admin-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="title-display text-2xl text-gray-800 mb-3">市场巡检端</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[60px]">
                扫码即可查看完整溯源信息，巡检记录一键保存，临期商品整改追踪。
              </p>
              <div className="flex items-center gap-2 text-admin-500 font-semibold group-hover:gap-3 transition-all">
                <span>进入管理员端</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-admin-50 text-admin-500 font-medium">扫码巡检</span>
                <span className="text-xs px-3 py-1 rounded-full bg-admin-50 text-admin-500 font-medium">全量溯源</span>
                <span className="text-xs px-3 py-1 rounded-full bg-admin-50 text-admin-500 font-medium">临期追踪</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/consumer')}
            className="card-interactive p-8 animate-fade-in-up relative overflow-hidden group"
            style={{ animationDelay: '400ms' }}
          >
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-gradient-to-br from-accent-400/20 to-amber-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-500 to-amber-400 flex items-center justify-center mb-6 shadow-xl shadow-accent-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="title-display text-2xl text-gray-800 mb-3">消费者查询</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 min-h-[60px]">
                扫码或搜索摊位，查看商品来源、检测结果，买得安心吃得放心。
              </p>
              <div className="flex items-center gap-2 text-accent-600 font-semibold group-hover:gap-3 transition-all">
                <span>进入消费者端</span>
                <Apple className="w-4 h-4" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-accent-50 text-accent-600 font-medium">摊位查询</span>
                <span className="text-xs px-3 py-1 rounded-full bg-accent-50 text-accent-600 font-medium">商品溯源</span>
                <span className="text-xs px-3 py-1 rounded-full bg-accent-50 text-accent-600 font-medium">公开透明</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: '550ms' }}>
          <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-gray-600"><strong className="text-primary-600">5</strong> 个示范摊位</span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-accent-500" />
              <span className="text-sm text-gray-600"><strong className="text-accent-600">8</strong> 个商品批次</span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-admin-500" />
              <span className="text-sm text-gray-600"><strong className="text-admin-500">100%</strong> 检测合格率</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

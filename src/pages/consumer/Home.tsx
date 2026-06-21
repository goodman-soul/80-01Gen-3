import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Store, Shield, ArrowRight, QrCode, MapPin, Star } from 'lucide-react';
import { api } from '../../utils/api';
import { ratingText } from '../../utils/format';
import type { StallWithMask } from '../../../shared/types';

const CATEGORY_EMOJI: Record<string, string> = {
  蔬菜: '🥬',
  水果: '🍎',
  肉类: '🥩',
  水产: '🦐',
  干货: '🌰',
};

export default function ConsumerHome() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [traceCode, setTraceCode] = useState('');
  const [recommendStalls, setRecommendStalls] = useState<StallWithMask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendStalls();
  }, []);

  async function fetchRecommendStalls() {
    setLoading(true);
    const res = await api.get<StallWithMask[]>('/stalls');
    if (res.success && res.data) {
      setRecommendStalls(res.data.slice(0, 3));
    }
    setLoading(false);
  }

  function handleSearch() {
    const keyword = searchKeyword.trim();
    if (!keyword) {
      navigate('/consumer/stalls');
      return;
    }
    navigate(`/consumer/stalls?search=${encodeURIComponent(keyword)}`);
  }

  function handleQuickTrace() {
    const code = traceCode.trim();
    if (code) {
      navigate(`/consumer/trace/${encodeURIComponent(code)}`);
    }
  }

  return (
    <div className="min-h-screen relative z-10 pb-20">
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="card-interactive flex items-center gap-2 px-4 py-2.5"
        >
          <Home className="w-4 h-4 text-accent-600" />
          <span className="text-sm font-semibold text-gray-700">返回首页</span>
        </button>
      </div>

      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-50 via-orange-50 to-amber-50" />
        <div className="absolute top-20 left-10 text-8xl opacity-10 animate-float pointer-events-none">🥕</div>
        <div className="absolute top-40 right-16 text-7xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>🍊</div>
        <div className="absolute bottom-10 left-1/4 text-6xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>🍅</div>
        <div className="absolute bottom-20 right-1/3 text-8xl opacity-10 animate-float pointer-events-none" style={{ animationDelay: '0.5s' }}>🥬</div>

        <div className="container relative">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-accent-200 shadow-sm mb-6">
              <Shield className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-semibold text-accent-700">食品安全溯源查询平台</span>
            </div>
            <h1 className="title-display text-5xl md:text-6xl mb-5">
              <span className="bg-gradient-to-r from-accent-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                安心买菜 · 源头可溯
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              每一份食材从产地到餐桌，全链路透明可追溯，守护您和家人的健康每一天
            </p>

            <div className="relative max-w-2xl mx-auto mb-8">
              <div className="card p-2 shadow-xl shadow-accent-200/50">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="输入摊位号或商品名，例如：A01、西红柿..."
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-accent-50/50 transition-all duration-300 text-base"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent-500 to-orange-500 text-white font-bold shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 whitespace-nowrap"
                  >
                    搜索
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <button
                onClick={() => navigate('/consumer/stalls')}
                className="card-interactive p-6 text-left relative overflow-hidden group"
              >
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-accent-400/20 to-orange-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-orange-500 flex items-center justify-center shadow-lg shadow-accent-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Store className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="title-display text-xl text-gray-800 mb-1">按摊位查询</h3>
                    <p className="text-sm text-gray-500">浏览全部摊位，查看经营信息</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-accent-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('quick-trace');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="card-interactive p-6 text-left relative overflow-hidden group"
              >
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-accent-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-accent-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <QrCode className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="title-display text-xl text-gray-800 mb-1">按商品溯源</h3>
                    <p className="text-sm text-gray-500">输入批次号，查看完整溯源</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="flex items-end justify-between mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
              <span className="text-sm font-semibold text-accent-600">精选推荐</span>
            </div>
            <h2 className="title-display text-3xl text-gray-800">优质摊位推荐</h2>
          </div>
          <button
            onClick={() => navigate('/consumer/stalls')}
            className="flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700 transition-colors"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 h-52 animate-pulse-soft">
                <div className="h-10 w-10 rounded-xl bg-gray-100 mb-4" />
                <div className="h-6 w-32 bg-gray-100 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-50 rounded mb-4" />
                <div className="h-4 w-40 bg-gray-50 rounded mb-2" />
                <div className="h-4 w-36 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendStalls.map((stall, idx) => (
              <div
                key={stall.id}
                onClick={() => navigate(`/consumer/stall/${stall.id}`)}
                className="card-interactive p-6 animate-fade-in-up relative overflow-hidden group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-br from-accent-400/15 to-orange-400/15 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-100 to-orange-100 flex items-center justify-center text-3xl shadow-inner">
                      {CATEGORY_EMOJI[stall.category] || '🏪'}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ratingText[stall.creditRating].className}`}>
                      {stall.creditRating}
                    </span>
                  </div>
                  <h3 className="title-display text-xl text-gray-800 mb-1 group-hover:text-accent-600 transition-colors">
                    {stall.name}
                  </h3>
                  <p className="text-sm font-semibold text-accent-600 mb-3">摊位号 · {stall.stallNo}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{stall.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="px-2 py-0.5 rounded-md bg-accent-50 text-accent-700 text-xs font-medium">
                        {stall.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="quick-trace" className="container py-12">
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500 via-orange-500 to-amber-500" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <QrCode className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">快速溯源通道</span>
            </div>
            <h2 className="title-display text-3xl md:text-4xl text-white mb-4">
              输入批次号 · 一码溯源
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              扫描商品包装二维码或手动输入批次号，立即查看完整溯源信息
            </p>

            <div className="card p-2 shadow-2xl">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">SC</span>
                  <input
                    type="text"
                    value={traceCode}
                    onChange={(e) => setTraceCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickTrace()}
                    placeholder="例如：SC20260620001"
                    className="w-full pl-14 pr-4 py-4 rounded-xl border-0 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-accent-50/50 transition-all duration-300 font-mono text-base"
                  />
                </div>
                <button
                  onClick={handleQuickTrace}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-emerald-500 text-white font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 whitespace-nowrap"
                >
                  查询溯源
                </button>
              </div>
            </div>

            <p className="mt-6 text-white/70 text-sm">
              支持批次号、溯源码多种格式查询
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

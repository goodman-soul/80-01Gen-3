import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Home, Store, MapPin, User, Filter, ArrowLeft } from 'lucide-react';
import { api } from '../../utils/api';
import { ratingText } from '../../utils/format';
import type { StallWithMask } from '../../../shared/types';

const CATEGORIES = ['全部', '蔬菜', '水果', '肉类', '水产', '干货'];

const CATEGORY_EMOJI: Record<string, string> = {
  蔬菜: '🥬',
  水果: '🍎',
  肉类: '🥩',
  水产: '🦐',
  干货: '🌰',
};

export default function ConsumerStalls() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allStalls, setAllStalls] = useState<StallWithMask[]>([]);
  const [filteredStalls, setFilteredStalls] = useState<StallWithMask[]>([]);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStalls();
  }, []);

  useEffect(() => {
    filterStalls();
  }, [allStalls, activeCategory, searchKeyword]);

  async function fetchStalls() {
    setLoading(true);
    const res = await api.get<StallWithMask[]>('/stalls');
    if (res.success && res.data) {
      setAllStalls(res.data);
    }
    setLoading(false);
  }

  function filterStalls() {
    let result = [...allStalls];
    if (activeCategory !== '全部') {
      result = result.filter((s) => s.category === activeCategory);
    }
    const keyword = searchKeyword.trim().toLowerCase();
    if (keyword) {
      result = result.filter(
        (s) =>
          s.stallNo.toLowerCase().includes(keyword) ||
          s.name.toLowerCase().includes(keyword) ||
          s.category.toLowerCase().includes(keyword) ||
          s.location.toLowerCase().includes(keyword)
      );
    }
    setFilteredStalls(result);
  }

  return (
    <div className="min-h-screen relative z-10 pb-16">
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => navigate('/consumer')}
          className="card-interactive flex items-center gap-2 px-4 py-2.5"
        >
          <ArrowLeft className="w-4 h-4 text-accent-600" />
          <span className="text-sm font-semibold text-gray-700">返回</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="card-interactive flex items-center gap-2 px-4 py-2.5"
        >
          <Home className="w-4 h-4 text-accent-600" />
          <span className="text-sm font-semibold text-gray-700">首页</span>
        </button>
      </div>

      <section className="relative overflow-hidden pt-20 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-50 via-orange-50/80 to-transparent" />
        <div className="absolute top-24 right-20 text-7xl opacity-10 animate-float pointer-events-none">🛒</div>

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-accent-200 shadow-sm mb-5">
              <Store className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-semibold text-accent-700">全部摊位一览</span>
            </div>
            <h1 className="title-display text-4xl md:text-5xl mb-4">
              <span className="bg-gradient-to-r from-accent-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                找到您信任的摊位
              </span>
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              所有摊位均经过市场准入审核，摊主信息脱敏展示，信用评级公开透明
            </p>

            <div className="relative">
              <div className="card p-2 shadow-xl shadow-accent-100/50">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="搜索摊位号、摊位名称或位置..."
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-0 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-accent-50/50 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="card p-4 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 px-2">
              <Filter className="w-4 h-4 text-accent-500" />
              <span>经营品类</span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-gradient-to-r from-accent-500 to-orange-500 text-white shadow-lg shadow-accent-500/25'
                      : 'text-gray-600 hover:bg-accent-50 hover:text-accent-700'
                  }`}
                >
                  {cat !== '全部' && <span className="mr-1">{CATEGORY_EMOJI[cat]}</span>}
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500 font-medium">
              共 <span className="text-accent-600 font-bold">{filteredStalls.length}</span> 个摊位
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 rounded-2xl border-2 border-gray-100 p-6 animate-pulse-soft">
                <div className="h-12 w-12 rounded-xl bg-gray-100 mb-4" />
                <div className="h-6 w-36 bg-gray-100 rounded mb-2" />
                <div className="h-4 w-28 bg-gray-50 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-50 rounded" />
                  <div className="h-4 w-36 bg-gray-50 rounded" />
                  <div className="h-4 w-32 bg-gray-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStalls.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="title-display text-xl text-gray-700 mb-2">没有找到匹配的摊位</h3>
            <p className="text-gray-500 mb-6">试试换个关键词或调整筛选条件</p>
            <button
              onClick={() => {
                setActiveCategory('全部');
                setSearchKeyword('');
              }}
              className="btn-secondary"
            >
              重置筛选条件
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStalls.map((stall, idx) => (
              <div
                key={stall.id}
                onClick={() => navigate(`/consumer/stall/${stall.id}`)}
                className="group relative rounded-2xl p-[2px] cursor-pointer animate-fade-in-up transition-all duration-500 hover:-translate-y-1"
                style={{
                  animationDelay: `${idx * 60}ms`,
                  background: 'linear-gradient(135deg, #34d399 0%, #10B981 50%, #6ee7b7 100%)',
                }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: 'linear-gradient(135deg, #34d399 0%, #10B981 100%)' }}
                />
                <div className="relative bg-white rounded-2xl p-6 h-full transition-all duration-300 group-hover:bg-white">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-accent-400/15 to-orange-400/15 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                  <div className="flex items-start justify-between mb-4 relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-emerald-50 flex items-center justify-center text-3xl shadow-inner border border-primary-100">
                      {CATEGORY_EMOJI[stall.category] || '🏪'}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${ratingText[stall.creditRating].className}`}>
                      {ratingText[stall.creditRating].text}
                    </span>
                  </div>

                  <div className="relative">
                    <h3 className="title-display text-xl text-gray-800 mb-1 group-hover:text-primary-700 transition-colors">
                      {stall.name}
                    </h3>
                    <p className="text-sm font-semibold text-accent-600 mb-4">
                      摊位号 · {stall.stallNo}
                    </p>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">摊主：{stall.vendorNameMasked}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{stall.location}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-accent-50 to-orange-50 text-accent-700 text-xs font-semibold border border-accent-100">
                          {CATEGORY_EMOJI[stall.category] || '🏷️'} {stall.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

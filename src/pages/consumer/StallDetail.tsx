import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, MapPin, User, ArrowLeft, Store, Package, Calendar, AlertTriangle, ShieldCheck, Clock, ChevronRight } from 'lucide-react';
import { api } from '../../utils/api';
import { ratingText, statusText, daysRemaining, formatDate } from '../../utils/format';
import type { StallWithMask, ProductBatch } from '../../../shared/types';

const CATEGORY_EMOJI: Record<string, string> = {
  蔬菜: '🥬',
  水果: '🍎',
  肉类: '🥩',
  水产: '🦐',
  干货: '🌰',
};

const PRODUCT_EMOJI: Record<string, string> = {
  西红柿: '🍅',
  黄瓜: '🥒',
  土豆: '🥔',
  胡萝卜: '🥕',
  白菜: '🥬',
  菠菜: '🥬',
  苹果: '🍎',
  香蕉: '🍌',
  橙子: '🍊',
  葡萄: '🍇',
  草莓: '🍓',
  猪肉: '🥩',
  牛肉: '🥩',
  鸡肉: '🍗',
  鱼: '🐟',
  虾: '🦐',
  蟹: '🦀',
  大米: '🌾',
  面粉: '🌾',
  香菇: '🍄',
  木耳: '🍄',
};

export default function ConsumerStallDetail() {
  const navigate = useNavigate();
  const { stallId } = useParams<{ stallId: string }>();
  const [stall, setStall] = useState<StallWithMask | null>(null);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stallId) {
      fetchData();
    }
  }, [stallId]);

  async function fetchData() {
    setLoading(true);
    const stallRes = await api.get<StallWithMask>(`/stalls/${stallId}`);
    if (stallRes.success && stallRes.data) {
      setStall(stallRes.data);
    }
    const batchRes = await api.get<ProductBatch[]>(`/public/batches?stallId=${stallId}`);
    if (batchRes.success && batchRes.data) {
      setBatches(batchRes.data);
    }
    setLoading(false);
  }

  function getRemainingDays(batch: ProductBatch) {
    return daysRemaining(batch.productionDate, batch.shelfLifeDays);
  }

  function getProductEmoji(name: string) {
    return PRODUCT_EMOJI[name] || '📦';
  }

  if (loading) {
    return (
      <div className="min-h-screen relative z-10 pt-20 pb-16">
        <div className="container">
          <div className="card p-8 animate-pulse-soft mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 mb-6" />
            <div className="h-8 w-64 bg-gray-100 rounded mb-4" />
            <div className="h-4 w-48 bg-gray-50 rounded mb-3" />
            <div className="h-4 w-40 bg-gray-50 rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 h-28 animate-pulse-soft">
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-gray-100 rounded" />
                    <div className="h-4 w-40 bg-gray-50 rounded" />
                    <div className="h-4 w-36 bg-gray-50 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stall) {
    return (
      <div className="min-h-screen relative z-10 pt-20 pb-16">
        <div className="container">
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="title-display text-xl text-gray-700 mb-2">摊位不存在</h3>
            <p className="text-gray-500 mb-6">找不到该摊位信息，可能已被移除</p>
            <button onClick={() => navigate('/consumer/stalls')} className="btn-secondary">
              返回摊位列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const passedCount = batches.filter((b) => b.inspectionStatus === 'passed').length;

  return (
    <div className="min-h-screen relative z-10 pb-16">
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => navigate('/consumer/stalls')}
          className="card-interactive flex items-center gap-2 px-4 py-2.5"
        >
          <ArrowLeft className="w-4 h-4 text-accent-600" />
          <span className="text-sm font-semibold text-gray-700">返回列表</span>
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
        <div className="absolute inset-0 bg-gradient-to-b from-accent-50 via-orange-50/70 to-transparent" />

        <div className="container relative">
          <div className="card p-8 md:p-10 animate-fade-in-up relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-accent-400/20 to-orange-400/20 rounded-full blur-3xl" />
            <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-gradient-to-br from-primary-400/15 to-emerald-400/15 rounded-full blur-3xl" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary-500 via-emerald-500 to-teal-400 flex items-center justify-center text-5xl shadow-2xl shadow-primary-500/30">
                {CATEGORY_EMOJI[stall.category] || '🏪'}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="title-display text-3xl md:text-4xl text-gray-800">
                    {stall.name}
                  </h1>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${ratingText[stall.creditRating].className}`}>
                    {ratingText[stall.creditRating].text}
                  </span>
                </div>

                <p className="text-accent-600 font-semibold mb-4 text-lg">
                  摊位号 · {stall.stallNo}
                </p>

                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 text-accent-500" />
                    <span className="font-medium">{stall.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Store className="w-5 h-5 text-primary-500" />
                    <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-primary-50 to-emerald-50 text-primary-700 text-sm font-semibold border border-primary-100">
                      经营品类：{stall.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">摊主：{stall.vendorNameMasked}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                <div className="card p-4 text-center bg-gradient-to-br from-accent-50 to-orange-50">
                  <div className="text-3xl font-bold text-accent-600">{batches.length}</div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">在售批次</div>
                </div>
                <div className="card p-4 text-center bg-gradient-to-br from-primary-50 to-emerald-50">
                  <div className="text-3xl font-bold text-primary-600">{passedCount}</div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">检测合格</div>
                </div>
                <div className="card p-4 text-center bg-gradient-to-br from-amber-50 to-accent-50">
                  <div className="text-3xl font-bold text-amber-600">
                    {batches.length > 0 ? Math.round((passedCount / batches.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">合格率</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="flex items-end justify-between mb-6 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-accent-500" />
              <span className="text-sm font-semibold text-accent-600">在售商品</span>
            </div>
            <h2 className="title-display text-2xl md:text-3xl text-gray-800">
              当前在售商品批次
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            共 <span className="text-accent-600 font-bold">{batches.length}</span> 个批次
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="card p-16 text-center animate-fade-in-up">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="title-display text-xl text-gray-700 mb-2">暂无可售商品</h3>
            <p className="text-gray-500">该摊位暂时没有上架商品，请稍后再来看看</p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch, idx) => {
              const remain = getRemainingDays(batch);
              const isNearExpiry = remain <= 3;
              const expiryDateStr = formatDate(
                new Date(new Date(batch.productionDate).getTime() + batch.shelfLifeDays * 86400000).toISOString()
              );

              return (
                <div
                  key={batch.id}
                  onClick={() => navigate(`/consumer/trace/${batch.id}`)}
                  className="card-interactive p-5 md:p-6 animate-fade-in-up relative overflow-hidden group"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="absolute -right-12 -top-12 w-36 h-36 bg-gradient-to-br from-accent-400/15 to-orange-400/15 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                  <div className="relative flex flex-col md:flex-row md:items-center gap-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-accent-100 via-orange-100 to-amber-100 flex items-center justify-center text-4xl shadow-inner border border-accent-200/50 flex-shrink-0">
                      {getProductEmoji(batch.productName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="title-display text-xl text-gray-800 group-hover:text-accent-700 transition-colors">
                            {batch.productName}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            批次号：{batch.batchNo}
                          </p>
                        </div>
                        <span className={`badge ${statusText[batch.inspectionStatus].className} flex-shrink-0`}>
                          {batch.inspectionStatus === 'passed' && <ShieldCheck className="w-3.5 h-3.5" />}
                          {batch.inspectionStatus === 'pending' && <Clock className="w-3.5 h-3.5" />}
                          {batch.inspectionStatus === 'failed' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {statusText[batch.inspectionStatus].text}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin className="w-4 h-4 text-primary-500" />
                          <span>产地：{batch.origin}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Calendar className="w-4 h-4 text-accent-500" />
                          <span>保质期至：{expiryDateStr}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-semibold ${
                          isNearExpiry ? 'text-danger-600' : remain <= 7 ? 'text-accent-600' : 'text-primary-600'
                        }`}>
                          {isNearExpiry ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          <span>
                            {remain > 0 ? `剩余 ${remain} 天` : remain === 0 ? '今日到期' : `已过期 ${-remain} 天`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end md:w-auto gap-4">
                      <div className="flex items-center gap-2 text-accent-600 font-semibold group-hover:gap-3 transition-all">
                        <span className="text-sm">查看溯源</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, MapPin, Calendar, Clock, Store, ShieldCheck, ShieldAlert, ShieldQuestion, CheckCircle2, XCircle, ArrowLeft, Info } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate, daysRemaining, publicInspectionStatusText } from '../../utils/format';
import TraceTimeline from '../../components/TraceTimeline';
import type { PublicBatchTraceDetail } from '../../../shared/types';

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

export default function ConsumerTrace() {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [detail, setDetail] = useState<PublicBatchTraceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      fetchDetail();
    }
  }, [batchId]);

  async function fetchDetail() {
    setLoading(true);
    setError(null);
    const res = await api.get<PublicBatchTraceDetail>(`/public/batches/${batchId}`);
    if (res.success && res.data) {
      setDetail(res.data);
    } else {
      setError(res.message || '未找到该批次溯源信息');
    }
    setLoading(false);
  }

  function getProductEmoji(name: string) {
    return PRODUCT_EMOJI[name] || '📦';
  }

  function getInspectionSummary() {
    if (!detail) {
      return { pass: 0, fail: 0, total: 0 };
    }
    const { inspection } = detail;
    return {
      pass: inspection.passCount,
      fail: inspection.failCount,
      total: inspection.itemCount,
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen relative z-10 pt-20 pb-16">
        <div className="container max-w-4xl">
          <div className="rounded-3xl h-52 bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse-soft mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6 h-32 animate-pulse-soft">
                <div className="h-5 w-5 bg-gray-100 rounded mb-3" />
                <div className="h-6 w-36 bg-gray-100 rounded mb-2" />
                <div className="h-4 w-28 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
          <div className="card p-8 animate-pulse-soft">
            <div className="h-6 w-32 bg-gray-100 rounded mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-40 bg-gray-100 rounded" />
                    <div className="h-4 w-64 bg-gray-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen relative z-10 pt-20 pb-16">
        <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
          <button onClick={() => navigate('/consumer')} className="card-interactive flex items-center gap-2 px-4 py-2.5">
            <ArrowLeft className="w-4 h-4 text-accent-600" />
            <span className="text-sm font-semibold text-gray-700">返回</span>
          </button>
        </div>
        <div className="container max-w-4xl">
          <div className="card p-16 text-center">
            <div className="text-7xl mb-6">🔍</div>
            <h3 className="title-display text-2xl text-gray-700 mb-3">未找到溯源信息</h3>
            <p className="text-gray-500 mb-8">{error || '该批次号不存在或信息未录入'}</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/consumer')} className="btn-secondary">返回首页</button>
              <button onClick={() => navigate('/consumer/stalls')} className="btn-outline">浏览摊位</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { batch, stall, inspection } = detail;
  const remainDays = daysRemaining(batch.productionDate, batch.shelfLifeDays);
  const isNearExpiry = remainDays <= 3;
  const expiryDateStr = formatDate(
    new Date(new Date(batch.productionDate).getTime() + batch.shelfLifeDays * 86400000).toISOString()
  );
  const inspectionSummary = getInspectionSummary();

  const statusConfig = {
    passed: {
      badgeClass: 'bg-gradient-to-br from-primary-400 via-emerald-500 to-teal-500 text-white',
      iconBg: 'bg-white/25',
      Icon: ShieldCheck,
      title: '检测通过 · 放心购买',
      desc: '本批次商品已通过食品安全检测，所有检测项目均合格',
      bannerBg: 'from-primary-500 via-emerald-500 to-teal-500',
      borderGlow: 'shadow-primary-500/40',
    },
    pending: {
      badgeClass: 'bg-gradient-to-br from-accent-400 via-amber-500 to-orange-500 text-white',
      iconBg: 'bg-white/25',
      Icon: ShieldQuestion,
      title: '等待检测 · 建议观望',
      desc: '本批次商品正在等待食品安全检测，请关注后续检测结果',
      bannerBg: 'from-accent-500 via-amber-500 to-orange-500',
      borderGlow: 'shadow-accent-500/40',
    },
    failed: {
      badgeClass: 'bg-gradient-to-br from-danger-400 via-red-500 to-rose-500 text-white',
      iconBg: 'bg-white/25',
      Icon: ShieldAlert,
      title: '检测不合格 · 请勿购买',
      desc: '本批次商品存在检测不合格项目，为了您的健康请勿购买',
      bannerBg: 'from-danger-500 via-red-500 to-rose-500',
      borderGlow: 'shadow-danger-500/40',
    },
  } as const;

  const status = statusConfig[batch.inspectionStatus];
  const StatusIcon = status.Icon;

  return (
    <div className="min-h-screen relative z-10 pb-20">
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
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

      <section className="pt-20 pb-8">
        <div className="container max-w-4xl">
          <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 shadow-2xl ${status.borderGlow} animate-fade-in-up`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${status.bannerBg}`} />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
            <div className="absolute top-10 left-1/2 text-[120px] opacity-10 pointer-events-none select-none">
              {getProductEmoji(batch.productName)}
            </div>

            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className={`relative p-6 rounded-3xl ${status.badgeClass} shadow-2xl`}>
                <div className={`absolute inset-0 rounded-3xl ${status.iconBg} backdrop-blur-sm`} />
                <StatusIcon className="relative w-16 h-16 md:w-20 md:h-20" />
              </div>

              <div className="flex-1 text-white">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-semibold mb-4">
                  <Info className="w-4 h-4" />
                  <span>食品安全公示</span>
                </div>

                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <span className="text-6xl md:text-7xl">{getProductEmoji(batch.productName)}</span>
                  <h1 className="title-display text-4xl md:text-5xl">
                    {batch.productName}
                  </h1>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold opacity-95 mb-3">
                  {status.title}
                </h2>
                <p className="text-white/90 text-lg mb-5 max-w-2xl leading-relaxed">
                  {status.desc}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">产地：{batch.origin}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm font-mono text-sm">
                    批次号：{batch.batchNo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-4xl pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-6 animate-fade-in-up relative overflow-hidden group" style={{ animationDelay: '50ms' }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-primary-400/20 to-emerald-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="title-display text-lg text-gray-800">📍 产地信息</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400 mb-1">产地来源</p>
                  <p className="text-xl font-bold text-gray-800">{batch.origin}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up relative overflow-hidden group" style={{ animationDelay: '100ms' }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-accent-400/20 to-orange-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  batch.inspectionStatus === 'passed'
                    ? 'bg-gradient-to-br from-primary-100 to-emerald-100'
                    : batch.inspectionStatus === 'failed'
                    ? 'bg-gradient-to-br from-danger-100 to-red-100'
                    : 'bg-gradient-to-br from-accent-100 to-amber-100'
                }`}>
                  <CheckCircle2 className={`w-5 h-5 ${
                    batch.inspectionStatus === 'passed'
                      ? 'text-primary-600'
                      : batch.inspectionStatus === 'failed'
                      ? 'text-danger-600'
                      : 'text-accent-600'
                  }`} />
                </div>
                <h3 className="title-display text-lg text-gray-800">✅ 检测状态</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">整体结论</span>
                  <span className={`badge ${
                    batch.inspectionStatus === 'passed' ? 'badge-success' :
                    batch.inspectionStatus === 'failed' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {batch.inspectionStatus === 'passed' ? '合格' :
                     batch.inspectionStatus === 'failed' ? '不合格' : '待检测'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">检测结论</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {publicInspectionStatusText[inspection.overall]}
                  </span>
                </div>
                {inspectionSummary.total > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-semibold text-primary-700">
                        {inspectionSummary.pass} 项通过
                      </span>
                    </div>
                    {inspectionSummary.fail > 0 && (
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-danger-500" />
                        <span className="text-sm font-semibold text-danger-700">
                          {inspectionSummary.fail} 项未通过
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up relative overflow-hidden group" style={{ animationDelay: '150ms' }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-accent-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-accent-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="title-display text-lg text-gray-800">🕒 保质期信息</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">生产日期</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatDate(batch.productionDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">保质期至</span>
                  <span className="text-sm font-semibold text-gray-700">{expiryDateStr}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">剩余天数</span>
                    <span className={`text-lg font-bold ${
                      isNearExpiry ? 'text-danger-600' : remainDays <= 7 ? 'text-accent-600' : 'text-primary-600'
                    }`}>
                      {remainDays > 0 ? `${remainDays} 天` : remainDays === 0 ? '今日到期' : `已过期 ${-remainDays} 天`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: '200ms' }}
            onClick={() => navigate(`/consumer/stall/${stall.id}`)}
          >
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="title-display text-lg text-gray-800">📦 在售摊位</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">摊位号</span>
                  <span className="text-sm font-bold text-accent-600">{stall.stallNo}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">摊位名称</p>
                  <p className="text-xl font-bold text-gray-800 group-hover:text-teal-700 transition-colors">
                    {stall.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 text-xs text-teal-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>点击查看摊位详情</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-4xl">
        <div className="card p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="title-display text-2xl text-gray-800">溯源时间轴</h2>
              <p className="text-sm text-gray-500">从产地到餐桌的每一步都透明可查</p>
            </div>
          </div>

          <TraceTimeline records={detail.traceChain} variant="consumer" />
        </div>
      </section>
    </div>
  );
}

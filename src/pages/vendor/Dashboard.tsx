import { useState, useEffect } from 'react';
import { Package, Warehouse, AlertTriangle, CheckCircle2, Calendar, TrendingUp, Clock, Leaf, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { formatDate, daysRemaining, statusText } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import type { DashboardStats, ProductBatch } from '../../../shared/types';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user?.stallId]);

  const fetchData = async () => {
    if (!user?.stallId) return;
    try {
      const res = await api.get<DashboardStats>(`/batches/dashboard/${user.stallId}`);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 星期${weekDays[today.getDay()]}`;

  const statCards = stats ? [
    {
      label: '今日批次',
      value: stats.todayBatches,
      suffix: '批',
      icon: Package,
      gradient: 'from-primary-500 to-emerald-400',
      bg: 'bg-primary-50',
      iconBg: 'bg-primary-100',
    },
    {
      label: '库存总量',
      value: stats.totalStock,
      suffix: '件',
      icon: Warehouse,
      gradient: 'from-accent-500 to-amber-400',
      bg: 'bg-accent-50',
      iconBg: 'bg-accent-100',
    },
    {
      label: '临期预警',
      value: stats.nearExpiryCount,
      suffix: '件',
      icon: AlertTriangle,
      gradient: 'from-danger-500 to-rose-400',
      bg: 'bg-danger-50',
      iconBg: 'bg-danger-100',
      highlight: stats.nearExpiryCount > 0,
    },
    {
      label: '检测通过率',
      value: stats.inspectionPassRate,
      suffix: '%',
      icon: CheckCircle2,
      gradient: 'from-admin-500 to-blue-500',
      bg: 'bg-admin-50',
      iconBg: 'bg-admin-100',
    },
  ] : [];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="title-display text-3xl text-gray-800">
              你好，{user?.name} 👋
            </h1>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{todayStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              <span className="text-sm">今日经营状态良好</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/vendor/batches')}
            className="btn-primary flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>录入新批次</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`card p-6 relative overflow-hidden ${card.highlight ? 'ring-2 ring-danger-400 animate-pulse-soft' : ''}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-60`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`} />
                  </div>
                  {card.highlight && (
                    <span className="badge-danger">
                      <AlertTriangle className="w-3 h-3" />
                      需关注
                    </span>
                  )}
                </div>
                <div className="mb-1">
                  <span className="text-sm text-gray-500">{card.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>
                    {card.value}
                  </span>
                  <span className="text-gray-500 font-medium">{card.suffix}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="title-display text-xl text-gray-800">最近批次</h2>
              <p className="text-sm text-gray-500">最近录入的5个商品批次</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/vendor/batches')}
            className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
          >
            查看全部
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {stats?.recentBatches && stats.recentBatches.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">商品名称</th>
                  <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">批次号</th>
                  <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">剩余库存</th>
                  <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">状态</th>
                  <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">保质期</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBatches.map((batch: ProductBatch) => {
                  const remaining = daysRemaining(batch.productionDate, batch.shelfLifeDays);
                  const statusInfo = statusText[batch.inspectionStatus];
                  const isNear = batch.isNearExpiry || remaining <= 3;
                  return (
                    <tr key={batch.id} className="border-t border-gray-100 hover:bg-primary-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl">
                            {getEmojiForProduct(batch.productName)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{batch.productName}</p>
                            <p className="text-xs text-gray-500">{batch.origin} · {batch.supplier}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                          {batch.batchNo}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-700">{batch.remainingStock}</span>
                        <span className="text-sm text-gray-500 ml-1">{batch.unit}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusInfo ? `badge ${statusInfo.className}` : 'badge'}>
                          {statusInfo?.text || batch.inspectionStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isNear ? (
                          <div className="flex items-center gap-2">
                            <span className={`badge ${remaining <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                              <AlertTriangle className="w-3 h-3" />
                              {remaining <= 0 ? '已过期' : `临期 ${remaining}天`}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Leaf className="w-4 h-4 text-primary-500" />
                            剩余 {remaining} 天
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p>暂无批次记录，点击右上角「录入新批次」开始创建</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getEmojiForProduct(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('番茄') || lower.includes('西红柿')) return '🍅';
  if (lower.includes('黄瓜') || lower.includes('青瓜')) return '🥒';
  if (lower.includes('白菜') || lower.includes('青菜')) return '🥬';
  if (lower.includes('胡萝卜') || lower.includes('萝卜')) return '🥕';
  if (lower.includes('土豆') || lower.includes('马铃薯')) return '🥔';
  if (lower.includes('洋葱')) return '🧅';
  if (lower.includes('蒜')) return '🧄';
  if (lower.includes('辣椒') || lower.includes('青椒')) return '🌶️';
  if (lower.includes('玉米')) return '🌽';
  if (lower.includes('茄子')) return '🍆';
  if (lower.includes('蘑菇') || lower.includes('香菇')) return '🍄';
  if (lower.includes('苹果')) return '🍎';
  if (lower.includes('香蕉')) return '🍌';
  if (lower.includes('橙') || lower.includes('橘子')) return '🍊';
  if (lower.includes('葡萄')) return '🍇';
  if (lower.includes('西瓜')) return '🍉';
  if (lower.includes('猪肉')) return '🥩';
  if (lower.includes('鸡') || lower.includes('鸡肉')) return '🍗';
  if (lower.includes('鱼') || lower.includes('海鲜')) return '🐟';
  if (lower.includes('鸡蛋')) return '🥚';
  if (lower.includes('豆腐') || lower.includes('豆')) return '🫘';
  if (lower.includes('米') || lower.includes('大米')) return '🌾';
  return '🥗';
}

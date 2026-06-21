import { useState, useEffect } from 'react';
import {
  Warehouse, AlertTriangle, Layers, DollarSign,
  Minus, RotateCcw, X, Loader2, CheckCircle2, Clock
} from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate, daysRemaining, formatDateTime } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import type { ProductBatch } from '../../../shared/types';

export default function VendorInventory() {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deductModal, setDeductModal] = useState<{ id: string; productName: string; max: number; unit: string } | null>(null);
  const [deductAmount, setDeductAmount] = useState('');
  const [deductLoading, setDeductLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmZeroId, setConfirmZeroId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.stallId) {
      fetchInventory();
    }
  }, [user?.stallId]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get<ProductBatch[]>(`/inventory?stallId=${user?.stallId}`);
      if (res.success && res.data) {
        setInventory(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedInventory = [...inventory].sort((a, b) => {
    const aNear = a.isNearExpiry || daysRemaining(a.productionDate, a.shelfLifeDays) <= 3 ? 1 : 0;
    const bNear = b.isNearExpiry || daysRemaining(b.productionDate, b.shelfLifeDays) <= 3 ? 1 : 0;
    if (aNear !== bNear) return bNear - aNear;
    return daysRemaining(a.productionDate, a.shelfLifeDays) - daysRemaining(b.productionDate, b.shelfLifeDays);
  });

  const totalSku = inventory.length;
  const nearExpirySku = inventory.filter(i =>
    i.isNearExpiry || daysRemaining(i.productionDate, i.shelfLifeDays) <= 3
  ).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.remainingStock * 1), 0);

  const handleDeduct = async () => {
    if (!deductModal) return;
    const amount = Number(deductAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: '请输入有效的扣减数量' });
      return;
    }
    if (amount > deductModal.max) {
      setMessage({ type: 'error', text: `扣减数量不能超过当前库存 ${deductModal.max} ${deductModal.unit}` });
      return;
    }

    setDeductLoading(true);
    try {
      const res = await api.post(`/inventory/${deductModal.id}/deduct`, { amount });
      if (res.success) {
        setMessage({ type: 'success', text: `成功扣减 ${amount} ${deductModal.unit}` });
        setDeductModal(null);
        setDeductAmount('');
        fetchInventory();
      } else {
        setMessage({ type: 'error', text: res.message || '扣减失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setDeductLoading(false);
    }
  };

  const handleSetZero = async (id: string, productName: string) => {
    try {
      const res = await api.post(`/inventory/${id}/set`, { amount: 0 });
      if (res.success) {
        setMessage({ type: 'success', text: `「${productName}」已清零` });
        setConfirmZeroId(null);
        fetchInventory();
      } else {
        setMessage({ type: 'error', text: res.message || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const statCards = [
    {
      label: '总SKU数',
      value: totalSku,
      suffix: '个',
      icon: Layers,
      gradient: 'from-primary-500 to-emerald-400',
      bg: 'bg-primary-50',
      iconBg: 'bg-primary-100',
    },
    {
      label: '临期SKU',
      value: nearExpirySku,
      suffix: '个',
      icon: AlertTriangle,
      gradient: 'from-danger-500 to-rose-400',
      bg: 'bg-danger-50',
      iconBg: 'bg-danger-100',
      highlight: nearExpirySku > 0,
    },
    {
      label: '库存总值',
      value: totalValue.toFixed(0),
      suffix: '元',
      icon: DollarSign,
      gradient: 'from-accent-500 to-amber-400',
      bg: 'bg-accent-50',
      iconBg: 'bg-accent-100',
    },
  ];

  const getProgressColor = (percent: number, days: number) => {
    if (days <= 0) return 'bg-danger-500';
    if (days <= 3) return 'bg-danger-400';
    if (percent >= 70) return 'bg-primary-500';
    if (percent >= 40) return 'bg-accent-500';
    return 'bg-danger-400';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="title-display text-3xl text-gray-800 mb-2">库存管理</h1>
        <p className="text-gray-500">实时追踪库存状态，临期商品提前预警</p>
      </div>

      {message && (
        <div className={`mb-6 px-5 py-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-primary-50 border border-primary-200 text-primary-700'
            : 'bg-danger-50 border border-danger-200 text-danger-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`card p-6 relative overflow-hidden ${card.highlight ? 'ring-2 ring-danger-400 animate-pulse-soft' : ''}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-60`} />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{card.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>
                      {card.value}
                    </span>
                    <span className="text-gray-500 font-medium">{card.suffix}</span>
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="title-display text-xl text-gray-800">库存列表</h2>
              <p className="text-sm text-gray-500">临期商品已置顶并标红提醒</p>
            </div>
          </div>
          <button
            onClick={fetchInventory}
            className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            刷新
          </button>
        </div>

        {sortedInventory.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {sortedInventory.map(item => {
              const remainingDays = daysRemaining(item.productionDate, item.shelfLifeDays);
              const progressPercent = item.shelfLifeDays > 0
                ? Math.max(0, Math.min(100, (remainingDays / item.shelfLifeDays) * 100))
                : 0;
              const stockPercent = item.quantity > 0
                ? Math.max(0, Math.min(100, (item.remainingStock / item.quantity) * 100))
                : 0;
              const isNear = item.isNearExpiry || remainingDays <= 3;
              const isExpired = remainingDays <= 0;
              const isZero = item.remainingStock <= 0;

              return (
                <div
                  key={item.id}
                  className={`p-5 transition-all duration-300 ${
                    isNear ? 'bg-danger-50/40' : 'hover:bg-primary-50/30'
                  } ${
                    isNear ? 'border-l-4 border-l-danger-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                      isZero ? 'bg-gray-100' : isExpired ? 'bg-danger-100' : isNear ? 'bg-accent-100' : 'bg-primary-50'
                    }`}>
                      {getEmojiForProduct(item.productName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                            <h3 className="font-bold text-gray-800 text-lg">{item.productName}</h3>
                            {isExpired && (
                              <span className="badge-danger">
                                <AlertTriangle className="w-3 h-3" />
                                已过期
                              </span>
                            )}
                            {!isExpired && isNear && (
                              <span className="badge-warning">
                                <AlertTriangle className="w-3 h-3" />
                                临期 {remainingDays}天
                              </span>
                            )}
                            {isZero && (
                              <span className="badge badge-info">
                                已售罄
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                            <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">{item.batchNo}</span>
                            <span>批次 {formatDate(item.productionDate)} 生产</span>
                            <span>保质期 {item.shelfLifeDays} 天</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              if (isZero) {
                                setMessage({ type: 'error', text: '该商品库存已为0' });
                                return;
                              }
                              setDeductModal({
                                id: item.id,
                                productName: item.productName,
                                max: item.remainingStock,
                                unit: item.unit,
                              });
                              setDeductAmount('');
                            }}
                            disabled={isZero}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                              isZero
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-accent-50 text-accent-700 hover:bg-accent-100 hover:-translate-y-0.5 shadow-sm hover:shadow'
                            }`}
                          >
                            <Minus className="w-4 h-4" />
                            扣减
                          </button>
                          <button
                            onClick={() => setConfirmZeroId(item.id)}
                            disabled={isZero}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                              isZero
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-danger-50 text-danger-600 hover:bg-danger-100 hover:-translate-y-0.5 shadow-sm hover:shadow'
                            }`}
                          >
                            <RotateCcw className="w-4 h-4" />
                            清零
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Warehouse className="w-3 h-3" />
                              库存进度
                            </span>
                            <span className="font-semibold">
                              剩余 <span className="text-gray-800">{item.remainingStock}</span> / 总 {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                stockPercent >= 50 ? 'bg-primary-500' :
                                stockPercent >= 20 ? 'bg-accent-500' :
                                'bg-danger-400'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              保质期进度
                            </span>
                            <span className="font-semibold">
                              {isExpired
                                ? <span className="text-danger-600">已过期</span>
                                : isNear
                                  ? <span className="text-danger-600">剩余 {remainingDays} 天</span>
                                  : `剩余 ${remainingDays} / ${item.shelfLifeDays} 天`
                              }
                            </span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${getProgressColor(progressPercent, remainingDays)}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100/60 flex items-center justify-between text-xs text-gray-400">
                        <span>溯源码：{item.traceCode}</span>
                        <span>
                          到期日期：
                          <span className={isExpired ? 'text-danger-500 font-medium' : isNear ? 'text-accent-600 font-medium' : ''}>
                            {formatDate(new Date(new Date(item.productionDate).getTime() + item.shelfLifeDays * 24 * 60 * 60 * 1000).toISOString())}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Warehouse className="w-20 h-20 mx-auto text-gray-300 mb-6" />
            <h3 className="title-display text-2xl text-gray-600 mb-2">暂无库存数据</h3>
            <p className="text-gray-500">请先到「批次录入」页面创建商品批次</p>
          </div>
        )}
      </div>

      {deductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent-100 flex items-center justify-center">
                  <Minus className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <h3 className="title-display text-xl text-gray-800">扣减库存</h3>
                  <p className="text-sm text-gray-500">{deductModal.productName}</p>
                </div>
              </div>
              <button
                onClick={() => { setDeductModal(null); setDeductAmount(''); }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-gray-600">当前库存</span>
                <span className="font-bold text-2xl text-primary-600">
                  {deductModal.max} <span className="text-base font-normal text-gray-500">{deductModal.unit}</span>
                </span>
              </div>

              <div>
                <label className="label-base">扣减数量</label>
                <input
                  type="number"
                  min={0.01}
                  max={deductModal.max}
                  step="0.01"
                  value={deductAmount}
                  onChange={e => setDeductAmount(e.target.value)}
                  placeholder={`请输入扣减数量（最多 ${deductModal.max} ${deductModal.unit}）`}
                  className="input-base text-lg font-semibold"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                {[1, 5, 10, 50].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDeductAmount(String(Math.min(n, deductModal.max)))}
                    disabled={n > deductModal.max}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      n > deductModal.max
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDeductAmount(String(deductModal.max))}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-600 hover:bg-danger-50 hover:text-danger-600 transition-all"
                >
                  全部
                </button>
              </div>

              {deductAmount && Number(deductAmount) > 0 && (
                <div className="bg-primary-50 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-primary-700">扣减后剩余</span>
                  <span className="font-bold text-xl text-primary-700">
                    {Math.max(0, deductModal.max - Number(deductAmount)).toFixed(deductAmount.includes('.') ? 2 : 0)} <span className="text-sm font-normal">{deductModal.unit}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setDeductModal(null); setDeductAmount(''); }}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleDeduct}
                disabled={deductLoading || !deductAmount || Number(deductAmount) <= 0 || Number(deductAmount) > deductModal.max}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deductLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Minus className="w-5 h-5" />
                    确认扣减
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmZeroId && (() => {
        const item = inventory.find(i => i.id === confirmZeroId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-5">
                  <RotateCcw className="w-10 h-10 text-danger-600" />
                </div>
                <h3 className="title-display text-2xl text-gray-800 mb-2">确认清零库存？</h3>
                <p className="text-gray-500 mb-6">
                  确定要将「<span className="font-semibold text-gray-700">{item?.productName}</span>」的库存设置为 0 吗？<br />
                  此操作不可撤销。
                </p>
                {item && (
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <div className="text-sm text-gray-500 mb-1">当前库存</div>
                    <div className="font-bold text-3xl text-danger-600">
                      {item.remainingStock} <span className="text-lg font-normal text-gray-500">{item.unit}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmZeroId(null)}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => item && handleSetZero(item.id, item.productName)}
                    className="flex-1 btn-danger flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    确认清零
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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

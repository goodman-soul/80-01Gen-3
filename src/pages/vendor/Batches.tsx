import { useState, useEffect } from 'react';
import { PackagePlus, History, Package, MapPin, Truck, Scale, Calendar, Clock, ChevronDown, ChevronUp, QrCode, CheckCircle2, AlertTriangle, Copy, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../../utils/api';
import { formatDate, daysRemaining, statusText } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import type { ProductBatch, CreateBatchDto } from '../../../shared/types';

type TabType = 'create' | 'history';

export default function VendorBatches() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    productName: '',
    origin: '',
    supplier: '',
    quantity: '',
    unit: 'kg',
    productionDate: formatDate(new Date().toISOString()),
    shelfLifeDays: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdBatch, setCreatedBatch] = useState<ProductBatch | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.stallId) {
      fetchBatches();
    }
  }, [user?.stallId]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get<ProductBatch[]>(`/batches?stallId=${user?.stallId}`);
      if (res.success && res.data) {
        setBatches(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.stallId) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const payload: CreateBatchDto = {
        stallId: user.stallId,
        productName: form.productName,
        origin: form.origin,
        supplier: form.supplier,
        quantity: Number(form.quantity),
        unit: form.unit,
        productionDate: form.productionDate,
        shelfLifeDays: Number(form.shelfLifeDays),
      };

      const res = await api.post<ProductBatch>('/batches', payload);
      if (res.success && res.data) {
        setCreatedBatch(res.data);
        setMessage({ type: 'success', text: '批次创建成功！请保存下方的溯源二维码' });
        setBatches(prev => [res.data, ...prev]);
        setForm({
          productName: '',
          origin: '',
          supplier: '',
          quantity: '',
          unit: 'kg',
          productionDate: formatDate(new Date().toISOString()),
          shelfLifeDays: '',
        });
      } else {
        setMessage({ type: 'error', text: res.message || '创建失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage({ type: 'success', text: `${label}已复制到剪贴板` });
      setTimeout(() => setMessage(null), 2000);
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="title-display text-3xl text-gray-800 mb-2">批次管理</h1>
        <p className="text-gray-500">录入新批次并查看历史批次信息</p>
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

      <div className="flex gap-2 mb-6 p-1.5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'create'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 hover:bg-white hover:text-primary-600'
          }`}
        >
          <PackagePlus className="w-5 h-5" />
          录入新批次
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 hover:bg-white hover:text-primary-600'
          }`}
        >
          <History className="w-5 h-5" />
          历史批次
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
            {batches.length}
          </span>
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center">
                <PackagePlus className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="title-display text-xl text-gray-800">录入新批次</h2>
                <p className="text-sm text-gray-500">请填写商品来源及保质期信息</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary-500" />
                  商品名称 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={e => setForm(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="例如：山东有机番茄"
                  className="input-base"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    产地 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={e => setForm(prev => ({ ...prev, origin: e.target.value }))}
                    placeholder="例如：山东省寿光市"
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-primary-500" />
                    供应商 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.supplier}
                    onChange={e => setForm(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="例如：绿源蔬菜批发"
                    className="input-base"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="label-base flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-primary-500" />
                    数量 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="请输入数量"
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="label-base">单位</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="input-base"
                  >
                    <option value="kg">kg（公斤）</option>
                    <option value="只">只</option>
                    <option value="斤">斤</option>
                    <option value="个">个</option>
                    <option value="箱">箱</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    生产日期 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.productionDate}
                    onChange={e => setForm(prev => ({ ...prev, productionDate: e.target.value }))}
                    className="input-base"
                    required
                  />
                </div>
                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary-500" />
                    保质期（天）<span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.shelfLifeDays}
                    onChange={e => setForm(prev => ({ ...prev, shelfLifeDays: e.target.value }))}
                    placeholder="例如：7"
                    className="input-base"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <PackagePlus className="w-5 h-5" />
                    <span>创建批次并生成溯源码</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div>
            {createdBatch ? (
              <div className="card p-8 bg-gradient-to-br from-primary-50 to-white border-primary-200">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-sm font-semibold text-primary-600">批次创建成功</span>
                </div>

                <div className="text-center mb-6">
                  <div className="inline-block p-6 bg-white rounded-2xl shadow-lg mb-4">
                    <QRCodeCanvas
                      value={createdBatch.traceCode}
                      size={200}
                      level="M"
                      includeMargin
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <QrCode className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-700">溯源二维码</span>
                  </div>
                  <p className="text-sm text-gray-500">消费者扫码即可查看完整溯源信息</p>
                </div>

                <div className="space-y-4 bg-white/60 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">批次号</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded">
                        {createdBatch.batchNo}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdBatch.batchNo, '批次号')}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">溯源码</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded">
                        {createdBatch.traceCode}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdBatch.traceCode, '溯源码')}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">商品</span>
                    <span className="font-semibold text-gray-800">{createdBatch.productName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">保质期至</span>
                    <span className="font-semibold text-gray-800">
                      {formatDate(new Date(new Date(createdBatch.productionDate).getTime() + createdBatch.shelfLifeDays * 24 * 60 * 60 * 1000).toISOString())}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setCreatedBatch(null)}
                  className="btn-outline w-full mt-6"
                >
                  继续录入下一批
                </button>
              </div>
            ) : (
              <div className="card p-8 h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 bg-gray-50/50">
                <div className="w-24 h-24 rounded-3xl bg-primary-50 flex items-center justify-center mb-6">
                  <QrCode className="w-12 h-12 text-primary-400" />
                </div>
                <h3 className="title-display text-xl text-gray-700 mb-2">溯源二维码生成区</h3>
                <p className="text-gray-500 max-w-xs">
                  填写左侧表单并提交后，这里将自动生成该批次的唯一溯源二维码和追溯码
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-600">一物一码</span>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-accent-50 text-accent-600">公开透明</span>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-admin-50 text-admin-500">全链路追踪</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
          ) : batches.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {batches.map(batch => {
                const remaining = daysRemaining(batch.productionDate, batch.shelfLifeDays);
                const statusInfo = statusText[batch.inspectionStatus];
                const isNear = batch.isNearExpiry || remaining <= 3;
                const isExpanded = expandedId === batch.id;

                return (
                  <div
                    key={batch.id}
                    className={`card overflow-hidden transition-all duration-300 ${
                      isNear ? 'ring-2 ring-danger-300' : ''
                    }`}
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${
                      remaining <= 0 ? 'from-danger-500 to-rose-400' :
                      isNear ? 'from-accent-500 to-amber-400' :
                      'from-primary-500 to-emerald-400'
                    }`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl">
                            {getEmojiForProduct(batch.productName)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">{batch.productName}</h3>
                            <p className="text-xs text-gray-500 font-mono">{batch.batchNo}</p>
                          </div>
                        </div>
                        {statusInfo && (
                          <span className={`badge ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{batch.origin}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{batch.supplier}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Scale className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            剩余 <strong className="text-gray-800">{batch.remainingStock}</strong> / 总 {batch.quantity} {batch.unit}
                          </span>
                        </div>
                      </div>

                      {isNear && (
                        <div className={`mb-4 px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                          remaining <= 0 ? 'bg-danger-50 text-danger-600' : 'bg-accent-50 text-accent-600'
                        }`}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">
                            {remaining <= 0 ? '⚠️ 已过期，请及时处理' : `⏰ 临期警告：剩余 ${remaining} 天`}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-600 text-sm font-medium transition-all duration-300"
                      >
                        {isExpanded ? (
                          <>
                            收起详情
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            展开详情
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fade-in-up">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">生产日期</span>
                            <span className="font-medium text-gray-700">{formatDate(batch.productionDate)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">保质期天数</span>
                            <span className="font-medium text-gray-700">{batch.shelfLifeDays} 天</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">到期日期</span>
                            <span className={`font-medium ${remaining <= 0 ? 'text-danger-600' : isNear ? 'text-accent-600' : 'text-gray-700'}`}>
                              {formatDate(new Date(new Date(batch.productionDate).getTime() + batch.shelfLifeDays * 24 * 60 * 60 * 1000).toISOString())}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">溯源码</span>
                            <span className="font-mono text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                              {batch.traceCode}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                              <div className="text-2xl font-bold text-primary-600">{remaining}</div>
                              <div className="text-xs text-gray-500">剩余天数</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                              <div className="text-2xl font-bold text-accent-600">{batch.quantity}</div>
                              <div className="text-xs text-gray-500">总数量</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                              <div className="text-2xl font-bold text-admin-500">{batch.remainingStock}</div>
                              <div className="text-xs text-gray-500">剩余量</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card py-20 text-center">
              <Package className="w-20 h-20 mx-auto text-gray-300 mb-6" />
              <h3 className="title-display text-2xl text-gray-600 mb-2">暂无历史批次</h3>
              <p className="text-gray-500 mb-6">切换到「录入新批次」开始创建您的第一个批次</p>
              <button
                onClick={() => setActiveTab('create')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <PackagePlus className="w-5 h-5" />
                立即录入
              </button>
            </div>
          )}
        </div>
      )}
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Truck,
  CalendarDays,
  Clock,
  Package,
  Warehouse,
  FileCheck2,
  ClipboardList,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Leaf,
  User,
} from 'lucide-react';
import { api } from '../../utils/api';
import {
  formatDate,
  formatDateTime,
  daysRemaining,
  statusText,
  expiryDate,
} from '../../utils/format';
import TraceTimeline from '../../components/TraceTimeline';
import { useAuthStore } from '../../store/authStore';
import type { BatchTraceDetail, PatrolStatus, CreatePatrolDto } from '../../../shared/types';

const PRODUCT_EMOJI: Record<string, string> = {
  蔬菜: '🥬',
  水果: '🍎',
  肉类: '🥩',
  水产: '🦀',
  干货: '🍄',
};

function getEmoji(category: string, productName: string): string {
  if (PRODUCT_EMOJI[category]) return PRODUCT_EMOJI[category];
  if (productName.includes('猪') || productName.includes('肉')) return '🥩';
  if (productName.includes('鱼') || productName.includes('蟹') || productName.includes('虾')) return '🦐';
  if (productName.includes('果') || productName.includes('苹') || productName.includes('葡')) return '🍎';
  if (productName.includes('菜') || productName.includes('茄') || productName.includes('萝卜')) return '🥬';
  if (productName.includes('菇') || productName.includes('耳') || productName.includes('干货')) return '🍄';
  return '📦';
}

export default function AdminTraceDetail() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<BatchTraceDetail | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [findings, setFindings] = useState('');
  const [actions, setActions] = useState('');
  const [status, setStatus] = useState<PatrolStatus>('normal');

  useEffect(() => {
    if (batchId) {
      fetchDetail(batchId);
    }
  }, [batchId]);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<BatchTraceDetail>(`/batches/${encodeURIComponent(id)}`);
      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        setError(res.message || '加载溯源详情失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPatrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !user) return;
    if (!findings.trim()) {
      setError('请填写检查发现');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const dto: CreatePatrolDto = {
        adminId: user.id,
        adminName: user.name,
        batchId: detail.batch.id,
        stallId: detail.stall.id,
        findings: findings.trim(),
        actions: actions.trim() || undefined,
        status,
      };

      const res = await api.post('/patrol/records', dto);
      if (res.success) {
        setSuccessMsg('巡检记录已保存成功！');
        setFindings('');
        setActions('');
        setStatus('normal');
        fetchDetail(detail.batch.id);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.message || '保存失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-admin-500 animate-spin" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <AlertCircle className="w-16 h-16 text-danger-500 mx-auto mb-4" />
          <h2 className="title-display text-2xl text-gray-800 mb-2">加载失败</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/patrol')}
            className="btn-admin inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回巡检页</span>
          </button>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const { batch, stall, inspections, patrolRecords, traceChain } = detail;
  const remaining = daysRemaining(batch.productionDate, batch.shelfLifeDays);
  const expDate = expiryDate(batch.productionDate, batch.shelfLifeDays);
  const emoji = getEmoji(stall.category, batch.productName);
  const remainingText = remaining > 0 ? `剩余 ${remaining} 天` : remaining === 0 ? '今日到期' : `已过期 ${-remaining} 天`;
  const remainingClass = remaining > 3
    ? 'text-primary-600 bg-primary-100'
    : remaining > 0
    ? 'text-accent-600 bg-accent-100'
    : 'text-danger-600 bg-danger-100';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/admin/patrol')}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-admin-100 text-gray-600 hover:text-admin-500 hover:bg-white transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">返回巡检扫码</span>
      </button>

      <div className="relative overflow-hidden rounded-3xl p-8 mb-8 animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
          boxShadow: '0 20px 60px -15px rgba(30, 64, 175, 0.4)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-300/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl shadow-xl flex-shrink-0">
              {emoji}
            </div>
            <div className="text-white">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="title-display text-3xl md:text-4xl">{batch.productName}</h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  batch.inspectionStatus === 'passed'
                    ? 'bg-green-400/20 text-green-100 border border-green-400/30'
                    : batch.inspectionStatus === 'failed'
                    ? 'bg-red-400/20 text-red-100 border border-red-400/30'
                    : 'bg-amber-400/20 text-amber-100 border border-amber-400/30'
                }`}>
                  {batch.inspectionStatus === 'passed' && <CheckCircle2 className="w-3 h-3" />}
                  {batch.inspectionStatus === 'failed' && <AlertTriangle className="w-3 h-3" />}
                  {batch.inspectionStatus === 'pending' && <Clock className="w-3 h-3" />}
                  {statusText[batch.inspectionStatus].text}
                </span>
                {batch.isNearExpiry && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-danger-400/20 text-danger-100 border border-danger-400/30 animate-pulse-soft">
                    <ShieldAlert className="w-3 h-3" />
                    临期预警
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-lg mb-2">
                <Leaf className="w-4 h-4 inline mr-1" />
                {stall.name} · {stall.stallNo}
              </p>
              <p className="text-blue-200/80 text-sm flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  批次号：{batch.batchNo}
                </span>
                <span className="text-blue-300/50">|</span>
                <span className="inline-flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  溯源码：{batch.traceCode}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <div className={`px-4 py-2 rounded-xl ${remainingClass} font-bold text-sm`}>
              {remainingText}
            </div>
            <p className="text-blue-200/70 text-xs">保质期至 {expDate}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <h2 className="title-display text-xl text-gray-800 mb-5 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-admin-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-admin-500" />
              </div>
              批次基本信息
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>产地来源</span>
                </div>
                <p className="font-semibold text-gray-800">{batch.origin}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Truck className="w-4 h-4" />
                  <span>供应商</span>
                </div>
                <p className="font-semibold text-gray-800">{batch.supplier}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>生产日期</span>
                </div>
                <p className="font-semibold text-gray-800">{formatDate(batch.productionDate)}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span>保质期</span>
                </div>
                <p className="font-semibold text-gray-800">
                  {batch.shelfLifeDays} 天 · 至 {expDate}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${remainingClass}`}>
                    {remainingText}
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Package className="w-4 h-4" />
                  <span>进货量</span>
                </div>
                <p className="font-semibold text-gray-800">{batch.quantity} {batch.unit}</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Warehouse className="w-4 h-4" />
                  <span>剩余库存</span>
                </div>
                <p className="font-semibold text-gray-800">
                  {batch.remainingStock} {batch.unit}
                  <span className={`ml-2 text-xs ${
                    batch.remainingStock === 0
                      ? 'text-gray-400'
                      : batch.remainingStock < batch.quantity * 0.2
                      ? 'text-accent-600'
                      : 'text-primary-600'
                  }`}>
                    ({Math.round((batch.remainingStock / batch.quantity) * 100)}%)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <h2 className="title-display text-xl text-gray-800 mb-5 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-primary-600" />
              </div>
              检测报告
            </h2>

            {inspections.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <FileCheck2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>暂无检测报告</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inspections.map((report, idx) => (
                  <div key={report.id} className="border border-gray-100 rounded-2xl overflow-hidden"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="px-5 py-4 bg-gradient-to-r from-primary-50 to-emerald-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        {report.overall === 'pass' ? (
                          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-primary-600" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-danger-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-danger-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-800">{report.inspector}</p>
                          <p className="text-xs text-gray-500">{formatDate(report.inspectionDate)}</p>
                        </div>
                      </div>
                      <span className={`badge ${report.overall === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                        {report.overall === 'pass' ? '整体合格' : '检测不合格'}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        {report.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              item.result === 'pass' ? 'bg-primary-500 shadow-sm shadow-primary-300' : 'bg-danger-500 shadow-sm shadow-danger-300'
                            }`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                              {item.value && (
                                <p className="text-xs text-gray-500 truncate">{item.value}</p>
                              )}
                            </div>
                            <span className={`text-xs font-medium ${
                              item.result === 'pass' ? 'text-primary-600' : 'text-danger-600'
                            }`}>
                              {item.result === 'pass' ? '合格' : '不合格'}
                            </span>
                          </div>
                        ))}
                      </div>
                      {report.remarks && (
                        <p className="text-sm text-gray-600 bg-admin-50/50 px-4 py-3 rounded-xl border border-admin-100/50">
                          <span className="font-semibold text-admin-500">备注：</span>{report.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <h2 className="title-display text-xl text-gray-800 mb-5 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-admin-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-admin-500" />
              </div>
              巡检记录
            </h2>

            {patrolRecords.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>暂无巡检记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patrolRecords.map((record, idx) => (
                  <div key={record.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-admin-200 hover:bg-admin-50/30 transition-colors"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-admin-500" />
                        <span className="font-semibold text-gray-800">{record.adminName}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(record.patrolTime)}</span>
                      </div>
                      <span className={`badge ${statusText[record.status].className}`}>
                        {statusText[record.status].text}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-600">检查发现：</span>
                        {record.findings}
                      </p>
                      {record.actions && (
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-600">处理措施：</span>
                          {record.actions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <h2 className="title-display text-xl text-gray-800 mb-5 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-white" />
              </div>
              溯源时间轴
            </h2>
            <TraceTimeline records={traceChain} variant="full" />
          </div>

          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <h2 className="title-display text-xl text-gray-800 mb-5 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-admin-500 flex items-center justify-center shadow-lg shadow-admin-500/30">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              新增巡检记录
            </h2>

            {successMsg && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {successMsg}
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitPatrol} className="space-y-4">
              <div>
                <label className="label-base">检查发现 *</label>
                <textarea
                  value={findings}
                  onChange={e => setFindings(e.target.value)}
                  placeholder="请详细描述巡检时发现的情况..."
                  rows={3}
                  className="input-base resize-none focus:border-admin-400 focus:ring-admin-100"
                  required
                />
              </div>

              <div>
                <label className="label-base">处理措施</label>
                <textarea
                  value={actions}
                  onChange={e => setActions(e.target.value)}
                  placeholder="已采取的整改措施或后续跟进计划..."
                  rows={2}
                  className="input-base resize-none focus:border-admin-400 focus:ring-admin-100"
                />
              </div>

              <div>
                <label className="label-base">巡检状态 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'warning', 'rectified'] as PatrolStatus[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                        status === s
                          ? s === 'normal'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : s === 'warning'
                            ? 'border-danger-500 bg-danger-50 text-danger-700'
                            : 'border-admin-500 bg-admin-50 text-admin-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {statusText[s].text}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-admin-500 to-admin-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 4px 20px -2px rgba(30, 64, 175, 0.25)' }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>提交巡检记录</span>
                  </>
                )}
              </button>

              {user && (
                <p className="text-xs text-gray-400 text-center">
                  将以「{user.name}」身份提交记录
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

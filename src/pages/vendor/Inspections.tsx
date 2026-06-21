import { useState, useEffect } from 'react';
import { ClipboardCheck, FileText, UserCheck, CalendarDays, CheckCircle2, XCircle, AlertTriangle, Plus, Loader2, Package } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDateTime, formatDate } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import type { InspectionReport, ProductBatch, CreateInspectionDto, InspectionItem } from '../../../shared/types';

const DEFAULT_ITEMS: InspectionItem[] = [
  { name: '农药残留检测', result: 'pass', value: '0.02mg/kg (合格)' },
  { name: '重金属检测', result: 'pass', value: '未检出' },
  { name: '微生物检测', result: 'pass', value: '符合标准' },
  { name: '感官品质检查', result: 'pass', value: '外观新鲜、色泽正常' },
];

export default function VendorInspections() {
  const { user } = useAuthStore();
  const [inspections, setInspections] = useState<InspectionReport[]>([]);
  const [pendingBatches, setPendingBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    batchId: '',
    inspector: '',
    items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)) as InspectionItem[],
    overall: 'pass' as 'pass' | 'fail',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.stallId) {
      fetchData();
    }
  }, [user?.stallId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspectionsRes, batchesRes] = await Promise.all([
        api.get<InspectionReport[]>(`/inspections?stallId=${user?.stallId}`),
        api.get<ProductBatch[]>(`/batches?stallId=${user?.stallId}`),
      ]);

      if (inspectionsRes.success && inspectionsRes.data) {
        setInspections(inspectionsRes.data);
      }
      if (batchesRes.success && batchesRes.data) {
        setPendingBatches(batchesRes.data.filter(b => b.inspectionStatus === 'pending'));
        if (batchesRes.data.length > 0 && !form.batchId) {
          const pending = batchesRes.data.find(b => b.inspectionStatus === 'pending');
          if (pending) setForm(prev => ({ ...prev, batchId: pending.id }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: keyof InspectionItem, value: string) => {
    setForm(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };
      if (field === 'result') {
        item.result = value as 'pass' | 'fail';
      } else {
        (item as unknown as Record<string, string>)[field] = value;
      }
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId) {
      setMessage({ type: 'error', text: '请选择要检测的批次' });
      return;
    }
    if (!form.inspector.trim()) {
      setMessage({ type: 'error', text: '请填写检测人员姓名' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const payload: CreateInspectionDto = {
        batchId: form.batchId,
        inspector: form.inspector.trim(),
        items: form.items,
        overall: form.overall,
        remarks: form.remarks.trim() || undefined,
      };

      const res = await api.post<InspectionReport>('/inspections', payload);
      if (res.success && res.data) {
        setMessage({ type: 'success', text: '检测报告上传成功！' });
        setInspections(prev => [res.data, ...prev]);
        setForm({
          batchId: '',
          inspector: '',
          items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
          overall: 'pass',
          remarks: '',
        });
        fetchData();
      } else {
        setMessage({ type: 'error', text: res.message || '提交失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const allBatchesMap = new Map<string, ProductBatch>();
  pendingBatches.forEach(b => allBatchesMap.set(b.id, b));
  inspections.forEach(ins => {
    const batchFromPending = pendingBatches.find(b => b.id === ins.batchId);
    if (batchFromPending) allBatchesMap.set(ins.batchId, batchFromPending);
  });

  const getBatchInfo = (batchId: string) => allBatchesMap.get(batchId);

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
        <h1 className="title-display text-3xl text-gray-800 mb-2">检测报告</h1>
        <p className="text-gray-500">上传批次检测报告，确保食品安全透明可查</p>
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

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-7 sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-admin-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-admin-500" />
              </div>
              <div>
                <h2 className="title-display text-xl text-gray-800">上传检测报告</h2>
                <p className="text-sm text-gray-500">为待检测批次填写检测结果</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-base flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-admin-500" />
                  选择批次 <span className="text-danger-500">*</span>
                </label>
                <select
                  value={form.batchId}
                  onChange={e => setForm(prev => ({ ...prev, batchId: e.target.value }))}
                  className="input-base"
                  required
                >
                  <option value="">-- 请选择待检测批次 --</option>
                  {pendingBatches.length > 0 ? pendingBatches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.productName} - {batch.batchNo}
                    </option>
                  )) : (
                    <option value="" disabled>暂无可检测批次</option>
                  )}
                </select>
                {pendingBatches.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-primary-500" />
                    所有批次均已完成检测
                  </p>
                )}
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-admin-500" />
                  检测人员 <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.inspector}
                  onChange={e => setForm(prev => ({ ...prev, inspector: e.target.value }))}
                  placeholder="请输入检测人员姓名"
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5 mb-3">
                  <ClipboardCheck className="w-4 h-4 text-admin-500" />
                  检测项目明细
                </label>
                <div className="space-y-3 bg-gray-50/60 rounded-xl p-4">
                  {form.items.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3.5 border border-gray-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleItemChange(index, 'name', e.target.value)}
                          className="font-semibold text-sm text-gray-800 bg-transparent focus:outline-none focus:bg-primary-50/50 rounded px-2 py-1 w-40"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleItemChange(index, 'result', 'pass')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              item.result === 'pass'
                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                                : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-600'
                            }`}
                          >
                            ✓ 合格
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemChange(index, 'result', 'fail')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              item.result === 'fail'
                                ? 'bg-danger-500 text-white shadow-md shadow-danger-500/30'
                                : 'bg-gray-100 text-gray-500 hover:bg-danger-50 hover:text-danger-600'
                            }`}
                          >
                            ✗ 不合格
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.value || ''}
                        onChange={e => handleItemChange(index, 'value', e.target.value)}
                        placeholder="检测值/备注（可选）"
                        className="w-full text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-100 border border-transparent focus:border-primary-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-base flex items-center gap-1.5 mb-3">
                  <FileText className="w-4 h-4 text-admin-500" />
                  总体结论 <span className="text-danger-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, overall: 'pass' }))}
                    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      form.overall === 'pass'
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-lg shadow-primary-500/20'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:bg-primary-50/50'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">检测合格</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, overall: 'fail' }))}
                    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                      form.overall === 'fail'
                        ? 'border-danger-500 bg-danger-50 text-danger-700 shadow-lg shadow-danger-500/20'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-danger-200 hover:bg-danger-50/50'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold">检测不合格</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="label-base">备注</label>
                <textarea
                  value={form.remarks}
                  onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="其他需要说明的情况..."
                  rows={3}
                  className="input-base resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || pendingBatches.length === 0}
                className="btn-admin w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="w-5 h-5" />
                    <span>提交检测报告</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="title-display text-xl text-gray-800">已上传报告</h2>
                <p className="text-sm text-gray-500">共 {inspections.length} 份检测报告</p>
              </div>
            </div>
          </div>

          {inspections.length > 0 ? (
            <div className="space-y-5">
              {inspections.map(inspection => {
                const batch = getBatchInfo(inspection.batchId);
                return (
                  <div
                    key={inspection.id}
                    className={`card overflow-hidden ${
                      inspection.overall === 'fail' ? 'ring-2 ring-danger-200' : ''
                    }`}
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${
                      inspection.overall === 'pass'
                        ? 'from-primary-500 to-emerald-400'
                        : 'from-danger-500 to-rose-400'
                    }`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                            inspection.overall === 'pass'
                              ? 'bg-primary-100'
                              : 'bg-danger-100'
                          }`}>
                            {inspection.overall === 'pass' ? (
                              <CheckCircle2 className="w-7 h-7 text-primary-600" />
                            ) : (
                              <XCircle className="w-7 h-7 text-danger-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-800 text-lg">
                                {batch?.productName || '未知商品'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                inspection.overall === 'pass'
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'bg-danger-100 text-danger-700'
                              }`}>
                                {inspection.overall === 'pass' ? '✓ 合格' : '✗ 不合格'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">
                                {batch?.batchNo || inspection.batchId}
                              </span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5" />
                                {inspection.inspector}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {formatDate(inspection.inspectionDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-5">
                        {inspection.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border ${
                              item.result === 'pass'
                                ? 'bg-primary-50/50 border-primary-100'
                                : 'bg-danger-50/50 border-danger-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-sm text-gray-700">{item.name}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                item.result === 'pass'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-danger-500 text-white'
                              }`}>
                                {item.result === 'pass' ? '合格' : '不合格'}
                              </span>
                            </div>
                            {item.value && (
                              <p className="text-xs text-gray-500">{item.value}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {inspection.remarks && (
                        <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">检测备注</p>
                            <p className="text-sm text-gray-700">{inspection.remarks}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                        <span>报告编号：{inspection.id}</span>
                        <span>上传时间：{formatDateTime(inspection.inspectionDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card py-20 text-center">
              <ClipboardCheck className="w-20 h-20 mx-auto text-gray-300 mb-6" />
              <h3 className="title-display text-2xl text-gray-600 mb-2">暂无检测报告</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                完成批次录入后，请在左侧表单填写检测结果并上传报告，
                消费者扫码即可看到完整的检测信息。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

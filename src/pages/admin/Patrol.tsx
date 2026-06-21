import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Search,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Zap,
  History,
  Loader2,
  Package,
} from 'lucide-react';
import { api } from '../../utils/api';
import { formatDateTime, statusText } from '../../utils/format';
import type { PatrolRecord, ProductBatch } from '../../../shared/types';

interface PatrolStats {
  todayCount: number;
  totalCount: number;
  warningCount: number;
}

const QUICK_BATCHES = [
  { code: 'SC20260620001', name: '有机西红柿' },
  { code: 'MT20260620001', name: '土猪后腿肉' },
  { code: 'FR20260620001', name: '阳光玫瑰葡萄' },
  { code: 'AQ20260620002', name: '鲜活大闸蟹' },
  { code: 'SC20260618005', name: '紫皮茄子' },
  { code: 'GH20260615001', name: '东北黑木耳' },
];

export default function AdminPatrol() {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState<PatrolStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<PatrolRecord[]>([]);
  const [batchMap, setBatchMap] = useState<Record<string, ProductBatch>>({});
  const [stallNameMap, setStallNameMap] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, recordsRes, batchesRes] = await Promise.all([
        api.get<PatrolStats>('/patrol/stats'),
        api.get<PatrolRecord[]>('/patrol/records'),
        api.get<ProductBatch[]>('/batches'),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (recordsRes.success && recordsRes.data) {
        setRecentRecords(recordsRes.data.slice(0, 8));
      }

      if (batchesRes.success && batchesRes.data) {
        const map: Record<string, ProductBatch> = {};
        batchesRes.data.forEach(b => {
          map[b.id] = b;
          map[b.batchNo] = b;
          map[b.traceCode] = b;
        });
        setBatchMap(map);
      }
    } catch {
      console.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (code?: string) => {
    const queryCode = code || searchCode;
    if (!queryCode.trim()) {
      setError('请输入批次号或溯源码');
      return;
    }

    setError('');
    setSearching(true);

    try {
      const res = await api.get(`/batches/${encodeURIComponent(queryCode.trim())}`);
      if (res.success && res.data) {
        navigate(`/admin/trace/${(res.data as any).batch.id}`);
      } else {
        setError(res.message || '未找到该批次');
      }
    } catch {
      setError('查询失败，请稍后重试');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getBatchInfo = (batchId: string) => {
    return batchMap[batchId];
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="title-display text-3xl text-gray-800 mb-2">巡检扫码</h1>
        <p className="text-gray-500">扫描商品溯源码或输入批次号，查看完整溯源信息并记录巡检情况</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-admin-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6 animate-fade-in-up relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-admin-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-admin-400 to-admin-600 flex items-center justify-center shadow-lg shadow-admin-500/30">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="badge-info">今日</span>
                </div>
                <p className="text-gray-500 text-sm mb-1">今日巡检数</p>
                <p className="title-display text-4xl text-admin-600">{stats?.todayCount ?? 0}</p>
              </div>
            </div>

            <div className="card p-6 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '80ms' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <span className="badge-success">累计</span>
                </div>
                <p className="text-gray-500 text-sm mb-1">巡检总数</p>
                <p className="title-display text-4xl text-primary-600">{stats?.totalCount ?? 0}</p>
              </div>
            </div>

            <div className="card p-6 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '160ms' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-danger-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-danger-400 to-danger-600 flex items-center justify-center shadow-lg shadow-danger-500/30">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <span className="badge-danger">关注</span>
                </div>
                <p className="text-gray-500 text-sm mb-1">待整改预警</p>
                <p className="title-display text-4xl text-danger-600">{stats?.warningCount ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-admin-500 to-blue-600 shadow-2xl shadow-admin-500/30 mb-6 animate-pulse-soft">
                <ScanLine className="w-12 h-12 text-white" />
              </div>
              <h2 className="title-display text-2xl text-gray-800 mb-2">扫码查询商品溯源</h2>
              <p className="text-gray-500">请扫描摊位张贴的溯源二维码，或手动输入批次号/溯源码</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchCode}
                    onChange={e => setSearchCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入批次号或溯源码，如：SC20260620001"
                    className="input-base pl-12 pr-4 text-base focus:border-admin-400 focus:ring-admin-100"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={searching}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-admin-500 to-admin-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                  style={{ boxShadow: '0 4px 20px -2px rgba(30, 64, 175, 0.25)' }}
                >
                  {searching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span>查询</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-accent-500" />
                <span className="text-sm font-semibold text-gray-700">快捷查询（点击一键演示）</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {QUICK_BATCHES.map((batch, idx) => (
                  <button
                    key={batch.code}
                    onClick={() => {
                      setSearchCode(batch.code);
                      handleSearch(batch.code);
                    }}
                    disabled={searching}
                    className="group p-4 rounded-xl bg-gradient-to-br from-admin-50 to-blue-50 border border-admin-100 hover:border-admin-300 hover:from-admin-100 hover:to-blue-100 transition-all duration-300 text-left disabled:opacity-50"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <p className="text-xs font-medium text-admin-500 mb-1 truncate">{batch.code}</p>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-admin-600 transition-colors truncate">
                      {batch.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden animate-fade-in-up" style={{ animationDelay: '320ms' }}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-admin-100 flex items-center justify-center">
                  <History className="w-5 h-5 text-admin-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">最近巡检记录</h3>
                  <p className="text-sm text-gray-500">查看已完成的巡检情况</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {recentRecords.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>暂无巡检记录</p>
                </div>
              ) : (
                recentRecords.map((record, idx) => {
                  const batch = getBatchInfo(record.batchId);
                  return (
                    <div
                      key={record.id}
                      className="p-5 flex items-center justify-between gap-4 hover:bg-admin-50/30 transition-colors"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          record.status === 'normal'
                            ? 'bg-primary-100'
                            : record.status === 'warning'
                            ? 'bg-danger-100'
                            : 'bg-admin-100'
                        }`}>
                          {record.status === 'normal' ? (
                            <CheckCircle2 className="w-5 h-5 text-primary-600" />
                          ) : record.status === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-danger-600" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-admin-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-gray-800 truncate">
                              {batch?.productName || '未知商品'}
                            </p>
                            <span className={`badge ${statusText[record.status].className}`}>
                              {statusText[record.status].text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                            <span>{formatDateTime(record.patrolTime)}</span>
                            <span>·</span>
                            <span className="truncate">
                              {stallNameMap[record.stallId] || batchMap[record.batchId]
                                ? (() => {
                                    const b = batchMap[record.batchId];
                                    if (b) {
                                      stallNameMap[record.stallId] = '摊位';
                                      return `摊位`;
                                    }
                                    return '未知摊位';
                                  })()
                                : '未知摊位'}
                            </span>
                            {record.adminName && (
                              <>
                                <span>·</span>
                                <span>巡检员：{record.adminName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/admin/trace/${record.batchId}`)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-admin-600 hover:bg-admin-100 font-medium text-sm transition-colors flex-shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        <span>查看详情</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

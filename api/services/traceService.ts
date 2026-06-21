import type { TraceRecord, ProductBatch, Stall, InspectionReport, PatrolRecord } from '../../shared/types';

const catEmojiMap: Record<string, string> = {
  '蔬菜': '🥬',
  '水果': '🍎',
  '肉类': '🥩',
  '水产': '🦀',
  '干货': '🍄',
};

export function getEmojiByCategory(category: string): string {
  return catEmojiMap[category] || '🛒';
}

export function generateBatchNo(category: string): string {
  const prefixMap: Record<string, string> = {
    '蔬菜': 'SC',
    '水果': 'FR',
    '肉类': 'MT',
    '水产': 'AQ',
    '干货': 'GH',
  };
  const prefix = prefixMap[category] || 'OTHER';
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}${dateStr}${rand}`;
}

export function generateTraceCode(category: string): string {
  const prefixMap: Record<string, string> = {
    '蔬菜': 'SC',
    '水果': 'FR',
    '肉类': 'MT',
    '水产': 'AQ',
    '干货': 'GH',
  };
  const prefix = prefixMap[category] || 'OT';
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `TRACE-${prefix}-${dateStr}-${rand}`;
}

export function isNearExpiry(batch: ProductBatch): boolean {
  const prod = new Date(batch.productionDate);
  const expiry = new Date(prod);
  expiry.setDate(expiry.getDate() + batch.shelfLifeDays);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 2;
}

export function daysRemaining(batch: ProductBatch): number {
  const prod = new Date(batch.productionDate);
  const expiry = new Date(prod);
  expiry.setDate(expiry.getDate() + batch.shelfLifeDays);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildTraceChain(
  batch: ProductBatch,
  stall: Stall,
  inspections: InspectionReport[],
  patrolRecords: PatrolRecord[]
): TraceRecord[] {
  const chain: TraceRecord[] = [];

  chain.push({
    timestamp: batch.productionDate + 'T08:00:00',
    action: '产地采收',
    operator: batch.supplier,
    description: `在【${batch.origin}】完成采收，共 ${batch.quantity}${batch.unit}`,
    icon: '🌱',
  });

  chain.push({
    timestamp: batch.purchaseDate + 'T05:30:00',
    action: '运输入场',
    operator: `${stall.name} · ${stall.vendorName}`,
    description: `运抵市场，摊位号 ${stall.stallNo}，完成进货入库登记`,
    icon: '🚚',
  });

  inspections.forEach((ins) => {
    chain.push({
      timestamp: ins.inspectionDate + 'T09:00:00',
      action: '安全检测',
      operator: ins.inspector,
      description: ins.overall === 'pass'
        ? `检测合格，共 ${ins.items.length} 项指标均通过 · ${ins.remarks || ''}`
        : `⚠️ 检测存在不合格项，需立即下架处理`,
      icon: ins.overall === 'pass' ? '✅' : '❌',
    });
  });

  patrolRecords.forEach((pat) => {
    chain.push({
      timestamp: pat.patrolTime,
      action: '市场巡检',
      operator: pat.adminName,
      description: pat.status === 'normal'
        ? `巡检结果：${pat.findings}`
        : `⚠️ 巡检预警：${pat.findings}${pat.actions ? '；处理措施：' + pat.actions : ''}`,
      icon: pat.status === 'normal' ? '👮' : '⚠️',
    });
  });

  chain.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  chain.push({
    timestamp: new Date().toISOString(),
    action: '在售中',
    operator: stall.name,
    description: `当前剩余库存 ${batch.remainingStock}${batch.unit}，${isNearExpiry(batch) ? '⚠️ 临近保质期' : '品质新鲜，放心选购'}`,
    icon: '🏪',
  });

  return chain;
}

export function maskVendorName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function genId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

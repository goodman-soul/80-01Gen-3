export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function daysFromNow(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function expiryDate(productionDate: string, shelfDays: number): string {
  const d = new Date(productionDate);
  d.setDate(d.getDate() + shelfDays);
  return formatDate(d.toISOString());
}

export function daysRemaining(productionDate: string, shelfDays: number): number {
  const d = new Date(productionDate);
  d.setDate(d.getDate() + shelfDays);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const statusText: Record<string, { text: string; className: string }> = {
  pending: { text: '待检测', className: 'badge-warning' },
  passed: { text: '检测合格', className: 'badge-success' },
  failed: { text: '检测不合格', className: 'badge-danger' },
  normal: { text: '巡检正常', className: 'badge-success' },
  warning: { text: '需要整改', className: 'badge-warning' },
  rectified: { text: '已整改', className: 'badge-info' },
};

export const ratingText: Record<string, { text: string; className: string }> = {
  A: { text: '信用优秀 A', className: 'bg-gradient-to-r from-primary-500 to-emerald-400 text-white' },
  B: { text: '信用良好 B', className: 'bg-gradient-to-r from-accent-500 to-amber-400 text-white' },
  C: { text: '信用一般 C', className: 'bg-gradient-to-r from-gray-500 to-gray-400 text-white' },
};

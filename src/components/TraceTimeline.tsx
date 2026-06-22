import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { TraceRecord, PublicTraceRecord } from '../../shared/types';
import { formatDateTime } from '../utils/format';

interface Props {
  records: TraceRecord[] | PublicTraceRecord[];
  variant?: 'full' | 'consumer';
}

export default function TraceTimeline({ records, variant = 'full' }: Props) {
  return (
    <div className="relative">
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary-400 via-accent-300 to-primary-200 rounded-full" />

      <div className="space-y-6">
        {records.map((record, idx) => {
          const isWarning = record.description.includes('⚠️') || record.description.includes('不合格');
          const opacityClass = variant === 'consumer' && idx < records.length - 3
            ? 'opacity-80'
            : 'opacity-100';

          return (
            <div
              key={idx}
              className={`relative flex gap-5 pl-2 animate-fade-in-up ${opacityClass}`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div
                className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg ${
                  isWarning
                    ? 'bg-gradient-to-br from-danger-400 to-danger-500 shadow-danger-500/30'
                    : 'bg-gradient-to-br from-primary-400 to-primary-500 shadow-primary-500/30'
                }`}
              >
                {record.icon || (isWarning ? <AlertTriangle className="w-6 h-6 text-white" /> : <CheckCircle2 className="w-6 h-6 text-white" />)}
              </div>

              <div className={`flex-1 pb-2 ${variant === 'consumer' ? 'card p-5' : ''}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-bold text-lg ${
                        isWarning ? 'text-danger-600' : 'text-gray-800'
                      }`}>
                        {record.action}
                      </h4>
                      {variant === 'full' && (
                        <span className={`badge ${
                          isWarning ? 'badge-danger' : 'badge-success'
                        }`}>
                          {isWarning ? '需关注' : '正常'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {record.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500">
                      {formatDateTime(record.timestamp)}
                    </p>
                    {variant === 'full' && 'operator' in record && (
                      <p className="text-xs text-primary-600 font-medium mt-1">
                        {record.operator}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

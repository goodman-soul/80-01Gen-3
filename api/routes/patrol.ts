import { Router } from 'express';
import { patrolRecords } from '../data/store.js';
import { genId } from '../services/traceService.js';
import type { ApiResponse, PatrolRecord, CreatePatrolDto } from '../../shared/types';

const router = Router();

router.get('/records', (req, res) => {
  const { batchId, stallId, status } = req.query;
  let result = [...patrolRecords];

  if (batchId) {
    result = result.filter(p => p.batchId === String(batchId));
  }

  if (stallId) {
    result = result.filter(p => p.stallId === String(stallId));
  }

  if (status) {
    result = result.filter(p => p.status === status);
  }

  result.sort((a, b) => new Date(b.patrolTime).getTime() - new Date(a.patrolTime).getTime());

  const response: ApiResponse<PatrolRecord[]> = {
    success: true,
    message: '获取巡检记录成功',
    data: result,
  };
  res.json(response);
});

router.post('/records', (req, res) => {
  const body = req.body as CreatePatrolDto;

  const newRecord: PatrolRecord = {
    id: genId('p'),
    adminId: body.adminId,
    adminName: body.adminName,
    batchId: body.batchId,
    stallId: body.stallId,
    patrolTime: new Date().toISOString(),
    findings: body.findings,
    actions: body.actions,
    status: body.status,
  };

  patrolRecords.unshift(newRecord);

  const response: ApiResponse<PatrolRecord> = {
    success: true,
    message: '巡检记录已保存',
    data: newRecord,
  };
  res.status(201).json(response);
});

router.get('/stats', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = patrolRecords.filter(p => p.patrolTime.startsWith(today));
  const warningCount = patrolRecords.filter(p => p.status === 'warning').length;

  const response: ApiResponse<{
    todayCount: number;
    totalCount: number;
    warningCount: number;
  }> = {
    success: true,
    message: '获取巡检统计成功',
    data: {
      todayCount: todayRecords.length,
      totalCount: patrolRecords.length,
      warningCount,
    },
  };
  res.json(response);
});

export default router;

import { Router } from 'express';
import {
  getPatrolRecords,
  addPatrolRecord,
  getProductBatches,
} from '../data/persistentStore.js';
import { genId } from '../services/traceService.js';
import { adminAuth } from '../middleware/auth.js';
import type { ApiResponse, PatrolRecord } from '../../shared/types';

const router = Router();

router.get('/records', adminAuth, (req, res) => {
  const { batchId, stallId, status } = req.query;
  let result = [...getPatrolRecords()];

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

router.post('/records', adminAuth, (req, res) => {
  const body = req.body as {
    batchId: string;
    stallId: string;
    findings: string;
    actions?: string;
    status: 'normal' | 'warning' | 'rectified';
  };

  if (!body.batchId || !body.stallId || !body.findings || !body.status) {
    return res.status(400).json({
      success: false,
      message: '批次ID、摊位ID、巡检内容和状态为必填项',
    });
  }

  const batch = getProductBatches().find(b => b.id === body.batchId);
  if (!batch) {
    return res.status(400).json({ success: false, message: '关联批次不存在' });
  }

  const adminId = req.auth.userId;
  const adminName = req.auth.name;

  const newRecord: PatrolRecord = {
    id: genId('p'),
    adminId,
    adminName,
    batchId: body.batchId,
    stallId: body.stallId,
    patrolTime: new Date().toISOString(),
    findings: body.findings,
    actions: body.actions,
    status: body.status,
  };

  addPatrolRecord(newRecord);

  const response: ApiResponse<PatrolRecord> = {
    success: true,
    message: '巡检记录已保存',
    data: newRecord,
  };
  res.status(201).json(response);
});

router.get('/stats', adminAuth, (_req, res) => {
  const patrolRecords = getPatrolRecords();
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

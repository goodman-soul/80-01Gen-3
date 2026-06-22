import { Router } from 'express';
import {
  getInspectionReports,
  getProductBatches,
  addInspectionReport,
  updateBatchInspectionStatus,
} from '../data/persistentStore.js';
import { genId } from '../services/traceService.js';
import { vendorAuth, anyAuth } from '../middleware/auth.js';
import type { ApiResponse, InspectionReport, CreateInspectionDto } from '../../shared/types';

const router = Router();

router.get('/', anyAuth, (req, res) => {
  const { batchId, stallId } = req.query;
  let result = [...getInspectionReports()];

  if (req.auth?.role === 'vendor') {
    const stallBatches = getProductBatches()
      .filter(b => b.stallId === req.auth!.stallId)
      .map(b => b.id);
    result = result.filter(i => stallBatches.includes(i.batchId));
  } else {
    if (batchId) {
      result = result.filter(i => i.batchId === String(batchId));
    }
    if (stallId) {
      const stallBatches = getProductBatches()
        .filter(b => b.stallId === String(stallId))
        .map(b => b.id);
      result = result.filter(i => stallBatches.includes(i.batchId));
    }
  }

  result.sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());

  const response: ApiResponse<InspectionReport[]> = {
    success: true,
    message: '获取检测报告成功',
    data: result,
  };
  res.json(response);
});

router.post('/', vendorAuth, (req, res) => {
  const body = req.body as CreateInspectionDto;

  if (!body.batchId || !body.overall || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: '批次ID、检测结论和检测项不能为空',
    });
  }

  const batch = getProductBatches().find(b => b.id === body.batchId);

  if (!batch) {
    return res.status(400).json({ success: false, message: '关联批次不存在' });
  }

  if (req.auth?.role === 'vendor' && req.auth.stallId !== batch.stallId) {
    return res.status(403).json({ success: false, message: '无权为其他摊位提交检测报告' });
  }

  const inspector = req.auth?.role === 'admin'
    ? `管理员-${req.auth.name}`
    : (body.inspector?.trim() || '市场快检室');

  const newReport: InspectionReport = {
    id: genId('i'),
    batchId: body.batchId,
    inspector,
    inspectionDate: new Date().toISOString().split('T')[0],
    items: body.items.map(it => ({
      name: it.name?.trim() || '检测项',
      result: it.result === 'fail' ? 'fail' : 'pass',
      value: it.value,
    })),
    overall: body.overall === 'fail' ? 'fail' : 'pass',
    remarks: body.remarks?.trim(),
  };

  addInspectionReport(newReport);
  updateBatchInspectionStatus(body.batchId, body.overall === 'pass' ? 'passed' : 'failed');

  const response: ApiResponse<InspectionReport> = {
    success: true,
    message: '检测报告上传成功',
    data: newReport,
  };
  res.status(201).json(response);
});

export default router;

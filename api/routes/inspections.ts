import { Router } from 'express';
import { inspectionReports, productBatches } from '../data/store.js';
import { genId } from '../services/traceService.js';
import type { ApiResponse, InspectionReport, CreateInspectionDto } from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const { batchId, stallId } = req.query;
  let result = [...inspectionReports];

  if (batchId) {
    result = result.filter(i => i.batchId === String(batchId));
  }

  if (stallId) {
    const stallBatches = productBatches.filter(b => b.stallId === String(stallId)).map(b => b.id);
    result = result.filter(i => stallBatches.includes(i.batchId));
  }

  result.sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());

  const response: ApiResponse<InspectionReport[]> = {
    success: true,
    message: '获取检测报告成功',
    data: result,
  };
  res.json(response);
});

router.post('/', (req, res) => {
  const body = req.body as CreateInspectionDto;
  const batch = productBatches.find(b => b.id === body.batchId);

  if (!batch) {
    const response: ApiResponse<null> = {
      success: false,
      message: '关联批次不存在',
    };
    return res.status(400).json(response);
  }

  const newReport: InspectionReport = {
    id: genId('i'),
    batchId: body.batchId,
    inspector: body.inspector,
    inspectionDate: new Date().toISOString().split('T')[0],
    items: body.items,
    overall: body.overall,
    remarks: body.remarks,
  };

  inspectionReports.unshift(newReport);
  batch.inspectionStatus = body.overall === 'pass' ? 'passed' : 'failed';

  const response: ApiResponse<InspectionReport> = {
    success: true,
    message: '检测报告上传成功',
    data: newReport,
  };
  res.status(201).json(response);
});

export default router;

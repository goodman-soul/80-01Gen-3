import { Router } from 'express';
import { productBatches, stalls, inspectionReports, patrolRecords } from '../data/store.js';
import {
  generateBatchNo,
  generateTraceCode,
  isNearExpiry,
  buildTraceChain,
  genId,
} from '../services/traceService.js';
import type {
  ApiResponse,
  ProductBatch,
  CreateBatchDto,
  BatchTraceDetail,
  DashboardStats,
} from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const { stallId } = req.query;
  let result = [...productBatches];

  if (stallId) {
    result = result.filter(b => b.stallId === String(stallId));
  }

  result = result.map(b => ({ ...b, isNearExpiry: isNearExpiry(b) }));
  result.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  const response: ApiResponse<ProductBatch[]> = {
    success: true,
    message: '获取批次列表成功',
    data: result,
  };
  res.json(response);
});

router.get('/dashboard/:stallId', (req, res) => {
  const { stallId } = req.params;
  const stallBatches = productBatches.filter(b => b.stallId === stallId);

  const today = new Date().toISOString().split('T')[0];
  const todayBatches = stallBatches.filter(b => b.purchaseDate === today).length;
  const totalStock = stallBatches.reduce((sum, b) => sum + b.remainingStock, 0);
  const nearExpiryCount = stallBatches.filter(b => isNearExpiry(b)).length;

  const inspectedCount = stallBatches.filter(b => b.inspectionStatus !== 'pending').length;
  const passedCount = stallBatches.filter(b => b.inspectionStatus === 'passed').length;
  const inspectionPassRate = inspectedCount === 0 ? 0 : Math.round((passedCount / inspectedCount) * 100);

  const recentBatches = [...stallBatches]
    .map(b => ({ ...b, isNearExpiry: isNearExpiry(b) }))
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 5);

  const stats: DashboardStats = {
    todayBatches,
    totalStock,
    nearExpiryCount,
    inspectionPassRate,
    recentBatches,
  };

  const response: ApiResponse<DashboardStats> = {
    success: true,
    message: '获取工作台统计成功',
    data: stats,
  };
  res.json(response);
});

router.post('/', (req, res) => {
  const body = req.body as CreateBatchDto;
  const stall = stalls.find(s => s.id === body.stallId);

  if (!stall) {
    const response: ApiResponse<null> = {
      success: false,
      message: '关联摊位不存在',
    };
    return res.status(400).json(response);
  }

  const today = new Date().toISOString().split('T')[0];
  const newBatch: ProductBatch = {
    id: genId('b'),
    batchNo: generateBatchNo(stall.category),
    stallId: body.stallId,
    productName: body.productName,
    origin: body.origin,
    supplier: body.supplier,
    quantity: body.quantity,
    unit: body.unit,
    productionDate: body.productionDate,
    shelfLifeDays: body.shelfLifeDays,
    purchaseDate: today,
    traceCode: generateTraceCode(stall.category),
    inspectionStatus: 'pending',
    remainingStock: body.quantity,
    isNearExpiry: false,
  };

  productBatches.unshift(newBatch);
  newBatch.isNearExpiry = isNearExpiry(newBatch);

  const response: ApiResponse<ProductBatch> = {
    success: true,
    message: '批次创建成功，溯源码已生成',
    data: newBatch,
  };
  res.status(201).json(response);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const batch = productBatches.find(b => b.id === id || b.batchNo === id || b.traceCode === id);

  if (!batch) {
    const response: ApiResponse<null> = {
      success: false,
      message: '批次不存在',
    };
    return res.status(404).json(response);
  }

  const stall = stalls.find(s => s.id === batch.stallId)!;
  const inspections = inspectionReports.filter(i => i.batchId === batch.id);
  const patrols = patrolRecords.filter(p => p.batchId === batch.id);
  const traceChain = buildTraceChain(batch, stall, inspections, patrols);
  const batchWithFlag = { ...batch, isNearExpiry: isNearExpiry(batch) };

  const detail: BatchTraceDetail = {
    batch: batchWithFlag,
    stall,
    inspections,
    patrolRecords: patrols,
    traceChain,
  };

  const response: ApiResponse<BatchTraceDetail> = {
    success: true,
    message: '获取溯源详情成功',
    data: detail,
  };
  res.json(response);
});

export default router;

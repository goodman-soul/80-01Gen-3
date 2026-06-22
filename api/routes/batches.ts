import { Router } from 'express';
import {
  getProductBatches,
  getStalls,
  getInspectionReports,
  getPatrolRecords,
  addProductBatch,
} from '../data/persistentStore.js';
import {
  generateBatchNo,
  generateTraceCode,
  isNearExpiry,
  buildTraceChain,
  genId,
  maskVendorName,
} from '../services/traceService.js';
import { vendorAuth, anyAuth } from '../middleware/auth.js';
import type {
  ApiResponse,
  ProductBatch,
  CreateBatchDto,
  BatchTraceDetail,
  DashboardStats,
  PublicBatchTraceDetail,
  PublicTraceRecord,
} from '../../shared/types';

const router = Router();

router.get('/public', (req, res) => {
  const { stallId } = req.query;
  let result = [...getProductBatches()];

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

router.get('/', anyAuth, (req, res) => {
  const { stallId } = req.query;
  let result = [...getProductBatches()];

  if (req.auth?.role === 'vendor') {
    result = result.filter(b => b.stallId === req.auth!.stallId);
  } else if (stallId) {
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

router.get('/dashboard/:stallId', vendorAuth, (req, res) => {
  const { stallId } = req.params;

  if (req.auth?.stallId !== stallId) {
    return res.status(403).json({ success: false, message: '无权访问其他摊位的数据' });
  }

  const stallBatches = getProductBatches().filter(b => b.stallId === stallId);

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

router.post('/', vendorAuth, (req, res) => {
  const body = req.body as CreateBatchDto;

  if (req.auth?.stallId !== body.stallId) {
    return res.status(403).json({ success: false, message: '无权为其他摊位创建批次' });
  }

  const stall = getStalls().find(s => s.id === body.stallId);

  if (!stall) {
    const response: ApiResponse<null> = {
      success: false,
      message: '关联摊位不存在',
    };
    return res.status(400).json(response);
  }

  if (!body.productName || !body.origin || !body.quantity || !body.productionDate) {
    return res.status(400).json({ success: false, message: '商品名、产地、数量、生产日期为必填项' });
  }

  const today = new Date().toISOString().split('T')[0];
  const newBatch: ProductBatch = {
    id: genId('b'),
    batchNo: generateBatchNo(stall.category),
    stallId: body.stallId,
    productName: body.productName.trim(),
    origin: body.origin.trim(),
    supplier: body.supplier?.trim() || '未知供应商',
    quantity: Number(body.quantity),
    unit: body.unit || 'kg',
    productionDate: body.productionDate,
    shelfLifeDays: Number(body.shelfLifeDays) || 7,
    purchaseDate: today,
    traceCode: generateTraceCode(stall.category),
    inspectionStatus: 'pending',
    remainingStock: Number(body.quantity),
    isNearExpiry: false,
  };

  addProductBatch(newBatch);
  newBatch.isNearExpiry = isNearExpiry(newBatch);

  const response: ApiResponse<ProductBatch> = {
    success: true,
    message: '批次创建成功，溯源码已生成',
    data: newBatch,
  };
  res.status(201).json(response);
});

router.get('/public/:id', (req, res) => {
  const { id } = req.params;
  const batch = getProductBatches().find(
    b => b.id === id || b.batchNo === id || b.traceCode === id
  );

  if (!batch) {
    return res.status(404).json({ success: false, message: '批次不存在' });
  }

  const stall = getStalls().find(s => s.id === batch.stallId)!;
  const inspections = getInspectionReports().filter(i => i.batchId === batch.id);
  const patrols = getPatrolRecords().filter(p => p.batchId === batch.id);
  const fullChain = buildTraceChain(batch, stall, inspections, patrols);

  const passCount = inspections.reduce(
    (sum, ins) => sum + ins.items.filter(i => i.result === 'pass').length,
    0
  );
  const failCount = inspections.reduce(
    (sum, ins) => sum + ins.items.filter(i => i.result === 'fail').length,
    0
  );
  const itemCount = inspections.reduce((sum, ins) => sum + ins.items.length, 0);
  const anyFail = inspections.some(i => i.overall === 'fail');
  const anyPass = inspections.some(i => i.overall === 'pass');

  const traceChain: PublicTraceRecord[] = fullChain.map(record => ({
    timestamp: record.timestamp,
    action: record.action,
    description: record.description
      .replace(new RegExp(stall.vendorName, 'g'), maskVendorName(stall.vendorName))
      .replace(/(检测员|检疫员|工)[:：\s]*[\u4e00-\u9fa5A-Za-z0-9-]+/g, '市场检测人员'),
    icon: record.icon,
  }));

  const publicDetail: PublicBatchTraceDetail = {
    batch: {
      id: batch.id,
      batchNo: batch.batchNo,
      productName: batch.productName,
      origin: batch.origin,
      unit: batch.unit,
      productionDate: batch.productionDate,
      shelfLifeDays: batch.shelfLifeDays,
      purchaseDate: batch.purchaseDate,
      traceCode: batch.traceCode,
      inspectionStatus: batch.inspectionStatus,
      isNearExpiry: isNearExpiry(batch),
    },
    stall: {
      id: stall.id,
      stallNo: stall.stallNo,
      name: stall.name,
      category: stall.category,
      location: stall.location,
      creditRating: stall.creditRating,
    },
    inspection: {
      overall: anyFail ? 'fail' : anyPass ? 'pass' : 'pending',
      passCount,
      failCount,
      itemCount,
    },
    traceChain,
  };

  res.json({ success: true, message: '获取溯源信息成功', data: publicDetail });
});

router.get('/:id', anyAuth, (req, res) => {
  const { id } = req.params;
  const batch = getProductBatches().find(
    b => b.id === id || b.batchNo === id || b.traceCode === id
  );

  if (!batch) {
    return res.status(404).json({ success: false, message: '批次不存在' });
  }

  if (req.auth?.role === 'vendor' && req.auth.stallId !== batch.stallId) {
    return res.status(403).json({ success: false, message: '无权查看其他摊位的批次详情' });
  }

  const stall = getStalls().find(s => s.id === batch.stallId)!;
  const inspections = getInspectionReports().filter(i => i.batchId === batch.id);
  const patrols = getPatrolRecords().filter(p => p.batchId === batch.id);
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

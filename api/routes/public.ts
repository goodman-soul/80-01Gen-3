import { Router } from 'express';
import {
  getStalls,
  getProductBatches,
  getInspectionReports,
  getPatrolRecords,
} from '../data/persistentStore.js';
import {
  isNearExpiry,
  buildTraceChain,
  maskVendorName,
} from '../services/traceService.js';
import type {
  ApiResponse,
  StallWithMask,
  PublicBatchTraceDetail,
  PublicTraceRecord,
  PublicInspectionSummary,
} from '../../shared/types';

const router = Router();

router.get('/stalls', (_req, res) => {
  const stalls = getStalls();
  const maskedStalls: StallWithMask[] = stalls.map(s => ({
    id: s.id,
    stallNo: s.stallNo,
    name: s.name,
    category: s.category,
    vendorName: s.vendorName,
    vendorNameMasked: maskVendorName(s.vendorName),
    location: s.location,
    creditRating: s.creditRating,
    createdAt: s.createdAt,
  }));

  const response: ApiResponse<StallWithMask[]> = {
    success: true,
    message: '获取摊位列表成功',
    data: maskedStalls,
  };
  res.json(response);
});

router.get('/stalls/:id', (req, res) => {
  const { id } = req.params;
  const stall = getStalls().find(s => s.id === id);

  if (!stall) {
    const response: ApiResponse<null> = {
      success: false,
      message: '摊位不存在',
    };
    return res.status(404).json(response);
  }

  const data: StallWithMask = {
    id: stall.id,
    stallNo: stall.stallNo,
    name: stall.name,
    category: stall.category,
    vendorName: stall.vendorName,
    vendorNameMasked: maskVendorName(stall.vendorName),
    location: stall.location,
    creditRating: stall.creditRating,
    createdAt: stall.createdAt,
  };

  const response: ApiResponse<StallWithMask> = {
    success: true,
    message: '获取摊位详情成功',
    data,
  };
  res.json(response);
});

router.get('/batches', (req, res) => {
  const { stallId } = req.query;
  let batches = [...getProductBatches()];

  if (stallId) {
    batches = batches.filter(b => b.stallId === String(stallId));
  }

  const publicBatches = batches.map(b => ({
    id: b.id,
    batchNo: b.batchNo,
    productName: b.productName,
    origin: b.origin,
    unit: b.unit,
    productionDate: b.productionDate,
    shelfLifeDays: b.shelfLifeDays,
    purchaseDate: b.purchaseDate,
    traceCode: b.traceCode,
    inspectionStatus: b.inspectionStatus,
    isNearExpiry: isNearExpiry(b),
  }));

  publicBatches.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  const response: ApiResponse<typeof publicBatches> = {
    success: true,
    message: '获取批次列表成功',
    data: publicBatches,
  };
  res.json(response);
});

router.get('/batches/:id', (req, res) => {
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
      .replace(/(检测员|检疫员|工)[:：\s]*[\u4e00-\u9fa5A-Za-z0-9-]+/g, '市场检测人员')
      .replace(/管理员[:：\s]*[\u4e00-\u9fa5A-Za-z0-9-]+/g, '市场管理人员'),
    icon: record.icon,
  }));

  const inspection: PublicInspectionSummary = {
    overall: anyFail ? 'fail' : anyPass ? 'pass' : 'pending',
    passCount,
    failCount,
    itemCount,
  };

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
    inspection,
    traceChain,
  };

  const response: ApiResponse<PublicBatchTraceDetail> = {
    success: true,
    message: '获取溯源信息成功',
    data: publicDetail,
  };
  res.json(response);
});

export default router;

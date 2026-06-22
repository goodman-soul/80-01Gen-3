import { Router } from 'express';
import { getStalls, getProductBatches } from '../data/persistentStore.js';
import { maskVendorName } from '../services/traceService.js';
import { anyAuth } from '../middleware/auth.js';
import type { ApiResponse, Stall, StallWithMask, ProductBatch } from '../../shared/types';

const router = Router();

router.get('/', (_req, res) => {
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

router.get('/:id', (req, res) => {
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

router.get('/:id/detail', anyAuth, (req, res) => {
  const { id } = req.params;
  const stall = getStalls().find(s => s.id === id);

  if (!stall) {
    return res.status(404).json({ success: false, message: '摊位不存在' });
  }

  if (req.auth?.role === 'vendor' && req.auth.stallId !== id) {
    return res.status(403).json({ success: false, message: '无权访问其他摊位的详细数据' });
  }

  const batches: ProductBatch[] = getProductBatches().filter(b => b.stallId === id);

  const response: ApiResponse<{ stall: Stall; batches: ProductBatch[] }> = {
    success: true,
    message: '获取摊位完整信息成功',
    data: { stall, batches },
  };
  res.json(response);
});

export default router;

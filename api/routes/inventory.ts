import { Router } from 'express';
import {
  getProductBatches,
  deductBatchStock,
  setBatchStock,
} from '../data/persistentStore.js';
import { isNearExpiry } from '../services/traceService.js';
import { vendorAuth } from '../middleware/auth.js';
import type { ApiResponse, ProductBatch, DeductInventoryDto } from '../../shared/types';

const router = Router();

router.get('/', vendorAuth, (req, res) => {
  const stallId = req.auth?.stallId;
  let result = [...getProductBatches()];

  if (stallId) {
    result = result.filter(b => b.stallId === stallId);
  }

  result = result.map(b => ({ ...b, isNearExpiry: isNearExpiry(b) }));
  result.sort((a, b) => {
    if (a.isNearExpiry !== b.isNearExpiry) return a.isNearExpiry ? -1 : 1;
    return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
  });

  const response: ApiResponse<ProductBatch[]> = {
    success: true,
    message: '获取库存列表成功',
    data: result,
  };
  res.json(response);
});

router.post('/:id/deduct', vendorAuth, (req, res) => {
  const { id } = req.params;
  const { amount } = req.body as DeductInventoryDto;

  const batch = getProductBatches().find(b => b.id === id);

  if (!batch) {
    const response: ApiResponse<null> = {
      success: false,
      message: '批次不存在',
    };
    return res.status(404).json(response);
  }

  if (req.auth?.stallId !== batch.stallId) {
    return res.status(403).json({ success: false, message: '无权操作其他摊位的库存' });
  }

  if (amount <= 0) {
    const response: ApiResponse<null> = {
      success: false,
      message: '扣减数量必须大于0',
    };
    return res.status(400).json(response);
  }

  if (amount > batch.remainingStock) {
    const response: ApiResponse<null> = {
      success: false,
      message: `库存不足，当前剩余 ${batch.remainingStock}${batch.unit}`,
    };
    return res.status(400).json(response);
  }

  const updatedBatch = deductBatchStock(id, amount);

  const response: ApiResponse<ProductBatch> = {
    success: true,
    message: `库存扣减成功，剩余 ${updatedBatch?.remainingStock}${batch.unit}`,
    data: updatedBatch ? { ...updatedBatch, isNearExpiry: isNearExpiry(updatedBatch) } : undefined,
  };
  res.json(response);
});

router.post('/:id/set', vendorAuth, (req, res) => {
  const { id } = req.params;
  const { remainingStock } = req.body as { remainingStock: number };

  const batch = getProductBatches().find(b => b.id === id);

  if (!batch) {
    const response: ApiResponse<null> = {
      success: false,
      message: '批次不存在',
    };
    return res.status(404).json(response);
  }

  if (req.auth?.stallId !== batch.stallId) {
    return res.status(403).json({ success: false, message: '无权操作其他摊位的库存' });
  }

  if (remainingStock < 0) {
    const response: ApiResponse<null> = {
      success: false,
      message: '库存不能为负数',
    };
    return res.status(400).json(response);
  }

  const updatedBatch = setBatchStock(id, remainingStock);

  const response: ApiResponse<ProductBatch> = {
    success: true,
    message: '库存更新成功',
    data: updatedBatch ? { ...updatedBatch, isNearExpiry: isNearExpiry(updatedBatch) } : undefined,
  };
  res.json(response);
});

export default router;

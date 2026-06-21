import { Router } from 'express';
import { productBatches } from '../data/store.js';
import { isNearExpiry } from '../services/traceService.js';
import type { ApiResponse, ProductBatch, DeductInventoryDto } from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const { stallId } = req.query;
  let result = [...productBatches];

  if (stallId) {
    result = result.filter(b => b.stallId === String(stallId));
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

router.post('/:id/deduct', (req, res) => {
  const { id } = req.params;
  const { amount } = req.body as DeductInventoryDto;

  const batch = productBatches.find(b => b.id === id);

  if (!batch) {
    const response: ApiResponse<null> = {
      success: false,
      message: '批次不存在',
    };
    return res.status(404).json(response);
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

  batch.remainingStock -= amount;

  const response: ApiResponse<ProductBatch> = {
    success: true,
    message: `库存扣减成功，剩余 ${batch.remainingStock}${batch.unit}`,
    data: { ...batch, isNearExpiry: isNearExpiry(batch) },
  };
  res.json(response);
});

router.post('/:id/set', (req, res) => {
  const { id } = req.params;
  const { remainingStock } = req.body as { remainingStock: number };

  const batch = productBatches.find(b => b.id === id);

  if (!batch) {
    const response: ApiResponse<null> = {
      success: false,
      message: '批次不存在',
    };
    return res.status(404).json(response);
  }

  if (remainingStock < 0) {
    const response: ApiResponse<null> = {
      success: false,
      message: '库存不能为负数',
    };
    return res.status(400).json(response);
  }

  batch.remainingStock = remainingStock;

  const response: ApiResponse<ProductBatch> = {
    success: true,
    message: '库存更新成功',
    data: { ...batch, isNearExpiry: isNearExpiry(batch) },
  };
  res.json(response);
});

export default router;

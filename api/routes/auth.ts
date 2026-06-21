import { Router } from 'express';
import { vendorUsers, adminUsers } from '../data/store.js';
import type { ApiResponse, LoginResponse } from '../../shared/types';

const router = Router();

router.post('/vendor/login', (req, res) => {
  const { username, password } = req.body;
  const user = vendorUsers.find(u => u.username === username && u.password === password);

  if (!user) {
    const response: ApiResponse<null> = {
      success: false,
      message: '账号或密码错误',
    };
    return res.status(401).json(response);
  }

  const data: LoginResponse = {
    token: `mock_vendor_token_${Date.now()}`,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: 'vendor',
      stallId: user.stallId,
    },
  };

  const response: ApiResponse<LoginResponse> = {
    success: true,
    message: '登录成功',
    data,
  };
  res.json(response);
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = adminUsers.find(u => u.username === username && u.password === password);

  if (!user) {
    const response: ApiResponse<null> = {
      success: false,
      message: '管理员账号或密码错误',
    };
    return res.status(401).json(response);
  }

  const data: LoginResponse = {
    token: `mock_admin_token_${Date.now()}`,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: 'admin',
    },
  };

  const response: ApiResponse<LoginResponse> = {
    success: true,
    message: '登录成功',
    data,
  };
  res.json(response);
});

export default router;

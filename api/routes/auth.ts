import { Router } from 'express';
import { getVendorUsers, getAdminUsers } from '../data/persistentStore.js';
import { signToken } from '../middleware/auth.js';
import type { ApiResponse, LoginResponse } from '../../shared/types';

const router = Router();

router.post('/vendor/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请提供账号和密码' });
  }

  const user = getVendorUsers().find(u => u.username === username && u.password === password);

  if (!user) {
    const response: ApiResponse<null> = {
      success: false,
      message: '账号或密码错误',
    };
    return res.status(401).json(response);
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: 'vendor',
    stallId: user.stallId,
  });

  const data: LoginResponse = {
    token,
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
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请提供账号和密码' });
  }

  const user = getAdminUsers().find(u => u.username === username && u.password === password);

  if (!user) {
    const response: ApiResponse<null> = {
      success: false,
      message: '管理员账号或密码错误',
    };
    return res.status(401).json(response);
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: 'admin',
  });

  const data: LoginResponse = {
    token,
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

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '已退出登录' });
});

export default router;

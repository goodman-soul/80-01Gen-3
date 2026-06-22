import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../../shared/types';

export interface AuthPayload {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  stallId?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'trace-market-2026-ultra-secure-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export function signToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(roles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少认证令牌，请先登录',
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期，请重新登录',
      });
    }

    if (roles && roles.length > 0 && !roles.includes(payload.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作',
      });
    }

    req.auth = payload;
    next();
  };
}

export const vendorAuth = authMiddleware(['vendor']);
export const adminAuth = authMiddleware(['admin']);
export const anyAuth = authMiddleware(['vendor', 'admin']);

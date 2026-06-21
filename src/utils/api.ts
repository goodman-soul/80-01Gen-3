import type { ApiResponse } from '../../shared/types';

const BASE_URL = import.meta.env.VITE_API_BASE || '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await res.json();
  } catch {
    data = {
      success: false,
      message: '网络错误，请稍后重试',
    };
  }

  if (!res.ok && !data.success) {
    return { success: false, message: data.message || `请求失败 (${res.status})` };
  }

  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

import axios, { AxiosRequestConfig } from 'axios';

function resolveApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window === 'undefined') {
    return configured ?? 'http://localhost:4000';
  }

  const browserBase = `${window.location.protocol}//${window.location.hostname}:4000`;
  const shouldUseBrowserHost = (hostname: string): boolean => {
    if (['localhost', '127.0.0.1', '0.0.0.0', 'api'].includes(hostname)) {
      return true;
    }

    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) {
      return true;
    }

    if (/^192\.168\.\d+\.\d+$/.test(hostname)) {
      return true;
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)) {
      return true;
    }

    return !hostname.includes('.') && hostname !== window.location.hostname;
  };

  if (!configured) {
    return browserBase;
  }

  try {
    const configuredUrl = new URL(configured);
    if (shouldUseBrowserHost(configuredUrl.hostname)) {
      return browserBase;
    }
  } catch {
    return browserBase;
  }

  return configured;
}

const API_BASE = resolveApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10_000, // avoid infinite loading if API is down
});

// Auth is handled via HttpOnly cookies (withCredentials: true).
// No Bearer header needed — cookies are sent automatically.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Rate limit handling
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || '60';
      // Dynamic import to avoid circular deps
      const { toast } = await import('@/hooks/use-toast');
      toast({
        title: 'Too many requests',
        description: `Please wait ${retryAfter} seconds before trying again.`,
        variant: 'destructive',
      });
      return Promise.reject(error);
    }

    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await axios.post<ApiResponse<{ accessToken: string }>>(
        `${API_BASE}/api/auth/refresh`,
        {},
        { withCredentials: true },
      );

      processQueue(null);
      // Retry with fresh cookie (set by the refresh response)
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  error: string | null;
}

export async function apiGet<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const { data } = await api.get<ApiResponse<T>>(url, config);
  return data;
}

export async function apiPost<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const { data } = await api.post<ApiResponse<T>>(url, body, config);
  return data;
}

export async function apiPut<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const { data } = await api.put<ApiResponse<T>>(url, body, config);
  return data;
}

export async function apiPatch<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const { data } = await api.patch<ApiResponse<T>>(url, body, config);
  return data;
}

export async function apiDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const { data } = await api.delete<ApiResponse<T>>(url, config);
  return data;
}

export default api;

import axios, { AxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

function processQueue(error: unknown, _token: string | null) {
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

      processQueue(null, null);
      // Retry with fresh cookie (set by the refresh response)
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
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

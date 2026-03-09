// lib/api.ts — place in ledgeros-mobile/lib/api.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  setToken(t: string)  { this.token = t; }
  clearToken()         { this.token = null; }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? 'Request failed');
    }
    return res.json();
  }

  get<T>(path: string)              { return this.request<T>(path); }
  post<T>(path: string, body: any)  { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }); }

  async uploadFile(path: string, formData: FormData) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? 'Upload failed');
    }
    return res.json();
  }
}

export const api = new ApiClient();
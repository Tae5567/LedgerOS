// store/authStore.ts
import { create } from 'zustand';
import { api } from '../lib/api';

export interface LoggedInUser {
  id: string;
  email: string;
  name: string;
  company: string;
  userType: 'business' | 'investor';
  companyId: string | null;
  token: string;
}

interface AuthStore {
  user: LoggedInUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoggedInUser>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null, loading: false, error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.post<{
        access_token: string;
        user: { id: string; email: string; user_type: 'business'|'investor'; full_name: string; company_name: string; company_id: string|null };
      }>('/auth/login', { email, password });

      const user: LoggedInUser = {
        id: data.user.id, email: data.user.email,
        name: data.user.full_name, company: data.user.company_name,
        userType: data.user.user_type, companyId: data.user.company_id,
        token: data.access_token,
      };
      api.setToken(data.access_token);
      set({ user, loading: false });
      return user;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => { api.clearToken(); set({ user: null, error: null }); },
}));
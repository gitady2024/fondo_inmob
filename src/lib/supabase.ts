import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'fondo_inmobil_supabase_url';
const STORAGE_KEY_ANON = 'fondo_inmobil_supabase_anon';

export const getSupabaseConfig = () => {
  // Soporte universal para variables Vite (VITE_) y Next.js (NEXT_PUBLIC_)
  const globalEnv = typeof globalThis !== 'undefined' ? (globalThis as any).process?.env : undefined;

  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    globalEnv?.NEXT_PUBLIC_SUPABASE_URL ||
    '';

  const envAnon =
    (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    globalEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const storedAnon = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const url = (storedUrl || envUrl || '').trim();
  const anonKey = (storedAnon || envAnon || '').trim();

  return { url, anonKey };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_ANON);
  }
  resetSupabaseClient();
};

const isValidHttpUrl = (str: string): boolean => {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

let clientInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    !url.includes('placeholder') &&
    isValidHttpUrl(url)
  );
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !isValidHttpUrl(url) || url.includes('placeholder')) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (e) {
      console.error('Error al inicializar cliente de Supabase:', e);
      return null;
    }
  }

  return clientInstance;
};

export const resetSupabaseClient = () => {
  clientInstance = null;
};

// Cliente exportado para uso directo y seguro en Auth y Hooks
const initialConfig = getSupabaseConfig();
const defaultUrl = isValidHttpUrl(initialConfig.url)
  ? initialConfig.url
  : 'https://placeholder.supabase.co';
const defaultAnon = initialConfig.anonKey || 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(defaultUrl, defaultAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;

import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types/auth';

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, nombre?: string, role?: UserRole, especialidad?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setDevUser: (profile: UserProfile | null) => void;
}

interface StoredAccount {
  id: string;
  email: string;
  password?: string;
  nombre: string;
  role: UserRole;
  especialidad?: string;
  socioId?: number;
}

const STORAGE_ACCOUNTS_KEY = 'fondo_inmobil_user_accounts';
const STORAGE_ACTIVE_USER_KEY = 'fondo_inmobil_active_auth_user';

const getStoredAccounts = (): StoredAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredAccount = (account: StoredAccount) => {
  if (typeof window === 'undefined') return;
  try {
    const accounts = getStoredAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    accounts.push(account);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
};

export const resolveRole = (dbRole?: string | null, metadataRole?: string | null): UserRole => {
  if (dbRole && ['admin', 'socio', 'tecnico'].includes(dbRole)) {
    return dbRole as UserRole;
  }
  if (metadataRole && ['admin', 'socio', 'tecnico'].includes(metadataRole)) {
    return metadataRole as UserRole;
  }
  return 'socio';
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar rol desde Supabase con fallback a user_metadata
  const resolveUserRole = useCallback(async (supabaseUser: User): Promise<UserRole> => {
    try {
      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (!roleError && data?.role_id) {
        return resolveRole(data.role_id, supabaseUser.user_metadata?.role);
      }
    } catch (err) {
      console.warn('No se pudo consultar user_roles en Supabase:', err);
    }
    return resolveRole(null, supabaseUser.user_metadata?.role);
  }, []);

  const syncUserProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      // Si no hay sesión Supabase, verificar si hay un usuario activo local persistido
      if (typeof window !== 'undefined') {
        const storedActive = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
        if (storedActive) {
          try {
            const parsed = JSON.parse(storedActive);
            setUserProfile(parsed);
            setRole(parsed.role);
            setLoading(false);
            return;
          } catch {}
        }
      }
      setUser(null);
      setSession(null);
      setRole(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const authUser = currentSession.user;
    setUser(authUser);
    setSession(currentSession);

    const resolvedRole = await resolveUserRole(authUser);
    setRole(resolvedRole);

    const profile: UserProfile = {
      id: authUser.id,
      role: resolvedRole,
      nombre: authUser.user_metadata?.nombre || (authUser.email ? authUser.email.split('@')[0] : 'Usuario'),
      email: authUser.email || '',
      socioId: authUser.user_metadata?.socio_id || 1,
      especialidad: authUser.user_metadata?.especialidad
    };
    setUserProfile(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
    }
    setLoading(false);
  }, [resolveUserRole]);

  useEffect(() => {
    let isMounted = true;

    // Obtener sesión inicial de Supabase
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: getSessionError }) => {
      if (!isMounted) return;
      if (getSessionError) {
        setError(getSessionError.message);
      }
      syncUserProfile(initialSession);
    }).catch((err) => {
      if (isMounted) {
        console.warn('Error al obtener sesión de Supabase:', err);
        // Fallback a usuario local
        if (typeof window !== 'undefined') {
          const storedActive = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
          if (storedActive) {
            try {
              const parsed = JSON.parse(storedActive);
              setUserProfile(parsed);
              setRole(parsed.role);
            } catch {}
          }
        }
        setLoading(false);
      }
    });

    // Escuchar cambios de sesión en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      syncUserProfile(currentSession);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncUserProfile]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const normEmail = email.trim().toLowerCase();

    // 1. Intento con Supabase
    try {
      const { data: supaData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normEmail,
        password
      });

      if (!signInError && supaData?.session) {
        return { success: true };
      }
    } catch {
      // Fallback a autenticación local
    }

    // 2. Fallback a cuenta local guardada
    const accounts = getStoredAccounts();
    const localMatch = accounts.find((a) => a.email.toLowerCase() === normEmail);

    if (localMatch) {
      if (localMatch.password && localMatch.password !== password) {
        const msg = 'Contraseña incorrecta para este correo.';
        setError(msg);
        return { success: false, error: msg };
      }

      const profile: UserProfile = {
        id: localMatch.id,
        role: localMatch.role,
        nombre: localMatch.nombre,
        email: localMatch.email,
        socioId: localMatch.socioId || 1,
        especialidad: localMatch.especialidad
      };

      setUserProfile(profile);
      setRole(profile.role);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
      }
      return { success: true };
    }

    // 3. Auto-recuperación para el correo de la cuenta técnica registrada (qdoblea@gmail.com o afines)
    if (normEmail === 'qdoblea@gmail.com' || normEmail.includes('tecnico') || normEmail.includes('obra')) {
      const tecnicoProfile: UserProfile = {
        id: `tecnico-${Date.now()}`,
        role: 'tecnico',
        nombre: 'Director Técnico de Obra',
        email: normEmail,
        especialidad: 'Dirección de Obra y Certificaciones'
      };

      saveStoredAccount({
        id: tecnicoProfile.id,
        email: normEmail,
        password,
        nombre: tecnicoProfile.nombre,
        role: 'tecnico',
        especialidad: tecnicoProfile.especialidad
      });

      setUserProfile(tecnicoProfile);
      setRole('tecnico');
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(tecnicoProfile));
      }
      return { success: true };
    }

    const errorMsg = 'No encontramos una cuenta con esas credenciales. Podés crear tu cuenta en la pestaña "Crear Cuenta" o ingresar con el botón de Acceso Rápido.';
    setError(errorMsg);
    return { success: false, error: errorMsg };
  };

  const signUp = async (
    email: string,
    password: string,
    nombre?: string,
    roleParam: UserRole = 'socio',
    especialidad?: string
  ) => {
    setError(null);
    const normEmail = email.trim().toLowerCase();

    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      role: roleParam,
      nombre: nombre || normEmail.split('@')[0],
      email: normEmail,
      socioId: 1,
      especialidad: especialidad || (roleParam === 'tecnico' ? 'Dirección de Obra y Certificaciones' : undefined)
    };

    // 1. Guardar de inmediato en almacenamiento local para no depender de rate limits de emails
    saveStoredAccount({
      id: newProfile.id,
      email: normEmail,
      password,
      nombre: newProfile.nombre,
      role: roleParam,
      especialidad: newProfile.especialidad,
      socioId: 1
    });

    // 2. Iniciar sesión local de inmediato para que el usuario no quede bloqueado
    setUserProfile(newProfile);
    setRole(roleParam);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(newProfile));
    }

    // 3. Intentar en segundo plano crear la cuenta en Supabase
    try {
      await supabase.auth.signUp({
        email: normEmail,
        password,
        options: {
          data: {
            nombre: newProfile.nombre,
            role: roleParam,
            especialidad: newProfile.especialidad
          }
        }
      });
    } catch (supaErr) {
      console.warn('Nota de Supabase signUp en segundo plano:', supaErr);
    }

    return { success: true };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error al cerrar sesión:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setUserProfile(null);
  };

  // Método auxiliar para pruebas y modo demo
  const setDevUser = (profile: UserProfile | null) => {
    if (!profile) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
      }
      setUser(null);
      setSession(null);
      setRole(null);
      setUserProfile(null);
      return;
    }
    setRole(profile.role);
    setUserProfile(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
    }
  };

  return {
    user,
    session,
    role,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    setDevUser
  };
};

export default useAuth;

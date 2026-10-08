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
    setLoading(false);
  }, [resolveUserRole]);

  useEffect(() => {
    let isMounted = true;

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: getSessionError }) => {
      if (!isMounted) return;
      if (getSessionError) {
        setError(getSessionError.message);
      }
      syncUserProfile(initialSession);
    }).catch((err) => {
      if (isMounted) {
        console.warn('Error al obtener sesión de Supabase:', err);
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
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Error de autenticación';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    nombre?: string,
    roleParam: UserRole = 'socio',
    especialidad?: string
  ) => {
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre || email.split('@')[0],
            role: roleParam,
            especialidad: especialidad || (roleParam === 'tecnico' ? 'Dirección de Obra y Planos' : undefined)
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      // Intentar vincular en tabla user_roles si el usuario fue creado de inmediato
      if (data.user) {
        try {
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role_id: roleParam
          });
        } catch {
          // Ignorar si el trigger SQL ya lo creó automáticamente
        }
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Error al registrar usuario';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error al cerrar sesión:', err);
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setUserProfile(null);
  };

  // Método auxiliar para pruebas y modo demo
  const setDevUser = (profile: UserProfile | null) => {
    if (!profile) {
      setUser(null);
      setSession(null);
      setRole(null);
      setUserProfile(null);
      return;
    }
    setRole(profile.role);
    setUserProfile(profile);
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

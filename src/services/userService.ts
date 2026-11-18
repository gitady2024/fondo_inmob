import type { UserProfile, UserRole } from '../types/auth';

export interface UsuarioCuenta {
  id: string;
  email: string;
  password?: string;
  nombre: string;
  role: UserRole;
  especialidad?: string;
  socioId?: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const STORAGE_ACCOUNTS_KEY = 'fondo_inmobil_user_accounts';
export const STORAGE_ACTIVE_USER_KEY = 'fondo_inmobil_active_auth_user';

// Cuentas predefinidas del sistema fiduciario
export const CUENTAS_BASE_DEFAULT: UsuarioCuenta[] = [
  {
    id: 'user-admin-base',
    email: 'admin@fondoinmobil.com',
    password: 'admin',
    nombre: 'Administrador Fiduciario',
    role: 'admin',
    activo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-tecnico-base',
    email: 'tecnico@fondoinmobil.com',
    password: 'obra',
    nombre: 'Director Técnico de Obra',
    role: 'tecnico',
    especialidad: 'Dirección de Obra, Planos y Gestoría Pública',
    activo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-socio1-base',
    email: 'socio1@fondoinmobil.com',
    password: 'socio',
    nombre: 'Socio Inversor D1',
    role: 'socio',
    socioId: 1,
    activo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

/**
 * Obtiene la lista completa de usuarios registrados en el sistema
 */
export const getUsuariosRegistrados = (): UsuarioCuenta[] => {
  if (typeof window === 'undefined') return CUENTAS_BASE_DEFAULT;

  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    let accounts: UsuarioCuenta[] = raw ? JSON.parse(raw) : [];

    // Si está vacío, inicializar con las cuentas base
    if (!accounts || accounts.length === 0) {
      accounts = [...CUENTAS_BASE_DEFAULT];
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
      return accounts;
    }

    // Asegurar que las cuentas base existan si no fueron dadas de baja
    const emailsExistentes = new Set(accounts.map((a) => a.email.toLowerCase()));
    let modificado = false;

    for (const base of CUENTAS_BASE_DEFAULT) {
      if (!emailsExistentes.has(base.email.toLowerCase())) {
        accounts.push(base);
        modificado = true;
      }
    }

    // Normalizar campos faltantes (activo por defecto true, etc.)
    accounts = accounts.map((acc) => ({
      ...acc,
      activo: acc.activo !== false,
      nombre: acc.nombre || acc.email.split('@')[0],
      createdAt: acc.createdAt || new Date().toISOString(),
      updatedAt: acc.updatedAt || new Date().toISOString()
    }));

    if (modificado) {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    return accounts;
  } catch (err) {
    console.warn('Error al leer usuarios de localStorage:', err);
    return CUENTAS_BASE_DEFAULT;
  }
};

/**
 * Crea o edita un usuario registrado en el sistema
 */
export const guardarUsuario = (
  datos: Partial<UsuarioCuenta> & { email: string; role: UserRole }
): { success: boolean; usuario?: UsuarioCuenta; error?: string } => {
  if (!datos.email || !datos.email.trim()) {
    return { success: false, error: 'El email del usuario es obligatorio.' };
  }

  const normEmail = datos.email.trim().toLowerCase();
  const accounts = getUsuariosRegistrados();

  const id = datos.id || `user-${Date.now()}`;
  const now = new Date().toISOString();

  const index = accounts.findIndex(
    (a) => (datos.id && a.id === datos.id) || a.email.toLowerCase() === normEmail
  );

  const usuarioGuardado: UsuarioCuenta = {
    id: index >= 0 ? accounts[index].id : id,
    email: normEmail,
    password: datos.password || (index >= 0 ? accounts[index].password : 'inverfondo123'),
    nombre: datos.nombre?.trim() || (index >= 0 ? accounts[index].nombre : normEmail.split('@')[0]),
    role: datos.role,
    especialidad: datos.role === 'tecnico' ? (datos.especialidad?.trim() || 'Dirección de Obra y Certificaciones') : undefined,
    socioId: datos.role === 'socio' ? (datos.socioId || 1) : undefined,
    activo: datos.activo !== undefined ? datos.activo : (index >= 0 ? accounts[index].activo : true),
    createdAt: index >= 0 ? accounts[index].createdAt || now : now,
    updatedAt: now
  };

  if (index >= 0) {
    accounts[index] = usuarioGuardado;
  } else {
    accounts.push(usuarioGuardado);
  }

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));

      // Si el usuario editado es el que actualmente está logueado, sincronizar su sesión activa
      const rawActive = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
      if (rawActive) {
        const active: UserProfile = JSON.parse(rawActive);
        if (active.email?.toLowerCase() === normEmail || active.id === usuarioGuardado.id) {
          const updatedActive: UserProfile = {
            ...active,
            nombre: usuarioGuardado.nombre,
            role: usuarioGuardado.role,
            email: usuarioGuardado.email,
            especialidad: usuarioGuardado.especialidad,
            socioId: usuarioGuardado.socioId
          };
          localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(updatedActive));
        }
      }
    }
    return { success: true, usuario: usuarioGuardado };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al persistir usuario en el sistema.' };
  }
};

/**
 * Elimina una cuenta de usuario por ID o Email
 */
export const eliminarUsuario = (id: string): { success: boolean; error?: string } => {
  try {
    const accounts = getUsuariosRegistrados();
    const filtered = accounts.filter((a) => a.id !== id && a.email !== id);

    if (filtered.length === accounts.length) {
      return { success: false, error: 'No se encontró el usuario a eliminar.' };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(filtered));
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al eliminar usuario.' };
  }
};

/**
 * Conmuta el estado de actividad de un usuario (Activo / Suspendido)
 */
export const alternarEstadoUsuario = (id: string): { success: boolean; nuevoEstado?: boolean; error?: string } => {
  try {
    const accounts = getUsuariosRegistrados();
    const index = accounts.findIndex((a) => a.id === id);

    if (index === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const nuevoEstado = !accounts[index].activo;
    accounts[index] = {
      ...accounts[index],
      activo: nuevoEstado,
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    return { success: true, nuevoEstado };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al actualizar estado.' };
  }
};

/**
 * Restablece o cambia la contraseña de una cuenta
 */
export const restablecerPassword = (id: string, nuevoPass: string): { success: boolean; error?: string } => {
  if (!nuevoPass || nuevoPass.trim().length < 3) {
    return { success: false, error: 'La contraseña debe tener al menos 3 caracteres.' };
  }

  try {
    const accounts = getUsuariosRegistrados();
    const index = accounts.findIndex((a) => a.id === id);

    if (index === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    accounts[index] = {
      ...accounts[index],
      password: nuevoPass.trim(),
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al restablecer contraseña.' };
  }
};

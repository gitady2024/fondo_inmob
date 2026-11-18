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
 * Obtiene la lista completa de usuarios registrados en el sistema.
 * Inicializa con las cuentas fiduciarias base solo en la primera carga (cuando el almacenamiento está virgen),
 * respetando estrictamente las eliminaciones, modificaciones y adiciones posteriores del usuario.
 */
export const getUsuariosRegistrados = (): UsuarioCuenta[] => {
  if (typeof window === 'undefined') return CUENTAS_BASE_DEFAULT;

  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);

    // Solo si el storage nunca fue inicializado (null), sembramos las cuentas base
    if (raw === null) {
      const initial = [...CUENTAS_BASE_DEFAULT];
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(initial));
      return initial;
    }

    let accounts: UsuarioCuenta[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        accounts = parsed;
      } else {
        accounts = [...CUENTAS_BASE_DEFAULT];
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
        return accounts;
      }
    } catch {
      accounts = [...CUENTAS_BASE_DEFAULT];
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
      return accounts;
    }

    // Normalizar campos para consistencia de datos
    return accounts.map((acc) => ({
      ...acc,
      activo: acc.activo !== false,
      nombre: acc.nombre ? acc.nombre.trim() : acc.email.split('@')[0],
      createdAt: acc.createdAt || new Date().toISOString(),
      updatedAt: acc.updatedAt || new Date().toISOString()
    }));
  } catch (err) {
    console.warn('Error al leer usuarios de localStorage:', err);
    return CUENTAS_BASE_DEFAULT;
  }
};

/**
 * Crea o edita un usuario registrado en el sistema.
 * Valida formato de correo, unicidad del email, contraseña, asignaciones según rol y sincroniza la sesión activa.
 */
export const guardarUsuario = (
  datos: Partial<UsuarioCuenta> & { email: string; role: UserRole }
): { success: boolean; usuario?: UsuarioCuenta; error?: string } => {
  if (!datos.email || !datos.email.trim()) {
    return { success: false, error: 'El email del usuario es obligatorio.' };
  }

  const normEmail = datos.email.trim().toLowerCase();

  // Validación básica de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normEmail)) {
    return { success: false, error: 'El formato de correo electrónico ingresado no es válido.' };
  }

  if (datos.nombre !== undefined && (!datos.nombre || !datos.nombre.trim())) {
    return { success: false, error: 'El nombre completo o razón social no puede estar vacío.' };
  }

  const accounts = getUsuariosRegistrados();

  // Validar conflicto de email: no permitir que dos cuentas tengan el mismo correo
  if (datos.id) {
    const conflict = accounts.find(
      (a) => a.email.toLowerCase() === normEmail && a.id !== datos.id
    );
    if (conflict) {
      return {
        success: false,
        error: `El correo "${normEmail}" ya está asignado a otra cuenta (${conflict.nombre}).`
      };
    }
  } else {
    const existe = accounts.find((a) => a.email.toLowerCase() === normEmail);
    if (existe) {
      return {
        success: false,
        error: `Ya existe una cuenta registrada con el correo "${normEmail}".`
      };
    }
  }

  const now = new Date().toISOString();

  // Buscar usuario a editar por ID primero, luego por email
  let index = -1;
  if (datos.id) {
    index = accounts.findIndex((a) => a.id === datos.id);
  }
  if (index === -1) {
    index = accounts.findIndex((a) => a.email.toLowerCase() === normEmail);
  }

  const finalId = index >= 0 ? accounts[index].id : (datos.id || `user-${Date.now()}`);

  // Manejo de contraseña:
  // Si se ingresó una nueva contraseña, validar longitud mínima de 3 caracteres
  let passwordFinal = index >= 0 ? (accounts[index].password || 'inverfondo123') : 'inverfondo123';
  if (datos.password && datos.password.trim()) {
    if (datos.password.trim().length < 3) {
      return { success: false, error: 'La contraseña debe tener al menos 3 caracteres.' };
    }
    passwordFinal = datos.password.trim();
  }

  const usuarioGuardado: UsuarioCuenta = {
    id: finalId,
    email: normEmail,
    password: passwordFinal,
    nombre: datos.nombre?.trim() || (index >= 0 ? accounts[index].nombre : normEmail.split('@')[0]),
    role: datos.role,
    especialidad: datos.role === 'tecnico' ? (datos.especialidad?.trim() || 'Dirección de Obra y Certificaciones') : undefined,
    socioId: datos.role === 'socio' ? (datos.socioId || 1) : undefined,
    activo: datos.activo !== undefined ? datos.activo : (index >= 0 ? accounts[index].activo : true),
    createdAt: index >= 0 ? (accounts[index].createdAt || now) : now,
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
        try {
          const active: UserProfile = JSON.parse(rawActive);
          if (active.email?.toLowerCase() === normEmail || active.id === usuarioGuardado.id) {
            const updatedActive: UserProfile = {
              ...active,
              id: usuarioGuardado.id,
              nombre: usuarioGuardado.nombre,
              role: usuarioGuardado.role,
              email: usuarioGuardado.email,
              especialidad: usuarioGuardado.especialidad,
              socioId: usuarioGuardado.socioId
            };
            localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(updatedActive));
          }
        } catch {}
      }
    }
    return { success: true, usuario: usuarioGuardado };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al persistir usuario en el sistema.' };
  }
};

/**
 * Elimina permanentemente una cuenta de usuario por ID o Email.
 * Una vez eliminada, no volverá a regenerarse automáticamente.
 */
export const eliminarUsuario = (idOrEmail: string): { success: boolean; error?: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) {
      return { success: false, error: 'No se encontraron cuentas almacenadas en el sistema.' };
    }

    let accounts: UsuarioCuenta[] = [];
    try {
      accounts = JSON.parse(raw);
    } catch {
      return { success: false, error: 'Error al interpretar el almacenamiento de cuentas.' };
    }

    const target = idOrEmail.trim().toLowerCase();
    const filtered = accounts.filter(
      (a) => a.id !== idOrEmail && a.email.toLowerCase() !== target
    );

    if (filtered.length === accounts.length) {
      return { success: false, error: 'No se encontró la cuenta que se desea eliminar.' };
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
export const alternarEstadoUsuario = (idOrEmail: string): { success: boolean; nuevoEstado?: boolean; error?: string } => {
  try {
    const accounts = getUsuariosRegistrados();
    const target = idOrEmail.trim().toLowerCase();
    const index = accounts.findIndex((a) => a.id === idOrEmail || a.email.toLowerCase() === target);

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
export const restablecerPassword = (idOrEmail: string, nuevoPass: string): { success: boolean; error?: string } => {
  if (!nuevoPass || nuevoPass.trim().length < 3) {
    return { success: false, error: 'La contraseña debe tener al menos 3 caracteres.' };
  }

  try {
    const accounts = getUsuariosRegistrados();
    const target = idOrEmail.trim().toLowerCase();
    const index = accounts.findIndex((a) => a.id === idOrEmail || a.email.toLowerCase() === target);

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

/**
 * Restablece las cuentas de fábrica del sistema fiduciario
 */
export const restablecerCuentasPorDefecto = (): UsuarioCuenta[] => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(CUENTAS_BASE_DEFAULT));
  }
  return [...CUENTAS_BASE_DEFAULT];
};


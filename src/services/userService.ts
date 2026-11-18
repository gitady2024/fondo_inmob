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
  // Campos de verificación y admisión fiduciaria (Requisitos de Socio)
  estadoSocio?: 'aprobado' | 'prospecto' | 'pendiente_aprobacion';
  dni?: string;
  domicilio?: string;
  garantiaTipo?: string;
  garantiaDetalle?: string;
  pagoInicialMonto?: number;
  pagoInicialAcreditado?: boolean;
  obraAsignadaId?: string;
  obraAsignadaNombre?: string;
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
    estadoSocio: 'aprobado',
    dni: '32.145.890',
    domicilio: 'Av. Libertador 1240, CABA',
    garantiaTipo: 'Recibo de Sueldo y Fianza Personal',
    garantiaDetalle: 'Ingresos certificados en relación de dependencia',
    pagoInicialMonto: 10000,
    pagoInicialAcreditado: true,
    obraAsignadaNombre: 'Family Homes La Lucia (36 meses)',
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
    socioId: datos.role === 'socio' ? (datos.socioId || (index >= 0 ? accounts[index].socioId : undefined)) : undefined,
    activo: datos.activo !== undefined ? datos.activo : (index >= 0 ? accounts[index].activo : true),
    estadoSocio: datos.estadoSocio !== undefined ? datos.estadoSocio : (index >= 0 ? accounts[index].estadoSocio : (datos.role === 'socio' ? 'prospecto' : undefined)),
    dni: datos.dni !== undefined ? datos.dni?.trim() : (index >= 0 ? accounts[index].dni : undefined),
    domicilio: datos.domicilio !== undefined ? datos.domicilio?.trim() : (index >= 0 ? accounts[index].domicilio : undefined),
    garantiaTipo: datos.garantiaTipo !== undefined ? datos.garantiaTipo?.trim() : (index >= 0 ? accounts[index].garantiaTipo : undefined),
    garantiaDetalle: datos.garantiaDetalle !== undefined ? datos.garantiaDetalle?.trim() : (index >= 0 ? accounts[index].garantiaDetalle : undefined),
    pagoInicialMonto: datos.pagoInicialMonto !== undefined ? Number(datos.pagoInicialMonto) : (index >= 0 ? accounts[index].pagoInicialMonto : undefined),
    pagoInicialAcreditado: datos.pagoInicialAcreditado !== undefined ? Boolean(datos.pagoInicialAcreditado) : (index >= 0 ? accounts[index].pagoInicialAcreditado : undefined),
    obraAsignadaId: datos.obraAsignadaId !== undefined ? datos.obraAsignadaId : (index >= 0 ? accounts[index].obraAsignadaId : undefined),
    obraAsignadaNombre: datos.obraAsignadaNombre !== undefined ? datos.obraAsignadaNombre : (index >= 0 ? accounts[index].obraAsignadaNombre : undefined),
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
              socioId: usuarioGuardado.socioId,
              estadoSocio: usuarioGuardado.estadoSocio,
              dni: usuarioGuardado.dni,
              domicilio: usuarioGuardado.domicilio,
              garantiaTipo: usuarioGuardado.garantiaTipo,
              garantiaDetalle: usuarioGuardado.garantiaDetalle,
              pagoInicialMonto: usuarioGuardado.pagoInicialMonto,
              pagoInicialAcreditado: usuarioGuardado.pagoInicialAcreditado,
              obraAsignadaId: usuarioGuardado.obraAsignadaId,
              obraAsignadaNombre: usuarioGuardado.obraAsignadaNombre
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

/**
 * Resultado estructurado de la verificación de admisión como socio fiduciario
 */
export interface VerificacionSocio {
  esAprobado: boolean;
  estado: 'aprobado' | 'prospecto' | 'pendiente_aprobacion';
  motivosPendientes: string[];
  tienePagoMinimo: boolean;
  tieneDni: boolean;
  tieneDomicilio: boolean;
  tieneGarantia: boolean;
  tieneObraAsignada: boolean;
  pagoMonto: number;
}

/**
 * Verifica si un usuario reúne los requisitos necesarios para operar como Socio Pleno:
 * 1. Haber integrado el anticipo mínimo de USD 10.000 (o acreditado por la administración).
 * 2. Estar suscripto a alguna de las obras en marcha del fondo.
 * 3. Datos mínimos completos: DNI del titular, constancia de domicilio y garantía exigida.
 * 4. Aprobación formal por la Administración Fiduciaria.
 * Si no cumple, el usuario debe ingresar en Modo Invitado / Prospecto.
 */
export const verificarEstadoSocio = (
  usuario: Partial<UsuarioCuenta | UserProfile> | null
): VerificacionSocio => {
  if (!usuario || usuario.role !== 'socio') {
    return {
      esAprobado: false,
      estado: 'prospecto',
      motivosPendientes: ['El perfil no corresponde a un usuario con rol de socio.'],
      tienePagoMinimo: false,
      tieneDni: false,
      tieneDomicilio: false,
      tieneGarantia: false,
      tieneObraAsignada: false,
      pagoMonto: 0
    };
  }

  // Si es explícitamente invitado demo
  if (usuario.isGuest && !usuario.email) {
    return {
      esAprobado: false,
      estado: 'prospecto',
      motivosPendientes: [
        'Cuenta en modo invitado demo sin registro.',
        'Anticipo de USD 10.000 pendiente de acreditación.',
        'Documentación fiduciaria (DNI, domicilio, garantía) pendiente.'
      ],
      tienePagoMinimo: false,
      tieneDni: false,
      tieneDomicilio: false,
      tieneGarantia: false,
      tieneObraAsignada: false,
      pagoMonto: 0
    };
  }

  const motivos: string[] = [];

  // 1. Verificación de pago inicial mínimo (USD 10.000 o bandera de acreditación)
  const pagoMonto = Number((usuario as any).pagoInicialMonto || (usuario as any).pagoInicial || 0);
  const pagoAcreditado = Boolean((usuario as any).pagoInicialAcreditado || pagoMonto >= 10000);
  const tienePagoMinimo = pagoAcreditado;
  if (!tienePagoMinimo) {
    motivos.push('Anticipo fiduciario mínimo de USD 10.000 pendiente de integración.');
  }

  // 2. Verificación de DNI
  const dni = (usuario as any).dni?.trim();
  const tieneDni = Boolean(dni && dni.length >= 6);
  if (!tieneDni) {
    motivos.push('DNI del titular pendiente de presentar.');
  }

  // 3. Verificación de Domicilio
  const domicilio = (usuario as any).domicilio?.trim();
  const tieneDomicilio = Boolean(domicilio && domicilio.length >= 5);
  if (!tieneDomicilio) {
    motivos.push('Constancia de domicilio actualizada pendiente.');
  }

  // 4. Verificación de Garantía
  const garantia =
    (usuario as any).garantiaTipo?.trim() ||
    (usuario as any).garantia?.trim() ||
    (usuario as any).garantiaDetalle?.trim();
  const tieneGarantia = Boolean(garantia && garantia.length >= 3);
  if (!tieneGarantia) {
    motivos.push('Garantía exigida por el fondo pendiente de presentar.');
  }

  // 5. Asignación a obra en marcha
  const tieneObra = Boolean(
    (usuario as any).obraAsignadaId ||
    (usuario as any).obraAsignadaNombre ||
    (usuario as any).socioId
  );
  if (!tieneObra) {
    motivos.push('Asignación y suscripción a una obra en marcha pendiente.');
  }

  // Estado administrativo
  const estadoGuardado = (usuario as any).estadoSocio;
  let estadoFinal: 'aprobado' | 'prospecto' | 'pendiente_aprobacion' = 'prospecto';

  if (estadoGuardado === 'aprobado' && tienePagoMinimo && tieneDni) {
    estadoFinal = 'aprobado';
  } else if (estadoGuardado === 'pendiente_aprobacion' || (tieneDni && tieneDomicilio)) {
    estadoFinal = 'pendiente_aprobacion';
  } else {
    estadoFinal = 'prospecto';
  }

  const esAprobado = estadoFinal === 'aprobado' && motivos.length === 0;

  return {
    esAprobado,
    estado: estadoFinal,
    motivosPendientes: motivos,
    tienePagoMinimo,
    tieneDni,
    tieneDomicilio,
    tieneGarantia,
    tieneObraAsignada: tieneObra,
    pagoMonto
  };
};

/**
 * Permite a un prospecto o socio enviar/actualizar su documentación fiduciaria (DNI, Domicilio, Garantía, Pago Inicial)
 * para solicitar la aprobación formal de la Administración.
 */
export const enviarSolicitudSocio = (
  userIdOrEmail: string,
  datos: {
    nombre?: string;
    dni: string;
    domicilio: string;
    garantiaTipo: string;
    garantiaDetalle?: string;
    pagoInicialMonto?: number;
    obraAsignadaNombre?: string;
    comprobanteReferencia?: string;
  }
): { success: boolean; error?: string; usuario?: UsuarioCuenta } => {
  const accounts = getUsuariosRegistrados();
  const target = userIdOrEmail.trim().toLowerCase();
  const index = accounts.findIndex((a) => a.id === userIdOrEmail || a.email.toLowerCase() === target);

  if (index === -1) {
    return { success: false, error: 'No se encontró la cuenta de usuario.' };
  }

  const prev = accounts[index];
  const now = new Date().toISOString();
  const monto = datos.pagoInicialMonto !== undefined ? Number(datos.pagoInicialMonto) : (prev.pagoInicialMonto || 0);

  const actualizado: UsuarioCuenta = {
    ...prev,
    nombre: datos.nombre?.trim() || prev.nombre,
    dni: datos.dni.trim(),
    domicilio: datos.domicilio.trim(),
    garantiaTipo: datos.garantiaTipo.trim(),
    garantiaDetalle: datos.garantiaDetalle?.trim() || prev.garantiaDetalle,
    pagoInicialMonto: monto,
    pagoInicialAcreditado: monto >= 10000 ? true : prev.pagoInicialAcreditado,
    obraAsignadaNombre: datos.obraAsignadaNombre || prev.obraAsignadaNombre || 'Family Homes La Lucia (36 meses)',
    estadoSocio: 'pendiente_aprobacion',
    updatedAt: now
  };

  accounts[index] = actualizado;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));

    // Sincronizar sesión activa si es el usuario actual
    const rawActive = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
    if (rawActive) {
      try {
        const active: UserProfile = JSON.parse(rawActive);
        if (active.id === actualizado.id || active.email?.toLowerCase() === actualizado.email.toLowerCase()) {
          const updatedActive: UserProfile = {
            ...active,
            nombre: actualizado.nombre,
            dni: actualizado.dni,
            domicilio: actualizado.domicilio,
            garantiaTipo: actualizado.garantiaTipo,
            garantiaDetalle: actualizado.garantiaDetalle,
            pagoInicialMonto: actualizado.pagoInicialMonto,
            pagoInicialAcreditado: actualizado.pagoInicialAcreditado,
            obraAsignadaNombre: actualizado.obraAsignadaNombre,
            estadoSocio: actualizado.estadoSocio
          };
          localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(updatedActive));
        }
      } catch {}
    }
  }

  return { success: true, usuario: actualizado };
};


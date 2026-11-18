import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUsuariosRegistrados,
  guardarUsuario,
  eliminarUsuario,
  alternarEstadoUsuario,
  restablecerPassword,
  verificarEstadoSocio,
  enviarSolicitudSocio,
  STORAGE_ACCOUNTS_KEY
} from './userService';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true
});

describe('userService - Gestión de Cuentas y Accesos de Usuarios', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('inicializa con cuentas base predefinidas si el almacenamiento está vacío', () => {
    const usuarios = getUsuariosRegistrados();
    expect(usuarios.length).toBeGreaterThanOrEqual(3);

    const admin = usuarios.find((u) => u.role === 'admin');
    expect(admin).toBeDefined();
    expect(admin?.email).toBe('admin@fondoinmobil.com');

    const tecnico = usuarios.find((u) => u.role === 'tecnico');
    expect(tecnico).toBeDefined();
    expect(tecnico?.especialidad).toBeDefined();
  });

  it('permite registrar un nuevo usuario con rol socio', () => {
    const res = guardarUsuario({
      email: 'juan.perez@example.com',
      nombre: 'Juan Pérez Inversor',
      role: 'socio',
      socioId: 4,
      password: 'password123'
    });

    expect(res.success).toBe(true);
    expect(res.usuario).toBeDefined();
    expect(res.usuario?.email).toBe('juan.perez@example.com');
    expect(res.usuario?.role).toBe('socio');
    expect(res.usuario?.socioId).toBe(4);

    const usuarios = getUsuariosRegistrados();
    const encontrado = usuarios.find((u) => u.email === 'juan.perez@example.com');
    expect(encontrado).toBeDefined();
    expect(encontrado?.nombre).toBe('Juan Pérez Inversor');
  });

  it('permite editar los datos de un usuario existente', () => {
    guardarUsuario({
      id: 'user-test-1',
      email: 'carlos@example.com',
      nombre: 'Carlos Inicial',
      role: 'tecnico',
      especialidad: 'Estructuras'
    });

    // Edición
    const editRes = guardarUsuario({
      id: 'user-test-1',
      email: 'carlos@example.com',
      nombre: 'Carlos Modificado',
      role: 'admin'
    });

    expect(editRes.success).toBe(true);
    expect(editRes.usuario?.nombre).toBe('Carlos Modificado');
    expect(editRes.usuario?.role).toBe('admin');

    const usuarios = getUsuariosRegistrados();
    const carlos = usuarios.find((u) => u.id === 'user-test-1');
    expect(carlos?.nombre).toBe('Carlos Modificado');
    expect(carlos?.role).toBe('admin');
  });

  it('permite alternar el estado activo/suspendido de un usuario', () => {
    const nuevo = guardarUsuario({
      email: 'suspendible@example.com',
      nombre: 'Usuario Suspendible',
      role: 'socio'
    });

    const id = nuevo.usuario!.id;
    const resToggle = alternarEstadoUsuario(id);
    expect(resToggle.success).toBe(true);
    expect(resToggle.nuevoEstado).toBe(false);

    const resToggle2 = alternarEstadoUsuario(id);
    expect(resToggle2.success).toBe(true);
    expect(resToggle2.nuevoEstado).toBe(true);
  });

  it('permite restablecer la contraseña de un usuario', () => {
    const nuevo = guardarUsuario({
      email: 'cambiopass@example.com',
      nombre: 'Usuario Pass',
      role: 'socio',
      password: 'passOriginal'
    });

    const id = nuevo.usuario!.id;
    const resPass = restablecerPassword(id, 'nuevaPasswordSegura2026');
    expect(resPass.success).toBe(true);

    const usuarios = getUsuariosRegistrados();
    const modificado = usuarios.find((u) => u.id === id);
    expect(modificado?.password).toBe('nuevaPasswordSegura2026');
  });

  it('permite eliminar un usuario registrado', () => {
    const nuevo = guardarUsuario({
      email: 'aeliminar@example.com',
      nombre: 'A Eliminar',
      role: 'socio'
    });

    const id = nuevo.usuario!.id;
    const deleteRes = eliminarUsuario(id);
    expect(deleteRes.success).toBe(true);

    const usuarios = getUsuariosRegistrados();
    expect(usuarios.some((u) => u.id === id)).toBe(false);
  });

  it('permite eliminar permanentemente una de las cuentas base (ej: admin base) sin que vuelva a aparecer', () => {
    // 1. Obtener lista inicial con cuentas base
    const inicial = getUsuariosRegistrados();
    const adminBase = inicial.find((u) => u.email === 'admin@fondoinmobil.com');
    expect(adminBase).toBeDefined();

    // 2. Eliminar la cuenta base
    const deleteRes = eliminarUsuario(adminBase!.id);
    expect(deleteRes.success).toBe(true);

    // 3. Consultar nuevamente la lista; NO debe resucitar
    const despues = getUsuariosRegistrados();
    expect(despues.some((u) => u.email === 'admin@fondoinmobil.com')).toBe(false);
    expect(despues.some((u) => u.id === adminBase!.id)).toBe(false);
  });

  it('rechaza guardar usuario si el email entra en conflicto con otra cuenta registrada', () => {
    guardarUsuario({
      id: 'user-a',
      email: 'primero@example.com',
      nombre: 'Primer Usuario',
      role: 'socio'
    });

    guardarUsuario({
      id: 'user-b',
      email: 'segundo@example.com',
      nombre: 'Segundo Usuario',
      role: 'socio'
    });

    // Intentar cambiar el email de user-b para que sea el de user-a
    const conflictoRes = guardarUsuario({
      id: 'user-b',
      email: 'primero@example.com',
      nombre: 'Segundo Usuario Con Conflicto',
      role: 'socio'
    });

    expect(conflictoRes.success).toBe(false);
    expect(conflictoRes.error).toContain('ya está asignado a otra cuenta');
  });

  it('permite cambiar el email de una cuenta sin regenerar el email anterior como duplicado', () => {
    const res = guardarUsuario({
      id: 'user-modificar-email',
      email: 'original@example.com',
      nombre: 'Original',
      role: 'tecnico'
    });
    expect(res.success).toBe(true);

    // Modificar email
    const editRes = guardarUsuario({
      id: 'user-modificar-email',
      email: 'renombrado@example.com',
      nombre: 'Original Renombrado',
      role: 'tecnico'
    });
    expect(editRes.success).toBe(true);

    const usuarios = getUsuariosRegistrados();
    expect(usuarios.some((u) => u.email === 'renombrado@example.com')).toBe(true);
    expect(usuarios.some((u) => u.email === 'original@example.com')).toBe(false);
  });

  it('guarda correctamente el estado activo/suspendido del usuario', () => {
    const res = guardarUsuario({
      id: 'user-estado-test',
      email: 'inactivo@example.com',
      nombre: 'Usuario Inactivo',
      role: 'socio',
      activo: false
    });
    expect(res.success).toBe(true);
    expect(res.usuario?.activo).toBe(false);

    const usuarios = getUsuariosRegistrados();
    const guardado = usuarios.find((u) => u.id === 'user-estado-test');
    expect(guardado?.activo).toBe(false);
  });

  describe('Admisión Fiduciaria y Verificación de Requisitos para Socios', () => {
    it('socio1 base predefinido cuenta con aprobación fiduciaria completa', () => {
      const usuarios = getUsuariosRegistrados();
      const socio1 = usuarios.find((u) => u.id === 'user-socio1-base');
      expect(socio1).toBeDefined();

      const verif = verificarEstadoSocio(socio1);
      expect(verif.esAprobado).toBe(true);
      expect(verif.estado).toBe('aprobado');
      expect(verif.motivosPendientes.length).toBe(0);
      expect(verif.tienePagoMinimo).toBe(true);
      expect(verif.tieneDni).toBe(true);
      expect(verif.tieneGarantia).toBe(true);
      expect(verif.tieneDomicilio).toBe(true);
    });

    it('un usuario nuevo sin requisitos cumplidos no es aprobado y queda como prospecto / invitado', () => {
      const usuarioNuevo = {
        id: 'user-vaenmoto',
        email: 'vaenmoto@example.com',
        nombre: 'vaenmoto',
        role: 'socio' as const
      };

      const verif = verificarEstadoSocio(usuarioNuevo);
      expect(verif.esAprobado).toBe(false);
      expect(verif.estado).toBe('prospecto');
      expect(verif.motivosPendientes.length).toBeGreaterThan(0);
      expect(verif.tienePagoMinimo).toBe(false);
      expect(verif.tieneDni).toBe(false);
    });

    it('enviarSolicitudSocio actualiza los datos y pasa el estado a pendiente_aprobacion', () => {
      guardarUsuario({
        id: 'user-postulante',
        email: 'postulante@example.com',
        nombre: 'Postulante Fiduciario',
        role: 'socio'
      });

      const res = enviarSolicitudSocio('user-postulante', {
        nombre: 'Postulante Fiduciario Completo',
        dni: '35.123.456',
        domicilio: 'Av. Libertador 4500, San Juan',
        garantiaTipo: 'Recibo de Sueldo',
        garantiaDetalle: 'Empresa Constructora SA',
        pagoInicialMonto: 10000,
        obraAsignadaNombre: 'Family Homes La Lucía',
        comprobanteReferencia: 'TR-10000-USD-5544'
      });

      expect(res.success).toBe(true);
      expect(res.usuario?.estadoSocio).toBe('pendiente_aprobacion');
      expect(res.usuario?.dni).toBe('35.123.456');
      expect(res.usuario?.pagoInicialMonto).toBe(10000);

      const verif = verificarEstadoSocio(res.usuario);
      expect(verif.esAprobado).toBe(false);
      expect(verif.estado).toBe('pendiente_aprobacion');
      expect(verif.tieneDni).toBe(true);
      expect(verif.tieneDomicilio).toBe(true);
      expect(verif.tieneGarantia).toBe(true);
      expect(verif.tienePagoMinimo).toBe(true);
    });

    it('al aprobar el Administrador y acreditar el pago, el socio pasa a ser Socio Pleno Aprobado', () => {
      guardarUsuario({
        id: 'user-aprobado',
        email: 'aprobado@example.com',
        nombre: 'Socio Pleno Confirmado',
        role: 'socio',
        dni: '28.990.111',
        domicilio: 'Mitre 250, San Juan',
        garantiaTipo: 'Fianza Bancaria',
        garantiaDetalle: 'Banco San Juan Aval',
        pagoInicialMonto: 10000,
        pagoInicialAcreditado: true,
        obraAsignadaNombre: 'Family Homes La Lucía',
        estadoSocio: 'aprobado',
        socioId: 2
      });

      const usuarios = getUsuariosRegistrados();
      const socioAprobado = usuarios.find((u) => u.id === 'user-aprobado');
      const verif = verificarEstadoSocio(socioAprobado);

      expect(verif.esAprobado).toBe(true);
      expect(verif.estado).toBe('aprobado');
      expect(verif.motivosPendientes.length).toBe(0);
      expect(verif.tienePagoMinimo).toBe(true);
      expect(verif.tieneDni).toBe(true);
      expect(verif.tieneDomicilio).toBe(true);
      expect(verif.tieneGarantia).toBe(true);
    });
  });
});

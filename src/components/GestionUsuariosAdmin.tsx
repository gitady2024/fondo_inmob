import React, { useState, useEffect, useMemo } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import {
  getUsuariosRegistrados,
  guardarUsuario,
  eliminarUsuario,
  alternarEstadoUsuario,
  restablecerPassword,
  type UsuarioCuenta
} from '../services/userService';
import {
  Users,
  UserPlus,
  Shield,
  HardHat,
  User,
  Key,
  Lock,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Pencil,
  LogIn,
  Eye,
  EyeOff,
  Building2,
  Check,
  X
} from 'lucide-react';

interface GestionUsuariosAdminProps {
  currentUser: UserProfile;
  onShowToast: (msg: string) => void;
  onSwitchUser?: (user: UserProfile) => void;
  cantidadDeptos?: number;
}

export const GestionUsuariosAdmin: React.FC<GestionUsuariosAdminProps> = ({
  currentUser,
  onShowToast,
  onSwitchUser,
  cantidadDeptos = 10
}) => {
  const [usuarios, setUsuarios] = useState<UsuarioCuenta[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroRol, setFiltroRol] = useState<'todos' | 'admin' | 'tecnico' | 'socio'>('todos');

  // Modal de edición o creación
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [usuarioEditando, setUsuarioEditando] = useState<Partial<UsuarioCuenta>>({});
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Modal para restablecer contraseña rápida
  const [passModalUser, setPassModalUser] = useState<UsuarioCuenta | null>(null);
  const [nuevoPasswordInput, setNuevoPasswordInput] = useState<string>('');

  // Cargar usuarios
  const cargarUsuarios = () => {
    const list = getUsuariosRegistrados();
    setUsuarios(list);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Filtrado
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const cumpleFiltro = filtroRol === 'todos' || u.role === filtroRol;
      if (!cumpleFiltro) return false;

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.especialidad && u.especialidad.toLowerCase().includes(q)) ||
        (u.socioId && `unidad ${u.socioId}`.includes(q))
      );
    });
  }, [usuarios, filtroRol, busqueda]);

  // Contadores KPIs
  const totalUsuarios = usuarios.length;
  const totalAdmins = usuarios.filter((u) => u.role === 'admin').length;
  const totalTecnicos = usuarios.filter((u) => u.role === 'tecnico').length;
  const totalSocios = usuarios.filter((u) => u.role === 'socio').length;

  // Abrir modal de creación
  const handleAbrirCrear = () => {
    setModoModal('crear');
    setUsuarioEditando({
      nombre: '',
      email: '',
      password: '',
      role: 'socio',
      socioId: 1,
      activo: true
    });
    setMostrarPassword(false);
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleAbrirEditar = (user: UsuarioCuenta) => {
    setModoModal('editar');
    setUsuarioEditando({ ...user });
    setMostrarPassword(false);
    setIsModalOpen(true);
  };

  // Guardar usuario (Crear o Editar)
  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando.email || !usuarioEditando.email.trim()) {
      onShowToast('❌ Debes ingresar un correo electrónico válido.');
      return;
    }

    setGuardando(true);
    const res = guardarUsuario({
      id: usuarioEditando.id,
      email: usuarioEditando.email,
      nombre: usuarioEditando.nombre,
      password: usuarioEditando.password,
      role: usuarioEditando.role || 'socio',
      especialidad: usuarioEditando.especialidad,
      socioId: usuarioEditando.socioId,
      activo: usuarioEditando.activo !== undefined ? usuarioEditando.activo : true
    });

    setGuardando(false);

    if (res.success) {
      onShowToast(
        modoModal === 'crear'
          ? `✅ Cuenta de ${usuarioEditando.nombre || usuarioEditando.email} creada con éxito.`
          : `✅ Datos de ${usuarioEditando.nombre || usuarioEditando.email} actualizados.`
      );
      cargarUsuarios();
      setIsModalOpen(false);
    } else {
      onShowToast(`❌ Error: ${res.error || 'No se pudo guardar el usuario'}`);
    }
  };

  // Eliminar usuario
  const handleEliminar = (user: UsuarioCuenta) => {
    if (user.id === currentUser.id || user.email.toLowerCase() === currentUser.email?.toLowerCase()) {
      onShowToast('⚠️ No puedes eliminar la cuenta con la que has iniciado sesión.');
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta de "${user.nombre}" (${user.email})?`)) {
      const res = eliminarUsuario(user.id);
      if (res.success) {
        onShowToast(`🗑️ Cuenta de ${user.nombre} eliminada del sistema.`);
        cargarUsuarios();
      } else {
        onShowToast(`❌ Error al eliminar: ${res.error}`);
      }
    }
  };

  // Conmutar activo/suspendido
  const handleToggleActivo = (user: UsuarioCuenta) => {
    if (user.id === currentUser.id || user.email.toLowerCase() === currentUser.email?.toLowerCase()) {
      onShowToast('⚠️ No puedes suspender tu propia cuenta activa.');
      return;
    }

    const res = alternarEstadoUsuario(user.id);
    if (res.success) {
      onShowToast(
        res.nuevoEstado
          ? `🟢 Cuenta de ${user.nombre} habilitada.`
          : `🔴 Cuenta de ${user.nombre} suspendida.`
      );
      cargarUsuarios();
    }
  };

  // Guardar restablecimiento de contraseña
  const handleGuardarNuevoPass = () => {
    if (!passModalUser) return;
    if (!nuevoPasswordInput || nuevoPasswordInput.trim().length < 3) {
      onShowToast('❌ La contraseña debe tener al menos 3 caracteres.');
      return;
    }

    const res = restablecerPassword(passModalUser.id, nuevoPasswordInput);
    if (res.success) {
      onShowToast(`🔑 Contraseña actualizada para ${passModalUser.nombre}.`);
      setPassModalUser(null);
      setNuevoPasswordInput('');
      cargarUsuarios();
    } else {
      onShowToast(`❌ Error: ${res.error}`);
    }
  };

  // Simular ingreso como este usuario
  const handleIngresarComo = (u: UsuarioCuenta) => {
    if (!onSwitchUser) return;
    const profile: UserProfile = {
      id: u.id,
      role: u.role,
      nombre: u.nombre,
      email: u.email,
      socioId: u.socioId,
      especialidad: u.especialidad
    };
    onSwitchUser(profile);
    onShowToast(`🔄 Has iniciado sesión como ${u.nombre} (${u.role.toUpperCase()}).`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header con métricas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Control de Cuentas y Credenciales
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {totalUsuarios} registradas
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                Gestión de Usuarios y Accesos al Sistema
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl">
                Crea, edita y administra todas las cuentas con acceso a la plataforma (Administradores, Equipo Técnico y Socios Inversores), gestiona contraseñas y asigna unidades.
              </p>
            </div>
          </div>

          <button
            onClick={handleAbrirCrear}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Nueva Cuenta</span>
          </button>
        </div>

        {/* Resumen de Métricas de Cuentas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Cuentas</div>
            <div className="text-xl font-black text-white mt-0.5">{totalUsuarios}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Usuarios del sistema</div>
          </div>

          <div className="bg-slate-950/60 border border-purple-500/20 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3" /> Administradores
            </div>
            <div className="text-xl font-black text-purple-300 mt-0.5">{totalAdmins}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Acceso fiduciario total</div>
          </div>

          <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <HardHat className="w-3 h-3" /> Equipo Técnico
            </div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{totalTecnicos}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Dirección y gestoría</div>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/20 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Socios Inversores
            </div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{totalSocios}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Fiduciantes adjudicados</div>
          </div>
        </div>
      </div>

      {/* 2. Filtros y Búsqueda */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Pills de Roles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Rol:</span>
          </span>
          <button
            onClick={() => setFiltroRol('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filtroRol === 'todos'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({totalUsuarios})
          </button>
          <button
            onClick={() => setFiltroRol('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filtroRol === 'admin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 text-purple-400 hover:bg-slate-700'
            }`}
          >
            Admins ({totalAdmins})
          </button>
          <button
            onClick={() => setFiltroRol('tecnico')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filtroRol === 'tecnico'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
            }`}
          >
            Técnicos ({totalTecnicos})
          </button>
          <button
            onClick={() => setFiltroRol('socio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filtroRol === 'socio'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            Socios ({totalSocios})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, email, especialidad..."
            className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Tabla de Usuarios Registrados */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Usuario & Email</th>
                <th className="py-3 px-4">Rol / Acceso</th>
                <th className="py-3 px-4">Detalle / Asignación</th>
                <th className="py-3 px-4">Contraseña</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const esUsuarioActual =
                    u.id === currentUser.id ||
                    u.email.toLowerCase() === currentUser.email?.toLowerCase();

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        esUsuarioActual ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Usuario & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : u.role === 'tecnico'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {u.role === 'admin' ? (
                              <Shield className="w-4 h-4" />
                            ) : u.role === 'tecnico' ? (
                              <HardHat className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{u.nombre}</span>
                              {esUsuarioActual && (
                                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{u.email}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <Shield className="w-3 h-3" />
                            <span>Administrador</span>
                          </span>
                        ) : u.role === 'tecnico' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <HardHat className="w-3 h-3" />
                            <span>Equipo Técnico</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <User className="w-3 h-3" />
                            <span>Socio Inversor</span>
                          </span>
                        )}
                      </td>

                      {/* Detalle / Asignación */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {u.role === 'socio' ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Unidad D{u.socioId || 1}</span>
                          </div>
                        ) : u.role === 'tecnico' ? (
                          <div className="text-slate-300 font-medium truncate max-w-[220px]" title={u.especialidad}>
                            {u.especialidad || 'Dirección de Obra'}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Acceso Administrativo Pleno</span>
                        )}
                      </td>

                      {/* Contraseña */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPassModalUser(u);
                            setNuevoPasswordInput(u.password || '');
                          }}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-indigo-500/40 text-[11px] font-mono transition cursor-pointer"
                          title="Ver o restablecer contraseña"
                        >
                          <Key className="w-3 h-3 text-indigo-400" />
                          <span>{u.password ? '••••••••' : 'Configurar'}</span>
                        </button>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(u)}
                          disabled={esUsuarioActual}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            u.activo !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20'
                          }`}
                          title={esUsuarioActual ? 'Tu cuenta activa' : 'Hacer clic para cambiar estado'}
                        >
                          {u.activo !== false ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Suspendido</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Simular Ingreso */}
                          {onSwitchUser && !esUsuarioActual && (
                            <button
                              type="button"
                              onClick={() => handleIngresarComo(u)}
                              title={`Iniciar sesión como ${u.nombre}`}
                              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Botón Editar Ficha */}
                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(u)}
                            title="Editar datos del usuario"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          {!esUsuarioActual && (
                            <button
                              type="button"
                              onClick={() => handleEliminar(u)}
                              title="Eliminar usuario permanentemente"
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-200 rounded-lg border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <span>
            Mostrando <strong>{usuariosFiltrados.length}</strong> de {usuarios.length} cuentas registradas
          </span>
          <span className="text-[11px] text-slate-500">
            🔒 Las credenciales y roles se sincronizan de inmediato en el entorno fiduciario.
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: CREAR / EDITAR USUARIO                                        */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  {modoModal === 'crear' ? <UserPlus className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {modoModal === 'crear' ? 'Registrar Nueva Cuenta de Usuario' : 'Editar Cuenta de Usuario'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configura los datos personales, rol de acceso y contraseña.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardar} className="p-4 sm:p-6 space-y-4">
              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre Completo o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={usuarioEditando.nombre || ''}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nombre: e.target.value })}
                  placeholder="Ej: Ing. Martín Gómez o Carlos Mendoza"
                  className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Correo Electrónico (Email de Acceso) *
                </label>
                <input
                  type="email"
                  required
                  value={usuarioEditando.email || ''}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, email: e.target.value })}
                  placeholder="usuario@fondoinmobil.com"
                  className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono transition"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Contraseña de Ingreso
                </label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={usuarioEditando.password || ''}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, password: e.target.value })}
                    placeholder={modoModal === 'crear' ? 'Asignar contraseña (mínimo 3 caracteres)' : 'Dejar en blanco para no modificar'}
                    className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 rounded-xl px-3.5 py-2 pr-10 text-xs text-white outline-none font-mono transition"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {mostrarPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Rol en la Plataforma */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Rol y Nivel de Acceso *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Admin */}
                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition ${
                      usuarioEditando.role === 'admin'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={usuarioEditando.role === 'admin'}
                      onChange={() => setUsuarioEditando({ ...usuarioEditando, role: 'admin' })}
                      className="sr-only"
                    />
                    <Shield className="w-4 h-4 mb-1 text-purple-400" />
                    <span className="text-xs font-bold block">Admin</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Control Total</span>
                  </label>

                  {/* Técnico */}
                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition ${
                      usuarioEditando.role === 'tecnico'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="tecnico"
                      checked={usuarioEditando.role === 'tecnico'}
                      onChange={() => setUsuarioEditando({ ...usuarioEditando, role: 'tecnico' })}
                      className="sr-only"
                    />
                    <HardHat className="w-4 h-4 mb-1 text-amber-400" />
                    <span className="text-xs font-bold block">Técnico</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Gestoría & Obras</span>
                  </label>

                  {/* Socio */}
                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition ${
                      usuarioEditando.role === 'socio'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="socio"
                      checked={usuarioEditando.role === 'socio'}
                      onChange={() => setUsuarioEditando({ ...usuarioEditando, role: 'socio' })}
                      className="sr-only"
                    />
                    <User className="w-4 h-4 mb-1 text-emerald-400" />
                    <span className="text-xs font-bold block">Socio</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Portal Inversor</span>
                  </label>
                </div>
              </div>

              {/* Asignación condicional según el rol */}
              {usuarioEditando.role === 'socio' && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                  <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Unidad Fiduciaria Asignada (Depto #)</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Indica a qué departamento o número de socio pertenece esta cuenta para ver sus cuotas y posesión.
                  </p>
                  <select
                    value={usuarioEditando.socioId || 1}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, socioId: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                  >
                    {Array.from({ length: Math.max(cantidadDeptos, 10) }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        🏢 Departamento D{num} (Socio #{num})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {usuarioEditando.role === 'tecnico' && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                  <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Especialidad Técnica / Cargo</span>
                  </label>
                  <input
                    type="text"
                    value={usuarioEditando.especialidad || ''}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, especialidad: e.target.value })}
                    placeholder="Ej: Dirección de Obra, Gestoría Municipal, Planos y Trámites"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Botonera de Guardado */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : modoModal === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VER / CAMBIAR CONTRASEÑA RÁPIDA                               */}
      {/* ==================================================================== */}
      {passModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Restablecer Contraseña</span>
              </div>
              <button
                type="button"
                onClick={() => setPassModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-300">
                Establecer nueva clave para: <strong>{passModalUser.nombre}</strong>
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{passModalUser.email}</p>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="text"
                value={nuevoPasswordInput}
                onChange={(e) => setNuevoPasswordInput(e.target.value)}
                placeholder="Escribe la nueva contraseña..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white rounded-xl px-3.5 py-2 text-xs font-mono outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPassModalUser(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarNuevoPass}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Actualizar Clave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


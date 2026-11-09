import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { FondoGuardado } from '../services/fondoService';
import type { SocioFiduciario } from '../types/socio';
import {
  getSociosPorFondo,
  guardarSocio,
  togglePagoInicialSocio,
  calcularResumenSocios,
  fileToDataUrl
} from '../services/socioAdminService';
import { fmtMoneda } from '../utils/calculations';
import {
  Users,
  UserPlus,
  FileText,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  FileCheck,
  Download,
  Eye,
  Edit2,
  Search,
  X,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';

interface GestionSociosAdminProps {
  currentFondo: FondoGuardado;
  onShowToast: (msg: string) => void;
}

export const GestionSociosAdmin: React.FC<GestionSociosAdminProps> = ({
  currentFondo,
  onShowToast
}) => {
  const [socios, setSocios] = useState<SocioFiduciario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'pendientes' | 'con_contrato'>('todos');

  // Estado para Modal de Edición / Alta
  const [socioEditando, setSocioEditando] = useState<SocioFiduciario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Estado para Modal Visor de Documento (Contrato / DNI)
  const [docVisor, setDocVisor] = useState<{
    titulo: string;
    url: string;
    nombreArchivo: string;
    esPdf: boolean;
  } | null>(null);

  const fileInputContratoRef = useRef<HTMLInputElement>(null);
  const fileInputDniRef = useRef<HTMLInputElement>(null);

  // Cargar lista de socios
  const cargarSocios = async () => {
    setLoading(true);
    try {
      const data = await getSociosPorFondo(
        currentFondo.id,
        currentFondo.params.cantidadDeptos,
        currentFondo.params.costoDepto,
        currentFondo.anticipos
      );
      setSocios(data);
    } catch (err) {
      console.warn('Error cargando socios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSocios();
  }, [currentFondo.id, currentFondo.params.cantidadDeptos]);

  // Resumen de KPIs
  const resumen = useMemo(() => {
    return calcularResumenSocios(socios);
  }, [socios]);

  // Filtrado de socios
  const sociosFiltrados = useMemo(() => {
    return socios.filter((s) => {
      // Filtro de texto
      const matchTexto =
        filtroTexto.trim() === '' ||
        s.nombreCompleto.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        s.dni.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        s.unidadDepto.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        s.email.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        s.telefono.toLowerCase().includes(filtroTexto.toLowerCase());

      if (!matchTexto) return false;

      // Filtro de estado
      if (filtroEstado === 'activos') return s.pagoInicialEfectuado;
      if (filtroEstado === 'pendientes') return !s.pagoInicialEfectuado;
      if (filtroEstado === 'con_contrato') return !!s.contratoFirmadoUrl;
      return true;
    });
  }, [socios, filtroTexto, filtroEstado]);

  // Manejo de toggle rápido de pago inicial
  const handleTogglePago = async (socio: SocioFiduciario) => {
    const nuevoEstado = !socio.pagoInicialEfectuado;
    const montoSugerido = socio.montoPagoInicial > 0 ? socio.montoPagoInicial : Math.round(currentFondo.params.costoDepto * 0.1);
    const ok = await togglePagoInicialSocio(currentFondo.id, socio.id, nuevoEstado, montoSugerido);
    if (ok) {
      setSocios((prev) =>
        prev.map((s) =>
          s.id === socio.id
            ? {
                ...s,
                pagoInicialEfectuado: nuevoEstado,
                estado: nuevoEstado ? 'activo' : 'pendiente_pago',
                montoPagoInicial: nuevoEstado ? montoSugerido : s.montoPagoInicial,
                fechaPagoInicial: nuevoEstado ? new Date().toISOString().slice(0, 10) : undefined
              }
            : s
        )
      );
      onShowToast(
        nuevoEstado
          ? `✅ Pago inicial registrado para ${socio.unidadDepto} (${socio.nombreCompleto || 'Socio'}). Estado: ACTIVO.`
          : `⏳ Pago inicial revertido para ${socio.unidadDepto}. Estado: PENDIENTE.`
      );
    }
  };

  // Abrir modal de edición
  const handleEditarSocio = (socio: SocioFiduciario) => {
    setSocioEditando({ ...socio });
    setIsModalOpen(true);
  };

  // Guardar datos desde el modal
  const handleGuardarModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socioEditando) return;

    setGuardando(true);
    try {
      const res = await guardarSocio(socioEditando);
      if (res.success) {
        setSocios((prev) =>
          prev.map((s) => (s.id === res.socio.id ? res.socio : s))
        );
        setIsModalOpen(false);
        setSocioEditando(null);
        onShowToast(`💾 Datos del socio de ${res.socio.unidadDepto} guardados con éxito.`);
      }
    } catch (err: any) {
      onShowToast(`❌ Error al guardar socio: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // Subida de Contrato Firmado
  const handleFileContratoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socioEditando) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setSocioEditando({
        ...socioEditando,
        contratoFirmadoUrl: dataUrl,
        contratoFirmadoNombre: file.name,
        fechaFirmaContrato: new Date().toISOString().slice(0, 10)
      });
      onShowToast(`📄 Contrato firmado "${file.name}" cargado digitalmente.`);
    } catch (err) {
      onShowToast('❌ Error al procesar el archivo del contrato.');
    }
  };

  // Subida de Foto de DNI
  const handleFileDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socioEditando) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setSocioEditando({
        ...socioEditando,
        fotoDniUrl: dataUrl,
        fotoDniNombre: file.name
      });
      onShowToast(`🆔 Foto de DNI "${file.name}" cargada.`);
    } catch (err) {
      onShowToast('❌ Error al procesar la foto del DNI.');
    }
  };

  // Abrir Visor de Documento
  const abrirVisor = (titulo: string, url: string, nombreArchivo: string) => {
    const esPdf = url.startsWith('data:application/pdf') || nombreArchivo.toLowerCase().endsWith('.pdf');
    setDocVisor({ titulo, url, nombreArchivo, esPdf });
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* ==================================================================== */}
      {/* 1. CABECERA INSTITUCIONAL DEL PADRÓN DE SOCIOS                       */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Padrón Fiduciario de Socios & Contratos
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {currentFondo.nombre}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Gestión Integral de Socios e Inversores
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Administración de datos personales, verificación de pago inicial de suscripción y archivo digital de contratos firmados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // Seleccionar primer socio sin nombre para completar
                const vacio = socios.find((s) => !s.nombreCompleto || s.nombreCompleto.trim().length === 0) || socios[0];
                if (vacio) handleEditarSocio(vacio);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar / Asignar Socio</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. TARJETAS DE KPIS RESUMEN DEL PADRÓN                               */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          
          {/* Card 1: Total Unidades */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Unidades
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {resumen.totalUnidades}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({resumen.sociosRegistrados} cargados)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              100% fiduciario asignable
            </span>
          </div>

          {/* Card 2: Socios Activos (Con Pago Inicial) */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Socios Activos (Pagado)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {resumen.sociosActivos}
              </span>
              <span className="text-xs text-emerald-500/80 font-mono">
                / {resumen.totalUnidades}
              </span>
            </div>
            <span className="text-[11px] text-emerald-300/80 mt-1 block">
              Aporte inicial acreditado
            </span>
          </div>

          {/* Card 3: Pendientes de Pago Inicial */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pendientes de Pago
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {resumen.sociosPendientesPago}
              </span>
              <span className="text-xs text-amber-500/80 font-mono">
                sin acreditar
              </span>
            </div>
            <span className="text-[11px] text-amber-300/80 mt-1 block">
              Requiere validar suscripción
            </span>
          </div>

          {/* Card 4: Contratos Firmados Cargados */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" /> Contratos Firmados
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
                {resumen.contratosCargados}
              </span>
              <span className="text-xs text-indigo-400/80 font-mono">
                / {resumen.totalUnidades}
              </span>
            </div>
            <span className="text-[11px] text-indigo-300/80 mt-1 block">
              Documentos digitales resguardados
            </span>
          </div>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS                         */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre, DNI, unidad (D1, D2...), email o teléfono..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
          />
          {filtroTexto && (
            <button
              onClick={() => setFiltroTexto('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros de estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroEstado === 'todos'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({socios.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('activos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroEstado === 'activos'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Pagados ({resumen.sociosActivos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('pendientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroEstado === 'pendientes'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Pendientes ({resumen.sociosPendientesPago})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('con_contrato')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroEstado === 'con_contrato'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Con Contrato ({resumen.contratosCargados})
          </button>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 4. TABLA DEL PADRÓN DE SOCIOS                                        */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Cargando padrón de socios...
          </div>
        ) : sociosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No se encontraron socios que coincidan con el filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Unidad</th>
                  <th className="py-3 px-4">Socio Titular</th>
                  <th className="py-3 px-4">DNI / Documento</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Pago Inicial</th>
                  <th className="py-3 px-4">Contrato Firmado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {sociosFiltrados.map((s) => {
                  const tieneNombre = s.nombreCompleto && s.nombreCompleto.trim().length > 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      
                      {/* Unidad */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-black">
                            D{s.numeroSocio}
                          </span>
                          <span>{s.unidadDepto}</span>
                        </div>
                      </td>

                      {/* Socio Titular */}
                      <td className="py-3.5 px-4">
                        {tieneNombre ? (
                          <div>
                            <strong className="text-white block font-semibold">{s.nombreCompleto}</strong>
                            <span className="text-[11px] text-slate-400">Titular de Adjudicación</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-xs">
                            Sin asignar (Clic en editar)
                          </span>
                        )}
                      </td>

                      {/* DNI */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {s.dni ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-200">{s.dni}</span>
                            {s.fotoDniUrl && (
                              <button
                                type="button"
                                onClick={() => abrirVisor(`Foto DNI - ${s.nombreCompleto}`, s.fotoDniUrl!, s.fotoDniNombre || 'DNI.jpg')}
                                title="Ver foto del DNI"
                                className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-slate-800 rounded transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>

                      {/* Contacto: Email y Teléfono */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {s.email ? (
                            <a
                              href={`mailto:${s.email}`}
                              className="text-slate-300 hover:text-white flex items-center gap-1.5 text-xs truncate max-w-[180px]"
                            >
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{s.email}</span>
                            </a>
                          ) : null}
                          {s.telefono ? (
                            <a
                              href={`https://wa.me/${s.telefono.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 text-xs font-mono"
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{s.telefono}</span>
                            </a>
                          ) : null}
                          {!s.email && !s.telefono && (
                            <span className="text-slate-500 text-xs">Sin contacto</span>
                          )}
                        </div>
                      </td>

                      {/* Pago Inicial y Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePago(s)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 border ${
                              s.pagoInicialEfectuado
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                            }`}
                            title="Clic para cambiar estado de pago inicial"
                          >
                            {s.pagoInicialEfectuado ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Abonado ({fmtMoneda(s.montoPagoInicial)})</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Pendiente</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Contrato Firmado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {s.contratoFirmadoUrl ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => abrirVisor(`Contrato Firmado - ${s.unidadDepto}`, s.contratoFirmadoUrl!, s.contratoFirmadoNombre || 'contrato.pdf')}
                              className="px-2.5 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                              title="Previsualizar o descargar contrato firmado"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Ver Contrato</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditarSocio(s)}
                            className="text-[11px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Cargar digital</span>
                          </button>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditarSocio(s)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. MODAL DE EDICIÓN / ALTA COMPLETA DEL SOCIO                        */}
      {/* ==================================================================== */}
      {isModalOpen && socioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Ficha del Socio — {socioEditando.unidadDepto}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentFondo.nombre} • Unidad #{socioEditando.numeroSocio}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarModal} className="space-y-4 text-xs sm:text-sm">
              
              {/* Bloque 1: Datos Personales */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
                  1. Datos Personales del Titular
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nombre y Apellido Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={socioEditando.nombreCompleto}
                      onChange={(e) => setSocioEditando({ ...socioEditando, nombreCompleto: e.target.value })}
                      placeholder="Ej: Juan Carlos Pérez"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      DNI / CUIT *
                    </label>
                    <input
                      type="text"
                      value={socioEditando.dni}
                      onChange={(e) => setSocioEditando({ ...socioEditando, dni: e.target.value })}
                      placeholder="Ej: 32.456.789"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={socioEditando.email}
                      onChange={(e) => setSocioEditando({ ...socioEditando, email: e.target.value })}
                      placeholder="socio@ejemplo.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={socioEditando.telefono}
                      onChange={(e) => setSocioEditando({ ...socioEditando, telefono: e.target.value })}
                      placeholder="Ej: +54 9 264 412 3456"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Carga de Foto de DNI */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Foto o Escaneo del DNI
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputDniRef}
                      onChange={handleFileDniChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputDniRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 cursor-pointer transition"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      <span>{socioEditando.fotoDniNombre ? 'Reemplazar Foto DNI' : 'Subir Foto DNI'}</span>
                    </button>
                    {socioEditando.fotoDniNombre && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{socioEditando.fotoDniNombre}</span>
                        <button
                          type="button"
                          onClick={() => setSocioEditando({ ...socioEditando, fotoDniUrl: undefined, fotoDniNombre: undefined })}
                          className="text-rose-400 hover:text-rose-300 text-xs ml-1"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloque 2: Estado del Pago Inicial */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  2. Acreditación del Pago Inicial (Condición de Socio Activo)
                </h4>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={socioEditando.pagoInicialEfectuado}
                      onChange={(e) =>
                        setSocioEditando({
                          ...socioEditando,
                          pagoInicialEfectuado: e.target.checked,
                          fechaPagoInicial: e.target.checked
                            ? socioEditando.fechaPagoInicial || new Date().toISOString().slice(0, 10)
                            : undefined
                        })
                      }
                      className="w-5 h-5 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">
                        Pago Inicial Efectuado y Acreditado
                      </span>
                      <span className="text-xs text-slate-400">
                        Habilita al socio como inversor pleno en el sistema.
                      </span>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Monto del Pago Inicial ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={socioEditando.montoPagoInicial || 0}
                        onChange={(e) => setSocioEditando({ ...socioEditando, montoPagoInicial: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Fecha de Acreditación
                      </label>
                      <input
                        type="date"
                        value={socioEditando.fechaPagoInicial || ''}
                        onChange={(e) => setSocioEditando({ ...socioEditando, fechaPagoInicial: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Archivo Digital del Contrato Firmado */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
                  3. Copia del Contrato Digital Firmado (PDF o Imagen)
                </h4>

                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  <input
                    type="file"
                    ref={fileInputContratoRef}
                    onChange={handleFileContratoChange}
                    accept="application/pdf,image/*"
                    className="hidden"
                  />

                  {socioEditando.contratoFirmadoUrl ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3">
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <strong className="text-white block text-xs">
                            {socioEditando.contratoFirmadoNombre || 'Contrato_Firmado.pdf'}
                          </strong>
                          <span className="text-[10px] text-indigo-300 font-mono">
                            Firmado el {socioEditando.fechaFirmaContrato || 'Fecha no especificada'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputContratoRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                        >
                          Reemplazar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSocioEditando({
                              ...socioEditando,
                              contratoFirmadoUrl: undefined,
                              contratoFirmadoNombre: undefined
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputContratoRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition group"
                    >
                      <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mx-auto mb-2 transition" />
                      <strong className="text-xs sm:text-sm text-slate-200 block group-hover:text-white">
                        Hacer clic para adjuntar el Contrato Firmado
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        Formatos aceptados: PDF o Imágenes escaneadas (JPG, PNG). El socio podrá consultarlo en su portal.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botonera de Guardado */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Ficha del Socio'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. MODAL VISOR DE DOCUMENTO (CONTRATO FIRMADO O DNI)                */}
      {/* ==================================================================== */}
      {docVisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header del Visor */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">
                    {docVisor.titulo}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {docVisor.nombreArchivo}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={docVisor.url}
                  download={docVisor.nombreArchivo}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Copia</span>
                </a>
                <button
                  type="button"
                  onClick={() => setDocVisor(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del Documento */}
            <div className="flex-1 bg-slate-950/80 p-4 overflow-auto flex items-center justify-center">
              {docVisor.esPdf ? (
                <iframe
                  src={docVisor.url}
                  title={docVisor.titulo}
                  className="w-full h-full rounded-xl border border-slate-800 bg-white"
                />
              ) : (
                <img
                  src={docVisor.url}
                  alt={docVisor.titulo}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-800"
                />
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { UserProfile } from '../types/auth';
import type { Mensaje, CategoriaMensaje } from '../types/mensajes';
import { CATEGORIAS_CONFIG } from '../types/mensajes';
import {
  getMensajesForUser,
  enviarMensaje,
  responderMensaje,
  marcarConversacionComoLeida
} from '../services/mensajeService';
import {
  MessageSquare,
  Send,
  Reply,
  CheckCheck,
  Clock,
  Shield,
  HardHat,
  User,
  X,
  AlertCircle,
  Inbox,
  Sparkles,
  Search
} from 'lucide-react';

interface CentroMensajesProps {
  user: UserProfile;
  fondoId: string;
  fondoNombre: string;
  cantidadSocios?: number;
  isOpen?: boolean;
  isEmbedded?: boolean;
  onClose?: () => void;
  onRefreshBadges?: () => void;
  initialContactRole?: 'tecnico' | 'socio';
  initialSocioId?: number;
}

export const CentroMensajes: React.FC<CentroMensajesProps> = ({
  user,
  fondoId,
  fondoNombre,
  cantidadSocios = 10,
  isOpen = true,
  isEmbedded = false,
  onClose,
  onRefreshBadges,
  initialContactRole = 'socio',
  initialSocioId = 1
}) => {
  // Lista total de mensajes visibles para este usuario
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  // Estado de navegación para Admin
  const [adminActiveTab, setAdminActiveTab] = useState<'socios' | 'tecnico'>(
    initialContactRole === 'tecnico' ? 'tecnico' : 'socios'
  );
  const [selectedSocioId, setSelectedSocioId] = useState<number>(initialSocioId);

  // Formulario de nuevo mensaje / respuesta
  const [replyingTo, setReplyingTo] = useState<Mensaje | null>(null);
  const [asunto, setAsunto] = useState<string>('');
  const [contenido, setContenido] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaMensaje>('consulta_general');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar mensajes
  const reloadMensajes = useCallback(() => {
    const list = getMensajesForUser(fondoId, user);
    setMensajes(list);
    if (onRefreshBadges) onRefreshBadges();
  }, [fondoId, user, onRefreshBadges]);

  useEffect(() => {
    reloadMensajes();
  }, [reloadMensajes]);

  // Determinar con quién es la conversación activa
  const targetInterlocutor = useMemo(() => {
    if (user.role === 'admin') {
      if (adminActiveTab === 'tecnico') {
        return {
          role: 'tecnico' as const,
          socioId: undefined,
          nombre: 'Equipo Técnico & Dirección de Obra',
          subtitulo: 'Canal de comunicaciones técnicas, certificaciones y gestoría municipal'
        };
      } else {
        return {
          role: 'socio' as const,
          socioId: selectedSocioId,
          nombre: `Socio Inversor - Unidad D${selectedSocioId}`,
          subtitulo: `Cuenta y consultas fiduciarias de la Unidad Departamental ${selectedSocioId}`
        };
      }
    } else if (user.role === 'tecnico') {
      return {
        role: 'admin' as const,
        socioId: undefined,
        nombre: 'Administración Fiduciaria',
        subtitulo: 'Canal oficial con el fiduciario para informes técnicos y certificaciones'
      };
    } else {
      // Socio
      return {
        role: 'admin' as const,
        socioId: undefined,
        nombre: 'Administración Fiduciaria',
        subtitulo: `Atención personalizada para el Socio Inversor D${user.socioId || 1}`
      };
    }
  }, [user, adminActiveTab, selectedSocioId]);

  // Mensajes correspondientes a la conversación activa
  const mensajesConversacion = useMemo(() => {
    return mensajes
      .filter((m) => {
        if (user.role === 'admin') {
          if (adminActiveTab === 'tecnico') {
            return m.senderRole === 'tecnico' || m.receiverRole === 'tecnico';
          } else {
            return (
              (m.senderRole === 'socio' && m.senderSocioId === selectedSocioId) ||
              (m.receiverRole === 'socio' && m.receiverSocioId === selectedSocioId)
            );
          }
        } else if (user.role === 'tecnico') {
          return m.senderRole === 'tecnico' || m.receiverRole === 'tecnico';
        } else {
          // Socio
          const sId = user.socioId || 1;
          return (
            (m.senderRole === 'socio' && m.senderSocioId === sId) ||
            (m.receiverRole === 'socio' && m.receiverSocioId === sId)
          );
        }
      })
      .filter((m) => {
        if (filtroCategoria !== 'todas' && m.categoria !== filtroCategoria) return false;
        if (busqueda.trim() !== '') {
          const q = busqueda.toLowerCase();
          return (
            m.asunto.toLowerCase().includes(q) ||
            m.contenido.toLowerCase().includes(q) ||
            (m.motivoPersonalizado && m.motivoPersonalizado.toLowerCase().includes(q)) ||
            m.senderNombre.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
  }, [mensajes, user, adminActiveTab, selectedSocioId, filtroCategoria, busqueda]);

  // Marcar conversación como leída al abrir
  useEffect(() => {
    if (user.role === 'admin') {
      marcarConversacionComoLeida(
        fondoId,
        user,
        adminActiveTab === 'tecnico' ? 'tecnico' : 'socio',
        adminActiveTab === 'socios' ? selectedSocioId : undefined
      ).then(() => {
        if (onRefreshBadges) onRefreshBadges();
      });
    } else {
      marcarConversacionComoLeida(fondoId, user, 'admin').then(() => {
        if (onRefreshBadges) onRefreshBadges();
      });
    }
  }, [fondoId, user, adminActiveTab, selectedSocioId, onRefreshBadges]);

  // Auto-scroll al final al recibir o enviar mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesConversacion.length]);

  // Iniciar respuesta a un mensaje
  const handleStartReply = (msg: Mensaje) => {
    setReplyingTo(msg);
    setCategoria(msg.categoria);
    if (msg.categoria === 'otros' && msg.motivoPersonalizado) {
      setMotivoPersonalizado(msg.motivoPersonalizado);
    }
    const nuevoAsunto = msg.asunto.startsWith('Re: ') ? msg.asunto : `Re: ${msg.asunto}`;
    setAsunto(nuevoAsunto);
    setFormError(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setAsunto('');
  };

  // Enviar mensaje o respuesta
  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!contenido.trim()) {
      setFormError('Por favor redacte el contenido del mensaje.');
      return;
    }

    if (!asunto.trim()) {
      setFormError('Por favor ingrese un asunto para el mensaje.');
      return;
    }

    if (categoria === 'otros' && !motivoPersonalizado.trim()) {
      setFormError('Para la categoría "Otros", debe indicar sucintamente el motivo.');
      return;
    }

    setEnviando(true);
    try {
      if (replyingTo) {
        // Enviar respuesta
        await responderMensaje(replyingTo, contenido.trim(), user);
      } else {
        // Enviar nuevo mensaje directo
        let receiverRole: 'admin' | 'tecnico' | 'socio' = 'admin';
        let receiverSocioId: number | undefined = undefined;

        if (user.role === 'admin') {
          if (adminActiveTab === 'tecnico') {
            receiverRole = 'tecnico';
          } else {
            receiverRole = 'socio';
            receiverSocioId = selectedSocioId;
          }
        }

        await enviarMensaje(
          {
            fondoId,
            receiverRole,
            receiverSocioId,
            categoria,
            motivoPersonalizado: categoria === 'otros' ? motivoPersonalizado.trim() : undefined,
            asunto: asunto.trim(),
            contenido: contenido.trim()
          },
          user
        );
      }

      // Limpiar formulario
      setContenido('');
      setAsunto('');
      setMotivoPersonalizado('');
      setReplyingTo(null);
      setCategoria('consulta_general');
      reloadMensajes();
    } catch (err: any) {
      setFormError(err?.message || 'Error al enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  // Ayudante de badges de no leídos por socio (para Admin)
  const unreadPorSocio = useMemo(() => {
    const counts: Record<number, number> = {};
    mensajes.forEach((m) => {
      if (!m.leido && m.receiverRole === 'admin' && m.senderRole === 'socio' && m.senderSocioId) {
        counts[m.senderSocioId] = (counts[m.senderSocioId] || 0) + 1;
      }
    });
    return counts;
  }, [mensajes]);

  // Badge de no leídos de técnico (para Admin)
  const unreadTecnico = useMemo(() => {
    return mensajes.filter(
      (m) => !m.leido && m.receiverRole === 'admin' && m.senderRole === 'tecnico'
    ).length;
  }, [mensajes]);

  // Si no está abierto (en modo modal), no renderizar
  if (!isEmbedded && !isOpen) return null;

  const content = (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden ${
      isEmbedded ? 'h-[750px] w-full' : 'h-[85vh] max-h-[820px] w-full max-w-5xl'
    }`}>
      {/* ------------------------------------------------------------------ */}
      {/* HEADER DEL CENTRO DE MENSAJES                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            user.role === 'admin'
              ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-600/20 text-white'
              : user.role === 'tecnico'
              ? 'bg-gradient-to-tr from-amber-600 to-amber-500 shadow-amber-600/20 text-white'
              : 'bg-gradient-to-tr from-emerald-600 to-emerald-500 shadow-emerald-600/20 text-white'
          }`}>
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Centro de Comunicaciones Fiduciarias
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                {fondoNombre}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {user.role === 'admin'
                ? 'Gestión centralizada de comunicaciones con Socios Inversores y Equipo Técnico'
                : user.role === 'tecnico'
                ? 'Canal directo y exclusivo con el Administrador Fiduciario'
                : `Canal privado y confidencial para la Unidad D${user.socioId || 1}`}
            </p>
          </div>
        </div>

        {!isEmbedded && onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-all"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CUERPO PRINCIPAL                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL LATERAL PARA ADMINISTRADOR (Socios vs Técnico) */}
        {user.role === 'admin' && (
          <div className="w-64 sm:w-72 border-r border-slate-800 bg-slate-950/40 flex flex-col">
            {/* Pestañas de categoría de contacto */}
            <div className="p-3 border-b border-slate-800/80 flex gap-1.5">
              <button
                onClick={() => setAdminActiveTab('socios')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  adminActiveTab === 'socios'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Socios ({cantidadSocios})</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('tecnico')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  adminActiveTab === 'tecnico'
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>Técnico</span>
                {unreadTecnico > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold animate-pulse">
                    {unreadTecnico}
                  </span>
                )}
              </button>
            </div>

            {/* Lista de contactos */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {adminActiveTab === 'socios' ? (
                Array.from({ length: cantidadSocios }).map((_, idx) => {
                  const sId = idx + 1;
                  const isSelected = selectedSocioId === sId;
                  const unread = unreadPorSocio[sId] || 0;

                  return (
                    <button
                      key={sId}
                      onClick={() => setSelectedSocioId(sId)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          D{sId}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">Socio Unidad D{sId}</div>
                          <div className="text-[10px] text-slate-500">Inversor suscriptor</div>
                        </div>
                      </div>

                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div
                  className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1"
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-amber-400" />
                    <span>Equipo Técnico & Obra</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Dirección de Obra, Gestoría de Planos y Permisos Municipales.
                  </p>
                </div>
              )}
            </div>

            {/* Aviso informativo de aislamiento estricto */}
            <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 leading-tight">
              <span className="font-bold text-slate-400 block mb-0.5">Aislamiento Estricto:</span>
              Los socios no tienen visibilidad de mensajes técnicos ni entre sí.
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ÁREA DE CONVERSACIÓN / CHAT                                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex-1 flex flex-col bg-slate-900/60 overflow-hidden">
          {/* Barra superior de la conversación activa */}
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                targetInterlocutor.role === 'admin'
                  ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-400'
                  : targetInterlocutor.role === 'tecnico'
                  ? 'bg-amber-950/60 border-amber-700/50 text-amber-400'
                  : 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
              }`}>
                {targetInterlocutor.role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : targetInterlocutor.role === 'tecnico' ? (
                  <HardHat className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{targetInterlocutor.nombre}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {targetInterlocutor.subtitulo}
                </p>
              </div>
            </div>

            {/* Filtros rápidos de conversación */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-28 sm:w-36 transition-all"
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 text-slate-300 text-xs py-1 px-2 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="todas">Todas las categorías</option>
                {Object.values(CATEGORIAS_CONFIG).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de mensajes (timeline) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {mensajesConversacion.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-300">No hay mensajes aún en este canal</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  Utilice el formulario inferior para redactar el primer mensaje oficial.
                </p>
              </div>
            ) : (
              mensajesConversacion.map((msg) => {
                const isMyMessage = msg.senderRole === user.role && (
                  user.role !== 'socio' || msg.senderSocioId === user.socioId
                );
                const catInfo = CATEGORIAS_CONFIG[msg.categoria] || CATEGORIAS_CONFIG.consulta_general;
                const formattedDate = new Date(msg.fechaCreacion).toLocaleString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 space-y-2.5 shadow-md border ${
                      isMyMessage
                        ? 'bg-indigo-950/40 border-indigo-500/30 text-slate-100 rounded-tr-sm'
                        : msg.senderRole === 'tecnico'
                        ? 'bg-amber-950/30 border-amber-600/30 text-slate-100 rounded-tl-sm'
                        : msg.senderRole === 'admin'
                        ? 'bg-slate-800/80 border-slate-700/80 text-slate-100 rounded-tl-sm'
                        : 'bg-emerald-950/30 border-emerald-600/30 text-slate-100 rounded-tl-sm'
                    }`}>
                      {/* Remitente y Badge de categoría */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/40 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${
                            msg.senderRole === 'admin'
                              ? 'text-indigo-400'
                              : msg.senderRole === 'tecnico'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {msg.senderRole === 'admin' ? (
                              <Shield className="w-3 h-3" />
                            ) : msg.senderRole === 'tecnico' ? (
                              <HardHat className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {msg.senderNombre}
                          </span>

                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            {formattedDate}
                          </span>
                        </div>

                        {/* Badges de Categoría y Motivo */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catInfo.badgeClass}`}>
                            {catInfo.label}
                          </span>

                          {msg.categoria === 'otros' && msg.motivoPersonalizado && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30"
                              title={`Motivo: ${msg.motivoPersonalizado}`}
                            >
                              Motivo: {msg.motivoPersonalizado}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Asunto */}
                      <div className="text-xs font-bold text-white tracking-wide">
                        {msg.asunto}
                      </div>

                      {/* Cuadro de Respuesta / Cita (si aplica) */}
                      {msg.replyToPreview && (
                        <div className="bg-slate-900/80 border-l-2 border-indigo-400 px-3 py-1.5 rounded-r-lg text-[11px] text-slate-400 space-y-0.5">
                          <span className="text-[10px] font-bold text-indigo-300 block">
                            En respuesta a {msg.replyToPreview.senderNombre}:
                          </span>
                          <p className="line-clamp-2 italic text-slate-300">
                            "{msg.replyToPreview.contenido}"
                          </p>
                        </div>
                      )}

                      {/* Contenido del mensaje */}
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {msg.contenido}
                      </p>

                      {/* Footer del mensaje: Botón responder y confirmación de lectura */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/30 text-[11px]">
                        <button
                          onClick={() => handleStartReply(msg)}
                          className="text-slate-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Responder</span>
                        </button>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          {msg.leido ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCheck className="w-3 h-3" />
                              Leído
                            </span>
                          ) : (
                            <span className="text-slate-500">Pendiente</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* FORMULARIO DE ENVÍO / RESPUESTA                                    */}
          {/* ------------------------------------------------------------------ */}
          <div className="p-3.5 sm:p-4 bg-slate-950/90 border-t border-slate-800">
            <form onSubmit={handleEnviar} className="space-y-3">
              {/* Banner de respuesta activa */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-indigo-950/60 border border-indigo-500/40 px-3 py-2 rounded-xl text-xs text-indigo-200">
                  <div className="flex items-center gap-2 truncate">
                    <Reply className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">
                      Respondiendo a: <strong>{replyingTo.senderNombre}</strong> —{' '}
                      <em>"{replyingTo.asunto}"</em>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelReply}
                    className="p-1 hover:bg-indigo-900/60 rounded-lg text-indigo-300 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Fila de Categoría, Motivo (si otros) y Asunto */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Selector de Categoría */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Categorización del Mensaje
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaMensaje)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {Object.values(CATEGORIAS_CONFIG).map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo de Motivo Sucinto (visible cuando categoría es 'otros') */}
                {categoria === 'otros' ? (
                  <div className="sm:col-span-4 animate-in fade-in duration-200">
                    <label className="block text-[11px] font-semibold text-amber-300 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Motivo sucinto (Obligatorio)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Reunión por garantía o trámites"
                      value={motivoPersonalizado}
                      onChange={(e) => setMotivoPersonalizado(e.target.value)}
                      maxLength={120}
                      className="w-full bg-slate-800 border border-amber-500/50 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ) : null}

                {/* Asunto */}
                <div className={categoria === 'otros' ? 'sm:col-span-4' : 'sm:col-span-8'}>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Asunto
                  </label>
                  <input
                    type="text"
                    placeholder="Título breve del mensaje..."
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    maxLength={140}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Área de texto de contenido */}
              <div>
                <textarea
                  rows={3}
                  placeholder={`Escriba su mensaje formal para ${targetInterlocutor.nombre}...`}
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              {/* Mensaje de Error si lo hay */}
              {formError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 px-3 py-1.5 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Botón de Enviar */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {replyingTo ? 'Respondiendo al hilo' : `Enviando a: ${targetInterlocutor.nombre}`}
                </span>

                <button
                  type="submit"
                  disabled={enviando}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{enviando ? 'Enviando...' : replyingTo ? 'Enviar Respuesta' : 'Enviar Mensaje'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  // Modal con backdrop
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl flex justify-center">
        {content}
      </div>
    </div>
  );
};

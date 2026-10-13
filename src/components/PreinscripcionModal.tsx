import React, { useState } from 'react';
import {
  X,
  User,
  CreditCard,
  Phone,
  Mail,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Send,
  MessageSquare,
  Calendar as CalendarIcon
} from 'lucide-react';
import {
  WHATSAPP_CONTACT_NUMBER,
  GOOGLE_CALENDAR_MEETING_URL,
  ADMIN_EMAIL_DESTINATARIO,
  generarEnlaceWhatsApp,
  generarEnlaceWhatsAppFichaPreinscripcion
} from '../types/preinscripcion';
import { guardarPreinscripcion } from '../services/preinscripcionService';
import { trackLeadGenerado } from '../services/analyticsService';

interface PreinscripcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoNombre?: string;
  proyectoId?: string;
  cuotaEstimada?: number;
  anticipoEstimado?: number;
}

export const PreinscripcionModal: React.FC<PreinscripcionModalProps> = ({
  isOpen,
  onClose,
  proyectoNombre = 'Fideicomiso Inmobiliario',
  proyectoId,
  cuotaEstimada,
  anticipoEstimado
}) => {
  const [nombreApellido, setNombreApellido] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [importeMensual, setImporteMensual] = useState<string>(
    cuotaEstimada && cuotaEstimada > 0 ? String(Math.round(cuotaEstimada)) : ''
  );
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('USD');

  // Sincronizar cuota estimada precargada al abrir el modal o recibir nuevos valores calculados
  React.useEffect(() => {
    if (isOpen) {
      if (cuotaEstimada && cuotaEstimada > 0) {
        setImporteMensual(String(Math.round(cuotaEstimada)));
      }
      setErrorValidacion(null);
    }
  }, [isOpen, cuotaEstimada]);

  // Estado de envío y errores
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [whatsappFichaUrl, setWhatsappFichaUrl] = useState<string>('');
  const [emailDespachado, setEmailDespachado] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    // 1. Validaciones de obligatoriedad estricta
    const nombreLimpio = nombreApellido.trim();
    const dniLimpio = dni.trim();
    const telLimpio = telefono.trim();
    const emailLimpio = email.trim();
    const montoNum = parseFloat(importeMensual.replace(/[^0-9.]/g, ''));

    if (!nombreLimpio) {
      setErrorValidacion('Por favor, ingresa tu Nombre y Apellido completo.');
      return;
    }
    if (!dniLimpio || dniLimpio.length < 6) {
      setErrorValidacion('Por favor, ingresa un número de DNI válido.');
      return;
    }
    if (!telLimpio || telLimpio.length < 7) {
      setErrorValidacion('Por favor, ingresa un número de Teléfono de contacto válido.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailLimpio || !emailRegex.test(emailLimpio)) {
      setErrorValidacion('Por favor, ingresa una dirección de Email válida.');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorValidacion('Por favor, ingresa el Importe mensual disponible para invertir (mayor a 0).');
      return;
    }

    setIsSubmitting(true);

    try {
      const resultado = await guardarPreinscripcion({
        proyectoNombre,
        proyectoId,
        nombreApellido: nombreLimpio,
        dni: dniLimpio,
        telefono: telLimpio,
        email: emailLimpio,
        importeMensualInvertir: montoNum,
        moneda,
        cuotaSimulada: cuotaEstimada,
        anticipoSimulado: anticipoEstimado
      });

      if (resultado.success) {
        setTicketId(resultado.leadId);
        setWhatsappFichaUrl(resultado.whatsappUrl);
        setEmailDespachado(resultado.emailEnviado);
        setEnviadoExitoso(true);

        // Track: lead generado con montos reales
        trackLeadGenerado(
          anticipoEstimado || 0,
          montoNum,
          proyectoNombre,
          resultado.leadId
        );

        // Abrir automáticamente WhatsApp con la ficha precargada
        if (typeof window !== 'undefined' && resultado.whatsappUrl) {
          try {
            window.open(resultado.whatsappUrl, '_blank');
          } catch {
            // Popup bloqueado
          }
        }
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorValidacion(errObj?.message || 'Ocurrió un error al registrar tu preinscripción. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetYSalir = () => {
    setEnviadoExitoso(false);
    setNombreApellido('');
    setDni('');
    setTelefono('');
    setEmail('');
    setImporteMensual('');
    setErrorValidacion(null);
    onClose();
  };

  const urlWhatsappConDatos = generarEnlaceWhatsApp(
    proyectoNombre,
    cuotaEstimada,
    parseFloat(importeMensual) || undefined
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden my-auto">
        
        {/* Cabecera decorativa premium */}
        <div className="bg-gradient-to-r from-amber-600/30 via-emerald-600/20 to-slate-900 border-b border-slate-800 p-5 sm:p-6 flex items-start justify-between relative">
          <div className="space-y-1 pr-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Preinscripción Fiduciaria Oficial</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>Asegura tu Cupo de Inversión</span>
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Proyecto: <strong className="text-emerald-300">{proyectoNombre}</strong></span>
            </p>
          </div>

          <button
            type="button"
            id="btn-close-preinscripcion-modal"
            onClick={handleResetYSalir}
            aria-label="Cerrar modal de preinscripción"
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO: Formulario o Pantalla de Éxito */}
        <div className="p-5 sm:p-6">
          {enviadoExitoso ? (
            <div className="text-center py-3 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xl font-extrabold text-white">
                  ¡Preinscripción Registrada con Éxito!
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Gracias <strong className="text-white">{nombreApellido}</strong>. Tu interés en <strong className="text-emerald-300">{proyectoNombre}</strong> ha sido transmitido a la Administración Fiduciaria.
                </p>
                {ticketId && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Código de Registro: <span className="text-amber-400 font-semibold">{ticketId.slice(0, 16)}</span>
                  </p>
                )}
              </div>

              {/* Estado de los 2 canales de destino solicitados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Correo de Administración</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {emailDespachado ? '✓ Enviado a ' : '✓ Despachado a '}
                    <strong className="text-white">{ADMIN_EMAIL_DESTINATARIO}</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Oficial</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Dirigido al <strong className="text-emerald-300">{WHATSAPP_CONTACT_NUMBER}</strong>
                  </p>
                </div>
              </div>

              {/* Tarjeta de Acción Primaria: WhatsApp con la Ficha Completa */}
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-950 to-emerald-950/70 border border-emerald-500/40 rounded-2xl p-4 text-left space-y-3 shadow-lg shadow-emerald-500/10">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Envío Inmediato de Ficha por WhatsApp</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Hemos preparado el mensaje con tu DNI, contacto e importe disponible listo para enviar al asesor.
                  </p>
                </div>

                <a
                  href={
                    whatsappFichaUrl ||
                    generarEnlaceWhatsAppFichaPreinscripcion({
                      nombreApellido,
                      dni,
                      telefono,
                      email,
                      proyectoNombre: proyectoNombre || 'Fideicomiso Inmobiliario',
                      proyectoId,
                      importeMensualInvertir: parseFloat(importeMensual) || 0,
                      moneda,
                      cuotaSimulada: cuotaEstimada,
                      anticipoSimulado: anticipoEstimado,
                      id: ticketId || undefined
                    })
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Ficha a WhatsApp ({WHATSAPP_CONTACT_NUMBER})</span>
                </a>
              </div>

              {/* Botón secundario: Google Calendar y Volver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={GOOGLE_CALENDAR_MEETING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Entrevista 1 a 1 Online</span>
                </a>

                <button
                  type="button"
                  onClick={handleResetYSalir}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Volver al Simulador
                </button>
              </div>

            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Resumen del plan que está preinscribiendo */}
              {(cuotaEstimada || anticipoEstimado) && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Cuota mensual estimada:</span>
                    <strong className="text-emerald-400 text-sm font-mono">
                      USD ${cuotaEstimada ? Math.round(cuotaEstimada).toLocaleString('es-AR') : '--'}
                    </strong>
                  </div>
                  {anticipoEstimado && anticipoEstimado > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Anticipo proyectado:</span>
                      <strong className="text-amber-400 text-sm font-mono">
                        USD ${Math.round(anticipoEstimado).toLocaleString('es-AR')}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje de error de validación */}
              {errorValidacion && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorValidacion}</span>
                </div>
              )}

              <p className="text-[11px] text-amber-400/90 font-medium">
                * Todos los datos a continuación son obligatorios para validar tu reserva y coordinar la documentación fiduciaria.
              </p>

              {/* Campo 1: Nombre y Apellido */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nombre y Apellido <span className="text-amber-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={nombreApellido}
                  onChange={(e) => setNombreApellido(e.target.value)}
                  placeholder="Ej: Juan Martín Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Fila 2: DNI y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>DNI / CUIT <span className="text-amber-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej: 32.456.789"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Teléfono Móvil <span className="text-amber-400">*</span></span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: +54 9 264 4123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Campo 3: Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Correo Electrónico <span className="text-amber-400">*</span></span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: juan.perez@ejemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Campo 4: Importe disponible por mes para invertir */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Importe disponible por mes para invertir <span className="text-amber-400">*</span></span>
                  </span>
                  <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setMoneda('USD')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        moneda === 'USD'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoneda('ARS')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        moneda === 'ARS'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ARS
                    </button>
                  </div>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-bold">
                    {moneda === 'USD' ? 'US$' : '$'}
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={importeMensual}
                    onChange={(e) => setImporteMensual(e.target.value)}
                    placeholder="Ej: 1500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Indica con cuánto capital mensual proyectas participar para coordinar el plan a tu medida.
                </p>
              </div>

              {/* Botón de Enviar Preinscripción */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Registrando Preinscripción...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span>Confirmar y Enviar Preinscripción</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Canales alternativos directos */}
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-[11px] text-center text-slate-400 mb-2">
                  ¿Prefieres consultar directamente antes de completar el formulario?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={urlWhatsappConDatos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp {WHATSAPP_CONTACT_NUMBER}</span>
                  </a>
                  <a
                    href={GOOGLE_CALENDAR_MEETING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Entrevista 1 a 1 Online</span>
                  </a>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

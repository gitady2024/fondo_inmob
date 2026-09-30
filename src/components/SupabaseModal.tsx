import React, { useState, useEffect } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  resetSupabaseClient
} from '../lib/supabase';
import { listFondos, saveFondo, loadFondoById } from '../services/fondoService';
import type { FondoGuardado } from '../services/fondoService';

import type {
  ParametrosFondoState,
  GastosConfigState,
  CesionConfigState,
  AdelantoConfigState
} from '../types/fondo';
import {
  Database,
  Cloud,
  HardDrive,
  Save,
  FolderOpen,
  X,
  Key,
  Globe,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  anticipos: number[];
  adjudicacionFijada: Record<number, number>;
  cesion: CesionConfigState;
  adelanto: AdelantoConfigState;
  onLoadFondo: (fondo: FondoGuardado) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  params,
  gastos,
  anticipos,
  adjudicacionFijada,
  cesion,
  adelanto,
  onLoadFondo
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [nombreFondo, setNombreFondo] = useState('Círculo Inmobiliario 1');
  const [fondosGuardados, setFondosGuardados] = useState<{ id: string; nombre: string; updated_at: string }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fondos' | 'conexion'>('fondos');

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      refreshLista();
    }
  }, [isOpen]);

  const refreshLista = async () => {
    const list = await listFondos();
    setFondosGuardados(list);
  };

  const handleGuardarConfig = () => {
    saveSupabaseConfig(url.trim(), anonKey.trim());
    resetSupabaseClient();
    setMensajeExito('Configuración de Supabase actualizada exitosamente');
    refreshLista();
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const handleGuardarFondo = async () => {
    setGuardando(true);
    try {
      const res = await saveFondo(
        nombreFondo.trim() || 'Fondo Inmobiliario',
        params,
        gastos,
        anticipos,
        adjudicacionFijada,
        cesion,
        adelanto
      );
      setMensajeExito(`Círculo guardado correctamente (${res.guardadoEn === 'supabase' ? 'en la nube Supabase' : 'localmente'})`);
      refreshLista();
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const handleCargar = async (id: string) => {
    const fondo = await loadFondoById(id);
    if (fondo) {
      onLoadFondo(fondo);
      setMensajeExito(`Círculo "${fondo.nombre}" cargado con éxito`);
      setTimeout(() => {
        setMensajeExito(null);
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  const conectado = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Persistencia y Proyectos Inmobiliarios
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {conectado ? (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" /> Supabase Cloud Conectado
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" /> Modo Local (Almacenamiento en Navegador)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('fondos')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'fondos'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Guardar y Cargar Círculos
          </button>
          <button
            onClick={() => setActiveTab('conexion')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'conexion'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Configurar Credenciales Supabase
          </button>
        </div>

        {/* Notificación de éxito */}
        {mensajeExito && (
          <div className="mx-5 mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'fondos' ? (
            <>
              {/* Guardar estado actual */}
              <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl space-y-3">
                <span className="font-bold text-slate-200 text-xs block">
                  Guardar Círculo Actual
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={nombreFondo}
                    onChange={(e) => setNombreFondo(e.target.value)}
                    placeholder="Nombre del Fideicomiso / Círculo..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleGuardarFondo}
                    disabled={guardando}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{guardando ? 'Guardando...' : 'Guardar Estado'}</span>
                  </button>
                </div>
              </div>

              {/* Lista de círculos guardados */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 block">
                  Círculos Guardados ({fondosGuardados.length})
                </span>

                {fondosGuardados.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                    No hay círculos guardados aún. Guarda el estado actual para conservarlo.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {fondosGuardados.map((f) => (
                      <div
                        key={f.id}
                        className="bg-slate-900/80 border border-slate-700/80 hover:border-indigo-500/60 p-3 rounded-xl flex justify-between items-center transition-colors"
                      >
                        <div>
                          <strong className="text-slate-100 block text-xs">{f.nombre}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Modificado: {new Date(f.updated_at).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCargar(f.id)}
                          className="bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors text-[11px]"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Cargar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Formulario de credenciales */}
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    Project URL de Supabase (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xxxxxxxxxxxx.supabase.co"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Anon Public API Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <a
                    href="https://app.supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] underline"
                  >
                    Abrir Consola de Supabase <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={handleGuardarConfig}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar y Conectar</span>
                  </button>
                </div>

                {/* Info sobre el script SQL */}
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1.5 text-slate-300">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Esquema SQL Listo en el Proyecto
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Hemos generado el archivo <code className="text-indigo-300">supabase/schema.sql</code> con la creación de tablas (<code className="text-slate-300">fondos</code>, <code className="text-slate-300">socios</code>, <code className="text-slate-300">pagos_cuotas</code>, <code className="text-slate-300">cesiones_contractuales</code>) y políticas de seguridad RLS. Solo debes pegarlo en el <em>SQL Editor</em> de tu proyecto en Supabase.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import type { FondoGuardado } from '../services/fondoService';
import {
  type ChatMessage,
  consultarAsesorGemini,
  getGeminiApiKey,
  setGeminiApiKey
} from '../services/geminiService';
import {
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  Key,
  Check,
  ArrowRight
} from 'lucide-react';

interface ChatbotAsesorProps {
  proyectosActivos: FondoGuardado[];
  currentFondo?: FondoGuardado;
  onNavigate?: (route: 'landing' | 'app' | 'obras') => void;
  onOpenSimulador?: () => void;
}

const PREGUNTAS_RAPIDAS = [
  '¿Cómo funciona el fideicomiso al costo?',
  '¿Por qué es mejor que un crédito UVA?',
  '¿Qué obras tienen disponibles hoy?',
  '¿Cuánto es el anticipo y las cuotas?'
];

export const ChatbotAsesor: React.FC<ChatbotAsesorProps> = ({
  proyectosActivos,
  currentFondo,
  onNavigate,
  onOpenSimulador
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConfigApiKey, setShowConfigApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: '¡Hola! Soy tu **Asesor Virtual Fiduciario** en **Inverfondo**.\n\nPuedo responder cualquier duda sobre cómo funciona el sistema al costo, la diferencia con los créditos bancarios UVA, o los proyectos disponibles en este momento. ¿En qué te puedo ayudar?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '💡 ¿Cómo funciona?', action: 'simular' },
        { label: '🏗️ Ver proyectos activos', action: 'obras' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentKey = getGeminiApiKey();
    setHasCustomKey(Boolean(currentKey));
    setApiKeyInput(currentKey);
  }, [showConfigApiKey]);

  useEffect(() => {
    if (isOpen) {
      setHasUnreadNotification(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const respuesta = await consultarAsesorGemini({
        historial: [...messages, userMsg],
        nuevoMensaje: messageContent,
        proyectosActivos,
        currentFondo
      });

      setMessages((prev) => [...prev, respuesta]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Disculpas, hubo una interrupción momentánea de conexión. Podés consultar de forma directa con nuestro equipo comercial por WhatsApp.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: [{ label: '💬 Consultar por WhatsApp', action: 'whatsapp' }]
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action === 'simular') {
      if (onOpenSimulador) {
        onOpenSimulador();
      } else if (onNavigate) {
        onNavigate('app');
      }
      setIsOpen(false);
    } else if (action === 'obras') {
      if (onNavigate) {
        onNavigate('obras');
      }
      setIsOpen(false);
    } else if (action === 'whatsapp') {
      const msg = encodeURIComponent(
        'Hola, estuve consultando en la web de Inverfondo y me gustaría recibir asesoramiento personalizado sobre los planes fiduciarios al costo.'
      );
      window.open(`https://wa.me/5491161234567?text=${msg}`, '_blank');
    }
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
    setHasCustomKey(Boolean(apiKeyInput.trim()));
    setShowConfigApiKey(false);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: '¡Conversación reiniciada! ¿Qué consulta tenés sobre los planes fiduciarios al costo de **Inverfondo**?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: '💡 ¿Cómo funciona?', action: 'simular' },
          { label: '🏗️ Ver proyectos activos', action: 'obras' }
        ]
      }
    ]);
  };

  return (
    <aside aria-label="Asistente Virtual" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans print:hidden">
      {/* ==================================================================== */}
      {/* 1. BOTÓN FLOTANTE (ESTADO CERRADO)                                   */}
      {/* ==================================================================== */}
      {!isOpen && (
        <div className="relative group">
          {/* Badge o notificación flotante */}
          {hasUnreadNotification && (
            <div className="absolute -top-10 right-0 bg-slate-900 text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-xl whitespace-nowrap animate-bounce flex items-center gap-1.5 pointer-events-none">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>¿Dudas sobre el plan? Chateá con IA</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-600 text-slate-950 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer relative overflow-hidden group"
            title="Abrir Asesor Virtual de Inverfondo con IA"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src="/isologo-fondin.png"
              alt="Inverfondo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow"
            />
            {/* Indicador de activo */}
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. VENTANA DE CHAT (ESTADO ABIERTO)                                  */}
      {/* ==================================================================== */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] max-h-[calc(100vh-6rem)] bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-fade-in transition-all">
          
          {/* CABECERA INSTITUCIONAL */}
          <header className="px-4 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-white tracking-tight leading-none">
                    Asesor Fiduciario IA
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Gemini
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Inverfondo • En línea
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Botón Configurar API Key */}
              <button
                type="button"
                onClick={() => setShowConfigApiKey((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  hasCustomKey
                    ? 'text-emerald-400 hover:bg-emerald-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Configurar Google Gemini API Key"
              >
                <Key className="w-4 h-4" />
              </button>

              {/* Botón Reiniciar conversación */}
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition cursor-pointer"
                title="Reiniciar chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition cursor-pointer ml-1"
                title="Minimizar asesor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* PANEL OPCIONAL: CONFIGURAR API KEY */}
          {showConfigApiKey && (
            <div className="bg-slate-900 p-3.5 border-b border-slate-800 text-xs text-slate-300 space-y-2 animate-fade-in shrink-0">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Google Gemini API Key
                </span>
                <span className="text-[10px] text-slate-400">Opcional</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Si no ingresas una clave, el asesor funcionará en <strong>Modo Local Inteligente</strong> utilizando las obras y datos en tiempo real de Inverfondo.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Pegar AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          )}

          {/* CUERPO DEL CHAT (MENSAJES) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 space-y-1.5 leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                        {paragraph.split('**').map((part, i) =>
                          i % 2 === 1 ? (
                            <strong key={i} className={msg.sender === 'user' ? 'font-black' : 'font-bold text-white'}>
                              {part}
                            </strong>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Acciones sugeridas dentro del mensaje */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-800/80 mt-2">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          type="button"
                          onClick={() => handleActionClick(act.action)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 px-1 mt-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Indicador de escritura animado */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 border border-slate-800 rounded-2xl px-3.5 py-2 max-w-[140px] animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-[11px]">Escribiendo...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* CHIPS DE PREGUNTAS FRECUENTES RÁPIDAS (1-CLIC) */}
          <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {PREGUNTAS_RAPIDAS.map((pregunta, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(pregunta)}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium border border-slate-700/60 transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {pregunta}
              </button>
            ))}
          </div>

          {/* CAJA DE TEXTO / FOOTER */}
          <footer className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Preguntá lo que quieras sobre el plan..."
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
              disabled={isTyping}
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </footer>
        </div>
      )}
    </aside>
  );
};

import React from 'react';
import { Calendar, ArrowRight, ShieldCheck, Sparkles, Building2, Lock } from 'lucide-react';

interface LandingPageProps {
  onStartSimulation: () => void;
  onOpenStaffLogin: () => void;
  onOpenPerfiles?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSimulation,
  onOpenStaffLogin,
  onOpenPerfiles
}) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full text-slate-100 relative">
      {/* Botón Flotante CTA */}
      <a
        id="btn-flotante-calendar"
        href="https://calendar.app.google/aacxfmLJk73KnyB39"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3.5 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] font-bold text-xs sm:text-sm flex items-center gap-2 transition transform hover:scale-105"
      >
        <Calendar className="w-4 h-4" />
        <span>Agendar Entrevista para Ingresar</span>
      </a>

      {/* ========================================== */}
      {/* CABECERA DE LA LANDING                    */}
      {/* ========================================== */}
      <nav className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md mb-8 px-4 sm:px-6 py-4 transition-all">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-600/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Fondo Inmobiliario <span className="text-indigo-400">1</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">Inversión Fiduciaria al Costo</span>
            </div>
          </div>

          {/* Enlaces Desktop */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('comparativa')}
              className="text-slate-300 hover:text-white transition cursor-pointer"
            >
              Fondo vs UVA
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('como-funciona')}
              className="text-slate-300 hover:text-white transition cursor-pointer"
            >
              Cómo Funciona
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('seguridad')}
              className="text-slate-300 hover:text-white transition cursor-pointer"
            >
              Seguridad Legal
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenStaffLogin}
              title="Acceso exclusivo para administradores fiduciarios y equipo técnico"
              className="text-xs font-bold text-amber-300 hover:text-white border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Acceso Staff</span>
            </button>
            <button
              type="button"
              onClick={onStartSimulation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition transform hover:scale-105 cursor-pointer"
            >
              Simular Inversión
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* HERO SECTION                               */}
      {/* ========================================== */}
      <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800/80 mb-10 px-4 sm:px-8 text-center space-y-7">
        <div className="inline-block bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300">
          🚀 Fideicomiso al Costo Real (Art. 1666 CCCN)
        </div>
        
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Dejá de alquilar plata al banco. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Comprá Ladrillos.
          </span>
        </h1>
        
        <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          Ingresá al mercado inmobiliario al costo con un anticipo desde <strong className="text-white font-semibold">USD 10.000</strong>. Sin la trampa de la inflación UVA, sin intereses usureros y con la libertad de vender tu contrato cuando quieras.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={onStartSimulation}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Diseñar mi Plan a Medida</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <a
            href="https://calendar.app.google/aacxfmLJk73KnyB39"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-sm sm:text-base font-bold px-8 py-3.5 rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Agendar Videollamada</span>
          </a>
        </div>

        {onOpenPerfiles && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenPerfiles}
              className="text-xs text-slate-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
            >
              ¿Ya sos socio adjudicado o técnico? Ingresar por selector de perfiles →
            </button>
          </div>
        )}
      </section>

      {/* ========================================== */}
      {/* COMPARATIVA (FONDO VS UVA)                */}
      {/* ========================================== */}
      <section id="comparativa" className="py-14 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              El Problema del Crédito UVA vs La Evolución del Fondo 1
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              Comparamos el modelo tradicional bancario con nuestro vehículo de inversión directa al costo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tarjeta UVA */}
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-7 opacity-85">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🏦</span>
                <h3 className="text-xl font-bold text-rose-300">Crédito UVA (Bancos)</h3>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">❌</span>
                  <span><strong>Riesgo de Inflación:</strong> Tu deuda en pesos crece todos los días. Pagás interés sobre la inflación.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">❌</span>
                  <span><strong>Plazos Asfixiantes:</strong> Quedás endeudado por 20 o 30 años con hipoteca en primer grado.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">❌</span>
                  <span><strong>Atrapado:</strong> Vender una propiedad hipotecada es un trámite burocrático, costoso y riesgoso.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">❌</span>
                  <span><strong>Requisitos:</strong> Ingresos formales altísimos, historial bancario y ahorro previo desmedido.</span>
                </li>
              </ul>
            </div>

            {/* Tarjeta Fondo 1 */}
            <div className="bg-emerald-950/20 border-2 border-emerald-500/50 rounded-2xl p-7 relative shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="absolute -top-3.5 right-6 bg-emerald-500 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                La Solución
              </div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🏗️</span>
                <h3 className="text-xl font-bold text-emerald-400">Fondo Inmobiliario 1</h3>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>Costo Real Blindado:</strong> Acopiamos materiales para congelar precios. Cero tasas bancarias usurarias.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>Plazos Cortos:</strong> Te capitalizás y sos dueño en un ciclo de 36 a 48 meses.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>Mercado Líquido:</strong> Podés ceder tu contrato en cualquier momento, recuperar tus dólares y capitalizar el avance de obra.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span><strong>Inclusión Directa:</strong> Entrás con USD 10.000 sin importar tu score bancario.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* CÓMO FUNCIONA                             */}
      {/* ========================================== */}
      <section id="como-funciona" className="py-14 border-t border-slate-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-10">
            Un proceso transparente en 3 simples pasos
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative text-left">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-lg font-bold mb-4 border border-indigo-500/30">
                1
              </div>
              <h4 className="text-base font-bold text-white mb-2">Ticket de Ingreso</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Firmás tu adhesión al fideicomiso integrando un anticipo inicial accesible desde USD 10.000.
              </p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative text-left">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-lg font-bold mb-4 border border-indigo-500/30">
                2
              </div>
              <h4 className="text-base font-bold text-white mb-2">Cuotas al Costo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Abonás tu plan mes a mes. El dinero se usa exclusivamente para comprar materiales y avanzar la obra (Índice CAC).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative text-left">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-lg font-bold mb-4 border border-indigo-500/30">
                3
              </div>
              <h4 className="text-base font-bold text-white mb-2">Llaves o Ganancia</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Al llegar a la cuota estipulada recibís tu unidad. ¿Cambiaste de idea? Cedés tu posición y te llevás la rentabilidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SEGURIDAD LEGAL Y CTA                     */}
      {/* ========================================== */}
      <section id="seguridad" className="py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Seguridad Jurídica Absoluta
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Nuestro modelo está estructurado bajo las normativas de <strong>Fideicomiso (Art. 1666 CCCN)</strong> y <strong>Cesión de Posición Contractual (Art. 1614 CCCN)</strong>. Tu capital está blindado legalmente y separado del patrimonio de la desarrolladora.
          </p>

          <div className="pt-4">
            <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl max-w-2xl mx-auto space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-400">
                ¿Te cierran los números?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                No pierdas la oportunidad de ingresar en la fase inicial del pozo. Simulá tu plan y conversemos 15 minutos por Google Meet para revisar los detalles técnicos y contractuales.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <a
                  href="https://calendar.app.google/aacxfmLJk73KnyB39"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg text-xs sm:text-sm text-center flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Entrevista Virtual</span>
                </a>
                
                <button
                  type="button"
                  onClick={onStartSimulation}
                  className="w-full bg-transparent border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold py-3 px-6 rounded-xl transition text-xs sm:text-sm text-center cursor-pointer"
                >
                  Ir al Simulador
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

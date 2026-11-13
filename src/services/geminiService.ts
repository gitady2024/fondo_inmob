import type { FondoGuardado } from './fondoService';
import { fmtMoneda } from '../utils/calculations';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actions?: Array<{
    label: string;
    action: 'simular' | 'obras' | 'whatsapp' | 'contacto';
    payload?: string;
  }>;
}

const GEMINI_API_KEY_STORAGE_KEY = 'inverfondo_gemini_api_key';

/**
 * Obtiene la API key de Gemini desde variable de entorno o LocalStorage
 */
export const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (stored && stored.trim().length > 0) return stored.trim();
  }
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();
};

export const setGeminiApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  }
};

/**
 * Genera el System Prompt dinámico inyectando en tiempo real
 * la base de conocimiento institucional y las obras activas vigentes.
 */
export const construirSystemPrompt = (
  proyectosActivos: FondoGuardado[],
  currentFondo?: FondoGuardado
): string => {
  const listaObras =
    proyectosActivos && proyectosActivos.length > 0
      ? proyectosActivos
          .map((p, idx) => {
            const params = p.params || ({} as any);
            const dt = p.datosTecnicos || ({} as any);
            const direccion = dt.direccionObra || 'Ubicación consolidada de alta demanda';
            const pct = (dt.etapas || []).reduce(
              (acc: number, et: any) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
              0
            );
            const avance = pct > 0 ? Math.round(pct) : 25;
            return `• Proyecto #${idx + 1}: "${p.nombre}"
  - Dirección: ${direccion}
  - Unidades totales: ${params.cantidadDeptos || 20} departamentos
  - Plazo del plan: ${params.cantidadCuotas || 36} cuotas mensuales
  - Valor de cuota estimada inicial: ${fmtMoneda(params.costoDepto ? params.costoDepto / (params.cantidadCuotas || 36) : 1354000)}
  - Avance físico de obra: ${avance}%
  - Estado: Obra en marcha con fideicomiso perfeccionado`;
          })
          .join('\n\n')
      : '• Proyecto Modelo: Family Homes La Lucia (36 meses) (36 cuotas al costo, unidades residenciales).';

  return `Eres el Asesor Virtual Fiduciario de "Inverfondo" (anteriormente conocida como Fondin).
Tu misión es educar, asesorar y responder con precisión y calidez a potenciales inversores y socios sobre cómo funciona nuestro sistema de inversión fiduciaria inmobiliaria al costo estricto de obra.

REGLAS DE PERSONALIDAD Y TONO:
1. Tono: Profesional, transparente, seguro, empático y pedagógico. Hablas en español rioplatense moderado y cercano ("podés", "tenés", "contás").
2. Claridad: Evita tecnicismos oscuros; explica el fideicomiso como un sistema colaborativo inteligente y legal donde todos los inversores construyen al costo real sin pagar sobreprecios bancarios.
3. Sé conciso: Las respuestas deben tener entre 2 y 4 párrafos cortos o viñetas claras. No abrumes con textos gigantes.
4. Siempre que sea oportuno, invita a utilizar el "Simulador de Plan" o a hablar con un asesor comercial humano por WhatsApp.

CONOCIMIENTO VITAL DE INVERFONDO:
• Marco Jurídico: Fideicomiso al Costo conforme al Art. 1666 del Código Civil y Comercial de la Nación (CCCN). El patrimonio del fideicomiso es autónomo, blindado y protegido frente a cualquier contingencia.
• 0% Tasa de Interés: NO es un préstamo. El inversor no le pide plata a un banco. Las cuotas no tienen intereses financieros usureros ni comisiones bancarias ocultas.
• Diferencia con el Crédito Hipotecario UVA: El crédito UVA indexa por inflación minorista IPC y dólar bancario con tasas del 5.5% al 8.5% anual en dólares, lo que hace la deuda impagable. En Inverfondo, el aporte se actualiza estrictamente por el Índice de la Cámara Argentina de la Construcción (CAC), que refleja el costo real de los ladrillos y el cemento de la obra.
• Anticipo y Adjudicación: Se ingresa con un anticipo accesible (desde USD 10.000 o equivalente en pesos) y cuotas mensuales en pesos al costo. La adjudicación de las unidades se efectúa por sorteo o licitación fiduciaria en asambleas programadas.
• Cesión de Derechos: Si en algún momento el socio decide salir antes de terminar el plan, puede ceder o transferir su participación libremente a valor de mercado, capitalizando la valorización del ladrillo.

PROYECTOS Y OBRAS ACTIVAS EN ESTE MOMENTO (INFORMACIÓN EN TIEMPO REAL):
${listaObras}

${currentFondo ? `Obra actualmente en visualización por el usuario: "${currentFondo.nombre}"` : ''}

IMPORTANTE: Si te preguntan algo que no conoces o sobre datos personales/bancarios específicos de un socio, recomienda contactar por WhatsApp o acceder al Portal Privado con su usuario y contraseña.`;
};

/**
 * Motor heurístico de fallback cuando no hay API key configurada todavía.
 * Responde de forma inteligente a las preguntas más frecuentes utilizando la base de datos viva.
 */
export const responderConMotorLocal = (
  pregunta: string,
  proyectosActivos: FondoGuardado[]
): { text: string; actions?: ChatMessage['actions'] } => {
  const p = pregunta.toLowerCase();

  if (p.includes('uva') || p.includes('banco') || p.includes('credito') || p.includes('hipotecario')) {
    return {
      text: `En **Inverfondo** no cobramos intereses bancarios ni aplicamos la indexación de los créditos UVA.\n\n• **Crédito UVA:** Te endeuda con una tasa bancaria del 5.5% al 8.5% en dólares sobre una deuda que crece con la inflación general IPC.\n• **Inverfondo (Fideicomiso al Costo):** Pagás únicamente el costo real de los materiales y mano de obra conforme al índice CAC (Cámara Argentina de la Construcción). Sin usura, sin intermediarios bancarios.`,
      actions: [
        { label: '📊 Simular mi plan', action: 'simular' },
        { label: '💬 Consultar por WhatsApp', action: 'whatsapp' }
      ]
    };
  }

  if (p.includes('obra') || p.includes('proyecto') || p.includes('departamento') || p.includes('disponible') || p.includes('edificio')) {
    const nombres = proyectosActivos && proyectosActivos.length > 0
      ? proyectosActivos.map((o) => {
          const pct = (o.datosTecnicos?.etapas || []).reduce(
            (acc: number, et: any) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
            0
          );
          const avance = pct > 0 ? Math.round(pct) : 25;
          return `• **${o.nombre}** (${o.params?.cantidadCuotas || 36} cuotas, ${avance}% de avance)`;
        }).join('\n')
      : '• **Family Homes La Lucia (36 meses)** (36 cuotas al costo en pozo)';

    return {
      text: `Actualmente contamos con los siguientes proyectos fiduciarios activos en marcha:\n\n${nombres}\n\nPodés explorar los planos, memoria descriptiva y avances de cada obra en la sección especializada.`,
      actions: [
        { label: '🏗️ Ver Obras en Marcha', action: 'obras' },
        { label: '🧮 Simular cuota', action: 'simular' }
      ]
    };
  }

  if (p.includes('anticipo') || p.includes('cuota') || p.includes('precio') || p.includes('costo') || p.includes('cuanto') || p.includes('monto')) {
    return {
      text: `El ingreso a nuestros planes fiduciarios se realiza con un **anticipo inicial desde USD 10.000** (o su equivalente en pesos) y cuotas mensuales en pesos al costo estricto de obra.\n\nEn nuestro **Simulador Interactivo** podés ajustar el plazo (24 a 120 meses), el anticipo que tengas disponible y ver al instante la proyección estimada de tus cuotas.`,
      actions: [
        { label: '🧮 Abrir Simulador', action: 'simular' },
        { label: '📲 Asesoramiento WhatsApp', action: 'whatsapp' }
      ]
    };
  }

  if (p.includes('adjudic') || p.includes('entrega') || p.includes('posesion') || p.includes('llave')) {
    return {
      text: `La adjudicación y entrega de las unidades se realiza bajo dos mecanismos transparentes estipulados en el contrato marco:\n\n1. **Adjudicación programada por cuotas cumplidas:** Al alcanzar la cuota fijada en el plan de la obra.\n2. **Licitación por adelanto de cuotas:** En asambleas semestrales podés ofertar integración voluntaria de cuotas para acelerar la posesión de tu departamento.`,
      actions: [
        { label: '📄 Ver Modelo de Contrato', action: 'simular' },
        { label: '💬 Preguntar a un asesor', action: 'whatsapp' }
      ]
    };
  }

  if (p.includes('seguridad') || p.includes('garantia') || p.includes('legal') || p.includes('fideicomiso') || p.includes('ley') || p.includes('1666')) {
    return {
      text: `Todos los proyectos operan bajo la figura del **Fideicomiso Inmobiliario al Costo (Ley 26.994 - Art. 1666 y concordantes del CCCN)**.\n\nEsto significa que el terreno y los fondos aportados forman un **patrimonio separado e inembargable**, totalmente independiente del fiduciario o de cualquier otra empresa constructora. Los fondos se aplican con exclusividad al ladrillo de tu edificio.`,
      actions: [
        { label: '🛡️ Ver Seguridad Legal', action: 'simular' },
        { label: '💬 Hablar por WhatsApp', action: 'whatsapp' }
      ]
    };
  }

  // Respuesta por defecto
  return {
    text: `¡Hola! Soy tu Asesor Virtual en **Inverfondo**.\n\nPuedo explicarte cómo funciona nuestro fideicomiso al costo, ayudarte a simular tu cuota mensual o contarte sobre las obras en marcha disponibles en este momento. ¿Qué consulta tenés sobre el plan?`,
    actions: [
      { label: '💡 ¿Cómo funciona el plan?', action: 'simular' },
      { label: '🏗️ ¿Qué obras tienen?', action: 'obras' },
      { label: '📊 Simular mi departamento', action: 'simular' }
    ]
  };
};

/**
 * Consulta a la API de Google Gemini (gemini-1.5-flash)
 * Si no hay API key disponible, recurre de forma transparente al motor de conocimiento local.
 */
export const consultarAsesorGemini = async ({
  historial,
  nuevoMensaje,
  proyectosActivos,
  currentFondo
}: {
  historial: ChatMessage[];
  nuevoMensaje: string;
  proyectosActivos: FondoGuardado[];
  currentFondo?: FondoGuardado;
}): Promise<ChatMessage> => {
  const apiKey = getGeminiApiKey();

  // Si no hay API key configurada, usamos el motor heurístico local con datos en tiempo real
  if (!apiKey) {
    // Simular una ligera latencia de 400ms para efecto conversacional natural
    await new Promise((resolve) => setTimeout(resolve, 400));
    const respuestaLocal = responderConMotorLocal(nuevoMensaje, proyectosActivos);
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: respuestaLocal.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: respuestaLocal.actions
    };
  }

  const systemInstruction = construirSystemPrompt(proyectosActivos, currentFondo);

  // Formatear historial para el endpoint de Gemini
  const contents = [
    {
      role: 'user',
      parts: [{ text: `INSTRUCCIÓN DE SISTEMA PERMANENTE:\n${systemInstruction}\n\nPor favor, responde a partir de ahora actuando como este asesor.` }]
    },
    {
      role: 'model',
      parts: [{ text: 'Entendido. Soy el Asesor Virtual Fiduciario de Inverfondo. Responderé con calidez, claridad y rigor técnico fiduciario.' }]
    }
  ];

  for (const m of historial.slice(-6)) {
    if (m.sender === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.text }] });
    } else if (m.sender === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: m.text }] });
    }
  }

  contents.push({ role: 'user', parts: [{ text: nuevoMensaje }] });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 600
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('Error en Gemini API:', response.status, errData);
      // Fallback a motor local si la API da error (ej. cuota excedida)
      const fallback = responderConMotorLocal(nuevoMensaje, proyectosActivos);
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: fallback.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: fallback.actions
      };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const respuestaTexto =
      candidate?.content?.parts?.[0]?.text ||
      'No pude procesar la respuesta en este momento. Por favor contáctanos por WhatsApp.';

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: respuestaTexto,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '🧮 Simular Plan', action: 'simular' },
        { label: '💬 Hablar por WhatsApp', action: 'whatsapp' }
      ]
    };
  } catch (error) {
    console.error('Error al conectar con Gemini:', error);
    const fallback = responderConMotorLocal(nuevoMensaje, proyectosActivos);
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: fallback.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: fallback.actions
    };
  }
};

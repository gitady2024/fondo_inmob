import type { FondoGuardado } from './fondoService';
import { fmtMoneda } from '../utils/calculations';
import { WHATSAPP_RAW_NUMBER } from '../types/preinscripcion';

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
 * la base de conocimiento institucional y la obra activa oficial (Family Homes La Lucía).
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
            const direccion = dt.direccionObra || 'Av. Roque Saenz Peña esquina 12 de Octubre, Santa Lucía';
            const pct = (dt.etapas || []).reduce(
              (acc: number, et: any) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
              0
            );
            const avance = pct > 0 ? Math.round(pct) : 30;
            return `• Proyecto Oficial #${idx + 1}: "${p.nombre}"
  - Ubicación: ${direccion}
  - Unidades: ${params.cantidadDeptos || 10} departamentos residenciales (quedan unidades disponibles)
  - Plazo Fiduciario: ${params.cantidadCuotas || 36} cuotas mensuales
  - Valor al costo de obra: USD 75.000 (o equivalente en pesos)
  - Cuota mensual pura estimada: USD 2.083 (sin anticipo) o menor con anticipo inicial
  - Certificación de avance físico real: ${avance}%
  - Estado: Obra en marcha con fideicomiso perfeccionado y seguro`;
          })
          .join('\n\n')
      : '• Proyecto Oficial: Family Homes La Lucia (36 meses) (Av. Roque Saenz Peña esquina 12 de Octubre, Santa Lucía. 10 deptos, USD 75.000, 36 cuotas, 30% avance físico).';

  return `Eres el Asesor Virtual Fiduciario de "Inverfondo" (inverfondo.com).
Tu misión es educar, asesorar, realizar simulaciones numéricas y guiar a potenciales inversores hacia la suscripción del fideicomiso al costo estricto de obra.

REGLAS DE PERSONALIDAD Y TONO:
1. Tono: Profesional, transparente, seguro, empático y pedagógico. Hablas en español rioplatense cercano y respetuoso ("podés", "tenés", "contás").
2. Claridad: Explica el fideicomiso como un sistema colaborativo inteligente donde los socios construyen al costo real sin intermediación usurera de bancos.
3. Sé conciso: Respuestas de 2 a 4 párrafos cortos o viñetas claras. No abrumes con textos interminables.
4. Venta consultiva y conversión: Siempre que el usuario muestre interés o haga cálculos, invítalo a coordinar por WhatsApp para recibir la ficha técnica y reservar su unidad.

CONOCIMIENTO VITAL DE INVERFONDO:
• Marco Jurídico: Fideicomiso al Costo conforme al Art. 1666 y concordantes del Código Civil y Comercial de la Nación (CCCN). El patrimonio del fideicomiso es autónomo, blindado e inembargable.
• 0% Tasa de Interés: NO es un crédito bancario. Las cuotas no tienen intereses financieros ni costos ocultos.
• Comparación con Crédito Hipotecario UVA: El crédito UVA indexa por IPC más una tasa bancaria del 5.5% al 8.5% anual en dólares sobre capital creciente. En Inverfondo, el aporte se actualiza estrictamente por el Índice CAC (Cámara Argentina de la Construcción), que mide el costo real de los materiales y mano de obra.
• Anticipo y Cuotas: Se ingresa con un anticipo inicial accesible (desde USD 10.000 o equivalente en pesos) y el saldo se abona en cuotas mensuales al costo de obra.
• Cesión de Posición Contractual: El socio puede transferir o ceder su unidad antes de la finalización a valor de mercado, capitalizando la valorización del metro cuadrado en pozo.

CÁLCULOS FINANCIEROS EN VIVO (SIMULADOR EN DIÁLOGO):
Si el usuario menciona un monto de anticipo o una cuota mensual que puede pagar:
- Toma como base el proyecto oficial: "Family Homes La Lucia (36 meses)" (Valor total: USD 75.000, Plazo: 36 cuotas).
- Calcula: Saldo a Financiar = USD 75.000 - Anticipo ingresado.
- Cuota mensual estimada = Saldo / 36 meses.
- Ejemplo: Si el usuario tiene USD 20.000 de anticipo, el saldo es USD 55.000 y la cuota queda en aprox. USD 1.528/mes.
- Muestra el cálculo con orgullo y claridad, e invítalo a contactar por WhatsApp para congelar el valor de obra.

PROYECTOS Y OBRAS ACTIVAS EN ESTE MOMENTO:
${listaObras}

${currentFondo ? `Obra actualmente en pantalla: "${currentFondo.nombre}"` : ''}

IMPORTANTE: Si consultan sobre trámites internos de socios existentes o cuentas bancarias, recomendá ingresar con clave al Portal de Socios o comunicarse al WhatsApp oficial.`;
};

/**
 * Motor heurístico inteligente de fallback cuando no hay API key o no hay red.
 * Realiza cálculos dinámicos de cuotas y anticipos para Family Homes La Lucía y atiende preguntas frecuentes.
 */
export const responderConMotorLocal = (
  pregunta: string,
  proyectosActivos: FondoGuardado[]
): { text: string; actions?: ChatMessage['actions'] } => {
  const p = pregunta.toLowerCase();

  // 1. Detección de montos numéricos para cálculo financiero dinámico
  const numerosEncontrados = pregunta.match(/\d+([.,]\d+)?/g);
  const tieneIntencionPresupuesto =
    p.includes('tengo') ||
    p.includes('puedo') ||
    p.includes('gano') ||
    p.includes('alcanza') ||
    p.includes('ahorro') ||
    p.includes('presupuesto') ||
    p.includes('usd') ||
    p.includes('dolar') ||
    p.includes('dólar') ||
    p.includes('$');

  if (numerosEncontrados && tieneIntencionPresupuesto) {
    // Normalizar primer número significativo
    const numLimpio = numerosEncontrados[0].replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(numLimpio);

    if (valor >= 5000 && valor <= 75000) {
      const costoTotal = 75000;
      const anticipo = valor;
      const saldo = Math.max(0, costoTotal - anticipo);
      const cuota36 = Math.round(saldo / 36);

      return {
        text: `¡Excelente número para ingresar! Si contás con un anticipo de **USD ${anticipo.toLocaleString('es-AR')}**, así quedaría tu plan en **Family Homes La Lucía** (valor total USD 75.000 al costo estricto):\n\n• **Saldo a financiar:** USD ${saldo.toLocaleString('es-AR')}\n• **Plazo:** 36 cuotas mensuales\n• **Cuota mensual estimada:** aprox. **USD ${cuota36.toLocaleString('es-AR')}** (abonables en pesos al índice CAC, sin intereses bancarios)\n• **Avance actual de obra:** 30% certificado\n\nPodemos coordinar para enviarte los planos y la ficha de adhesión formal.`,
        actions: [
          {
            label: '📲 Enviar esta simulación a WhatsApp',
            action: 'whatsapp',
            payload: `Hola Inverfondo, tengo un anticipo de USD ${anticipo.toLocaleString('es-AR')} y me gustaría solicitar la suscripción para el proyecto Family Homes La Lucía.`
          },
          { label: '🧮 Ajustar en Simulador Completo', action: 'simular' }
        ]
      };
    }
  }

  // 2. Intención de compra / reserva / contacto
  if (
    p.includes('anotar') ||
    p.includes('inscribir') ||
    p.includes('reserv') ||
    p.includes('comprar') ||
    p.includes('contact') ||
    p.includes('asesor') ||
    p.includes('reunion') ||
    p.includes('reunión') ||
    p.includes('llamada')
  ) {
    return {
      text: `¡Nos alegra tu interés en ser parte de **Inverfondo**!\n\nPara avanzar con la reserva o recibir la carpeta técnica oficial de **Family Homes La Lucía**:\n\n1. Coordinamos una consulta directa por WhatsApp o videollamada.\n2. Evaluamos la disponibilidad de departamentos (quedan pocas unidades en obra).\n3. Te enviamos el modelo contractual de Fideicomiso al Costo (Art. 1666 CCCN) para tu tranquilidad jurídica.`,
      actions: [
        {
          label: '📲 Hablar con Asesor Comercial en WhatsApp',
          action: 'whatsapp',
          payload: 'Hola Inverfondo, quiero avanzar con la preinscripción y reserva de una unidad en Family Homes La Lucía.'
        },
        { label: '🏗️ Ver ficha técnica del proyecto', action: 'obras' }
      ]
    };
  }

  // 3. Diferencia con Créditos UVA y Bancos
  if (p.includes('uva') || p.includes('banco') || p.includes('credito') || p.includes('hipotecario')) {
    return {
      text: `En **Inverfondo** no hay usura bancaria ni endeudamiento UVA:\n\n• **Crédito Hipotecario UVA:** Te indexa por inflación general (IPC) y te suma una tasa bancaria del 5.5% al 8.5% anual en dólares sobre una deuda que crece sin techo.\n• **Inverfondo (Fideicomiso al Costo):** Aportás estrictamente el costo real de los materiales y la mano de obra conforme al índice CAC (Cámara Argentina de la Construcción). Sin bancos, sin sobreprecios, construyendo ladrillo sobre ladrillo.`,
      actions: [
        { label: '📊 Simular mi plan', action: 'simular' },
        { label: '💬 Consultar por WhatsApp', action: 'whatsapp' }
      ]
    };
  }

  // 4. Proyectos y Obras activas
  if (p.includes('obra') || p.includes('proyecto') || p.includes('departamento') || p.includes('disponible') || p.includes('edificio') || p.includes('lucia') || p.includes('lucía')) {
    const nombres =
      proyectosActivos && proyectosActivos.length > 0
        ? proyectosActivos
            .map((o) => {
              const dt = o.datosTecnicos || ({} as any);
              const dir = dt.direccionObra || 'Santa Lucía';
              return `• **${o.nombre}**\n  - Dirección: ${dir}\n  - Plazo: ${o.params?.cantidadCuotas || 36} cuotas\n  - Costo: USD 75.000\n  - Avance físico: 30% certificado`;
            })
            .join('\n\n')
        : '• **Family Homes La Lucia (36 meses)** (Av. Roque Saenz Peña esquina 12 de Octubre, Santa Lucía. 30% de avance físico certificado).';

    return {
      text: `Actualmente nuestro proyecto fiduciario insignia activo es:\n\n${nombres}\n\nPodés auditar el cronograma de avance físico de obra, los planos y la memoria descriptiva en detalle.`,
      actions: [
        { label: '🏗️ Ver Obras en Marcha', action: 'obras' },
        { label: '🧮 Simular cuota de este proyecto', action: 'simular' },
        {
          label: '💬 Consultar disponibilidad por WhatsApp',
          action: 'whatsapp',
          payload: 'Hola, quisiera consultar la disponibilidad de unidades en Family Homes La Lucía.'
        }
      ]
    };
  }

  // 5. Anticipo, cuotas y precios
  if (p.includes('anticipo') || p.includes('cuota') || p.includes('precio') || p.includes('costo') || p.includes('cuanto') || p.includes('monto')) {
    return {
      text: `En el proyecto oficial **Family Homes La Lucía (36 meses)** el valor de departamento al costo estricto es de **USD 75.000**:\n\n• **Anticipo inicial accesible:** desde USD 10.000 (o su equivalente en pesos).\n• **Plazo fiduciario:** 36 cuotas mensuales al costo de obra.\n• **Cuota pura base:** desde USD 1.528/mes (según tu anticipo) o USD 2.083/mes si no integras anticipo.\n\nEn nuestro **Simulador Interactivo** podés probar distintas combinaciones de anticipo y cuotas.`,
      actions: [
        { label: '🧮 Abrir Simulador Interactivo', action: 'simular' },
        {
          label: '📲 Asesoramiento WhatsApp',
          action: 'whatsapp',
          payload: 'Hola, estuve viendo los costos de Family Homes La Lucía y quisiera asesorarme sobre el anticipo y las cuotas.'
        }
      ]
    };
  }

  // 6. Adjudicación y Posesión
  if (p.includes('adjudic') || p.includes('entrega') || p.includes('posesion') || p.includes('posesión') || p.includes('llave')) {
    return {
      text: `La entrega y adjudicación de las unidades de **Family Homes La Lucía** se efectúa bajo dos mecanismos claros fijados en el contrato fiduciario:\n\n1. **Adjudicación programada por avance:** Al completarse el cronograma constructivo (obra pactada en 36 meses, actualmente en 30% certificado).\n2. **Licitación por adelanto voluntario de cuotas:** En asambleas programadas podés ofertar adelanto de cuotas para acelerar la adjudicación de tu departamento.`,
      actions: [
        { label: '📄 Ver Modelo de Contrato', action: 'simular' },
        { label: '💬 Preguntar a un asesor', action: 'whatsapp' }
      ]
    };
  }

  // 7. Seguridad Jurídica y Fideicomiso CCCN
  if (p.includes('seguridad') || p.includes('garantia') || p.includes('garantía') || p.includes('legal') || p.includes('fideicomiso') || p.includes('ley') || p.includes('1666')) {
    return {
      text: `Todos los proyectos de **Inverfondo** se constituyen bajo la figura del **Fideicomiso Inmobiliario al Costo (Art. 1666 y ss. del CCCN)**.\n\n• **Patrimonio de afectación separado:** El terreno y los fondos no pertenecen a la constructora ni a los administradores; pertenecen exclusivamente al fideicomiso.\n• **Inembargabilidad:** Los activos están legalmente protegidos ante quiebras o deudas de terceros.\n• **Auditoría transparente:** Cada peso aportado se aplica con exclusividad a los materiales y mano de obra del proyecto.`,
      actions: [
        { label: '🛡️ Ver Seguridad Legal', action: 'simular' },
        { label: '💬 Hablar por WhatsApp', action: 'whatsapp' }
      ]
    };
  }

  // Respuesta por defecto interactiva
  return {
    text: `¡Hola! Soy tu Asesor Virtual en **Inverfondo**.\n\nPuedo calcular tus cuotas al instante para **Family Homes La Lucía** (USD 75.000 en 36 cuotas), comparar nuestro sistema con créditos UVA o contarte el estado de avance de obra. ¿De cuánto dispones para invertir o qué duda tenés?`,
    actions: [
      { label: '🧮 Simular mi departamento', action: 'simular' },
      { label: '🏗️ ¿Qué obras tienen hoy?', action: 'obras' },
      {
        label: '💬 Hablar por WhatsApp',
        action: 'whatsapp',
        payload: 'Hola Inverfondo, quisiera recibir información sobre el plan fiduciario de Family Homes La Lucía.'
      }
    ]
  };
};

/**
 * Consulta en modo STREAMING a Google Gemini (gemini-3.5-flash-lite).
 * Si hay API Key: transmite palabra por palabra en tiempo real vía Server-Sent Events (SSE).
 * Si no hay API Key o falla: recurre al motor heurístico con efecto progresivo tipo máquina de escribir.
 */
export const consultarAsesorGeminiStream = async ({
  historial,
  nuevoMensaje,
  proyectosActivos,
  currentFondo,
  onChunk
}: {
  historial: ChatMessage[];
  nuevoMensaje: string;
  proyectosActivos: FondoGuardado[];
  currentFondo?: FondoGuardado;
  onChunk?: (textoParcial: string) => void;
}): Promise<ChatMessage> => {
  const apiKey = getGeminiApiKey();

  // Caso 1: Sin API Key -> Transmisión progresiva del motor local
  if (!apiKey) {
    const respuestaLocal = responderConMotorLocal(nuevoMensaje, proyectosActivos);
    if (onChunk) {
      // Simular efecto de escritura fluido palabra por palabra (sensación de IA en tiempo real)
      const palabras = respuestaLocal.text.split(' ');
      let acumulado = '';
      for (let i = 0; i < palabras.length; i++) {
        acumulado += (i === 0 ? '' : ' ') + palabras[i];
        onChunk(acumulado);
        await new Promise((resolve) => setTimeout(resolve, 14));
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: respuestaLocal.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: respuestaLocal.actions
    };
  }

  // Caso 2: Con API Key -> Llamada a Gemini 1.5 Flash vía streaming SSE
  const systemInstruction = construirSystemPrompt(proyectosActivos, currentFondo);

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `INSTRUCCIÓN DE SISTEMA PERMANENTE:\n${systemInstruction}\n\nPor favor, responde a partir de ahora actuando como este asesor.`
        }
      ]
    },
    {
      role: 'model',
      parts: [
        {
          text: 'Entendido. Soy el Asesor Virtual Fiduciario de Inverfondo. Responderé con calidez, claridad y rigor técnico fiduciario.'
        }
      ]
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`;

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

    if (!response.ok || !response.body) {
      console.warn('Gemini stream falló con código:', response.status);
      const fallback = responderConMotorLocal(nuevoMensaje, proyectosActivos);
      if (onChunk) {
        const palabras = fallback.text.split(' ');
        let acumulado = '';
        for (let i = 0; i < palabras.length; i++) {
          acumulado += (i === 0 ? '' : ' ') + palabras[i];
          onChunk(acumulado);
          await new Promise((resolve) => setTimeout(resolve, 14));
        }
      }
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: fallback.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: fallback.actions
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let textoCompleto = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lineas = buffer.split('\n');
      buffer = lineas.pop() || '';

      for (const linea of lineas) {
        const lim = linea.trim();
        if (lim.startsWith('data: ')) {
          const jsonStr = lim.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const parte = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (parte) {
              textoCompleto += parte;
              if (onChunk) {
                onChunk(textoCompleto);
              }
            }
          } catch {
            // Ignorar trozos incompletos
          }
        }
      }
    }

    if (!textoCompleto.trim()) {
      const fallback = responderConMotorLocal(nuevoMensaje, proyectosActivos);
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: fallback.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: fallback.actions
      };
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: textoCompleto.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        {
          label: '📲 Continuar por WhatsApp',
          action: 'whatsapp',
          payload: `Hola Inverfondo, estuve chateando con el Asesor IA sobre el proyecto Family Homes La Lucía y quisiera coordinar una consulta comercial.`
        },
        { label: '🧮 Simular en Calculadora', action: 'simular' },
        { label: '🏗️ Ver Obras en Marcha', action: 'obras' }
      ]
    };
  } catch (error) {
    console.error('Error en conexión streaming con Gemini:', error);
    const fallback = responderConMotorLocal(nuevoMensaje, proyectosActivos);
    if (onChunk) {
      const palabras = fallback.text.split(' ');
      let acumulado = '';
      for (let i = 0; i < palabras.length; i++) {
        acumulado += (i === 0 ? '' : ' ') + palabras[i];
        onChunk(acumulado);
        await new Promise((resolve) => setTimeout(resolve, 14));
      }
    }
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: fallback.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: fallback.actions
    };
  }
};

/**
 * Consulta estándar no-streaming a Google Gemini (retrocompatibilidad).
 */
export const consultarAsesorGemini = async (params: {
  historial: ChatMessage[];
  nuevoMensaje: string;
  proyectosActivos: FondoGuardado[];
  currentFondo?: FondoGuardado;
}): Promise<ChatMessage> => {
  return consultarAsesorGeminiStream(params);
};

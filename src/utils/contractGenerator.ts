import jsPDF from 'jspdf';
import type { ParametrosFondoState, GastosConfigState } from '../types/fondo';
import type { DatosTecnicosProyecto } from '../types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import { fmtMoneda } from './calculations';

export interface ContratoDatosInput {
  fondoNombre: string;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  socioId: number;
  datosTecnicos?: DatosTecnicosProyecto;
  fechaInicio?: string;
  anticipoSocio?: number;
  nombreSocio?: string;
  dniSocio?: string;
  contratoPersonalizado?: string;
}

/**
 * Reemplaza etiquetas dinámicas dentro de cualquier texto de contrato personalizado
 */
export const aplicarVariablesContrato = (texto: string, input: ContratoDatosInput): string => {
  const dt = input.datosTecnicos || DATOS_TECNICOS_DEFAULT;
  const director = dt.directorObra || (dt.profesionales && dt.profesionales[0]?.nombre) || 'Arq. Colegiado Responsable';
  const calculista = dt.calculistaEstructural || 'Ing. Especialista en Estructuras H°A°';
  const constructora = dt.empresaConstructora || 'Empresa Constructora Fiduciaria S.A.';
  const permiso = dt.numeroPermisoObra || 'EXP-MUNIC-2026-89412';
  const ubicacion = dt.direccionObra || 'Av. Libertador 1450, Emprendimiento Central';

  const costoDepto = input.params.costoDepto || 75000;
  const cantidadCuotas = input.params.cantidadCuotas || 48;
  const cuotaPura = costoDepto / cantidadCuotas;
  const anticipo = input.anticipoSocio || 0;
  const saldoFinanciar = Math.max(0, costoDepto - anticipo);

  const titular = input.nombreSocio || `Socio Aportante Unidad D${input.socioId}`;
  const dni = input.dniSocio || `DNI / CUIT Asignado a Dpto ${input.socioId}`;

  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const totalGastosPct = (input.gastos.comisionGestion || 0) + (input.gastos.comisionEscribania || 0);

  return texto
    .replace(/\{\{PROYECTO\}\}/gi, input.fondoNombre)
    .replace(/\{\{FONDO\}\}/gi, input.fondoNombre)
    .replace(/\{\{SOCIO\}\}/gi, titular)
    .replace(/\{\{TITULAR\}\}/gi, titular)
    .replace(/\{\{DNI\}\}/gi, dni)
    .replace(/\{\{DEPTO\}\}/gi, String(input.socioId))
    .replace(/\{\{UNIDAD\}\}/gi, String(input.socioId))
    .replace(/\{\{VALOR_TOTAL\}\}/gi, fmtMoneda(costoDepto))
    .replace(/\{\{VALOR_DEPTO\}\}/gi, fmtMoneda(costoDepto))
    .replace(/\{\{CUOTAS\}\}/gi, String(cantidadCuotas))
    .replace(/\{\{CANTIDAD_CUOTAS\}\}/gi, String(cantidadCuotas))
    .replace(/\{\{CUOTA_PURA\}\}/gi, fmtMoneda(cuotaPura))
    .replace(/\{\{ANTICIPO\}\}/gi, fmtMoneda(anticipo))
    .replace(/\{\{SALDO_FINANCIAR\}\}/gi, fmtMoneda(saldoFinanciar))
    .replace(/\{\{GASTOS_PCT\}\}/gi, `${totalGastosPct}%`)
    .replace(/\{\{DIRECTOR_OBRA\}\}/gi, director)
    .replace(/\{\{CALCULISTA\}\}/gi, calculista)
    .replace(/\{\{CONSTRUCTORA\}\}/gi, constructora)
    .replace(/\{\{PERMISO_OBRA\}\}/gi, permiso)
    .replace(/\{\{DIRECCION_OBRA\}\}/gi, ubicacion)
    .replace(/\{\{FECHA_HOY\}\}/gi, fechaHoy);
};

/**
 * Genera el texto completo estándar del Contrato Tripartito por defecto
 */
export const obtenerTextoDefaultContrato = (input: ContratoDatosInput): string => {
  const dt = input.datosTecnicos || DATOS_TECNICOS_DEFAULT;
  const director = dt.directorObra || (dt.profesionales && dt.profesionales[0]?.nombre) || 'Arq. Colegiado Responsable';
  const calculista = dt.calculistaEstructural || 'Ing. Especialista en Estructuras H°A°';
  const constructora = dt.empresaConstructora || 'Empresa Constructora Fiduciaria S.A.';
  const permiso = dt.numeroPermisoObra || 'EXP-MUNIC-2026-89412';
  const ubicacion = dt.direccionObra || 'Av. Libertador 1450, Emprendimiento Central';

  const costoDepto = input.params.costoDepto || 75000;
  const cantidadCuotas = input.params.cantidadCuotas || 48;
  const cuotaPura = costoDepto / cantidadCuotas;
  const anticipo = input.anticipoSocio || 0;
  const saldoFinanciar = Math.max(0, costoDepto - anticipo);

  const titular = input.nombreSocio || `Socio Aportante Unidad D${input.socioId}`;
  const dni = input.dniSocio || `DNI / CUIT Asignado a Dpto ${input.socioId}`;

  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const totalGastosPct = (input.gastos.comisionGestion || 0) + (input.gastos.comisionEscribania || 0);

  return `CONTRATO TRIPARTITO DE ADHESIÓN FIDUCIARIA, DESARROLLO INMOBILIARIO Y DIRECCIÓN TÉCNICA
PROYECTO: "${input.fondoNombre.toUpperCase()}"

================================================================================
COMPARECIENTES Y PARTES INTERVINIENTES:
================================================================================

1. PARTE FIDUCIARIA / ADMINISTRADORA: Representada por la ADMINISTRACIÓN GENERAL DEL FONDO INMOBILIARIO ("LA FIDUCIARIA"), con domicilio constituido legal y fiscal en las oficinas centrales del fideicomiso, responsable de la custodia, asignación transparente y administración de los recursos del círculo de ahorro previo mutuo.

2. PARTE BENEFICIARIA / SOCIO APORTANTE: ${titular}, identificado con ${dni}, con domicilio especial constituido a los efectos del presente contrato, titular de la posición contractual y derechos de adjudicación sobre la Unidad Funcional / Departamento ${input.socioId} ("EL SOCIO APORTANTE").

3. PARTE TÉCNICA Y DIRECCIÓN DE OBRA: Integrada colegiadamente por la DIRECCIÓN TÉCNICA DE OBRA a cargo de ${director}, el CÁLCULO Y PROYECTO ESTRUCTURAL a cargo de ${calculista}, y la EJECUCIÓN CONSTRUCTIVA a cargo de ${constructora}, con legajo municipal registrado bajo expediente ${permiso} ("EL EQUIPO TÉCNICO RESPONSABLE").

================================================================================
CLÁUSULAS CONTRACTUALES:
================================================================================

CLÁUSULA PRIMERA: Marco Jurídico, Afectación y Naturaleza Fiduciaria
Las partes celebran el presente Contrato Tripartito de Adhesión al Fideicomiso Inmobiliario de Ahorro Previo Mutuo, regulado expresamente bajo las disposiciones de los Artículos 1666 a 1700 y concordantes del Código Civil y Comercial de la Nación (CCCN). Los bienes, aportes dinerarios y el inmueble ubicado en ${ubicacion} constituyen un patrimonio de afectación separado, libre de acciones de acreedores particulares de los socios aportantes, de la administración fiduciaria o de los profesionales técnicos intervinientes.

CLÁUSULA SEGUNDA: Objeto Contractual y Asignación de Unidad
El objeto del presente contrato es la adquisición del terreno, tramitación integral de permisos públicos, construcción material y adjudicación definitiva en Propiedad Horizontal (PH) de la Unidad Funcional / Departamento número ${input.socioId}, conforme a las especificaciones técnicas, planos de arquitectura convalidada y memoria descriptiva del proyecto denominado "${input.fondoNombre}".

CLÁUSULA TERCERA: Plan Económico, Aportes, Cuotas y Gastos de Adjudicación
El valor de costo objetivo estimado de la unidad asciende a ${fmtMoneda(costoDepto)}, pactándose un esquema de cancelación de ${cantidadCuotas} cuotas mensuales y ordinarias de aporte mutuo, con una cuota pura inicial estimada de ${fmtMoneda(cuotaPura)}. El Socio ha integrado un anticipo voluntario de capital de ${fmtMoneda(anticipo)}, quedando un saldo neto financiado de ${fmtMoneda(saldoFinanciar)}. Los gastos fiduciarios (administración, escribanía, seguros de caución y fondo de contingencia por un total estimado del ${totalGastosPct}%) serán integrados mediante la modalidad pactada (${input.gastos.formaPagoGastos === 'final' ? 'al momento de adjudicación / toma de posesión' : 'prorrateados proporcionalmente mes a mes'}).

CLÁUSULA CUARTA: Obligaciones y Facultades de la Administración Fiduciaria
LA FIDUCIARIA se obliga a: a) Recaudar puntualmente las cuotas y aportes mediante cuenta bancaria recaudadora fiduciaria exclusiva; b) Proveer los fondos necesarios al Equipo Técnico y a los proveedores conforme a los certificados de obra mensuales aprobados; c) Emitir mensualmente a cada suscriptor el extracto de cuenta corriente individual con historial de pagos; d) Gestionar las compras por acopio de materiales básicos (hierro, cemento, ladrillos) para blindar el costo contra variaciones inflacionarias; e) Convocar a los actos de adjudicación por sorteo o licitación.

CLÁUSULA QUINTA: Compromisos, Certificación y Dirección del Equipo Técnico
EL EQUIPO TÉCNICO RESPONSABLE asume formalmente la dirección ejecutiva, control de calidad y fiel ejecución constructiva del edificio, obligándose a: a) Confeccionar y gestionar las aprobaciones de planos definitivos ante la Municipalidad correspondiente (${permiso}), entes prestadores de servicios de energía, agua, gas y medio ambiente; b) Certificar de forma mensual el avance físico ponderado de la obra mediante Libro de Órdenes y actas rubricadas; c) Velar por el cumplimiento de las normas de higiene y seguridad laboral; d) Confeccionar el Plano de Mensura y Subdivisión en Propiedad Horizontal (PH) y tramitar el Final de Obra definitivo.

CLÁUSULA SEXTA: Posesión, Adjudicación y Cesión de Posición Contractual (Art. 1614 CCCN)
La entrega de la posesión efectiva de la unidad quedará supeditada a que la obra haya alcanzado el porcentaje de avance físico habitable certificado por la Dirección Técnica y a que el Socio Aportante se encuentre al día con sus cuotas y gastos de posesión. Asimismo, conforme a las previsiones del Artículo 1614 y concordantes del Código Civil y Comercial de la Nación, EL SOCIO APORTANTE goza del derecho expreso de ceder su posición contractual a terceros interesados, requiriendo únicamente la notificación fehaciente a la Administración Fiduciaria para el traspaso de la titularidad fiduciaria y registro en el padrón de socios.

CLÁUSULA SÉPTIMA: Mora, Intereses y Fondo de Garantía
La mora en el pago de las cuotas operará de pleno derecho a los diez (10) días corridos del vencimiento mensual, devengando un interés compensatorio y punitorio fijado por la administración. La reiteración de tres (3) cuotas consecutivas impagas facultará a la Fiduciaria a intimar al regularizamiento en un plazo improrrogable de 15 días, bajo apercibimiento de cesión coactiva o reintegro según las pautas del reglamento fiduciario para no perjudicar la continuidad de la obra comunitaria.

CLÁUSULA OCTAVA: Jurisdicción, Domicilios y Firma Tripartita
Para todos los efectos judiciales o extrajudiciales derivados del presente, las partes constituyen sus domicilios especiales en los lugares precedentemente indicados, y se someten a la competencia de los Tribunales Ordinarios en lo Civil y Comercial correspondientes a la jurisdicción de ubicación del inmueble, con renuncia a cualquier otro fuero o jurisdicción que pudiera corresponder. En prueba de mutua conformidad, se firman tres (3) ejemplares de un mismo tenor y a un solo efecto.

Celebrado en la ciudad correspondiente al emplazamiento del proyecto, a los ${fechaHoy}.
`.trim();
};

/**
 * Genera el texto estructurado del Contrato Tripartito
 */
export const obtenerTextoContrato = (input: ContratoDatosInput): {
  titulo: string;
  partes: { admin: string; socio: string; tecnico: string };
  clausulas: { numero: string; titulo: string; contenido: string }[];
  fechaTexto: string;
} => {
  const dt = input.datosTecnicos || DATOS_TECNICOS_DEFAULT;
  const director = dt.directorObra || (dt.profesionales && dt.profesionales[0]?.nombre) || 'Arq. Colegiado Responsable';
  const calculista = dt.calculistaEstructural || 'Ing. Especialista en Estructuras H°A°';
  const constructora = dt.empresaConstructora || 'Empresa Constructora Fiduciaria S.A.';
  const permiso = dt.numeroPermisoObra || 'EXP-MUNIC-2026-89412';
  const ubicacion = dt.direccionObra || 'Av. Libertador 1450, Emprendimiento Central';

  const costoDepto = input.params.costoDepto || 75000;
  const cantidadCuotas = input.params.cantidadCuotas || 48;
  const cuotaPura = costoDepto / cantidadCuotas;
  const anticipo = input.anticipoSocio || 0;
  const saldoFinanciar = Math.max(0, costoDepto - anticipo);

  const titular = input.nombreSocio || `Socio Aportante Unidad D${input.socioId}`;
  const dni = input.dniSocio || `DNI / CUIT Asignado a Dpto ${input.socioId}`;

  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const totalGastosPct = (input.gastos.comisionGestion || 0) + (input.gastos.comisionEscribania || 0);

  return {
    titulo: `CONTRATO TRIPARTITO DE ADHESIÓN FIDUCIARIA, DESARROLLO INMOBILIARIO Y DIRECCIÓN TÉCNICA - PROYECTO "${input.fondoNombre.toUpperCase()}"`,
    partes: {
      admin: `PARTE FIDUCIARIA / ADMINISTRADORA: Representada por la ADMINISTRACIÓN GENERAL DEL FONDO INMOBILIARIO ("LA FIDUCIARIA"), con domicilio constituido legal y fiscal en las oficinas centrales del fideicomiso, responsable de la custodia, asignación transparente y administración de los recursos del círculo de ahorro previo mutuo.`,
      socio: `PARTE BENEFICIARIA / SOCIO APORTANTE: ${titular}, identificado con ${dni}, con domicilio especial constituido a los efectos del presente contrato, titular de la posición contractual y derechos de adjudicación sobre la Unidad Funcional / Departamento ${input.socioId} ("EL SOCIO APORTANTE").`,
      tecnico: `PARTE TÉCNICA Y DIRECCIÓN DE OBRA: Integrada colegiadamente por la DIRECCIÓN TÉCNICA DE OBRA a cargo de ${director}, el CÁLCULO Y PROYECTO ESTRUCTURAL a cargo de ${calculista}, y la EJECUCIÓN CONSTRUCTIVA a cargo de ${constructora}, con legajo municipal registrado bajo expediente ${permiso} ("EL EQUIPO TÉCNICO RESPONSABLE").`
    },
    clausulas: [
      {
        numero: 'PRIMERA',
        titulo: 'Marco Jurídico, Afectación y Naturaleza Fiduciaria',
        contenido: `Las partes celebran el presente Contrato Tripartito de Adhesión al Fideicomiso Inmobiliario de Ahorro Previo Mutuo, regulado expresamente bajo las disposiciones de los Artículos 1666 a 1700 y concordantes del Código Civil y Comercial de la Nación (CCCN). Los bienes, aportes dinerarios y el inmueble ubicado en ${ubicacion} constituyen un patrimonio de afectación separado, libre de acciones de acreedores particulares de los socios aportantes, de la administración fiduciaria o de los profesionales técnicos intervinientes.`
      },
      {
        numero: 'SEGUNDA',
        titulo: 'Objeto Contractual y Asignación de Unidad',
        contenido: `El objeto del presente contrato es la adquisición del terreno, tramitación integral de permisos públicos, construcción material y adjudicación definitiva en Propiedad Horizontal (PH) de la Unidad Funcional / Departamento número ${input.socioId}, conforme a las especificaciones técnicas, planos de arquitectura convalidada y memoria descriptiva del proyecto denominado "${input.fondoNombre}".`
      },
      {
        numero: 'TERCERA',
        titulo: 'Plan Económico, Aportes, Cuotas y Gastos de Adjudicación',
        contenido: `El valor de costo objetivo estimado de la unidad asciende a ${fmtMoneda(costoDepto)}, pactándose un esquema de cancelación de ${cantidadCuotas} cuotas mensuales y ordinarias de aporte mutuo, con una cuota pura inicial estimada de ${fmtMoneda(cuotaPura)}. El Socio ha integrado un anticipo voluntario de capital de ${fmtMoneda(anticipo)}, quedando un saldo neto financiado de ${fmtMoneda(saldoFinanciar)}. Los gastos fiduciarios (administración, escribanía, seguros de caución y fondo de contingencia por un total estimado del ${totalGastosPct}%) serán integrados mediante la modalidad pactada (${input.gastos.formaPagoGastos === 'final' ? 'al momento de adjudicación / toma de posesión' : 'prorrateados proporcionalmente mes a mes'}).`
      },
      {
        numero: 'CUARTA',
        titulo: 'Obligaciones y Facultades de la Administración Fiduciaria',
        contenido: `LA FIDUCIARIA se obliga a: a) Recaudar puntualmente las cuotas y aportes mediante cuenta bancaria recaudadora fiduciaria exclusiva; b) Proveer los fondos necesarios al Equipo Técnico y a los proveedores conforme a los certificados de obra mensuales aprobados; c) Emitir mensualmente a cada suscriptor el extracto de cuenta corriente individual con historial de pagos; d) Gestionar las compras por acopio de materiales básicos (hierro, cemento, ladrillos) para blindar el costo contra variaciones inflacionarias; e) Convocar a los actos de adjudicación por sorteo o licitación.`
      },
      {
        numero: 'QUINTA',
        titulo: 'Compromisos, Certificación y Dirección del Equipo Técnico',
        contenido: `EL EQUIPO TÉCNICO RESPONSABLE asume formalmente la dirección ejecutiva, control de calidad y fiel ejecución constructiva del edificio, obligándose a: a) Confeccionar y gestionar las aprobaciones de planos definitivos ante la Municipalidad correspondiente (${permiso}), entes prestadores de servicios de energía, agua, gas y medio ambiente; b) Certificar de forma mensual el avance físico ponderado de la obra mediante Libro de Órdenes y actas rubricadas; c) Velar por el cumplimiento de las normas de higiene y seguridad laboral; d) Confeccionar el Plano de Mensura y Subdivisión en Propiedad Horizontal (PH) y tramitar el Final de Obra definitivo.`
      },
      {
        numero: 'SEXTA',
        titulo: 'Posesión, Adjudicación y Cesión de Posición Contractual (Art. 1614 CCCN)',
        contenido: `La entrega de la posesión efectiva de la unidad quedará supeditada a que la obra haya alcanzado el porcentaje de avance físico habitable certificado por la Dirección Técnica y a que el Socio Aportante se encuentre al día con sus cuotas y gastos de posesión. Asimismo, conforme a las previsiones del Artículo 1614 y concordantes del Código Civil y Comercial de la Nación, EL SOCIO APORTANTE goza del derecho expreso de ceder su posición contractual a terceros interesados, requiriendo únicamente la notificación fehaciente a la Administración Fiduciaria para el traspaso de la titularidad fiduciaria y registro en el padrón de socios.`
      },
      {
        numero: 'SÉPTIMA',
        titulo: 'Mora, Intereses y Fondo de Garantía',
        contenido: `La mora en el pago de las cuotas operará de pleno derecho a los diez (10) días corridos del vencimiento mensual, devengando un interés compensatorio y punitorio fijado por la administración. La reiteración de tres (3) cuotas consecutivas impagas facultará a la Fiduciaria a intimar al regularizamiento en un plazo improrrogable de 15 días, bajo apercibimiento de cesión coactiva o reintegro según las pautas del reglamento fiduciario para no perjudicar la continuidad de la obra comunitaria.`
      },
      {
        numero: 'OCTAVA',
        titulo: 'Jurisdicción, Domicilios y Firma Tripartita',
        contenido: `Para todos los efectos judiciales o extrajudiciales derivados del presente, las partes constituyen sus domicilios especiales en los lugares precedentemente indicados, y se someten a la competencia de los Tribunales Ordinarios en lo Civil y Comercial correspondientes a la jurisdicción de ubicación del inmueble, con renuncia a cualquier otro fuero o jurisdicción que pudiera corresponder. En prueba de mutua conformidad, se firman tres (3) ejemplares de un mismo tenor y a un solo efecto.`
      }
    ],
    fechaTexto: `Celebrado en la ciudad correspondiente al emplazamiento del proyecto, a los ${fechaHoy}.`
  };
};

/**
 * Genera y descarga el archivo PDF oficial del Contrato
 */
export const descargarContratoPDF = (input: ContratoDatosInput) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 22;
  let currentPage = 1;

  const addHeader = (pageNum: number) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`CONTRATO TRIPARTITO OFICIAL • PROYECTO: ${input.fondoNombre.toUpperCase()}`, margin, 16);

    doc.text(`Página ${pageNum}`, pageWidth - margin - 15, 14);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Instrumento contractual con validez fiduciaria (Arts. 1666 y ss. CCCN) • Unidad: Depto ${input.socioId} • Sistema FONDO INMOBIL`,
      margin,
      pageHeight - 8
    );
  };

  addHeader(currentPage);
  cursorY = 28;

  // Si existe contrato personalizado guardado por el usuario:
  if (input.contratoPersonalizado && input.contratoPersonalizado.trim()) {
    const textoProcesado = aplicarVariablesContrato(input.contratoPersonalizado, input);
    const parrafos = textoProcesado.split('\n');

    for (const p of parrafos) {
      const lineaTrim = p.trim();
      if (!lineaTrim) {
        cursorY += 4;
        continue;
      }

      // Estilo según tipo de línea
      const isTitulo = lineaTrim.startsWith('CONTRATO') || lineaTrim.startsWith('PROYECTO:');
      const isClausula = lineaTrim.startsWith('CLÁUSULA') || lineaTrim.startsWith('CLAUSULA') || lineaTrim.startsWith('SECCIÓN');
      const isSeparador = lineaTrim.startsWith('====') || lineaTrim.startsWith('----');

      if (isSeparador) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 4;
        continue;
      }

      if (isTitulo) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
      } else if (isClausula) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
      }

      const lineas = doc.splitTextToSize(lineaTrim, contentWidth);
      const reqSpace = lineas.length * 4.2 + 4;

      if (cursorY + reqSpace > pageHeight - 25) {
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        cursorY = 28;
      }

      doc.text(lineas, margin, cursorY, { align: isTitulo ? 'center' : 'left', maxWidth: contentWidth });
      cursorY += lineas.length * 4.2 + 2;
    }
  } else {
    // Si no hay contrato personalizado, usar la estructura por defecto
    const data = obtenerTextoContrato(input);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const titleLines = doc.splitTextToSize(data.titulo, contentWidth);
    doc.text(titleLines, margin, cursorY);
    cursorY += titleLines.length * 5.5 + 4;

    // Cuadro con las 3 partes
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, cursorY, contentWidth, 52, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('COMPARECIENTES Y PARTES INTERVINIENTES:', margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    const adminLines = doc.splitTextToSize(data.partes.admin, contentWidth - 8);
    doc.text(adminLines, margin + 4, cursorY + 12);

    const socioLines = doc.splitTextToSize(data.partes.socio, contentWidth - 8);
    doc.text(socioLines, margin + 4, cursorY + 24);

    const tecnicoLines = doc.splitTextToSize(data.partes.tecnico, contentWidth - 8);
    doc.text(tecnicoLines, margin + 4, cursorY + 37);

    cursorY += 58;

    // Cláusulas
    data.clausulas.forEach((c) => {
      const headerClausula = `CLÁUSULA ${c.numero}: ${c.titulo.toUpperCase()}`;
      const textLines = doc.splitTextToSize(c.contenido, contentWidth);
      const requiredSpace = textLines.length * 4 + 10;

      if (cursorY + requiredSpace > pageHeight - 25) {
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        cursorY = 28;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(headerClausula, margin, cursorY);
      cursorY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(textLines, margin, cursorY, { align: 'justify', maxWidth: contentWidth });
      cursorY += textLines.length * 4 + 4;
    });

    if (cursorY + 45 > pageHeight - 25) {
      doc.addPage();
      currentPage++;
      addHeader(currentPage);
      cursorY = 28;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(data.fechaTexto, margin, cursorY);
    cursorY += 12;
  }

  // Firmas de las tres partes
  if (cursorY + 32 > pageHeight - 20) {
    doc.addPage();
    currentPage++;
    addHeader(currentPage);
    cursorY = 28;
  }

  const boxWidth = (contentWidth - 8) / 3;
  const signHeight = 26;

  // Firma 1: Administrador
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.rect(margin, cursorY, boxWidth, signHeight);
  doc.line(margin + 4, cursorY + 16, margin + boxWidth - 4, cursorY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('POR LA ADMINISTRACIÓN FIDUCIARIA', margin + boxWidth / 2, cursorY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Firma y Sello Representante Legal', margin + boxWidth / 2, cursorY + 23, { align: 'center' });

  // Firma 2: Socio Aportante
  const xSocio = margin + boxWidth + 4;
  doc.rect(xSocio, cursorY, boxWidth, signHeight);
  doc.line(xSocio + 4, cursorY + 16, xSocio + boxWidth - 4, cursorY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(`POR EL SOCIO ADJUDICATARIO`, xSocio + boxWidth / 2, cursorY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Firma Titular Unidad Dpto ${input.socioId}`, xSocio + boxWidth / 2, cursorY + 23, { align: 'center' });

  // Firma 3: Representante Técnico
  const xTecnico = margin + (boxWidth + 4) * 2;
  doc.rect(xTecnico, cursorY, boxWidth, signHeight);
  doc.line(xTecnico + 4, cursorY + 16, xTecnico + boxWidth - 4, cursorY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('POR EL EQUIPO TÉCNICO Y OBRA', xTecnico + boxWidth / 2, cursorY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Dirección de Obra / Matrícula Colegiada', xTecnico + boxWidth / 2, cursorY + 23, { align: 'center' });

  const fileName = `Contrato_Tripartito_${input.fondoNombre.replace(/\s+/g, '_')}_Depto_${input.socioId}.pdf`;
  doc.save(fileName);
};

export type EstadoTramite = 'iniciado' | 'en_tramite' | 'aprobado' | 'observado';
export type CategoriaOrganismo =
  | 'Municipalidad'
  | 'Catastro / PH'
  | 'Servicios Públicos'
  | 'Medio Ambiente'
  | 'Bomberos / Seguridad'
  | 'Otros Organismos';

export interface TramiteOrganismo {
  id: string;
  organismo: CategoriaOrganismo;
  titulo: string;
  numeroExpediente: string;
  estado: EstadoTramite;
  fechaInicio: string;
  fechaAprobacion?: string;
  documentoUrl?: string;
  observaciones?: string;
}

export type EstadoEtapaObra = 'pendiente' | 'en_progreso' | 'completada';

export interface EtapaObra {
  id: string;
  nombre: string;
  pesoPonderado: number; // Porcentaje de peso sobre el total (0-100)
  porcentajeReal: number; // 0-100
  fechaInicioEstimada: string;
  fechaFinEstimada: string;
  estado: EstadoEtapaObra;
}

export interface DocumentoTecnico {
  id: string;
  categoria: 'Plano Arquitectura' | 'Estructura H°A°' | 'Instalaciones' | 'Permiso / Resolución' | 'Memoria Descriptiva';
  nombre: string;
  numeroPlanoResolucion?: string;
  fechaCarga: string;
  profesionalFirmante?: string;
  url?: string;
  tamanio?: string;
}

export interface ProfesionalTecnico {
  id: string;
  rol: string; // ej: 'Director de Obra', 'Cálculo Estructural', 'Empresa Constructora', 'Agrimensura / Mensura PH', 'Higiene y Seguridad', 'Instalaciones Termomecánicas y Gas', 'Instalaciones Eléctricas', etc.
  nombre: string;
  matricula?: string;
  entidadColegiada?: string; // ej: 'CAPBA', 'CIPBA', 'COPIME', 'CPA'
  empresa?: string;
  telefono?: string;
  email?: string;
}

export interface DatosTecnicosProyecto {
  // Dimensiones y datos catastrales
  superficieTotalM2: number;
  superficieCubiertaM2: number;
  superficieSemicubiertaM2: number;
  superficieTerrenoM2?: number;
  cantidadPisos: number;
  cantidadUnidades?: number;
  direccionObra?: string;
  nomenclaturaCatastral?: string;
  partidaInmobiliaria?: string;
  numeroPermisoObra?: string;
  memoriaDescriptiva?: string;

  // Profesionales (compatibilidad legacy + lista dinámica)
  directorObra: string;
  calculistaEstructural: string;
  empresaConstructora: string;
  profesionales?: ProfesionalTecnico[];

  // Etapas, Trámites y Planos
  etapas: EtapaObra[];
  tramites: TramiteOrganismo[];
  documentos: DocumentoTecnico[];
}

export const DATOS_TECNICOS_DEFAULT: DatosTecnicosProyecto = {
  superficieTotalM2: 1250,
  superficieCubiertaM2: 1100,
  superficieSemicubiertaM2: 150,
  superficieTerrenoM2: 450,
  cantidadPisos: 5,
  cantidadUnidades: 10,
  direccionObra: 'Av. Libertador 1450, Zona Céntrica',
  nomenclaturaCatastral: 'Circ. I, Secc. B, Manz. 24, Parc. 12',
  partidaInmobiliaria: '045-894120-7',
  numeroPermisoObra: 'EXP-MUNIC-2026-89412',
  memoriaDescriptiva: 'Edificio residencial de categoría desarrollado en PB y 4 plantas tipo con 10 unidades de 2 y 3 ambientes. Estructura independiente de H°A°, cerramientos de doble muro con cámara de aire, aberturas de aluminio DVH y terminaciones de primera línea.',
  directorObra: 'Arq. Martín Benítez (Mat. CAPBA 18452)',
  calculistaEstructural: 'Ing. Carlos Rossi (Mat. CIPBA 22104)',
  empresaConstructora: 'Construcciones & Desarrollos Fiduciarios S.A.',
  profesionales: [
    {
      id: 'prof-1',
      rol: 'Director de Obra',
      nombre: 'Arq. Martín Benítez',
      matricula: 'CAPBA 18452',
      entidadColegiada: 'Colegio de Arquitectos',
      empresa: 'Estudio Benítez & Asociados',
      telefono: '+54 11 4455-8899',
      email: 'mbenitez@estudiobenitez.com'
    },
    {
      id: 'prof-2',
      rol: 'Cálculo y Proyecto Estructural H°A°',
      nombre: 'Ing. Carlos Rossi',
      matricula: 'CIPBA 22104',
      entidadColegiada: 'Colegio de Ingenieros',
      empresa: 'Rossi Estructuras Civiles',
      telefono: '+54 11 4780-1122',
      email: 'carlos.rossi@rossiestructuras.com'
    },
    {
      id: 'prof-3',
      rol: 'Empresa Constructora Principal',
      nombre: 'Construcciones & Desarrollos Fiduciarios S.A.',
      matricula: 'Registro Contratista O.P. N° 4510',
      entidadColegiada: 'Cámara de la Construcción',
      empresa: 'CDF Desarrollos S.A.',
      telefono: '+54 11 5000-3300',
      email: 'obras@cdfconstrucciones.com.ar'
    },
    {
      id: 'prof-4',
      rol: 'Agrimensura y Subdivisión PH',
      nombre: 'Agrim. Roberto Gómez',
      matricula: 'CPA 5541',
      entidadColegiada: 'Consejo Profesional de Agrimensura',
      empresa: 'Gómez & Cía Agrimensura',
      telefono: '+54 11 4321-9988',
      email: 'roberto@gomezagrimensura.com'
    },
    {
      id: 'prof-5',
      rol: 'Seguridad e Higiene Laboral',
      nombre: 'Lic. Andrea Fernández',
      matricula: 'CSP 1042',
      entidadColegiada: 'Colegio de Higiene y Seguridad',
      empresa: 'SafeWork Consultora',
      telefono: '+54 11 6543-2109',
      email: 'afernandez@safework.com'
    }
  ],
  etapas: [
    {
      id: 'e-1',
      nombre: '1. Proyecto Ejecutivo y Trámites Previos',
      pesoPonderado: 10,
      porcentajeReal: 100,
      fechaInicioEstimada: '2026-10-01',
      fechaFinEstimada: '2026-12-31',
      estado: 'completada'
    },
    {
      id: 'e-2',
      nombre: '2. Movimiento de Suelos y Fundaciones',
      pesoPonderado: 15,
      porcentajeReal: 85,
      fechaInicioEstimada: '2027-01-01',
      fechaFinEstimada: '2027-04-30',
      estado: 'en_progreso'
    },
    {
      id: 'e-3',
      nombre: '3. Estructura de Hormigón Armado',
      pesoPonderado: 25,
      porcentajeReal: 30,
      fechaInicioEstimada: '2027-05-01',
      fechaFinEstimada: '2027-11-30',
      estado: 'en_progreso'
    },
    {
      id: 'e-4',
      nombre: '4. Mampostería y Cerramientos',
      pesoPonderado: 15,
      porcentajeReal: 0,
      fechaInicioEstimada: '2027-12-01',
      fechaFinEstimada: '2028-05-31',
      estado: 'pendiente'
    },
    {
      id: 'e-5',
      nombre: '5. Instalaciones (Sanitaria, Eléctrica, Gas)',
      pesoPonderado: 15,
      porcentajeReal: 0,
      fechaInicioEstimada: '2028-06-01',
      fechaFinEstimada: '2028-11-30',
      estado: 'pendiente'
    },
    {
      id: 'e-6',
      nombre: '6. Terminaciones, Yesería y Revestimientos',
      pesoPonderado: 15,
      porcentajeReal: 0,
      fechaInicioEstimada: '2028-12-01',
      fechaFinEstimada: '2029-06-30',
      estado: 'pendiente'
    },
    {
      id: 'e-7',
      nombre: '7. Final de Obra, PH y Entrega de Llaves',
      pesoPonderado: 5,
      porcentajeReal: 0,
      fechaInicioEstimada: '2029-07-01',
      fechaFinEstimada: '2029-10-31',
      estado: 'pendiente'
    }
  ],
  tramites: [
    {
      id: 't-1',
      organismo: 'Municipalidad',
      titulo: 'Permiso Provisorio de Obra / Demolición',
      numeroExpediente: 'MUN-EXP-2026-4412',
      estado: 'aprobado',
      fechaInicio: '2026-08-15',
      fechaAprobacion: '2026-11-20',
      observaciones: 'Convalidado con pago de derechos de construcción.'
    },
    {
      id: 't-2',
      organismo: 'Municipalidad',
      titulo: 'Aprobación de Planos de Arquitectura Definitivos',
      numeroExpediente: 'MUN-ARQ-2026-9811',
      estado: 'aprobado',
      fechaInicio: '2026-09-01',
      fechaAprobacion: '2026-12-10',
      observaciones: 'Resolución aprobatoria N° 458/26 emitida.'
    },
    {
      id: 't-3',
      organismo: 'Medio Ambiente',
      titulo: 'Certificado de Aptitud Ambiental e Impacto',
      numeroExpediente: 'AMB-RES-2026-1104',
      estado: 'aprobado',
      fechaInicio: '2026-10-05',
      fechaAprobacion: '2026-12-28',
      observaciones: 'Dictamen técnico favorable sin observaciones.'
    },
    {
      id: 't-4',
      organismo: 'Servicios Públicos',
      titulo: 'Factibilidad de Suministro Eléctrico (Transformador)',
      numeroExpediente: 'ELEC-FACT-88741',
      estado: 'en_tramite',
      fechaInicio: '2026-11-12',
      observaciones: 'En revisión de cálculo de potencia simultánea.'
    },
    {
      id: 't-5',
      organismo: 'Servicios Públicos',
      titulo: 'Factibilidad de Red de Agua Potable y Desagües Cloacales',
      numeroExpediente: 'AGUA-CLO-33982',
      estado: 'aprobado',
      fechaInicio: '2026-10-20',
      fechaAprobacion: '2027-01-15',
      observaciones: 'Aprobación con punto de conexión otorgado.'
    },
    {
      id: 't-6',
      organismo: 'Catastro / PH',
      titulo: 'Plano de Mensura y Proyecto de Subdivisión en PH',
      numeroExpediente: 'CAT-PH-2027-0043',
      estado: 'iniciado',
      fechaInicio: '2027-01-10',
      observaciones: 'Ingresado en Dirección de Geodesia y Catastro.'
    }
  ],
  documentos: [
    {
      id: 'd-1',
      categoria: 'Plano Arquitectura',
      nombre: 'Plano General de Plantas, Cortes y Fachadas (Aprobado)',
      numeroPlanoResolucion: 'PL-ARQ-01/04',
      fechaCarga: '2026-12-15',
      profesionalFirmante: 'Arq. Martín Benítez',
      tamanio: '14.2 MB'
    },
    {
      id: 'd-2',
      categoria: 'Estructura H°A°',
      nombre: 'Cálculo de Estructura y Planillas de Armaduras',
      numeroPlanoResolucion: 'EST-MEM-02',
      fechaCarga: '2027-01-05',
      profesionalFirmante: 'Ing. Carlos Rossi',
      tamanio: '8.7 MB'
    },
    {
      id: 'd-3',
      categoria: 'Permiso / Resolución',
      nombre: 'Resolución Municipal N° 458/26 - Permiso de Edificación',
      numeroPlanoResolucion: 'RES-458-2026',
      fechaCarga: '2026-12-12',
      profesionalFirmante: 'Dirección de Obras Particulares',
      tamanio: '2.1 MB'
    }
  ]
};

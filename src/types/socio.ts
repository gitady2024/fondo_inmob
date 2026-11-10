export interface SocioFiduciario {
  id: string;
  fondoId: string;
  numeroSocio: number; // 1, 2, ... correspondiente a Unidad Depto 1, 2...
  unidadDepto: string; // Ej: "Depto 1", "Unidad 1"
  nombreCompleto: string;
  dni: string;
  fotoDniUrl?: string; // Data URL o URL del DNI frente/dorso
  fotoDniNombre?: string;
  email: string;
  telefono: string;
  pagoInicialEfectuado: boolean;
  montoPagoInicial: number;
  fechaPagoInicial?: string; // YYYY-MM-DD
  comprobantePagoUrl?: string;
  comprobantePagoNombre?: string;
  contratoFirmadoUrl?: string; // Data URL (PDF o imagen) del contrato firmado
  contratoFirmadoNombre?: string;
  fechaFirmaContrato?: string; // YYYY-MM-DD
  estado: 'activo' | 'pendiente_pago' | 'inactivo';
  observaciones?: string;
  updatedAt: string;
}

export interface ResumenSociosFondo {
  totalUnidades: number;
  sociosRegistrados: number;
  sociosActivos: number; // Con pago inicial efectuado
  sociosPendientesPago: number;
  contratosCargados: number;
}


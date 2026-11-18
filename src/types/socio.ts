export interface SocioFiduciario {
  id: string;
  fondoId: string;
  numeroSocio: number; // 1, 2, ... correspondiente a Unidad Depto 1, 2...
  unidadDepto: string; // Ej: "Depto 1", "Unidad 1"
  nombreCompleto: string;
  dni: string;
  fotoDniUrl?: string; // Data URL o URL del DNI frente/dorso
  fotoDniNombre?: string;
  domicilio?: string; // Dirección real / fiscal del titular
  constanciaDomicilioUrl?: string; // Comprobante o certificado de domicilio
  constanciaDomicilioNombre?: string;
  garantiaTipo?: string; // Ej: 'Recibo de Sueldo', 'Garante Propietario', 'Seguro de Caución', 'Fianza Personal'
  garantiaDetalle?: string; // Detalle, titular o entidad de la garantía
  garantiaDocUrl?: string;
  garantiaDocNombre?: string;
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


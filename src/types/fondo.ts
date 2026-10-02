export type ModalidadAnticipo = 'reducir_cuota' | 'reducir_plazo';
export type FormaPagoGastos = 'final' | 'prorrateado';
export type MecanismoSalida = 'tercero' | 'preferencia' | 'diferido';
export type EstrategiaImpactoAdelanto = 'reducir_cuota' | 'acelerar';

export interface ParametrosFondoState {
  costoDepto: number;
  cantidadDeptos: number;
  cantidadCuotas: number;
  valorCuotaBase: number;
  fechaInicio: string; // YYYY-MM
  modalidadAnticipo: ModalidadAnticipo;
}

export interface GastosConfigState {
  formaPagoGastos: FormaPagoGastos;
  comisionGestion: number; // Porcentaje ej: 7
  comisionEscribania: number; // Porcentaje ej: 3
  otrosGastos: number; // Monto fijo en $
}

export interface CesionConfigState {
  activo: boolean;
  socioCedente: number; // 1-indexed
  cuotaSalida: number;
  primaCesion: number; // Porcentaje ej: 10
  mecanismoSalida: MecanismoSalida;
}

export interface AdelantoConfigState {
  activo: boolean;
  socioAdelanta: number; // 1-indexed
  monto: number;
  cuota: number;
  estrategia: EstrategiaImpactoAdelanto;
}

export interface AjusteCuota {
  id: string;
  mes: number; // Mes a partir del cual aplica el ajuste (ej: 6)
  porcentaje: number; // Porcentaje de incremento ej: 10 para 10%
  motivo?: string; // Ej: "Aumento CAC / Materiales", "Gestión Técnica"
  fechaAplicacion?: string; // Formato YYYY-MM
}

export interface FlujoMes {
  mes: number;
  capital: number;
  adelanto: number;
  gastos: number;
  abonadoMes: number;
  saldoRemanente: number;
  totalAcumulado: number;
  porcentajeAjuste?: number;
  motivoAjuste?: string;
  factorAcumuladoAjuste?: number;
}

export interface FlujoSocioCalculado {
  socioId: number;
  anticipoMes0: number;
  cuotaPosesion: number;
  cuotaInmInicial: number;
  cuotaFinInicial: number;
  pagoFinalGastos: number;
  recargoGastosPorCuota: number;
  mesesTotales: number;
  totalAbonado: number;
  flujo: FlujoMes[];
  totalAjustesPorcentaje?: number;
  cuotaInmActual?: number;
  cuotaFinActual?: number;
}

export interface LiquidacionCesion {
  capitalAportado: number;
  cuotasPagas: number;
  montoPrima: number;
  gastoCesion: number;
  netoACobrar: number;
  desembolsoEntradaAdquirente: number;
  cuotasRestantesAdquirente: number;
  deudaRestanteAdquirente: number;
  gastosAdjudicacionAdquirente: number;
  costoTotalAdquirente: number;
}

import type {
  GastosConfigState,
  FlujoMes,
  FlujoSocioCalculado,
  LiquidacionCesion
} from '../types/fondo';


export const fmtMoneda = (val: number): string => {
  return '$' + Math.round(val).toLocaleString('es-AR');
};

export const formatFecha = (
  fechaInicioStr: string,
  mesesOffset: number
): { fechaCorta: string; fechaLarga: string } => {
  const [startYear, startMonth] = (fechaInicioStr || '2027-01')
    .split('-')
    .map(Number);
  const offset = mesesOffset <= 0 ? 1 : mesesOffset;
  const targetMonthIndex = startMonth - 1 + (offset - 1);
  const anio = startYear + Math.floor(targetMonthIndex / 12);
  const mes = (targetMonthIndex % 12) + 1;

  return {
    fechaCorta: `${String(mes).padStart(2, '0')}/${String(anio).slice(-2)}`,
    fechaLarga: `${String(mes).padStart(2, '0')}/${anio}`
  };
};

export const calcularGastos = (costoDepto: number, gastos: GastosConfigState, cuotasTotales: number) => {
  const montoGestion = costoDepto * (gastos.comisionGestion / 100);
  const montoEscribania = costoDepto * (gastos.comisionEscribania / 100);
  const gastosTotales = montoGestion + montoEscribania + gastos.otrosGastos;
  const recargoGastosPorCuota =
    gastos.formaPagoGastos === 'prorrateado' && cuotasTotales > 0
      ? gastosTotales / cuotasTotales
      : 0;
  const pagoFinalGastos = gastos.formaPagoGastos === 'final' ? gastosTotales : 0;

  return {
    montoGestion,
    montoEscribania,
    gastosTotales,
    recargoGastosPorCuota,
    pagoFinalGastos
  };
};

export const calcularFlujoIndividual = (
  socioId: number,
  costoDepto: number,
  ant: number,
  cuotasTotalesPlan: number,
  modalidadAnticipo: 'reducir_cuota' | 'reducir_plazo',
  recargoGastosPorCuota: number,
  adelantoConfig: {
    activo: boolean;
    mes: number;
    monto: number;
    estrategia: 'reducir_cuota' | 'acelerar';
  },
  mPosesion: number,
  pagoFinalGastos: number
): FlujoSocioCalculado => {
  const flujo: FlujoMes[] = [];
  let saldo = costoDepto - ant;
  const cuotaBase = cuotasTotalesPlan > 0 ? costoDepto / cuotasTotalesPlan : 0;
  let cuotaNormal =
    modalidadAnticipo === 'reducir_cuota' && cuotasTotalesPlan > 0
      ? saldo / cuotasTotalesPlan
      : cuotaBase;

  const limiteMeses =
    modalidadAnticipo === 'reducir_cuota'
      ? cuotasTotalesPlan
      : cuotaNormal > 0
      ? Math.ceil(saldo / cuotaNormal)
      : cuotasTotalesPlan;

  let mes = 1;
  let totalAbonado = ant;

  while (saldo > 0.01 && mes <= 240) {
    let capitalMes = cuotaNormal;
    let adelantoMes = 0;

    if (adelantoConfig.activo && mes === adelantoConfig.mes) {
      adelantoMes = adelantoConfig.monto;
      saldo -= adelantoMes;
      if (saldo < 0) {
        adelantoMes += saldo;
        saldo = 0;
      }

      if (adelantoConfig.estrategia === 'reducir_cuota' && saldo > 0) {
        const mesesRest = limiteMeses - mes;
        if (mesesRest > 0) {
          cuotaNormal = saldo / mesesRest;
        }
      }
    }

    if (capitalMes > saldo) {
      capitalMes = saldo;
    }
    saldo -= capitalMes;

    let gastosMes = recargoGastosPorCuota;
    if (mes === mPosesion) {
      gastosMes += pagoFinalGastos;
    }

    const abonadoMes = capitalMes + adelantoMes + gastosMes;
    totalAbonado += abonadoMes;

    flujo.push({
      mes,
      capital: capitalMes,
      adelanto: adelantoMes,
      gastos: gastosMes,
      abonadoMes,
      saldoRemanente: saldo,
      totalAcumulado: totalAbonado
    });

    if (saldo <= 0.01) break;
    mes++;
  }

  return {
    socioId,
    anticipoMes0: ant,
    cuotaPosesion: mPosesion,
    cuotaInmInicial: flujo.length > 0 ? flujo[0].capital : 0,
    cuotaFinInicial: flujo.length > 0 ? flujo[0].capital + recargoGastosPorCuota : 0,
    pagoFinalGastos,
    recargoGastosPorCuota,
    mesesTotales: flujo.length,
    totalAbonado,
    flujo
  };
};

export const calcularLiquidacionCesion = (
  socioCalculado: FlujoSocioCalculado,
  cuotaSalida: number,
  primaPorcentaje: number,
  pagoFinalGastos: number
): LiquidacionCesion => {
  let capAportado = socioCalculado.anticipoMes0;
  let cuotasPagas = 0;

  for (const m of socioCalculado.flujo) {
    if (m.mes <= cuotaSalida) {
      capAportado += m.abonadoMes;
      cuotasPagas++;
    }
  }

  const valPrima = capAportado * (primaPorcentaje / 100);
  const arrNeto = capAportado + valPrima;
  const gastoCesion = arrNeto * 0.02; // 2% arancel cesión
  const netoACobrar = arrNeto - gastoCesion;

  const cuotasRestantes = Math.max(0, socioCalculado.mesesTotales - cuotaSalida);
  const deudaRestante = Math.max(0, socioCalculado.totalAbonado - capAportado);
  const gastosPosesion = socioCalculado.cuotaPosesion > cuotaSalida ? pagoFinalGastos : 0;
  const costoTotalAdquirente = arrNeto + deudaRestante;

  return {
    capitalAportado: capAportado,
    cuotasPagas,
    montoPrima: valPrima,
    gastoCesion,
    netoACobrar,
    desembolsoEntradaAdquirente: arrNeto,
    cuotasRestantesAdquirente: cuotasRestantes,
    deudaRestanteAdquirente: deudaRestante,
    gastosAdjudicacionAdquirente: gastosPosesion,
    costoTotalAdquirente
  };
};

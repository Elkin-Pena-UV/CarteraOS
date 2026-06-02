// 
//
// Convierte un DocumentoCruce en el payload de la API conectora de Siesa
// (sección `datos` del Imp-UnoEE-Docto_contable_conector.json). Es la
// alternativa al plano de ancho fijo: mismos datos, mapeados por NOMBRE de
// campo en vez de por posición.
//
// Produce el objeto `datos` para UN documento (una Nota Interna):
//   {
//     "Documento contable V2": [ {...cabecera} ],
//     "Movimiento CxC V2":     [ {...FVE}, {...RC}, ... ],
//     "Movimiento contable V2":[ {...ajuste} ]   // solo Caso 4/5
//   }

/** @typedef {import('./siesaPlano.js').DocumentoCruce} DocumentoCruce */

const num = (v) => Number(v ?? 0);

/**
 * @param {DocumentoCruce} d
 * @param {Object} [opts]
 * @param {string} [opts.consec='00000001']  Nº de documento (placeholder si es automático)
 * @param {string} [opts.consecAuto='1']     1=automático, 0=manual
 * @param {string} [opts.claseDocto='00030']
 * @param {string} [opts.estado='1']
 * @param {string} [opts.impresion='0']
 * @returns {Object}  Sección `datos` lista para el request
 */
export function aPayloadConector(d, opts = {}) {
  const {
    consec = '00000001',
    consecAuto = '1',
    claseDocto = '00030',
    estado = '1',
    impresion = '0',
  } = opts;

  const co = d.co ?? '001';
  const tipoDoc = d.tipoDoc ?? 'NI';
  const un = d.un ?? '01';

  const cabecera = {
    INDICA_SI_EL_NUMERO_CONSECUTIVO_DE_DOCTO_ES_MANUAL_O_AUTOMATICO: consecAuto,
    CENTRO_DE_OPERACION_DEL_DOCUMENTO: co,
    TIPO_DE_DOCUMENTO: tipoDoc,
    NUMERO_DE_DOCUMENTO: consec,
    FECHA_DEL_DOCUMENTO: d.fecha, // "AAAAMMDD"
    TERCERO_DEL_DOCUMENTO: d.tercero,
    CLASE_INTERNA_DEL_DOCUMENTO: claseDocto,
    ESTADO_DEL_DOCUMENTO: estado,
    ESTADO_DE_IMPRESION_DEL_DOCUMENTO: impresion,
    OBSERVACIONES_DEL_DOCUMENTO: d.notas,
    MANDATO: '',
  };

  const movimientosCxC = d.lineas.map((l) => ({
    CENTRO_DE_OPERACION_DEL_DOCUMENTO: co,
    TIPO_DE_DOCUMENTO: tipoDoc,
    NUMERO_DE_DOCUMENTO: consec,
    AUXILIAR_DE_CUENTA_CONTABLE: l.auxiliar,
    TERCERO: l.tercero,
    CENTRO_DE_OPERACION_DEL_MOVIMIENTO: co,
    UNIDAD_DE_NEGOCIO: un,
    AUXILIAR_DE_CENTRO_DE_COSTOS: '',
    VALOR_DEBITO: num(l.debito),
    VALOR_CREDITO: num(l.credito),
    VALOR_DEBITO_ALTERNO: 0,
    VALOR_CREDITO_ALTERNO: 0,
    OBSERVACIONES_DEL_MOVIMIENTO: l.notasMov,
    SUCURSAL_CLIENTE: l.sucursal,
    TIPO_DE_DOCUMENTO_DE_CRUCE: l.tipoCruce,
    NUMERO_DE_DOCUMENTO_DE_CRUCE: l.consecCruce,
    NUMERO_DE_CUOTA_DE_DOCUMENTO_DE_CRUCE: '000',
    FECHA_DE_VENCIMIENTO_DEL_DOCUMENTO: l.fechaVcto,
    FECHA_DE_PRONTO_PAGO_DEL_DOCUMENTO: l.fechaDscto ?? l.fechaVcto,
    VALOR_DESCUENTO_PRONTO_PAGO_OTORGADO: 0,
    VALOR_DESCUENTO_PRONTO_PAGO_APLICADO: 0,
    VALOR_DESCUENTO_PRONTO_PAGO_APLICADO_ALTERNO: 0,
    VALOR_AJUSTE_AL_SALDO: 0,
    VALOR_AJUSTE_AL_SALDO_ALTERNO: 0,
    VALOR_RETENCION: 0,
    VALOR_RETENCION_ALTERNO: 0,
    TERCERO_VENDEDOR: l.terceroVend,
    OBSERVACIONES_DEL_MOVIMIENTO_DE_SALDO_ABIERTO: l.notas354,
  }));

  const movimientosContables = d.ajuste
    ? [
        {
          CENTRO_DE_OPERACION_DEL_DOCUMENTO: co,
          TIPO_DE_DOCUMENTO: tipoDoc,
          NUMERO_DE_DOCUMENTO: consec,
          AUXILIAR_DE_CUENTA_CONTABLE: d.ajuste.auxiliar,
          TERCERO: d.ajuste.tercero,
          CENTRO_DE_OPERACION_DEL_MOVIMIENTO: '',
          UNIDAD_DE_NEGOCIO: '',
          AUXILIAR_DE_CENTRO_DE_COSTOS: d.ajuste.ccosto,
          AUXILIAR_DE_CONCEPTO_DE_FULJO_DE_EFECTIVO: '',
          VALOR_DEBITO: num(d.ajuste.debito),
          VALOR_CREDITO: num(d.ajuste.credito),
          VALOR_DEBITO_ALTERNO: 0,
          VALOR_CREDITO_ALTERNO: 0,
          VALOR_BASE_GRAVABLE: 0,
          TIPO_DE_DOCUMENTO_DE_BANCO: '',
          NUMERO_DE_DOCUMENTO_DE_BANCO: 0,
          OBSERVACIONES_DEL_MOVIMIENTO: d.ajuste.notas,
        },
      ]
    : [];

  return {
    'Documento contable V2': [cabecera],
    'Movimiento CxC V2': movimientosCxC,
    'Movimiento contable V2': movimientosContables,
  };
}
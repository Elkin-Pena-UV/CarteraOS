// 
//
// Une clasificador y serializador: a partir de un grupo clasificado produce el
// DocumentoCruce (cabecera + líneas de cartera + línea de ajuste opcional).
//
// Asiento base en todos los casos:
//   1305 (cartera)   al CRÉDITO  = valor de la(s) factura(s) aplicada(s)
//   2805 (anticipo)  al DÉBITO   = valor del/los recibo(s) aplicado(s)
// El ajuste cuadra la diferencia solo en Caso 4 (crédito a ingreso) y Caso 5
// (débito a gasto).

/** @typedef {import('./config.js').ConfigCruce} ConfigCruce */
/** @typedef {import('./normalizador.js').DocNormalizado} DocNormalizado */
/** @typedef {import('./normalizador.js').Clave} Clave */
/** @typedef {import('./clasificador.js').CasoCruce} CasoCruce */
/** @typedef {import('./siesaPlano.js').DocumentoCruce} DocumentoCruce */

/** @param {Clave} c */
const refCorta = (c) => (c.tipo === 'PVC' ? `PVC ${c.valor}` : `Oc ${c.valor}`);

/**
 * @param {DocNormalizado[]} grupo
 * @param {CasoCruce} caso
 * @param {number} net
 * @param {Clave} clave        Llave con la que se emparejó el grupo
 * @param {string} fechaDoc    Fecha de la NI en "AAAAMMDD" (regla: fecha de la factura)
 * @param {ConfigCruce} cfg
 * @returns {DocumentoCruce}
 */
export function mapearADocumento(grupo, caso, net, clave, fechaDoc, cfg) {
  const fves = grupo.filter((d) => d.tipo === 'FVE');
  const rcs = grupo.filter((d) => d.tipo !== 'FVE');
  const tercero = grupo[0].tercero;

  const nF = fves.map((d) => d.consecCruce).join(',');
  const nR = rcs.map((d) => d.consecCruce).join(',');
  const obs = `cruce de FVE ${nF} con RC ${nR} (${clave.valor})`;
  const ref = refCorta(clave);

  const totFVE = fves.reduce((a, d) => a + d.saldo, 0);
  const totRC = rcs.reduce((a, d) => a - d.saldo, 0); // saldo RC es negativo

  /** @type {import('./siesaPlano.js').LineaCartera[]} */
  const lineas = [];

  // Facturas (1305) al CRÉDITO. En pago parcial solo se aplica lo recaudado.
  let pendienteFVE = totRC;
  for (const f of fves) {
    const aplicado = caso === 'PAGO_PARCIAL'
      ? Math.min(f.saldo, pendienteFVE)
      : f.saldo;
    if (caso === 'PAGO_PARCIAL') pendienteFVE -= aplicado;
    lineas.push({
      auxiliar: cfg.cuentaCartera, tercero, credito: aplicado,
      notasMov: ref, sucursal: f.sucursal, tipoCruce: 'FVE',
      consecCruce: f.consecCruce, fechaVcto: f.fechaVcto,
      terceroVend: f.terceroVend, notas354: obs,
    });
  }

  // Anticipos (2805) al DÉBITO. En crédito a favor solo se aplica hasta el total facturado.
  let pendiente = totFVE;
  for (const r of rcs) {
    const aplicado = caso === 'CREDITO_A_FAVOR'
      ? Math.min(-r.saldo, pendiente)
      : -r.saldo;
    if (caso === 'CREDITO_A_FAVOR') pendiente -= aplicado;
    lineas.push({
      auxiliar: cfg.cuentaAnticipo, tercero, debito: aplicado,
      notasMov: ref, sucursal: r.sucursal, tipoCruce: r.tipo,
      consecCruce: r.consecCruce, fechaVcto: r.fechaVcto,
      terceroVend: r.terceroVend, notas354: obs,
    });
  }

  /** @type {DocumentoCruce} */
  const doc = {
    cia: cfg.cia,
    co: cfg.co,
    tipoDoc: cfg.tipoDoc,
    un: cfg.un,
    fecha: fechaDoc,
    tercero,
    notas: obs,
    lineas,
  };

  // Ajuste solo en Caso 4 / 5
  if (caso === 'SALDO_A_FAVOR') {
    doc.ajuste = {
      auxiliar: cfg.cuentaIngreso,
      tercero,
      ccosto: cfg.ccosto,
      credito: Math.abs(net),
      notas: 'Ajuste al peso',
    };
  } else if (caso === 'SALDO_EN_CONTRA') {
    doc.ajuste = {
      auxiliar: cfg.cuentaGasto,
      tercero,
      ccosto: cfg.ccosto,
      debito: net,
      notas: 'Ajuste al peso',
    };
  }

  return doc;
}
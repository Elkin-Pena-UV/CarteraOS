// frontend/lib/adapters/cruces.adapter.ts
import type {
  CruceProcessado,
  GrupoCruce,
  ItemRevision,
  CasoCruce,
  DocNormalizado,
} from '@/lib/services/crucesService'

/* ─── Filas para la tabla de PROCESADOS ─── */
export interface FilaCruceAuto {
  id: string           // tercero + clave
  tercero: string
  claveType: string    // PVC | OC
  claveValor: string
  confianza: number    // 0-1
  caso: CasoCruce
  net: number          // residual con signo (COP)
  totalFVE: number
  totalRC: number
  nroFVE: number       // cantidad de facturas
  nroRC: number        // cantidad de recibos
  consecsFVE: string   // "12345, 67890"
  consecsRC: string
  fechaDoctoFVE: string
  requiereAjuste: boolean
  doc: Record<string, unknown>
}

/* ─── Filas para la tabla de MANUALES ─── */
export interface FilaGrupoManual {
  id: string
  tercero: string
  claveType: string
  claveValor: string
  confianza: number    // razón por la que quedó manual (< umbral)
  nroDocs: number
  totalFVE: number
  totalRC: number
  nroFVE: number
  nroRC: number
  consecsFVE: string
  consecsRC: string
  netEstimado: number
  motivoManual: string // "Baja confianza de llave"
  docs: DocNormalizado[]   // Para mostrar detalles en el modal de revisión
}

/* ─── Filas para la tabla de REVISIÓN ─── */
export interface FilaRevision {
  id: string
  tercero: string
  tipo: string
  consecCruce: number
  saldo: number
  fechaDocto: string
  fechaVcto: string
  notas: string
  claves: string       // "PVC:12345 (1.0)"
  motivo: string
}

// ──────────────────────────────────────────────────────────────────────────────

const CASOS_CON_AJUSTE: CasoCruce[] = ['SALDO_A_FAVOR', 'SALDO_EN_CONTRA']

export function adaptProcesados(procesados: CruceProcessado[]): FilaCruceAuto[] {
  return procesados.map((p) => {
    const fves = p.doc?.lineas
      ? (p.doc.lineas as any[]).filter((l: any) => l.tipoCruce === 'FVE')
      : []
    const rcs = p.doc?.lineas
      ? (p.doc.lineas as any[]).filter((l: any) => l.tipoCruce !== 'FVE')
      : []

    const totalFVE = fves.reduce((a: number, l: any) => a + (l.credito ?? 0), 0)
    const totalRC  = rcs.reduce((a: number, l: any)  => a + (l.debito  ?? 0), 0)

    return {
      id: `${p.tercero}-${p.clave.tipo}${p.clave.valor}`,
      tercero: p.tercero,
      claveType: p.clave.tipo,
      claveValor: p.clave.valor,
      confianza: p.confianza,
      caso: p.caso,
      net: p.net,
      totalFVE,
      totalRC,
      nroFVE: fves.length,
      nroRC: rcs.length,
      consecsFVE: fves.map((l: any) => l.consecCruce).join(', '),
      consecsRC: rcs.map((l: any) => l.consecCruce).join(', '),
      fechaDoctoFVE: (p.doc as any)?.fechaDoc ?? '',
      requiereAjuste: CASOS_CON_AJUSTE.includes(p.caso),
      doc: p.doc, // Incluir el documento completo para posibles ajustes posteriores
    }
  })
}

export function adaptGruposManuales(grupos: GrupoCruce[]): FilaGrupoManual[] {
  return grupos.map((g) => {
    const fves = g.docs.filter((d) => d.tipo === 'FVE')
    const rcs  = g.docs.filter((d) => d.tipo !== 'FVE')
    const totalFVE = fves.reduce((a, d) => a + d.saldo, 0)
    const totalRC  = rcs.reduce((a, d)  => a + d.saldo, 0)
    const netEstimado = Number((totalFVE + totalRC).toFixed(2))

    return {
      id: `manual-${g.tercero}-${g.clave.tipo}${g.clave.valor}`,
      tercero: g.tercero,
      claveType: g.clave.tipo,
      claveValor: g.clave.valor,
      confianza: g.confianza,
      nroDocs: g.docs.length,
      totalFVE,
      totalRC,
      nroFVE: fves.length,
      nroRC: rcs.length,
      consecsFVE: fves.map((d) => d.consecCruce).join(', '),
      consecsRC: rcs.map((d) => d.consecCruce).join(', '),
      netEstimado,
      motivoManual: `Confianza de llave ${(g.confianza * 100).toFixed(0)}% < umbral 80%`,
      docs: g.docs,
    }
  })
}

export function adaptRevision(revision: ItemRevision[]): FilaRevision[] {
  return revision.map((r, i) => ({
    id: `rev-${r.doc.tercero}-${r.doc.consecCruce}-${i}`,
    tercero: r.doc.tercero,
    tipo: r.doc.tipo,
    consecCruce: r.doc.consecCruce,
    saldo: r.doc.saldo,
    fechaDocto: r.doc.fechaDocto,
    fechaVcto: r.doc.fechaVcto,
    notas: r.doc.notas,
    claves: r.doc.claves
      .map((c) => `${c.tipo}:${c.valor} (${c.confianza.toFixed(2)})`)
      .join(' | ') || '—',
    motivo: r.motivo,
  }))
}
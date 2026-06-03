// frontend/services/cruces.service.ts
import axios from '@/lib/axios'

export interface DocNormalizado {
  tercero: string
  tipo: 'FVE' | 'RC' | 'RAC'
  auxiliar: string
  consecCruce: number
  sucursal: string
  fechaDocto: string   // "AAAAMMDD"
  fechaVcto: string
  terceroVend: string
  saldo: number
  notas: string
  claves: { tipo: string; valor: string; confianza: number }[]
}

export interface GrupoCruce {
  tercero: string
  clave: { tipo: string; valor: string; confianza: number }
  docs: DocNormalizado[]
  confianza: number
  autoCruzable: boolean
}

export type CasoCruce =
  | 'MATCH_PERFECTO'
  | 'PAGO_PARCIAL'
  | 'SALDO_A_FAVOR'
  | 'SALDO_EN_CONTRA'
  | 'CREDITO_A_FAVOR'

export interface CruceProcessado {
  tercero: string
  clave: { tipo: string; valor: string; confianza: number }
  confianza: number
  caso: CasoCruce
  net: number
  doc: Record<string, unknown>
  plano: string
}

export interface ItemRevision {
  doc: DocNormalizado
  motivo: string
}

export interface ResumenCruces {
  totalFilas: number
  autoCruzados: number
  gruposManuales: number
  itemsRevision: number
  porCaso: Partial<Record<CasoCruce, number>>
  porMotivo: Record<string, number>
}

export interface ResultadoCruces {
  resumen: ResumenCruces
  procesados: CruceProcessado[]
  gruposManuales: GrupoCruce[]
  revision: ItemRevision[]
}

/** Dispara el pipeline completo (sin enviar a Siesa) */
export async function procesarCruces(): Promise<ResultadoCruces> {
  const res = await axios.post('/cruce-aut/procesar', {})
  return res as unknown as ResultadoCruces
}

export interface CruceAAutorizar {
  tercero: string
  claveType: string
  claveValor: string
  tipoCruce: 'AUTOMATICO' | 'MANUAL'
  caso?: string
  confianza: number
  totalFVE: number
  totalRC: number
  net: number
  nroFVE: number
  nroRC: number
  consecsFVE: string
  consecsRC: string
  observaciones?: string
}

export async function autorizarCruces(
  cruces: CruceAAutorizar[],
  observaciones?: string
): Promise<{ ok: boolean; guardados: number }> {
  const res = await axios.post('/cruce-aut/autorizar', { cruces, observaciones })
  return res as unknown as { ok: boolean; guardados: number }
}

export interface CruceHistorial {
  id: number
  tercero: string
  clave_tipo: string
  clave_valor: string
  tipo_cruce: 'AUTOMATICO' | 'MANUAL'
  caso: string | null
  confianza: number
  total_fve: number
  total_rc: number
  net_residual: number
  consecs_fve: string | null
  consecs_rc: string | null
  nro_fve: number
  nro_rc: number
  autorizado_por: string
  fecha_autorizacion: string
  observaciones: string | null
}

export async function obtenerHistorial(params: {
  tercero?: string
  usuario?: string
}): Promise<CruceHistorial[]> {
  const query = new URLSearchParams()
  if (params.tercero) query.set('tercero', params.tercero)
  if (params.usuario) query.set('usuario', params.usuario)
  const res = await axios.get(`/cruce-aut/historial?${query.toString()}`)
  return (res as any).data
}
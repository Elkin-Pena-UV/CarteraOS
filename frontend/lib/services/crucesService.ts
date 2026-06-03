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
import type { VariationClient } from "@/components/cartera/variation-table"
import type { VariationFilters } from "@/components/cartera/variation-filters-bar"

/**
 * Filtra un array de VariationClient según los filtros activos.
 * Fuente única de verdad — usada por la página de variación.
 */
export function applyVariationFilters(
  data: VariationClient[],
  filters: VariationFilters
): VariationClient[] {
  return data.filter((row) => {
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase().replace(/[^a-z0-9]/gi, "")
      const nitNorm = row.nit.toLowerCase().replace(/[^a-z0-9]/gi, "")
      const nameNorm = row.razonSocial.toLowerCase().replace(/[^a-z0-9]/gi, "")
      if (!nitNorm.includes(q) && !nameNorm.includes(q)) return false
    }

    if (filters.tipoCliente.length > 0) {
      const rowTipo = row.tipoCliente.toLowerCase()
      const match = filters.tipoCliente.some((t) => rowTipo.includes(t.toLowerCase()))
      if (!match) return false
    }

    if (filters.canal.length > 0) {
      const rowCanal = row.canal.toLowerCase()
      const match = filters.canal.some((c) => rowCanal.includes(c.toLowerCase()))
      if (!match) return false
    }

    return true
  })
}
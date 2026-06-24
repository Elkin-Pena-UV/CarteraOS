import type { Client } from "@/components/cartera/clients-table"
import type { ClientFilters } from "@/components/cartera/filters-bar"

/**
 * Filtra un array de clientes según los filtros activos.
 * Fuente única de verdad — usada por el dashboard (tabla + gráficos de aging).
 */
export function applyClientFilters(clients: Client[], filters: ClientFilters): Client[] {
  const normalizedName = filters.clientName.trim().toLowerCase()
  const normalizedNameNoPunct = normalizedName.replace(/[^a-z0-9]/gi, "")
  const minValue = filters.minValue === "" ? null : Number(filters.minValue)
  const maxValue = filters.maxValue === "" ? null : Number(filters.maxValue)

  return clients.filter((client) => {
    if (filters.channel.length > 0) {
      const match = filters.channel.some((c) =>
        client.channel.toLowerCase().includes(c.toLowerCase())
      )
      if (!match) return false
    }

    if (filters.advisor.length > 0 && !client.advisors.some(a => filters.advisor.includes(a))) return false

    if (
      filters.paymentCondition.length > 0 &&
      !filters.paymentCondition.includes(String(client.paymentCondition))
    ) {
      return false
    }

    if (normalizedName) {
      const nameMatches = client.name.toLowerCase().includes(normalizedName)
      const nitNormalized = client.nit
        ? client.nit.toLowerCase().replace(/[^a-z0-9]/gi, "")
        : ""
      const nitMatches = nitNormalized.includes(normalizedNameNoPunct)
      if (!nameMatches && !nitMatches) return false
    }

    const portfolioValue = client.current + client.overdue
    if (minValue !== null && !Number.isNaN(minValue) && portfolioValue < minValue) return false
    if (maxValue !== null && !Number.isNaN(maxValue) && portfolioValue > maxValue) return false

    return true
  })
}
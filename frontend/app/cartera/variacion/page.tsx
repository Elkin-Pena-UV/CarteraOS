"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { VariationTable } from "@/components/cartera/variation-table"
import { KPICards } from "@/components/cartera/kpi-variation-cards"
import {
  VariationFiltersBar,
  initialVariationFilters,
  initialVariationPeriod,
  lastDayOfMonthYYYYMMDD,
  type VariationFilters,
  type VariationPeriod,
} from "@/components/cartera/variation-filters-bar"
import { useVariacion } from "@/hooks/use-variacion"
import { adaptVariacionToClients } from "@/lib/adapters/variacionAdapter"
import type { VariationClient } from "@/components/cartera/variation-table"

function applyVariationFilters(data: VariationClient[], filters: VariationFilters): VariationClient[] {
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function VariacionPage() {
  const [filters, setFilters] = useState<VariationFilters>(initialVariationFilters)
  const [period, setPeriod] = useState<VariationPeriod>(initialVariationPeriod)

  // Ahora: draft (UI) + committed (fetch)
  const [draftPeriod, setDraftPeriod] = useState<VariationPeriod>(initialVariationPeriod)
  const [committedPeriod, setCommittedPeriod] = useState<VariationPeriod>(initialVariationPeriod)

  // Fecha = último día del mes seleccionado → formato YYYYMMDD para el hook
  const fecha = useMemo(
    () => lastDayOfMonthYYYYMMDD(committedPeriod.year, committedPeriod.month),
    [committedPeriod.year, committedPeriod.month]
  )

  // Al limpiar, resetea ambos
  const handleClearPeriod = () => {
    setDraftPeriod(initialVariationPeriod)
    setCommittedPeriod(initialVariationPeriod)
  }

  const { data: rawData, loading, error } = useVariacion(fecha)
  const allData = useMemo(() => adaptVariacionToClients(rawData), [rawData])
  const filteredData = useMemo(() => applyVariationFilters(allData, filters), [allData, filters])

  if (loading) return (
    <AppShell>
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Cargando variación de cartera...
      </div>
    </AppShell>
  )

  if (error) return (
    <AppShell>
      <div className="flex h-96 items-center justify-center text-destructive">{error}</div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Variación de Cartera</h1>
          <p className="text-muted-foreground">
            Comparativo de cartera entre el mes actual y el anterior
          </p>
        </div>

        <VariationFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          period={draftPeriod}
          onPeriodChange={setDraftPeriod}
          onConsultar={() => setCommittedPeriod(draftPeriod)}
          onClearPeriod={handleClearPeriod}
        />

        <KPICards data={allData} />

        <VariationTable data={filteredData} fecha={fecha} />
      </div>
    </AppShell>
  )
}
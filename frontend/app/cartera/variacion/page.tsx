"use client"

import { useMemo, useRef } from "react"
import { usePersistedFilters } from "@/hooks/use-persisted-filters"
import { AppShell } from "@/components/layout/app-shell"
import { VariationTable, type VariationTableRef } from "@/components/cartera/variation-table"
import { KPICards } from "@/components/cartera/kpi-variation-cards"
import {
  VariationFiltersBar,
  initialVariationFilters,
  initialVariationPeriod,
  lastDayOfMonthYYYYMMDD,
  type VariationFilters,
  type VariationPeriod,
} from "@/components/cartera/variation-filters-bar"
import { useVariacion, useRefrescarVariacion } from "@/hooks/use-variacion"
import { adaptVariacionToClients } from "@/lib/adapters/variacionAdapter"
import { applyVariationFilters } from "@/lib/filters/variation-filters"
import { useExportPDF } from "@/hooks/use-export-pdf"
import { FileDown, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VariacionPage() {
  const { filters, setFilters, reset: resetFilters } = usePersistedFilters<VariationFilters>(
    "variacion:filters",
    initialVariationFilters
  )

  const { filters: period, setFilters: setPeriod, reset: resetPeriod } = usePersistedFilters<VariationPeriod>(
    "variacion:period",
    initialVariationPeriod
  )
  const {
    filters: committedPeriod,
    setFilters: setCommittedPeriod,
  } = usePersistedFilters<VariationPeriod>("variacion:committedPeriod", initialVariationPeriod)

  const tableRef = useRef<VariationTableRef>(null)

  const { exportarVariacion, exportingVariacion } = useExportPDF()
  const refrescarVariacion = useRefrescarVariacion()
  const handleSincronizar = () => { refrescarVariacion() }

  const fecha = useMemo(
    () => lastDayOfMonthYYYYMMDD(committedPeriod.year, committedPeriod.month),
    [committedPeriod.year, committedPeriod.month]
  )

  const handleClearPeriod = () => {
    resetPeriod()
    setCommittedPeriod(initialVariationPeriod)
  }

  const { data: rawData, loading, error, isFetching, refetch } = useVariacion(fecha)
  const allData = useMemo(() => adaptVariacionToClients(rawData), [rawData])
  const filteredData = useMemo(() => applyVariationFilters(allData, filters), [allData, filters])


  const handleExportarPDF = () => {
    if (!tableRef.current?.table) return

    // Filas en el orden que muestra la tabla (respeta sorting activo)
    const clientesOrdenados = tableRef.current.table
      .getSortedRowModel()
      .rows.map(row => row.original)

    exportarVariacion({
      fecha,
      filtros: filters,
      clientes: clientesOrdenados,
      table: tableRef.current.table,
    })
  }

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

        {/* ── Cabecera ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Variación de Cartera</h1>
            <p className="text-muted-foreground">
              Comparativo de cartera entre el mes actual y el anterior
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSincronizar}
              disabled={isFetching}
            >
              {isFetching
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <RefreshCw className="mr-2 h-4 w-4" />
              }
              {isFetching ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarPDF}
              disabled={exportingVariacion || filteredData.length === 0}
            >
              {exportingVariacion
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <FileDown className="mr-2 h-4 w-4" />
              }
              {exportingVariacion ? "Generando..." : "Exportar PDF"}
            </Button>
          </div>
        </div>

        {/* ── Filtros ───────────────────────────────────────────────────── */}
        <VariationFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          period={period}
          onPeriodChange={setPeriod}
          onConsultar={() => setCommittedPeriod(period)}
          onClearPeriod={handleClearPeriod}
        />

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <KPICards data={filteredData} />

        {/* ── Tabla ────────────────────────────────────────────────────── */}
        <VariationTable ref={tableRef} data={filteredData} fecha={fecha} />

      </div>
    </AppShell>
  )
}

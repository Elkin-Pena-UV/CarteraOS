"use client"

import { useState, useEffect, useRef } from "react"
import { usePersistedFilters } from "@/hooks/use-persisted-filters"
import { AppShell } from "@/components/layout/app-shell"
import { RotationTable, type RotationTableHandle } from "@/components/cartera/rotation-table"
import { FiltersBarCopy, initialMonth, initialYear } from "@/components/cartera/filters-barcopy"
import { useRotacion, useRefrescarRotacion } from "@/hooks/use-rotacion"
import type { RotacionCliente } from "@/hooks/use-rotacion"
import type { RotacionFiltros } from "@/lib/services/rotacionService"
import { useExportPDF } from "@/hooks/use-export-pdf"
import { parsearCondPagoDias } from "@/lib/utils/rotacionColor"
import { FileDown, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Convierte el período YYYYMM de la serie al último día del mes → YYYYMMDD */
function periodoToFechaCorte(periodo: string | number): string {
  const s = String(periodo)
  if (s.length < 6) return s
  const year  = parseInt(s.slice(0, 4))
  const month = parseInt(s.slice(4, 6))
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`
}

export default function RotacionPage() {
  // fechaRef — wrapped in object because usePersistedFilters requires T extends object
  const { filters: fechaRefState, setFilters: setFechaRefState } = usePersistedFilters<{ v: string | null }>(
    "rotacion:fechaRef",
    { v: null }
  )
  const fechaRef = fechaRefState.v
  const setFechaRef = (v: string | null) => setFechaRefState({ v })

  // period — month + year persisted together as one object
  const { filters: periodState, setFilters: setPeriodState } = usePersistedFilters<{ month: string; year: string }>(
    "rotacion:period",
    { month: initialMonth, year: initialYear }
  )
  const setSelectedMonth = (month: string) => setPeriodState(prev => ({ ...prev, month }))
  const setSelectedYear  = (year: string)  => setPeriodState(prev => ({ ...prev, year }))

  const { filters: filtros, setFilters: setFiltros } = usePersistedFilters<RotacionFiltros>(
    "rotacion:filtros",
    {}
  )

  // canales — wrapped because array spread in usePersistedFilters produces index-keyed object, not []
  const { filters: canalesState, setFilters: setCanalesState } = usePersistedFilters<{ v: string[] }>(
    "rotacion:canales",
    { v: [] }
  )
  const selectedCanales = canalesState.v
  const setSelectedCanales = (v: string[]) => setCanalesState({ v })

  // clientType — wrapped because string is a primitive (T extends object)
  const { filters: clientTypeState, setFilters: setClientTypeState } = usePersistedFilters<{ v: string }>(
    "rotacion:clientType",
    { v: "" }
  )
  const clientType = clientTypeState.v
  const setClientType = (v: string) => setClientTypeState({ v })

  // clientName — wrapped because string is a primitive (T extends object)
  const { filters: clientNameState, setFilters: setClientNameState } = usePersistedFilters<{ v: string }>(
    "rotacion:clientName",
    { v: "" }
  )
  const clientName = clientNameState.v
  const setClientName = (v: string) => setClientNameState({ v })

  const [clientesCatalogo, setClientesCatalogo] = useState<RotacionCliente[]>([])
  const tableRef = useRef<RotationTableHandle>(null)

  const { data, clientes, loading, error, isFetching } = useRotacion(fechaRef, filtros)

  const { exportarRotacion, exportingRotacion } = useExportPDF()
  const refrescarRotacion = useRefrescarRotacion()
  const handleSincronizar = () => { refrescarRotacion() }

  const clienteActivo = filtros.razonSocial?.trim()
    ? clientes.find((c) =>
        c.f1_tercero_razon_social
          .toLowerCase()
          .includes(filtros.razonSocial!.trim().toLowerCase())
      ) ?? null
    : null

  const condPagoDias = parsearCondPagoDias(clienteActivo?.f1_id_cond_pago ?? "")

  useEffect(() => {
    if (clientes.length > 0 && clientes.length >= clientesCatalogo.length) {
      setClientesCatalogo(clientes)
    }
  }, [clientes])

  const handleConsultar = (fecha: string, f: RotacionFiltros) => {
    setFechaRef(fecha)
    setFiltros(f)
  }

  const handleLimpiar = () => {
    setFechaRef(null)
    setFiltros({})
    setSelectedMonth(initialMonth)
    setSelectedYear(initialYear)
    setSelectedCanales([])
    setClientType("")
    setClientName("")
  }

  const handleExportarPDF = () => {
    if (data.length === 0) return

    // 1. Fecha explícita del filtro activo
    // 2. Fecha derivada del último período de la serie (carga inicial o tras limpiar)
    const ultimo = data[data.length - 1]
    const fecha  = fechaRef ?? periodoToFechaCorte(ultimo.periodo)

    const sorting  = tableRef.current?.table.getState().sorting ?? []
    const modoRot  = tableRef.current?.modoRot ?? "anual"
    exportarRotacion({ fechaCorte: fecha, filtros, serie: data, condPagoDias, sorting, modoRot })
  }

  return (
    <AppShell>
      <div className="space-y-6">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rotación de Cartera</h1>
            <p className="text-muted-foreground">
              Análisis de rotación de cuentas por cobrar
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
              disabled={exportingRotacion || data.length === 0}
            >
              {exportingRotacion
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <FileDown className="mr-2 h-4 w-4" />
              }
              {exportingRotacion ? 'Generando...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

        <FiltersBarCopy
          selectedMonth={periodState.month}
          selectedYear={periodState.year}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          selectedCanales={selectedCanales}
          clientType={clientType}
          clientName={clientName}
          onCanalesChange={setSelectedCanales}
          onClientTypeChange={setClientType}
          onClientNameChange={setClientName}
          onConsultar={handleConsultar}
          onLimpiar={handleLimpiar}
          isFetching={isFetching}
          clienteOptions={clientesCatalogo}
        />

        {loading && (
          <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando rotación de cartera...
          </div>
        )}

        {!loading && error && (
          <div className="flex h-64 items-center justify-center text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <RotationTable ref={tableRef} data={data} fechaRef={fechaRef} isFetching={isFetching} condPagoDias={condPagoDias} />
        )}
      </div>
    </AppShell>
  )
}

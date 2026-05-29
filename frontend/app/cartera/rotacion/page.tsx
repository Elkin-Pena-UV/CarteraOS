"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { RotationTable, type RotationTableHandle } from "@/components/cartera/rotation-table"
import { FiltersBarCopy } from "@/components/cartera/filters-barcopy"
import { useRotacion } from "@/hooks/use-rotacion"
import type { RotacionCliente } from "@/hooks/use-rotacion"
import type { RotacionFiltros } from "@/lib/services/rotacionService"
import { useExportPDF } from "@/hooks/use-export-pdf"
import { parsearCondPagoDias } from "@/lib/utils/rotacionColor"
import { FileDown, Loader2 } from "lucide-react"
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
  const [fechaRef, setFechaRef] = useState<string | null>(null)
  const [filtros, setFiltros]   = useState<RotacionFiltros>({})
  const [clientesCatalogo, setClientesCatalogo] = useState<RotacionCliente[]>([])
  const tableRef = useRef<RotationTableHandle>(null)

  const { data, clientes, loading, error, isFetching } = useRotacion(fechaRef, filtros)

  const { exportarRotacion, exportingRotacion } = useExportPDF()

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
            {exportingRotacion ? "Generando..." : "Exportar PDF"}
          </Button>
        </div>

        <FiltersBarCopy
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

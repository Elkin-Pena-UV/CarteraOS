"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { RotationTable } from "@/components/cartera/rotation-table"
import { FiltersBarCopy } from "@/components/cartera/filters-barcopy"
import { useRotacion } from "@/hooks/use-rotacion"
import type { RotacionCliente } from "@/hooks/use-rotacion" 
import type { RotacionFiltros } from "@/lib/services/rotacionService"
import { Loader2 } from "lucide-react"

export default function RotacionPage() {
  const [fechaRef, setFechaRef] = useState<string | null>(null)
  const [filtros, setFiltros]   = useState<RotacionFiltros>({})
  const [clientesCatalogo, setClientesCatalogo] = useState<RotacionCliente[]>([])

  const { data, clientes, loading, error, isFetching } = useRotacion(fechaRef, filtros)

  // Guarda el catálogo completo la primera vez que llegan clientes
  // (o cuando llegan más que antes — sin filtro de cliente activo)
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rotación de Cartera</h1>
          <p className="text-muted-foreground">
            Análisis de rotación de cuentas por cobrar
          </p>
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
          <RotationTable data={data} fechaRef={fechaRef} isFetching={isFetching} />
        )}
      </div>
    </AppShell>
  )
}
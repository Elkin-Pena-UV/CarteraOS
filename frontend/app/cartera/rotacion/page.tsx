"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { RotationTable } from "@/components/cartera/rotation-table"
import { FiltersBarCopy } from "@/components/cartera/filters-barcopy"
import { useRotacion } from "@/hooks/use-rotacion"
import { Loader2 } from "lucide-react"

export default function RotacionPage() {
  const [fechaRef, setFechaRef] = useState<string | null>(null)

  const { data, loading, error, isFetching } = useRotacion(fechaRef)

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
          onConsultar={setFechaRef}
          onLimpiar={() => setFechaRef(null)}
          isFetching={isFetching}
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
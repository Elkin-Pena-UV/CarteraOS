"use client"

import { useMemo, useRef, useState } from "react"
import { KPICards } from "@/components/cartera/kpi-cards"
import { AgingCharts } from "@/components/cartera/aging-charts"
import {
  FiltersBar,
  initialClientFilters,
  initialFechaCorte,
  type ClientFilters,
  type FechaCorteState,
} from "@/components/cartera/filters-bar"
import { ClientsTable, type Client, type ClientsTableRef } from "@/components/cartera/clients-table"
import { ClientDrawer } from "@/components/cartera/client-drawer"
import { AppShell } from "@/components/layout/app-shell"
import { useCartera } from "@/hooks/use-cartera"
import {
  adaptCarteraToClients,
  adaptCarteraToKPIs,
  adaptClientsToAging,
} from "@/lib/adapters/carteraAdapter"
import { applyClientFilters } from "@/lib/filters/cartera-filters"
import { useExportPDF } from '@/hooks/use-export-pdf'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CarteraDashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<ClientFilters>(initialClientFilters)
  const [fechaCorte, setFechaCorte] = useState<FechaCorteState>(initialFechaCorte)
  const [sortedClients, setSortedClients] = useState<Client[]>([])
  const tableRef = useRef<ClientsTableRef>(null)

  const { exportarGeneral, exporting } = useExportPDF()

  // El hook recibe modo y fecha — react-query cachea cada combinación por separado
  const { data, loading, error } = useCartera(fechaCorte.modo, fechaCorte.fecha)

  // Adaptar datos crudos del backend → Client[] y KPIs para los cards
  const clients = useMemo(() => adaptCarteraToClients(data ?? []), [data])
  const kpis = useMemo(() => adaptCarteraToKPIs(data ?? []), [data])

  // Filtrado único — alimenta tanto la tabla como los gráficos de aging
  const filteredClients = useMemo(
    () => applyClientFilters(clients, draftFilters),
    [clients, draftFilters]
  )

  // Datos de aging derivados de los clientes filtrados
  const agingData = useMemo(() => adaptClientsToAging(filteredClients), [filteredClients])

  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setDrawerOpen(true)
  }

  if (loading) return (
    <AppShell>
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Cargando cartera...</p>
      </div>
    </AppShell>
  )

  if (error) return (
    <AppShell>
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    </AppShell>
  )

  const handleExportarPDF = () => {
    if (!tableRef.current) return
    exportarGeneral({
      fechaCorte,
      filtros:  draftFilters,
      clientes: sortedClients.length > 0 ? sortedClients : filteredClients,
      aging:    agingData,
      table:    tableRef.current.table,
    })
  }


  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Cartera</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de cartera de clientes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportarPDF}
          disabled={exporting}
        >
          {exporting
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <FileDown className="mr-2 h-4 w-4" />
          }
          {exporting ? 'Generando...' : 'Exportar PDF'}
        </Button>

        <FiltersBar
          value={draftFilters}
          onChange={setDraftFilters}
          fechaCorte={fechaCorte}
          onFechaCorteChange={setFechaCorte}
        />

        <KPICards kpis={kpis} />

        {/* Gráficos de aging — reaccionan a los mismos filtros que la tabla */}
        <AgingCharts data={agingData} />

        {/* ClientsTable recibe los datos ya filtrados */}
        <ClientsTable
          ref={tableRef}
          data={filteredClients}
          onViewClient={handleViewClient}
          onSortedRowsChange={setSortedClients}
        />

        <ClientDrawer
          client={selectedClient}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          fechaCorte={fechaCorte}
        />
      </div>
    </AppShell>
  )
}

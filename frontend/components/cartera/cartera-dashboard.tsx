"use client"

import { useMemo, useState } from "react"
import { KPICards } from "@/components/cartera/kpi-cards"
import { AgingCharts } from "@/components/cartera/aging-charts"
import {
  FiltersBar,
  initialClientFilters,
  initialFechaCorte,
  type ClientFilters,
  type FechaCorteState,
} from "@/components/cartera/filters-bar"
import { ClientsTable, type Client } from "@/components/cartera/clients-table"
import { ClientDrawer } from "@/components/cartera/client-drawer"
import { AppShell } from "@/components/layout/app-shell"
import { useCartera } from "@/hooks/use-cartera"
import {
  adaptCarteraToClients,
  adaptCarteraToKPIs,
  adaptClientsToAging,
} from "@/lib/adapters/carteraAdapter"

// ---------------------------------------------------------------------------
// Filtrado compartido (tabla + gráficos de aging)
// Misma lógica que ClientsTable.filteredData para garantizar consistencia.
// ---------------------------------------------------------------------------

function applyFilters(clients: Client[], filters: ClientFilters): Client[] {
  const normalizedClientName = filters.clientName.trim().toLowerCase()
  const normalizedNoPunct = normalizedClientName.replace(/[^a-z0-9]/gi, "")
  const minValue = filters.minValue === "" ? null : Number(filters.minValue)
  const maxValue = filters.maxValue === "" ? null : Number(filters.maxValue)

  return clients.filter((client) => {
    if (filters.channel.length > 0) {
      const match = filters.channel.some((c) =>
        client.channel.toLowerCase().includes(c.toLowerCase())
      )
      if (!match) return false
    }
    if (filters.advisor.length > 0) {
      const match = filters.advisor.some((a) =>
        client.advisor.toLowerCase().includes(a.toLowerCase())
      )
      if (!match) return false
    }

    if (normalizedClientName) {
      const nameMatches = client.name.toLowerCase().includes(normalizedClientName)
      const nitNormalized = client.nit
        ? client.nit.toLowerCase().replace(/[^a-z0-9]/gi, "")
        : ""
      const nitMatches = nitNormalized.includes(normalizedNoPunct)
      if (!nameMatches && !nitMatches) return false
    }

    const portfolioValue = client.current + client.overdue
    if (minValue !== null && !Number.isNaN(minValue) && portfolioValue < minValue) return false
    if (maxValue !== null && !Number.isNaN(maxValue) && portfolioValue > maxValue) return false

    return true
  })
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function CarteraDashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<ClientFilters>(initialClientFilters)
  const [fechaCorte, setFechaCorte] = useState<FechaCorteState>(initialFechaCorte)

  // El hook recibe modo y fecha — react-query cachea cada combinación por separado
  const { data, loading, error } = useCartera(fechaCorte.modo, fechaCorte.fecha)

  // Adaptar datos crudos del backend → Client[]
  const clients = useMemo(() => adaptCarteraToClients(data ?? []), [data])

  // KPIs sobre todos los clientes (sin filtros, igual que antes)
  const kpis = useMemo(() => adaptCarteraToKPIs(data ?? []), [data])

  // Clientes filtrados — usados por la tabla Y los gráficos de aging
  const filteredClients = useMemo(
    () => applyFilters(clients, draftFilters),
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Cartera</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de cartera de clientes
          </p>
        </div>

        <FiltersBar
          value={draftFilters}
          onChange={setDraftFilters}
          fechaCorte={fechaCorte}
          onFechaCorteChange={setFechaCorte}
        />

        <KPICards kpis={kpis} />

        {/* Gráficos de aging — reaccionan a los mismos filtros que la tabla */}
        <AgingCharts data={agingData} />

        {/*
          ClientsTable recibe `clients` (sin filtrar) y aplica filtros internamente.
          Los gráficos de aging replican la misma lógica con `applyFilters` arriba,
          garantizando consistencia entre ambas vistas.
        */}
        <ClientsTable
          data={clients}
          onViewClient={handleViewClient}
          filters={draftFilters}
        />

        <ClientDrawer
          client={selectedClient}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </AppShell>
  )
}

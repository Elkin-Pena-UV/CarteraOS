"use client"

import { useMemo, useState } from "react"
import { KPICards } from "@/components/cartera/kpi-cards"
import { AgingCharts } from "@/components/cartera/aging-charts"
import { FiltersBar, initialClientFilters, type ClientFilters } from "@/components/cartera/filters-bar"
import { ClientsTable, type Client } from "@/components/cartera/clients-table"
import { ClientDrawer } from "@/components/cartera/client-drawer"
import { AppShell } from "@/components/layout/app-shell"
import { useCartera } from "@/hooks/use-cartera"
import { adaptCarteraToClients, adaptCarteraToKPIs } from "@/lib/adapters/carteraAdapter"

export default function CarteraDashboard() {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [draftFilters, setDraftFilters] = useState<ClientFilters>(initialClientFilters)

    const { data, loading, error } = useCartera()

    const clients = useMemo(() => adaptCarteraToClients(data ?? []), [data])
    const kpis = useMemo(() => adaptCarteraToKPIs(data ?? []), [data])

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

                <FiltersBar value={draftFilters} onChange={setDraftFilters} />

                {/* KPIs con datos reales */}
                <KPICards kpis={kpis} />

                <AgingCharts />

                <div>
                    <h2 className="mb-4 text-lg font-semibold">Tabla de Clientes</h2>
                    {/* Tabla con datos reales */}
                    <ClientsTable
                        data={clients}
                        onViewClient={handleViewClient}
                        filters={draftFilters}
                    />
                </div>

                <ClientDrawer
                    client={selectedClient}
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                />
            </div>
        </AppShell>
    )
}

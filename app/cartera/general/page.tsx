"use client"

import { useState } from "react"
import { KPICards } from "@/components/cartera/kpi-cards"
import { AgingCharts } from "@/components/cartera/aging-charts"
import { FiltersBar, initialClientFilters, type ClientFilters } from "@/components/cartera/filters-bar"
import { ClientsTable, type Client } from "@/components/cartera/clients-table"
import { ClientDrawer } from "@/components/cartera/client-drawer"
import { AppShell } from "@/components/layout/app-shell"

export default function CarteraDashboard() {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [draftFilters, setDraftFilters] = useState<ClientFilters>(initialClientFilters)

    const handleViewClient = (client: Client) => {
        setSelectedClient(client)
        setDrawerOpen(true)
    }

    const handleCloseDrawer = () => {
        setDrawerOpen(false)
    }

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold">Dashboard de Cartera</h1>
                    <p className="text-muted-foreground">
                        Gestión y seguimiento de cartera de clientes
                    </p>
                </div>

                {/* Filters */}
                <FiltersBar
                    value={draftFilters}
                    onChange={setDraftFilters}
                />

                {/* KPI Cards */}
                <KPICards />

                {/* Charts */}
                <AgingCharts />

                {/* Clients Table */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">Tabla de Clientes</h2>
                    <ClientsTable onViewClient={handleViewClient} filters={draftFilters} />
                </div>

                {/* Client Detail Drawer */}
                <ClientDrawer
                    client={selectedClient}
                    open={drawerOpen}
                    onClose={handleCloseDrawer}
                />
            </div>
        </AppShell>
    )
}

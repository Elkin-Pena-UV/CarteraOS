"use client"

import { useMemo, useRef, useState } from "react"
import { usePersistedFilters } from "@/hooks/use-persisted-filters"
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
import {
  useCarteraAsesor,
  useAsesoresDisponibles,
  useRefrescarCarteraAsesor,
} from "@/hooks/use-cartera-asesor"
import {
  adaptCarteraToClients,
  adaptClientsToAging,
  adaptClientsToKPIs,
} from "@/lib/adapters/carteraAdapter"
import { applyClientFilters } from "@/lib/filters/cartera-filters"
import { useExportPDF } from '@/hooks/use-export-pdf'
import { refrescarCarteraAsesorBackend } from '@/lib/services/carteraAsesorService'
import { FileDown, Loader2, RefreshCw, Send } from 'lucide-react'
import { EmailReporteDialog, type EmailReporteItem } from '@/components/cartera/email-reporte-dialog'
import { Button } from '@/components/ui/button'
import { facturasKeys } from "@/hooks/use-facturas"
import { useQueryClient } from "@tanstack/react-query"
import { formatFechaAsunto } from "@/lib/formatters"

// ── Tipo del committed de asesores ────────────────────────────────────────────
type CommittedAsesores = { v: string[] }
const initialCommittedAsesores: CommittedAsesores = { v: [] }

export default function CarteraDashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [sortedClients, setSortedClients]   = useState<Client[]>([])
  const [isSyncing, setIsSyncing]           = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  const tableRef   = useRef<ClientsTableRef>(null)
  const queryClient = useQueryClient()

  // ── Filtros draft (UI) ────────────────────────────────────────────────────
  const { filters: draftFilters, setFilters: setDraftFilters } = usePersistedFilters<ClientFilters>(
    "cartera:filters",
    initialClientFilters,
  )

  // ── Fecha de corte ────────────────────────────────────────────────────────
  const { filters: fechaCorte, setFilters: setFechaCorte } = usePersistedFilters<FechaCorteState>(
    "cartera:fechaCorte",
    initialFechaCorte,
  )

  // ── Asesores committed — solo estos disparan el fetch ─────────────────────
  // Se actualizan cuando el usuario cambia el filtro de asesor en el filterbar
  const { filters: committedAsesores, setFilters: setCommittedAsesores } =
    usePersistedFilters<CommittedAsesores>("cartera:committedAsesores", initialCommittedAsesores)

  // Sincroniza draft → committed cada vez que cambia el advisor en el filterbar
  const handleFiltersChange = (next: ClientFilters) => {
    setDraftFilters(next)
    // Si el asesor cambió → actualizar committed para disparar fetch
    if (JSON.stringify(next.advisor) !== JSON.stringify(draftFilters.advisor)) {
      setCommittedAsesores({ v: next.advisor })
    }
  }

  // ── Fetch principal — usa carteraAsesor con filtro de asesor opcional ─────
  const { data, loading, error, isFetching } = useCarteraAsesor(
    fechaCorte.modo,
    fechaCorte.fecha,
    committedAsesores.v,
  )

  // ── Lista de asesores para el dropdown ───────────────────────────────────
  const { asesores: asesoresOptions } = useAsesoresDisponibles(
    fechaCorte.modo,
    fechaCorte.fecha,
  )

  const refrescarCarteraAsesor = useRefrescarCarteraAsesor()
  const { exportarGeneral, exporting } = useExportPDF()

  // ── Sincronizar ───────────────────────────────────────────────────────────
  const handleSincronizar = async () => {
    setIsSyncing(true)
    try {
      await refrescarCarteraAsesorBackend(
        fechaCorte.modo,
        fechaCorte.modo === 'fecha' ? (fechaCorte.fecha ?? null) : null,
        committedAsesores.v.length > 0 ? committedAsesores.v : null,
      )
      refrescarCarteraAsesor()
      queryClient.invalidateQueries({ queryKey: facturasKeys.all })
    } finally {
      setIsSyncing(false)
    }
  }

  // ── Adaptar y filtrar ─────────────────────────────────────────────────────
  // advisor ya viene filtrado desde el backend — se excluye del filtrado local
  const clients = useMemo(() => adaptCarteraToClients(data ?? []), [data])

  const condicionesPagoOptions = useMemo(() => {
    const set = new Set<string>()
    for (const c of clients) {
      const v = c.paymentCondition
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        set.add(String(v))
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
  }, [clients])

  const filteredClients = useMemo(
    () => applyClientFilters(clients, { ...draftFilters, advisor: [] }),
    [clients, draftFilters],
  )

  const kpis     = useMemo(() => adaptClientsToKPIs(filteredClients),  [filteredClients])
  const agingData = useMemo(() => adaptClientsToAging(filteredClients), [filteredClients])

  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setDrawerOpen(true)
  }

  // ── Loading / error ───────────────────────────────────────────────────────
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

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExportarPDF = () => {
    if (!tableRef.current) return
    exportarGeneral({
      fechaCorte,
      filtros: draftFilters,
      clientes: sortedClients.length > 0 ? sortedClients : filteredClients,
      aging: agingData,
      table: tableRef.current.table,
    })
  }

  const buildEmailReportes = (): EmailReporteItem[] => {
    if (!tableRef.current) return []
    const COLS_EXCLUIDAS = ['actions', 'select']
    const COL_KEY_MAP: Record<string, string> = {
      nit: 'nit', name: 'name', channel: 'channel',
      paymentCondition: 'paymentCondition', quota: 'quota',
      current: 'current', overdue: 'overdue', totalBalance: 'totalBalance',
      totalCop: 'totalCop', overcapacity: 'overcapacity',
    }
    const table    = tableRef.current.table
    const clientes = sortedClients.length > 0 ? sortedClients : filteredClients
    const columnas = table
      .getVisibleLeafColumns()
      .filter(col => !COLS_EXCLUIDAS.includes(col.id))
      .map(col => ({
        id:    col.id,
        label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
        key:   COL_KEY_MAP[col.id] ?? col.id,
      }))
    const totalCorriente    = clientes.reduce((s, c) => s + (c.current || 0), 0)
    const totalVencida      = clientes.reduce((s, c) => s + (c.overdue  || 0), 0)
    const totalCartera      = totalCorriente + totalVencida
    const clientesEnMora    = clientes.filter(c => c.overdue > 0).length
    const porcentajeVencida = totalCartera > 0 ? (totalVencida / totalCartera) * 100 : 0
    const fecha = fechaCorte.fecha ?? new Date().toISOString().slice(0, 10).replace(/-/g, '')

    return [{
      tipo:        'general',
      label:       'Cartera General',
      descripcion: 'Dashboard completo con filtros activos',
      requerido:   true,
      nombre:      `reporte_cartera_general_${fecha}.pdf`,
      payload: {
        meta: {
          fechaCorte:  fechaCorte.fecha,
          modoCorte:   fechaCorte.modo,
          generadoEn:  new Date().toISOString(),
          filtrosActivos: {
            canal:    draftFilters.channel.join(', ') || null,
            asesor:   draftFilters.advisor.join(', ') || null,
            cliente:  draftFilters.clientName          || null,
            minValor: draftFilters.minValue            || null,
            maxValor: draftFilters.maxValue            || null,
          },
        },
        kpis: { totalCorriente, totalVencida, clientesEnMora, totalClientes: clientes.length, porcentajeVencida },
        aging: {
          distribution:      agingData.distribution.map(d => ({ monto: d.value, label: d.name })),
          totalCopByChannel: agingData.totalCopByChannel,
          totalVencida:      agingData.totalVencida,
        },
        columnas,
        clientes,
      },
    }]
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Cartera</h1>
            <p className="text-muted-foreground">
              Gestión y seguimiento de cartera de clientes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSincronizar}
              disabled={isSyncing}
            >
              {isSyncing
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <RefreshCw className="mr-2 h-4 w-4" />}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarPDF}
              disabled={exporting}
            >
              {exporting
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <FileDown className="mr-2 h-4 w-4" />}
              {exporting ? 'Generando...' : 'Exportar PDF'}
            </Button>
            <Button
              size="sm"
              onClick={() => setEmailDialogOpen(true)}
              disabled={filteredClients.length === 0}
              className="bg-[#ff6600] text-white hover:bg-[#e65c00]"
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar reporte
            </Button>
          </div>
        </div>

        <FiltersBar
          value={draftFilters}
          onChange={handleFiltersChange}
          fechaCorte={fechaCorte}
          onFechaCorteChange={(next) => {
            setFechaCorte(next)
            // Al cambiar fecha, limpiar asesores committed para evitar
            // un fetch con asesores de la fecha anterior
            setCommittedAsesores(initialCommittedAsesores)
            setDraftFilters(prev => ({ ...prev, advisor: [] }))
          }}
          asesoresOptions={asesoresOptions}
          condicionesPagoOptions={condicionesPagoOptions}
        />

        <KPICards kpis={kpis} />

        <AgingCharts data={agingData} />

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

      <EmailReporteDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        titulo="Dashboard de Cartera"
        asuntoDefault={`Reporte de Cartera General — ${formatFechaAsunto(fechaCorte.fecha)}`}
        reportes={emailDialogOpen ? buildEmailReportes() : []}
      />
    </AppShell>
  )
}
"use client"

import { X, Phone, Mail, Send, Building2, User, Calendar, Loader2, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { EmailReporteDialog, type EmailReporteItem } from "@/components/cartera/email-reporte-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Client } from "./clients-table"
import { useFacturas } from "@/hooks/use-facturas"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useEffect, useMemo, useState } from "react"
import { formatCurrency } from "@/lib/formatters"
import { useExportPDF } from "@/hooks/use-export-pdf"
import type { FechaCorteState } from "@/components/cartera/filters-bar"

// ── Tipos ──────────────────────────────────────────────────────────────────
type SortField =
  | "f1_docto_causacion"
  | "f1_saldo_corriente_total"
  | "f1_saldo_vencido1"
  | "f1_saldo_vencido2"
  | "f1_saldo_vencido3"
  | "f1_saldo_vencido4"
  | "f1_saldo_vencido_total"
  | "f1_saldo_total"

type SortDirection = "asc" | "desc" | null

interface SortState {
  field: SortField | null
  direction: SortDirection
}

const formatDate = (dateString: string) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("es-CO")
}

// ── Icono de sort ──────────────────────────────────────────────────────────
function SortIcon({ field, sorting }: { field: SortField; sorting: SortState }) {
  if (sorting.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />
  if (sorting.direction === "asc") return <ArrowUp className="h-3 w-3 text-[#ff6600]" />
  return <ArrowDown className="h-3 w-3 text-[#ff6600]" />
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ClientDrawerProps {
  client:     Client | null
  open:       boolean
  onClose:    () => void
  fechaCorte: FechaCorteState
}

export function ClientDrawer({ client, open, onClose, fechaCorte }: ClientDrawerProps) {
  // 🆕 Estado para paginación
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  // 🆕 Estado de ordenamiento
  const [sorting, setSorting] = useState<SortState>({ field: null, direction: null })
  const { exportarCliente, exportingCliente } = useExportPDF()
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  // 🆕 Reiniciar página cuando cambia el cliente o se abre el drawer
  useEffect(() => {
    if (open && client) {
      setPage(1)
      setSorting({ field: null, direction: null })
    }
  }, [open, client?.nit])

  const fechaEfectiva = fechaCorte?.modo === 'fecha' && fechaCorte.fecha
    ? fechaCorte.fecha
    : null

  // 🔄 MODIFICADO: ahora pasa page, limit y fechaEfectiva al hook
  const { data: facturas, pagination, loading, isFetching, error } = useFacturas(
    open ? client?.nit ?? null : null,
    page,
    limit,
    fechaEfectiva
  )

  // 🆕 Facturas ordenadas
  const sortedFacturas = useMemo(() => {
    if (!sorting.field || !sorting.direction) return facturas

    return [...facturas].sort((a, b) => {
      const aVal = a[sorting.field!]
      const bVal = b[sorting.field!]

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sorting.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sorting.direction === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [facturas, sorting])

  const handleExportarCliente = () => {
    if (!client) return
    exportarCliente({
      cliente:    client,
      facturas:   sortedFacturas,
      fechaCorte,
    })
  }

  const buildEmailReportes = (): EmailReporteItem[] => {
    if (!client) return []
    const fecha = fechaCorte.fecha ?? new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return [
      {
        tipo:        'cliente',
        label:       'Cartera por cliente',
        descripcion: `Detalle de facturas — ${sortedFacturas.length} facturas`,
        requerido:   true,
        nombre:      `reporte_cliente_${client.nit}_${fecha}.pdf`,
        payload: {
          meta: {
            fechaCorte: fechaCorte.fecha ?? null,
            modoCorte:  fechaCorte.modo,
            generadoEn: new Date().toISOString(),
          },
          cliente:  client,
          facturas: sortedFacturas,
        },
      },
      // variacion y rotacion: agregar aquí cuando se conecten los datos al drawer
    ]
  }

  // 🆕 Toggle de columna
  const toggleSort = (field: SortField) => {
    setSorting((prev) => {
      if (prev.field !== field) return { field, direction: "asc" }
      if (prev.direction === "asc") return { field, direction: "desc" }
      return { field: null, direction: null } // tercer click = sin orden
    })
  }

  // Helper para renderizar un <TableHead> ordenable
  const SortableHead = ({
    field,
    children,
    className,
  }: {
    field: SortField
    children: React.ReactNode
    className?: string
  }) => (
    <TableHead className={cn("text-xs", className)}>
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {children}
        <SortIcon field={field} sorting={sorting} />
      </button>
    </TableHead>
  )

  if (!client) return null

  const totalVencido = facturas.reduce((sum, f) => sum + f.f1_saldo_vencido_total, 0)
  const totalSaldo = facturas.reduce((sum, f) => sum + f.f1_saldo_total, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 h-full bg-black/50 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[980px] max-w-[90vw] bg-card shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b p-6">
          <div>
            <h2 className="text-lg font-semibold">{client.name}</h2>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              NIT: {client.nit}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto p-6">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <User className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {client.advisors.length > 1 ? "Asesores" : "Asesor"}
                </p>
                {client.advisors.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin asesor</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {client.advisors.map((a) => (
                      <Badge key={a} variant="secondary" className="text-xs font-normal">
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Canal</p>
                <p className="text-sm font-medium">{client.channel}</p>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1">
              <Phone className="mr-2 h-4 w-4" />
              Llamar
            </Button>

            {/* Descargar PDF */}
            <Button
              variant="outline"
              onClick={handleExportarCliente}
              disabled={exportingCliente || loading}
            >
              {exportingCliente
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Mail className="mr-2 h-4 w-4" />
              }
              {exportingCliente ? "Generando..." : "Descargar PDF"}
            </Button>

            {/* Enviar por email */}
            <Button
              className="bg-[#ff6600] text-white hover:bg-[#e65c00]"
              onClick={() => setEmailDialogOpen(true)}
              disabled={loading}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar reporte
            </Button>
          </div>

          {client && (
            <EmailReporteDialog
              open={emailDialogOpen}
              onClose={() => setEmailDialogOpen(false)}
              titulo={`${client.name} — NIT ${client.nit}`}
              asuntoDefault={`Reporte de Cartera — ${client.name} — ${fechaCorte.fecha ?? 'hoy'}`}
              reportes={emailDialogOpen ? buildEmailReportes() : []}
            />
          )}

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                Cartera Corriente
              </p>
              <p className="mt-1 text-xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(client.current)}
              </p>
            </div>
            <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/20">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">
                Cartera Vencida
              </p>
              <p className="mt-1 text-xl font-bold text-red-700 dark:text-red-400">
                {formatCurrency(client.overdue)}
              </p>
            </div>
          </div>

          {/* Max Days Overdue */}
          {client.maxDaysOverdue > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Máximo días vencido
                </p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                  {client.maxDaysOverdue} días
                </p>
              </div>
            </div>
          )}

          {/* Invoices Table */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Detalle de Facturas
                {!loading && pagination && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({pagination.total.toLocaleString()} facturas en total)
                  </span>
                )}
              </h3>

              {/* 🆕 Indicador sutil de refetch al cambiar de página */}
              {isFetching && !loading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {loading && (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHead field="f1_docto_causacion">Nro Factura</SortableHead>
                        <SortableHead field="f1_saldo_corriente_total" className="text-right">Corriente</SortableHead>
                        <SortableHead field="f1_saldo_vencido1" className="text-right">Vencido 1</SortableHead>
                        <SortableHead field="f1_saldo_vencido2" className="text-right">Vencido 2</SortableHead>
                        <SortableHead field="f1_saldo_vencido3" className="text-right">Vencido 3</SortableHead>
                        <SortableHead field="f1_saldo_vencido4" className="text-right">Vencido 4</SortableHead>
                        <SortableHead field="f1_saldo_vencido_total" className="text-right">Saldo Vencido</SortableHead>
                        <SortableHead field="f1_saldo_total" className="text-right">Saldo Total</SortableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedFacturas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                            No hay facturas vencidas
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedFacturas.map((factura) => (
                          <TableRow key={factura.f1_docto_causacion}>
                            <TableCell className="font-mono text-xs">
                              {factura.f1_docto_causacion.trim()}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(factura.f1_saldo_corriente_total)}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(factura.f1_saldo_vencido1)}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(factura.f1_saldo_vencido2)}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(factura.f1_saldo_vencido3)}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(factura.f1_saldo_vencido4)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium text-destructive">
                              {formatCurrency(factura.f1_saldo_vencido_total)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium">
                              {formatCurrency(factura.f1_saldo_total)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {pagination && pagination.total > 0 && (
                  <PaginationControls
                    page={pagination.page}
                    pages={pagination.pages}
                    total={pagination.total}
                    limit={pagination.limit}
                    hasNext={pagination.hasNext}
                    hasPrev={pagination.hasPrev}
                    isLoading={isFetching}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit)
                      setPage(1)  // Al cambiar el tamaño, volver a página 1
                    }}
                  />
                )}


                {/* Totals */}
                {sortedFacturas.length > 0 && (
                  <div className="mt-4 flex justify-between rounded-lg bg-muted p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Vencido</p>
                      <p className="font-semibold text-destructive">
                        {formatCurrency(totalVencido)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Saldo Total</p>
                      <p className="font-semibold text-[#ff6600]">
                        {formatCurrency(totalSaldo)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
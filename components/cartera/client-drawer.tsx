"use client"

import { X, Phone, Mail, Building2, User, Calendar } from "lucide-react"
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

interface Invoice {
  number: string
  issueDate: string
  dueDate: string
  value: number
  payments: number
  balance: number
  status: "pagada" | "pendiente" | "vencida"
}

const invoices: Invoice[] = [
  {
    number: "FV-2024-001456",
    issueDate: "01/02/2024",
    dueDate: "03/03/2024",
    value: 78000000,
    payments: 30000000,
    balance: 48000000,
    status: "vencida",
  },
  {
    number: "FV-2024-001678",
    issueDate: "15/02/2024",
    dueDate: "17/03/2024",
    value: 52000000,
    payments: 11000000,
    balance: 41000000,
    status: "vencida",
  },
  {
    number: "FV-2024-001890",
    issueDate: "01/03/2024",
    dueDate: "31/03/2024",
    value: 89000000,
    payments: 0,
    balance: 89000000,
    status: "pendiente",
  },
  {
    number: "FV-2024-002012",
    issueDate: "15/03/2024",
    dueDate: "14/04/2024",
    value: 67000000,
    payments: 0,
    balance: 67000000,
    status: "pendiente",
  },
]

const statusConfig = {
  pagada: {
    label: "Pagada",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  vencida: {
    label: "Vencida",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface ClientDrawerProps {
  client: Client | null
  open: boolean
  onClose: () => void
}

export function ClientDrawer({ client, open, onClose }: ClientDrawerProps) {
  if (!client) return null

  const totalValue = invoices.reduce((sum, inv) => sum + inv.value, 0)
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0)

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
          "fixed right-0 top-0 z-50 h-full w-[720px] max-w-[90vw] bg-card shadow-xl transition-transform duration-300",
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
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Asesor</p>
                <p className="text-sm font-medium">{client.advisor}</p>
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
            <Button variant="outline" className="flex-1">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </div>

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
            <h3 className="mb-3 text-sm font-semibold">Detalle de Facturas</h3>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nro Factura</TableHead>
                    <TableHead className="text-xs">F. Emisión</TableHead>
                    <TableHead className="text-xs">F. Venc.</TableHead>
                    <TableHead className="text-right text-xs">Valor</TableHead>
                    <TableHead className="text-right text-xs">Abonos</TableHead>
                    <TableHead className="text-right text-xs">Saldo</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.number}>
                      <TableCell className="font-mono text-xs">
                        {invoice.number}
                      </TableCell>
                      <TableCell className="text-xs">
                        {invoice.issueDate}
                      </TableCell>
                      <TableCell className="text-xs">
                        {invoice.dueDate}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCurrency(invoice.value)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatCurrency(invoice.payments)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatCurrency(invoice.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            statusConfig[invoice.status].className
                          )}
                        >
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-between rounded-lg bg-muted p-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Facturado</p>
                <p className="font-semibold">{formatCurrency(totalValue)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                <p className="font-semibold text-[#ff6600]">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

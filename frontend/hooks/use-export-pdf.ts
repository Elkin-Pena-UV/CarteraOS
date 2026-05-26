import { useState } from 'react'
import { type Table as TanstackTable, type Column } from '@tanstack/react-table'
import api from '@/lib/axios'
import type { ClientFilters, FechaCorteState } from '@/components/cartera/filters-bar'
import type { Client } from '@/components/cartera/clients-table'
import type { AgingData } from '@/lib/adapters/carteraAdapter'
import type { FacturaItem } from '@/hooks/use-facturas'
import type { VariationClient } from '@/components/cartera/variation-table'
import type { VariationFilters } from '@/components/cartera/variation-filters-bar'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

interface ExportGeneralPayload {
  fechaCorte: FechaCorteState
  filtros: ClientFilters
  clientes: Client[]
  aging: AgingData
  table: TanstackTable<Client>
}

interface ExportClientePayload {
  cliente: Client
  facturas: FacturaItem[]
  fechaCorte: FechaCorteState
}

interface ExportVariacionPayload {
  fecha: string
  filtros: VariationFilters
  clientes: VariationClient[]
  table: TanstackTable<VariationClient>
}

// Columnas que nunca van al PDF aunque sean visibles
const COLS_EXCLUIDAS_VARIACION = ['actions', 'select']

// Mapa col.id → key del objeto VariationClient
const COL_KEY_MAP_VARIACION: Record<string, string> = {
  nit:              'nit',
  razonSocial:      'razonSocial',
  tipoCliente:      'tipoCliente',
  canal:            'canal',
  cupo:             'cupo',
  carteraMesActual: 'carteraMesActual',
  carteraUltimoMes: 'carteraUltimoMes',
  variacionCop:     'variacionCop',
  variacionPct:     'variacionPct',
  sobrecupoCop:     'sobrecupoCop',
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useExportPDF() {
  const [exporting,          setExporting         ] = useState(false)
  const [exportingCliente,   setExportingCliente  ] = useState(false)
  const [exportingVariacion, setExportingVariacion] = useState(false)

  // ── Reporte General ──────────────────────────────────────────────────────

  const exportarGeneral = async ({ fechaCorte, filtros, clientes, aging, table }: ExportGeneralPayload) => {
    setExporting(true)
    try {
      const COLS_EXCLUIDAS = ['actions', 'select']
      const COL_KEY_MAP: Record<string, string> = {
        nit: 'nit', name: 'name', channel: 'channel',
        paymentCondition: 'paymentCondition', quota: 'quota',
        current: 'current', overdue: 'overdue', totalBalance: 'totalBalance',
        totalCop: 'totalCop', overcapacity: 'overcapacity',
      }
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

      const payload = {
        meta: {
          fechaCorte:  fechaCorte.fecha,
          modoCorte:   fechaCorte.modo,
          generadoEn:  new Date().toISOString(),
          filtrosActivos: {
            canal:    filtros.channel.join(', ') || null,
            asesor:   filtros.advisor.join(', ') || null,
            cliente:  filtros.clientName          || null,
            minValor: filtros.minValue            || null,
            maxValor: filtros.maxValue            || null,
          },
        },
        kpis: {
          totalCorriente,
          totalVencida,
          clientesEnMora,
          totalClientes:    clientes.length,
          porcentajeVencida,
        },
        aging: {
          distribution:      aging.distribution.map(d => ({ monto: d.value, label: d.name })),
          totalCopByChannel: aging.totalCopByChannel,
          totalVencida:      aging.totalVencida,
        },
        columnas,
        clientes,
      }

      const blob = await (api.post('/export/general', payload, {
        responseType: 'blob',
      }) as unknown as Promise<Blob>)

      const fecha  = fechaCorte.fecha ?? new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const nombre = `reporte_cartera_general_${fecha}.pdf`
      descargarBlob(blob, nombre)

    } finally {
      setExporting(false)
    }
  }

  // ── Reporte por Cliente ──────────────────────────────────────────────────

  const exportarCliente = async ({ cliente, facturas, fechaCorte }: ExportClientePayload) => {
    setExportingCliente(true)
    try {
      const payload = {
        meta: {
          fechaCorte: fechaCorte.fecha,
          modoCorte:  fechaCorte.modo,
          generadoEn: new Date().toISOString(),
        },
        cliente,
        facturas,
      }

      const blob = await (api.post('/export/cliente', payload, {
        responseType: 'blob',
      }) as unknown as Promise<Blob>)

      const fecha  = fechaCorte.fecha ?? new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const nit    = cliente.nit ?? 'cliente'
      const nombre = `reporte_cliente_${nit}_${fecha}.pdf`
      descargarBlob(blob, nombre)

    } finally {
      setExportingCliente(false)
    }
  }

  // ── Reporte de Variación ─────────────────────────────────────────────────

  const exportarVariacion = async ({ fecha, filtros, clientes, table }: ExportVariacionPayload) => {
    setExportingVariacion(true)
    try {

      // ── 1. Columnas: visibles + en el orden visual del drag & drop ──────
      const columnOrder = table.getState().columnOrder
      const visibleCols = table
        .getVisibleLeafColumns()
        .filter(col => !COLS_EXCLUIDAS_VARIACION.includes(col.id))

      // Imperativo para que TypeScript infiera el tipo sin ambigüedad
      const colsSorted: Column<VariationClient, unknown>[] = []
      if (columnOrder.length > 0) {
        columnOrder.forEach(id => {
          const col = visibleCols.find(c => c.id === id)
          if (col) colsSorted.push(col)
        })
        // Columnas visibles que no están en columnOrder van al final
        visibleCols.forEach(col => {
          if (!columnOrder.includes(col.id)) colsSorted.push(col)
        })
      } else {
        colsSorted.push(...visibleCols)
      }

      const columnas = colsSorted.map(col => ({
        id:    col.id,
        label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
        key:   COL_KEY_MAP_VARIACION[col.id] ?? col.id,
      }))

      // ── 2. Sorting activo ───────────────────────────────────────────────
      const sorting = table.getState().sorting.map(s => ({
        id:   s.id,
        desc: s.desc,
      }))

      // ── 3. KPIs calculados desde los datos filtrados ────────────────────
      const carteraMesActual   = clientes.reduce((s, c) => s + (c.carteraMesActual  || 0), 0)
      const carteraMesAnterior = clientes.reduce((s, c) => s + (c.carteraUltimoMes  || 0), 0)
      const variacionTotalCop  = clientes.reduce((s, c) => s + (c.variacionCop      || 0), 0)
      const variacionTotalPct  = carteraMesAnterior !== 0
        ? (variacionTotalCop / carteraMesAnterior) * 100
        : 0
      const clientesEnSobrecupo = clientes.filter(c => c.sobrecupoCop > 0).length

      const payload = {
        meta: {
          fechaCorte:  fecha,
          generadoEn:  new Date().toISOString(),
          filtrosActivos: {
            tipoCliente: filtros.tipoCliente.length ? filtros.tipoCliente : null,
            canal:       filtros.canal.length       ? filtros.canal       : null,
            search:      filtros.search             || null,
          },
        },
        kpis: {
          carteraMesActual,
          carteraMesAnterior,
          variacionTotalCop,
          variacionTotalPct,
          clientesEnSobrecupo,
          totalClientes: clientes.length,
        },
        columnas,
        sorting,
        clientes,
      }

      const blob = await (api.post('/export/variacion', payload, {
        responseType: 'blob',
      }) as unknown as Promise<Blob>)

      const nombre = `reporte_variacion_${fecha}.pdf`
      descargarBlob(blob, nombre)

    } finally {
      setExportingVariacion(false)
    }
  }

  return {
    exportarGeneral,   exporting,
    exportarCliente,   exportingCliente,
    exportarVariacion, exportingVariacion,
  }
}

// ─────────────────────────────────────────────
// Utilidad compartida
// ─────────────────────────────────────────────

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}
import { useState } from 'react'
import api from '@/lib/axios'
import type { ClientFilters, FechaCorteState } from '@/components/cartera/filters-bar'
import type { Client } from '@/components/cartera/clients-table'
import type { AgingData } from '@/lib/adapters/carteraAdapter'

interface ExportPayload {
  fechaCorte: FechaCorteState
  filtros:    ClientFilters
  clientes:   Client[]
  aging:      AgingData
}

export function useExportPDF() {
  const [exporting, setExporting] = useState(false)

  const exportarGeneral = async ({ fechaCorte, filtros, clientes, aging }: ExportPayload) => {
    setExporting(true)
    try {
      // ── KPIs calculados desde números crudos de clientes ──
      const totalCorriente   = clientes.reduce((s, c) => s + (c.current || 0), 0)
      const totalVencida     = clientes.reduce((s, c) => s + (c.overdue  || 0), 0)
      const totalCartera     = totalCorriente + totalVencida
      const clientesEnMora   = clientes.filter(c => c.overdue > 0).length
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
        // Números crudos — la plantilla los formatea con formatCOP
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
        clientes,
      }

      const blob = await (api.post('/export/general', payload, {
        responseType: 'blob',
      }) as unknown as Promise<Blob>)

      const fecha  = fechaCorte.fecha ?? new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const nombre = `reporte_cartera_general_${fecha}.pdf`

      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = nombre
      a.click()
      URL.revokeObjectURL(url)

    } finally {
      setExporting(false)
    }
  }

  return { exportarGeneral, exporting }
}
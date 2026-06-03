// frontend/components/cruces/kpi-cruces-cards.tsx
'use client'

import { CheckCircle2, AlertTriangle, Clock, Hash } from 'lucide-react'
import type { ResumenCruces } from '@/lib/services/crucesService'
import { formatCurrency } from '@/lib/formatters'

interface Props {
  resumen: ResumenCruces
}

const CasoBadge = ({
  caso,
  count,
}: {
  caso: string
  count: number
}) => {
  const labels: Record<string, { label: string; color: string }> = {
    MATCH_PERFECTO:  { label: 'Match perfecto',   color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    PAGO_PARCIAL:    { label: 'Pago parcial',      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    SALDO_A_FAVOR:   { label: 'Saldo a favor',     color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
    SALDO_EN_CONTRA: { label: 'Saldo en contra',   color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    CREDITO_A_FAVOR: { label: 'Crédito a favor',   color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  }
  const meta = labels[caso] ?? { label: caso, color: 'bg-muted text-muted-foreground border-border' }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.color}`}
    >
      <span>{count}</span>
      <span className="opacity-75">·</span>
      <span>{meta.label}</span>
    </span>
  )
}

export function KpiCrucesCards({ resumen }: Props) {
  const cards = [
    {
      label: 'Total documentos',
      value: resumen.totalFilas.toLocaleString('es-CO'),
      icon: Hash,
      color: 'text-muted-foreground',
      bg: 'bg-muted/40',
    },
    {
      label: 'Cruzados automáticamente',
      value: resumen.autoCruzados.toLocaleString('es-CO'),
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Requieren intervención',
      value: resumen.gruposManuales.toLocaleString('es-CO'),
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'En revisión (sin emparejar)',
      value: resumen.itemsRevision.toLocaleString('es-CO'),
      icon: Clock,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
  ]

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border border-border/50 p-4 ${c.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className={`text-2xl font-semibold tabular-nums ${c.color}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Desglose por caso */}
      {Object.keys(resumen.porCaso).length > 0 && (
        <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground mr-1">Casos:</span>
          {Object.entries(resumen.porCaso).map(([caso, count]) => (
            <CasoBadge key={caso} caso={caso} count={count!} />
          ))}
        </div>
      )}

      {/* Desglose por motivo de revisión */}
      {Object.keys(resumen.porMotivo).length > 0 && (
        <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
          <span className="text-xs text-muted-foreground block mb-2">
            Motivos de revisión:
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(resumen.porMotivo).map(([motivo, count]) => (
              <span
                key={motivo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border bg-rose-500/10 text-rose-400 border-rose-500/20"
              >
                <span className="font-semibold">{count}</span>
                <span className="opacity-75">·</span>
                <span>{motivo}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

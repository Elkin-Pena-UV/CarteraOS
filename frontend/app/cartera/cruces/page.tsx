// frontend/app/cartera/cruces/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Play, RefreshCw, Search, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { useCruces } from '@/hooks/use-cruces'
import {
  adaptProcesados,
  adaptGruposManuales,
  adaptRevision,
} from '@/lib/adapters/crucesAdapter'
import { KpiCrucesCards } from '@/components/cruces/kpi-cruces-cards'
import { TablaProcesados } from '@/components/cruces/tabla-procesados'
import { TablaManuales } from '@/components/cruces/tabla-manuales'
import { TablaRevision } from '@/components/cruces/tabla-revision'
import { AppShell } from '@/components/layout/app-shell'

type Tab = 'automaticos' | 'manuales' | 'revision'

export default function CrucesPage() {
  const { data, isLoading, isFetching, isError, error, ejecutar } = useCruces()
  const [activeTab, setActiveTab] = useState<Tab>('automaticos')
  const [globalFilter, setGlobalFilter] = useState('')

  // Limpiar filtro al cambiar de pestaña
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setGlobalFilter('')
  }

  const procesados   = useMemo(() => adaptProcesados(data?.procesados ?? []),       [data])
  const manuales     = useMemo(() => adaptGruposManuales(data?.gruposManuales ?? []), [data])
  const enRevision   = useMemo(() => adaptRevision(data?.revision ?? []),            [data])

  const tabs: { id: Tab; label: string; count: number; icon: React.ElementType; color: string }[] = [
    {
      id: 'automaticos',
      label: 'Cruzados automáticamente',
      count: procesados.length,
      icon: CheckCircle2,
      color: 'text-emerald-400 border-emerald-500/40',
    },
    {
      id: 'manuales',
      label: 'Intervención manual',
      count: manuales.length,
      icon: AlertTriangle,
      color: 'text-amber-400 border-amber-500/40',
    },
    {
      id: 'revision',
      label: 'Sin emparejar',
      count: enRevision.length,
      icon: Clock,
      color: 'text-rose-400 border-rose-500/40',
    },
  ]

  const isRunning = isLoading || isFetching

  return (
    <AppShell>
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Cruce de Pagos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Seguimiento del pipeline automático FVE ↔ RC/RAC
          </p>
        </div>

        <button
          onClick={ejecutar}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            bg-[#ff6600] hover:bg-[#e55a00] text-white transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {data ? 'Re-ejecutar análisis' : 'Ejecutar análisis'}
        </button>
      </div>

      {/* Estado vacío */}
      {!data && !isRunning && !isError && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Play className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium text-muted-foreground">
            Presiona <span className="text-[#ff6600]">Ejecutar análisis</span> para procesar los cruces
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            El pipeline lee la vista v_ti_cruce_aut, empareja documentos y clasifica cada grupo.
          </p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Error al procesar cruces:{' '}
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      )}

      {/* Loading skeleton */}
      {isRunning && !data && (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/40" />
            ))}
          </div>
          <div className="h-10 rounded-lg bg-muted/40" />
          <div className="h-64 rounded-lg bg-muted/20" />
        </div>
      )}

      {/* Contenido principal */}
      {data && (
        <>
          {/* KPIs */}
          <KpiCrucesCards resumen={data.resumen} />

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border/50 pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg
                    border-b-2 transition-colors -mb-px
                    ${isActive
                      ? `border-[#ff6600] text-foreground bg-muted/20`
                      : `border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10`
                    }
                  `}
                >
                  <tab.icon
                    className={`h-3.5 w-3.5 ${isActive ? tab.color.split(' ')[0] : ''}`}
                  />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`
                        ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                        ${isActive
                          ? `bg-[#ff6600]/20 text-[#ff6600]`
                          : `bg-muted text-muted-foreground`
                        }
                      `}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Buscador global alineado a la derecha */}
            <div className="ml-auto relative mb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar tercero, llave…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="
                  pl-8 pr-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border/50
                  placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#ff6600]/50
                  w-52 transition-all
                "
              />
            </div>
          </div>

          {/* Tabla activa */}
          <div>
            {activeTab === 'automaticos' && (
              <TablaProcesados
                data={procesados}
                globalFilter={globalFilter}
              />
            )}
            {activeTab === 'manuales' && (
              <TablaManuales
                data={manuales}
                globalFilter={globalFilter}
              />
            )}
            {activeTab === 'revision' && (
              <TablaRevision
                data={enRevision}
                globalFilter={globalFilter}
              />
            )}
          </div>

          {/* Footer con timestamp */}
          {isFetching && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Actualizando…
            </p>
          )}
        </>
      )}
    </div>
    </AppShell>
  )
}

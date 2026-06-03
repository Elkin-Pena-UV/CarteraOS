// frontend/app/cartera/cruces/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Play, RefreshCw, Search, CheckCircle2, AlertTriangle, Clock, ShieldCheck, History } from 'lucide-react'
import { useCruces } from '@/hooks/use-cruces'
import {
  adaptProcesados,
  adaptGruposManuales,
  adaptRevision,
} from '@/lib/adapters/crucesAdapter'
import type { FilaGrupoManual } from '@/lib/adapters/crucesAdapter'
import { KpiCrucesCards } from '@/components/cruces/kpi-cruces-cards'
import { TablaProcesados } from '@/components/cruces/tabla-procesados'
import { TablaManuales } from '@/components/cruces/tabla-manuales'
import { TablaRevision } from '@/components/cruces/tabla-revision'
import { AppShell } from '@/components/layout/app-shell'
import { TablaHistorial } from '@/components/cruces/tabla-historial'
import { HistorialFiltersBar } from '@/components/cruces/historial-filters-bar'
import { useHistorialCruces } from '@/hooks/use-historial-cruces'
import { autorizarCruces } from '@/lib/services/crucesService'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Tab = 'automaticos' | 'manuales' | 'revision' | 'historial'

export default function CrucesPage() {
  const { data, isLoading, isFetching, isError, error, ejecutar } = useCruces()
  const [activeTab, setActiveTab] = useState<Tab>('automaticos')
  const [globalFilter, setGlobalFilter] = useState('')
  const [autorizados, setAutorizados] = useState<Set<string>>(new Set())
  const [autorizando, setAutorizando] = useState(false)
  const [dialogManualFila, setDialogManualFila] = useState<FilaGrupoManual | null>(null)
  const { toast } = useToast()
  const {
    data: historialData,
    isLoading: historialLoading,
    isFetching: historialFetching,
    draftTercero,
    setDraftTercero,
    draftUsuario,
    setDraftUsuario,
    consultar,
  } = useHistorialCruces()

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
    {
      id: 'historial',
      label: 'Historial',
      count: 0,
      icon: History,
      color: 'text-muted-foreground',
    },
  ]

  const isRunning = isLoading || isFetching

  async function handleAutorizarTodos() {
    setAutorizando(true)
    try {
      const payload = procesados.map(p => ({
        tercero: p.tercero,
        claveType: p.claveType,
        claveValor: p.claveValor,
        tipoCruce: 'AUTOMATICO' as const,
        caso: p.caso,
        confianza: p.confianza,
        totalFVE: p.totalFVE,
        totalRC: p.totalRC,
        net: p.net,
        nroFVE: p.nroFVE,
        nroRC: p.nroRC,
        consecsFVE: p.consecsFVE,
        consecsRC: p.consecsRC,
      }))
      await autorizarCruces(payload)
      setAutorizados(prev => {
        const next = new Set(prev)
        procesados.forEach(p => next.add(p.id))
        return next
      })
      toast({ title: 'Cruces autorizados', description: `${procesados.length} cruces registrados correctamente.` })
    } catch {
      toast({ title: 'Error al autorizar', description: 'No se pudieron autorizar los cruces.', variant: 'destructive' })
    } finally {
      setAutorizando(false)
    }
  }

  async function handleAutorizarManual(fila: FilaGrupoManual) {
    setAutorizando(true)
    try {
      await autorizarCruces([{
        tercero: fila.tercero,
        claveType: fila.claveType,
        claveValor: fila.claveValor,
        tipoCruce: 'MANUAL' as const,
        confianza: fila.confianza,
        totalFVE: fila.totalFVE,
        totalRC: fila.totalRC,
        net: fila.netEstimado,
        nroFVE: fila.nroFVE,
        nroRC: fila.nroRC,
        consecsFVE: fila.consecsFVE,
        consecsRC: fila.consecsRC,
      }])
      setAutorizados(prev => new Set([...prev, fila.id]))
      toast({ title: 'Cruce autorizado', description: `Grupo ${fila.claveValor} (${fila.tercero}) registrado correctamente.` })
    } catch {
      toast({ title: 'Error al autorizar', description: 'No se pudo autorizar el cruce.', variant: 'destructive' })
    } finally {
      setAutorizando(false)
      setDialogManualFila(null)
    }
  }

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
              <div className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={autorizando || procesados.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                          bg-emerald-600 hover:bg-emerald-700 text-white transition-colors
                          disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Autorizar todos ({procesados.length})
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Autorizar cruces automáticos</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se registrarán {procesados.length} cruces como autorizados. Esta acción queda registrada con tu usuario y la fecha actual.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAutorizarTodos}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <TablaProcesados data={procesados} globalFilter={globalFilter} />
              </div>
            )}
            {activeTab === 'manuales' && (
              <>
                <AlertDialog
                  open={dialogManualFila !== null}
                  onOpenChange={(open) => { if (!open) setDialogManualFila(null) }}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Autorizar cruce manual</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se registrará 1 cruce como autorizado para{' '}
                        <strong>{dialogManualFila?.tercero}</strong> / {dialogManualFila?.claveValor}.
                        {' '}Esta acción queda registrada con tu usuario y la fecha actual.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => dialogManualFila && handleAutorizarManual(dialogManualFila)}
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <TablaManuales
                  data={manuales}
                  globalFilter={globalFilter}
                  autorizados={autorizados}
                  onAutorizar={(fila) => setDialogManualFila(fila)}
                />
              </>
            )}
            {activeTab === 'revision' && (
              <TablaRevision
                data={enRevision}
                globalFilter={globalFilter}
              />
            )}
            {activeTab === 'historial' && (
              <div className="space-y-4">
                <HistorialFiltersBar
                  draftTercero={draftTercero}
                  setDraftTercero={setDraftTercero}
                  draftUsuario={draftUsuario}
                  setDraftUsuario={setDraftUsuario}
                  onConsultar={consultar}
                  isFetching={historialFetching}
                />
                {historialLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-10 rounded-lg bg-muted/40" />
                    <div className="h-64 rounded-lg bg-muted/20" />
                  </div>
                ) : (
                  <TablaHistorial
                    data={historialData ?? []}
                    globalFilter={globalFilter}
                  />
                )}
              </div>
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

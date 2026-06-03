"use client"

import { RefreshCw, Search, User } from "lucide-react"

interface HistorialFiltersBarProps {
  draftTercero: string
  setDraftTercero: (v: string) => void
  draftUsuario: string
  setDraftUsuario: (v: string) => void
  onConsultar: () => void
  isFetching: boolean
}

export function HistorialFiltersBar({
  draftTercero,
  setDraftTercero,
  draftUsuario,
  setDraftUsuario,
  onConsultar,
  isFetching,
}: HistorialFiltersBarProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onConsultar()
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card/95 px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Tercero / NIT</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Ej: 900123456"
            value={draftTercero}
            onChange={(e) => setDraftTercero(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 pr-3 py-2 rounded-lg text-sm bg-background border border-border/70
              placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#ff6600]/50
              w-52 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-muted-foreground font-medium">Usuario</label>
        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Ej: juan.perez"
            value={draftUsuario}
            onChange={(e) => setDraftUsuario(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 pr-3 py-2 rounded-lg text-sm bg-background border border-border/70
              placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#ff6600]/50
              w-44 transition-all"
          />
        </div>
      </div>

      <button
        onClick={onConsultar}
        disabled={isFetching}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          bg-[#ff6600] hover:bg-[#e55a00] text-white transition-colors
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        Consultar
      </button>
    </div>
  )
}

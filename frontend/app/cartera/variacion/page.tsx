"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { VariationTable } from "@/components/cartera/variation-table"
import { KPICards } from "@/components/cartera/kpi-variation-cards"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useVariacion } from "@/hooks/use-variacion"
import { adaptVariacionToClients } from "@/lib/adapters/variacionAdapter"

const toYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

const fromYYYYMMDD = (s: string): Date =>
  new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)))

const hoyYYYYMMDD = toYYYYMMDD(new Date())

export default function VariacionPage() {
  const [fecha, setFecha] = useState<string>(hoyYYYYMMDD)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // ── Un solo fetch, compartido entre KPIs y tabla ──────────────────────────
  const { data: rawData, loading, error } = useVariacion(fecha)
  const data = useMemo(() => adaptVariacionToClients(rawData), [rawData])

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    setFecha(toYYYYMMDD(day))
    setCalendarOpen(false)
  }

  if (loading) return (
    <AppShell>
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Cargando variación de cartera...
      </div>
    </AppShell>
  )

  if (error) return (
    <AppShell>
      <div className="flex h-96 items-center justify-center text-destructive">{error}</div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Variación de Cartera</h1>
            <p className="text-muted-foreground">Comparativo de cartera mes actual vs mes anterior</p>
          </div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-9 justify-start text-left font-normal gap-2")}>
                <CalendarIcon className="h-4 w-4" />
                {format(fromYYYYMMDD(fecha), "dd/MM/yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={fromYYYYMMDD(fecha)} onSelect={handleDaySelect} locale={es} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Ambos reciben los mismos datos — un solo fetch */}
        <KPICards data={data} />
        <VariationTable data={data} fecha={fecha} />
      </div>
    </AppShell>
  )
}
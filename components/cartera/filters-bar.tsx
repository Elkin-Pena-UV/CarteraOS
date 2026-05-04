"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X, Mail, ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { DateRange } from "react-day-picker"

export type ClientFilters = {
  channel: string
  advisor: string
  status: string
  clientName: string
  minValue: string
  maxValue: string
  dateRange: DateRange | undefined
}

export const initialClientFilters: ClientFilters = {
  channel: "",
  advisor: "",
  status: "",
  clientName: "",
  minValue: "",
  maxValue: "",
  dateRange: undefined,
}

interface FiltersBarProps {
  value: ClientFilters
  onChange: (nextFilters: ClientFilters) => void
}

export function FiltersBar({ value, onChange }: FiltersBarProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(true)

  const updateFilter = <K extends keyof ClientFilters>(key: K, nextValue: ClientFilters[K]) => {
    onChange({
      ...value,
      [key]: nextValue,
    })
  }

  const handleClearFilters = () => {
    onChange(initialClientFilters)
    toast({
      title: "Filtros limpiados",
      description: "Se han removido todos los filtros.",
    })
  }

  const handleExportExcel = () => {
    toast({
      title: "Enviando reporte",
      description: "El reporte se enviará en unos segundos...",
    })
  }

  return (
    <div className="sticky top-16 z-20 rounded-lg border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className={cn("flex items-center justify-between gap-3", isExpanded ? "border-b px-4 py-3" : "px-3 py-2")}> 
        <div>
          <p className="text-sm font-semibold">Filtros de cartera</p>
        </div>

        <Button
          variant="ghost"
          onClick={() => setIsExpanded((value) => !value)}
          className={cn("gap-2", isExpanded ? "h-9 px-3" : "h-8 px-2 text-xs")}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {isExpanded ? "Minimizar" : "Desplegar"}
        </Button>
      </div>

      {isExpanded ? (
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Canal */}
            <div className="min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Canal</Label>
              <Select value={value.channel} onValueChange={(next) => updateFilter("channel", next)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="comercializador">Comercializador</SelectItem>
                  <SelectItem value="vtd">Venta Directa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asesor */}
            <div className="min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Asesor</Label>
              <Select value={value.advisor} onValueChange={(next) => updateFilter("advisor", next)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="carlos">Carlos Méndez</SelectItem>
                  <SelectItem value="maria">María González</SelectItem>
                  <SelectItem value="pedro">Pedro Ramírez</SelectItem>
                  <SelectItem value="laura">Laura Torres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select value={value.status} onValueChange={(next) => updateFilter("status", next)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="corriente">Corriente</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                  <SelectItem value="gestion">En gestión</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="min-w-[220px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha Vencimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal",
                      !value.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value.dateRange?.from ? (
                      value.dateRange.to ? (
                        <>
                          {format(value.dateRange.from, "dd/MM/yy", { locale: es })} -{" "}
                          {format(value.dateRange.to, "dd/MM/yy", { locale: es })}
                        </>
                      ) : (
                        format(value.dateRange.from, "dd/MM/yyyy", { locale: es })
                      )
                    ) : (
                      "Seleccionar rango"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    autoFocus
                    mode="range"
                    defaultMonth={value.dateRange?.from}
                    selected={value.dateRange}
                    onSelect={(next) => updateFilter("dateRange", next)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Nombre cliente */}
            <div className="min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre Cliente</Label>
              <Input
                placeholder="Buscar nombre..."
                value={value.clientName}
                onChange={(e) => updateFilter("clientName", e.target.value)}
                className="h-9"
              />
            </div>

            {/* Rango de Valor */}
            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Rango Valor (COP)</Label>
              <div className="flex items-center gap-1">
                <Input
                  placeholder="Min"
                  value={value.minValue}
                  onChange={(e) => updateFilter("minValue", e.target.value)}
                  className="h-9 w-20"
                  type="number"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  placeholder="Max"
                  value={value.maxValue}
                  onChange={(e) => updateFilter("maxValue", e.target.value)}
                  className="h-9 w-20"
                  type="number"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-9"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="h-9"
              >
                <Mail className="mr-2 h-4 w-4" />
                Enviar reporte
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

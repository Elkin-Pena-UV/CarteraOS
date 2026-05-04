import { AppShell } from "@/components/layout/app-shell"
import { AgingCharts } from "@/components/cartera/aging-charts"
import { FiltersBar } from "@/components/cartera/filters-bar"
import { ClientsTable } from "@/components/cartera/clients-table"

export default function AntiguedadPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Antigüedad de Cartera</h1>
          <p className="text-muted-foreground">
            Análisis de antigüedad de cuentas por cobrar
          </p>
        </div>
        <AgingCharts />
        <div>
          <h2 className="mb-4 text-lg font-semibold">Detalle por Cliente</h2>
        </div>
      </div>
    </AppShell>
  )
}

import { AppShell } from "@/components/layout/app-shell"
import { RotationTable } from "@/components/cartera/rotation-table"
import { FiltersBarCopy } from "@/components/cartera/filters-barcopy"

export const metadata = {
  title: 'Rotación de Cartera',
  description: 'Análisis de rotación de cuentas por cobrar',
}

export default function RotacionPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rotación de Cartera</h1>
          <p className="text-muted-foreground">
            Análisis de rotación de cuentas por cobrar
          </p>
        </div>
        <FiltersBarCopy />
        <RotationTable />
      </div>
    </AppShell>
  )
}

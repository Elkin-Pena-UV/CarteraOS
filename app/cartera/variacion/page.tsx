import { AppShell } from "@/components/layout/app-shell"
import { VariationTable } from "@/components/cartera/variation-table"

export default function VariacionPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Variación de Cartera</h1>
          <p className="text-muted-foreground">
            Comparativo de cartera mes actual vs mes anterior
          </p>
        </div>
        <VariationTable />
      </div>
    </AppShell>
  )
}

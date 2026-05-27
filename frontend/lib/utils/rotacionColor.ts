export function parsearCondPagoDias(idCondPago: string): number | null {
  const s = idCondPago.trim().toUpperCase()
  if (s === "ANT" || s === "999") return null
  const m = s.match(/^(\d+)D$/)
  if (m) return parseInt(m[1], 10)
  return null
}

export function getRotationColor(days: number, condPagoDias?: number | null): string {
  if (condPagoDias != null) {
    return days <= condPagoDias ? "#22C55E" : "#F59E0B"
  }
  if (days <= 20) return "#22C55E"
  if (days <= 25) return "#F59E0B"
  return "#EF4444"
}

export function getRotationBg(days: number, condPagoDias?: number | null): string {
  if (condPagoDias != null) {
    return days <= condPagoDias
      ? "bg-green-100 dark:bg-green-950/50"
      : "bg-yellow-100 dark:bg-yellow-950/50"
  }
  if (days <= 20) return "bg-green-100 dark:bg-green-950/50"
  if (days <= 25) return "bg-yellow-100 dark:bg-yellow-950/50"
  return "bg-red-100 dark:bg-red-950/50"
}

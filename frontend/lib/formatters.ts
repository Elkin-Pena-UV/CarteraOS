/**
 * lib/formatters.ts
 *
 * Formatters centralizados para el módulo de cartera.
 * Instancias singleton de Intl para evitar re-creación en cada render.
 */

// ── Instancias singleton ──────────────────────────────────────────────────────

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("es-CO")

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Formatea un número como moneda COP completa.
 * Ej: 1500000 → "$1.500.000"
 */
export const formatCurrency = (value: number): string =>
  copFormatter.format(value)

/**
 * Formatea un número entero con separador de miles.
 * Ej: 1500000 → "1.500.000"
 */
export const formatNumber = (value: number): string =>
  numberFormatter.format(value)

/**
 * Formatea un número como moneda compacta (M / B).
 * Usada en gráficos y KPIs donde el espacio es limitado.
 * Ej: 1_500_000_000 → "$1.5 B" | 750_000_000 → "$750 M"
 */
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_000_000)         return `$${(value / 1_000_000).toFixed(0)} M`
  return `$${value.toLocaleString("es-CO")}`
}

/**
 * Formatea un porcentaje con signo y 2 decimales.
 * Ej: 3.5 → "+3.50%" | -1.2 → "-1.20%" | null → "0.00%"
 */
export const formatPercent = (value: number | null | undefined): string => {
  if (value == null) return "0.00%"
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
}

/**
 * Formatea una fecha ISO/string al formato local es-CO.
 * Ej: "2024-03-15" → "15/3/2024"
 * Retorna "-" si el string está vacío o es inválido.
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "-"
  return dateFormatter.format(date)
}
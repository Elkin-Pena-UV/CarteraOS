"use client"

import { useState, useEffect } from "react"

/**
 * Persists a filter state object in localStorage.
 * Merges saved value with defaultValue so new fields are always present.
 */
export function usePersistedFilters<T extends object>(storageKey: string, defaultValue: T) {
  const [filters, setFilters] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return defaultValue
      return { ...defaultValue, ...JSON.parse(saved) }
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(storageKey, JSON.stringify(filters))
  }, [storageKey, filters])

  const reset = () => setFilters(defaultValue)

  return { filters, setFilters, reset }
}

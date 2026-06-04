// frontend/hooks/use-cruces.ts
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { procesarCruces, type ResultadoCruces } from '@/lib/services/crucesService'

export function useCruces() {
  // El pipeline no corre automáticamente: el usuario presiona "Ejecutar análisis"
  const [enabled, setEnabled] = useState(true)

  const query = useQuery<ResultadoCruces>({
    queryKey: ['cruces'],
    queryFn: procesarCruces,
    enabled,
    staleTime: 5 * 60 * 1000,  // 5 min – el resultado no cambia si no se re-ejecuta
    gcTime: 10 * 60 * 1000,
  })

  const ejecutar = () => {
    if (enabled) {
      query.refetch()
    } else {
      setEnabled(true)
    }
  }

  return { ...query, ejecutar }
}
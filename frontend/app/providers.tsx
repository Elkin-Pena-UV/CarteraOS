'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // useState evita que se cree un cliente nuevo en cada render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ⏱️ Datos considerados frescos por 1 hora (igual que tu cache backend)
            staleTime: 1000 * 60 * 60,

            // 🗑️ Mantener en memoria 24h aunque ya no se use
            gcTime: 1000 * 60 * 60 * 24,

            // 🔄 No refetch automático al hacer focus (puede ser molesto)
            refetchOnWindowFocus: false,

            // 🔁 Reintentar 1 vez si falla
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
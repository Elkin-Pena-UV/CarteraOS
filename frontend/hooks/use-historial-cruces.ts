"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { obtenerHistorial, type CruceHistorial } from "@/lib/services/crucesService"

interface CommittedParams {
  tercero: string
  usuario: string
}

export function useHistorialCruces() {
  const [draftTercero, setDraftTercero] = useState("")
  const [draftUsuario, setDraftUsuario] = useState("")
  const [committedParams, setCommittedParams] = useState<CommittedParams>({ tercero: "", usuario: "" })

  const { data, isLoading, isFetching, isError } = useQuery<CruceHistorial[]>({
    queryKey: ["cruces-historial", committedParams],
    queryFn: () => obtenerHistorial({
      tercero: committedParams.tercero || undefined,
      usuario: committedParams.usuario || undefined,
    }),
    staleTime: 2 * 60 * 1000,
  })

  function consultar() {
    setCommittedParams({ tercero: draftTercero.trim(), usuario: draftUsuario.trim() })
  }

  return {
    data,
    isLoading,
    isFetching,
    isError,
    draftTercero,
    setDraftTercero,
    draftUsuario,
    setDraftUsuario,
    consultar,
  }
}

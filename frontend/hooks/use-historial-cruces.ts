"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { obtenerHistorial, type CruceHistorial } from "@/lib/services/crucesService"

interface CommittedParams {
  tercero: string
  usuario: string
  tick: number   // ← fuerza re-fetch aunque los filtros no cambien
}

export function useHistorialCruces() {
  const [draftTercero, setDraftTercero] = useState("")
  const [draftUsuario, setDraftUsuario] = useState("")
  const [committedParams, setCommittedParams] = useState<CommittedParams>({
    tercero: "",
    usuario: "",
    tick: 0,
  })

  const { data, isLoading, isFetching, isError } = useQuery<CruceHistorial[]>({
    queryKey: ["cruces-historial", committedParams],
    queryFn: () => obtenerHistorial({
      tercero: committedParams.tercero || undefined,
      usuario: committedParams.usuario || undefined,
    }),
    staleTime: 0,   // ← siempre re-fetcha cuando la queryKey cambia
  })

  function consultar() {
    setCommittedParams(prev => ({
      tercero: draftTercero.trim(),
      usuario: draftUsuario.trim(),
      tick: prev.tick + 1,   // ← garantiza queryKey diferente siempre
    }))
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

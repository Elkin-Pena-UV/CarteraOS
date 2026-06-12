"use client"

import { createContext, useContext, useState } from "react"

interface SidebarStateContextValue {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarStateContext = createContext<SidebarStateContextValue | null>(null)

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  function toggleSidebar() {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <SidebarStateContext.Provider value={{ sidebarCollapsed, toggleSidebar }}>
      {children}
    </SidebarStateContext.Provider>
  )
}

export function useSidebarState(): SidebarStateContextValue {
  const ctx = useContext(SidebarStateContext)
  if (!ctx) {
    throw new Error("useSidebarState must be used within a SidebarStateProvider")
  }
  return ctx
}

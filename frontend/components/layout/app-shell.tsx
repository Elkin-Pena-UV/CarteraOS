"use client"

import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { cn } from "@/lib/utils"
import { useSidebarState } from "@/lib/contexts/SidebarContext"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useInactivityLogout } from "@/hooks/useInactivityLogout"

const INACTIVITY_MS =
  Number(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_MINUTES ?? 20) * 60 * 1000

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed, toggleSidebar } = useSidebarState()
  const { logout, isAuthenticated } = useAuth()

  useInactivityLogout(logout, INACTIVITY_MS, isAuthenticated)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <Topbar sidebarCollapsed={sidebarCollapsed} />
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          sidebarCollapsed ? "pl-16" : "pl-64"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

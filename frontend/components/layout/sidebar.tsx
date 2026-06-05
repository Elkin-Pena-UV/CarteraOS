"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from '@/lib/contexts/AuthContext'
import {
  Wallet,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  TrendingUp,
  Receipt,
  Banknote,
  BarChart3,
  ArrowLeftRight,
  RefreshCcw,
  CreditCard,
  PiggyBank,
  FileBarChart,
  UserCircle,
  Building,
  GitMerge,
  type LucideIcon,
  UserCog,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface MenuItem {
  title: string
  href?: string
  icon: LucideIcon
  badge?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Cartera",
    icon: Wallet,
    badge: "",
    children: [
      {
        title: "Resumen General",
        href: "/cartera/general",
        icon: BarChart3,
      },
      {
        title: "Variación",
        href: "/cartera/variacion",
        icon: ArrowLeftRight,
      },
      {
        title: "Rotación",
        href: "/cartera/rotacion",
        icon: RefreshCcw,
      },
      {
        title: "Cruces de Pagos",
        href: "/cartera/cruces",
        icon: GitMerge,
      },
    ],
  },
  // {
  //   title: "Tesorería",
  //   icon: Banknote,
  //   children: [
  //     {
  //       title: "Flujo de Caja",
  //       href: "/tesoreria/flujo",
  //       icon: TrendingUp,
  //     },
  //     {
  //       title: "Recaudos",
  //       href: "/tesoreria/recaudos",
  //       icon: PiggyBank,
  //     },
  //     {
  //       title: "Pagos",
  //       href: "/tesoreria/pagos",
  //       icon: CreditCard,
  //     },
  //   ],
  // },
  // {
  //   title: "Clientes",
  //   icon: Users,
  //   children: [
  //     {
  //       title: "Directorio",
  //       href: "/clientes",
  //       icon: UserCircle,
  //     },
  //     {
  //       title: "Por Empresa",
  //       href: "/clientes/empresas",
  //       icon: Building,
  //     },
  //   ],
  // },
  // {
  //   title: "Facturas",
  //   href: "/facturas",
  //   icon: Receipt,
  // },
  // {
  //   title: "Reportes",
  //   href: "/reportes",
  //   icon: FileBarChart,
  // },
  // {
  //   title: "Documentos",
  //   href: "/documentos",
  //   icon: FileText,
  // },
  {
    title: "Administración",
    icon: ShieldCheck,
    children: [
      {
        title: "Usuarios",
        href: "/admin/usuarios",
        icon: UserCog,
      },
    ],
  },
]

const bottomMenuItems: MenuItem[] = [
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface PopoverState {
  item: MenuItem | null
  position: { top: number; left: number }
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [popover, setPopover] = useState<PopoverState>({ item: null, position: { top: 0, left: 0 } })
  const popoverRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()

  // Auto-expand groups with active children
  useEffect(() => {
    const activeGroups = menuItems
      .filter((item) => item.children?.some((child) => child.href === pathname))
      .map((item) => item.title)

    setExpandedGroups((prev) => {
      const newExpanded = [...new Set([...prev, ...activeGroups])]
      return newExpanded
    })
  }, [pathname])

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    )
  }

  const isGroupActive = (item: MenuItem) => {
    if (item.href) return pathname === item.href
    return item.children?.some((child) => child.href === pathname)
  }

  const handleMouseEnter = (item: MenuItem, event: React.MouseEvent<HTMLElement>) => {
    if (!collapsed || !item.children) return

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    const rect = event.currentTarget.getBoundingClientRect()
    setPopover({
      item,
      position: { top: rect.top, left: rect.right + 8 }
    })
  }

  const handleMouseLeave = () => {
    if (!collapsed) return

    hoverTimeoutRef.current = setTimeout(() => {
      setPopover({ item: null, position: { top: 0, left: 0 } })
    }, 150)
  }

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handlePopoverMouseLeave = () => {
    setPopover({ item: null, position: { top: 0, left: 0 } })
  }

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedGroups.includes(item.title)
    const isActive = item.href ? pathname === item.href : isGroupActive(item)
    const isChildActive = hasChildren && item.children?.some((child) => child.href === pathname)

    if (hasChildren && !collapsed) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleGroup(item.title)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isChildActive
                // ? "text-sidebar-foreground"
                ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", isChildActive && "text-[#ff6600]")} />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <span className="rounded-full bg-[#ff6600] px-2 py-0.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              isExpanded ? "max-h-96" : "max-h-0"
            )}
          >
            <div className="relative ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
              {item.children?.map((child) => renderMenuItem(child, true))}
            </div>
          </div>
        </div>
      )
    }

    if (hasChildren && collapsed) {
      return (
        <div
          key={item.title}
          onMouseEnter={(e) => handleMouseEnter(item, e)}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={cn(
              "flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isChildActive
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", isChildActive && "text-[#ff6600]")} />
          </button>
        </div>
      )
    }

    return (
      <Link
        key={item.href || item.title}
        href={item.href || "#"}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isChild && "py-2 text-[13px]",
          isActive
            ? isChild
              ? "bg-[#ff6600]/15 text-[#ff6600]"
              : "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          collapsed && "justify-center"
        )}
      >
        <item.icon
          className={cn(
            "shrink-0",
            isChild ? "h-4 w-4" : "h-5 w-5",
            isActive && "text-[#ff6600]"
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="rounded-full bg-[#ff6600] px-2 py-0.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6600]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">FinApp</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6600]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {menuItems
            .filter((item) => item.title !== 'Administración' || user?.rol === 'admin')
            .map((item) => renderMenuItem(item))}
        </nav>

        {/* Bottom Menu */}
        <div className="border-t border-sidebar-border p-2">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href || "#"}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </aside>

      {/* Popover for collapsed sidebar */}
      {collapsed && popover.item && (
        <div
          ref={popoverRef}
          style={{ top: popover.position.top, left: popover.position.left }}
          className="fixed z-50 min-w-48 rounded-lg border border-sidebar-border bg-sidebar p-2 shadow-lg"
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          <div className="mb-2 border-b border-sidebar-border pb-2">
            <span className="px-2 text-sm font-semibold text-sidebar-foreground">
              {popover.item.title}
            </span>
          </div>
          <div className="space-y-1">
            {popover.item.children?.map((child) => {
              const isActive = pathname === child.href
              return (
                <Link
                  key={child.href}
                  href={child.href || "#"}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-[#ff6600]/15 text-[#ff6600]"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  onClick={() => setPopover({ item: null, position: { top: 0, left: 0 } })}
                >
                  <child.icon className={cn("h-4 w-4", isActive && "text-[#ff6600]")} />
                  <span>{child.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Bell, Calendar, ChevronDown, LogOut, Menu, Search, Settings, Shield, User, X, CheckCheck, GraduationCap, BarChart2, ClipboardList, ShieldCheck, Route, LayoutDashboard, FileText } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth, isMasterUser } from "@/lib/auth-context"
import { isReviewerRole, isAdminRole } from "@/lib/auth-roles"
import {
  getMyTrainingNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  generateTrainingNotifications,
  type TrainingNotification,
} from "@/app/actions/training-notifications"

// tab= values must match the TabsTrigger values in page.tsx
const baseNavItems = [
  { label: "Overview",     tab: "dashboard"   },
  { label: "Incidents",    tab: "dashboard"   },
  { label: "Inspections",  tab: "inspections" },
  { label: "Training",     tab: "dashboard"   },
  { label: "Reports",      tab: "reports"     },
  { label: "Settings",     tab: "settings"    },
]

const SEARCH_ITEMS = [
  { label: "Dashboard Overview", description: "KPIs, stats, and performance metrics", href: "/", icon: LayoutDashboard, section: "Navigation" },
  { label: "Incidents", description: "View and manage incident reports", href: "/#incidents", icon: ShieldCheck, section: "Navigation" },
  { label: "Inspections", description: "Inspection reports and types", href: "/#inspections", icon: ClipboardList, section: "Navigation" },
  { label: "Training", description: "Training matrix and records", href: "/#training", icon: GraduationCap, section: "Navigation" },
  { label: "Reports", description: "HSE performance data, summaries and exports", href: "/#reports", icon: BarChart2, section: "Navigation" },
  { label: "Journey Tracker", description: "Track vehicle journeys and trips", href: "/journey-tracker", icon: Route, section: "Navigation" },
  { label: "Settings", description: "User management and system settings", href: "/#settings", icon: Settings, section: "Navigation" },
  { label: "Behaviour Observations", description: "Submit and review BBS observations", href: "/#observations", icon: FileText, section: "Sections" },
  { label: "Business Units", description: "Manage business units and departments", href: "/#business-units", icon: LayoutDashboard, section: "Sections" },
]

interface DashboardHeaderProps {
  onDateRangeChange?: (range: string) => void
}

export function DashboardHeader({ onDateRangeChange }: DashboardHeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dateRange, setDateRange] = useState("30days")
  const [notifications, setNotifications] = useState<TrainingNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchModalRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const activeTab = searchParams.get("tab") ?? "dashboard"

  const handleNavClick = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`)
  }

  const filteredItems = searchQuery.trim().length === 0
    ? SEARCH_ITEMS
    : SEARCH_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )

  const openSearch = () => {
    setSearchOpen(true)
    setSearchQuery("")
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery("")
  }

  const handleSearchSelect = (href: string) => {
    closeSearch()
    router.push(href)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchOpen ? closeSearch() : openSearch()
      }
      if (e.key === "Escape" && searchOpen) closeSearch()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [searchOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(e.target as Node)) {
        closeSearch()
      }
    }
    if (searchOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchOpen])

  const navItems = [
    ...baseNavItems,
    ...(user?.journeyAccess ? [{ label: "Journey Tracker", tab: "journey" }] : []),
  ]

  const canReceiveNotifications =
    user && (isAdminRole(user.role, user.email) || isReviewerRole(user.role))

  const fetchNotifications = useCallback(async () => {
    if (!user?.email || !canReceiveNotifications) return
    await generateTrainingNotifications()
    const res = await getMyTrainingNotifications(user.email)
    if (res.success) {
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    }
  }, [user?.email, canReceiveNotifications])

  useEffect(() => {
    fetchNotifications()
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const handleMarkAllRead = async () => {
    if (!user?.email) return
    await markAllNotificationsRead(user.email)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleLogout = () => {
    logout()
    router.push("/sign-in")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const showSettings = user && isMasterUser(user.role)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold">XOM Oman</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                HSE
              </Badge>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="ml-8 hidden lg:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.tab
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => handleNavClick(item.tab)}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search trigger */}
          <button
            onClick={openSearch}
            className="hidden md:flex items-center gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground w-56"
            aria-label="Open search"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="pointer-events-none hidden select-none rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-mono sm:inline-flex">
              Ctrl K
            </kbd>
          </button>

          {/* Date Range */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden gap-2 sm:flex">
                <Calendar className="h-4 w-4" />
                <span>
                  {dateRange === "7days" ? "Last 7 days" : dateRange === "30days" ? "Last 30 days" : dateRange === "90days" ? "Last 90 days" : "This year"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Date Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setDateRange("7days")
                  onDateRangeChange?.("7days")
                }}
              >
                Last 7 days
                {dateRange === "7days" && <span className="ml-2 text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setDateRange("30days")
                  onDateRangeChange?.("30days")
                }}
              >
                Last 30 days
                {dateRange === "30days" && <span className="ml-2 text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setDateRange("90days")
                  onDateRangeChange?.("90days")
                }}
              >
                Last 90 days
                {dateRange === "90days" && <span className="ml-2 text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setDateRange("thisyear")
                  onDateRangeChange?.("thisyear")
                }}
              >
                This year
                {dateRange === "thisyear" && <span className="ml-2 text-xs">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="p-0 text-sm font-semibold">
                  Training Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                      {unreadCount} new
                    </Badge>
                  )}
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground"
                    onClick={(e) => { e.preventDefault(); handleMarkAllRead() }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <GraduationCap className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No training notifications</p>
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.map((n) => {
                    const isOverdue = n.daysUntilExpiry < 0
                    const isUrgent = n.daysUntilExpiry >= 0 && n.daysUntilExpiry <= 7
                    return (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex flex-col items-start gap-1 px-3 py-3 cursor-pointer ${!n.read ? "bg-muted/40" : ""}`}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                      >
                        <div className="flex w-full items-start gap-2">
                          <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                            isOverdue ? "bg-destructive" : isUrgent ? "bg-orange-500" : "bg-yellow-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!n.read ? "font-medium" : "font-normal"}`}>
                              {n.message}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`text-xs font-medium ${
                                isOverdue ? "text-destructive" : isUrgent ? "text-orange-500" : "text-yellow-600"
                              }`}>
                                {isOverdue
                                  ? `Overdue by ${Math.abs(n.daysUntilExpiry)} day(s)`
                                  : `Expires in ${n.daysUntilExpiry} day(s)`}
                              </span>
                              {!n.read && (
                                <span className="text-[10px] text-muted-foreground">• unread</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings (only for master users) */}
          {showSettings && (
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <span className="block text-sm font-medium">{user?.name || "User"}</span>
                  <span className="block text-xs text-muted-foreground">{user?.role || ""}</span>
                </div>
                <ChevronDown className="hidden h-4 w-4 lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              {showSettings && (
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-border/50 bg-background p-4 lg:hidden">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.tab
              return (
                <li key={item.label}>
                  <button
                    onClick={() => { handleNavClick(item.tab); setMobileMenuOpen(false) }}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
            <li>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-secondary/50"
              >
                Log out
              </button>
            </li>
          </ul>
        </nav>
      )}
      {/* Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Modal */}
          <div
            ref={searchModalRef}
            className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, sections..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredItems.length > 0) {
                    handleSearchSelect(filteredItems[0].href)
                  }
                }}
              />
              <button
                onClick={closeSearch}
                className="rounded border border-border/60 bg-secondary/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-secondary"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                (() => {
                  const sections = Array.from(new Set(filteredItems.map((i) => i.section)))
                  return sections.map((section) => (
                    <div key={section}>
                      <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {section}
                      </p>
                      {filteredItems
                        .filter((i) => i.section === section)
                        .map((item) => (
                          <button
                            key={item.href}
                            onClick={() => handleSearchSelect(item.href)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/60"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-secondary/40">
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{item.label}</p>
                              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  ))
                })()
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span><kbd className="font-mono">↵</kbd> to select</span>
              <span><kbd className="font-mono">ESC</kbd> to close</span>
              <span><kbd className="font-mono">Ctrl K</kbd> to toggle</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

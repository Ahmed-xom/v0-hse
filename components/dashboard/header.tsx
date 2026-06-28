"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Calendar, ChevronDown, LogOut, Menu, Search, Settings, Shield, User, X, CheckCheck, GraduationCap } from "lucide-react"
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

const baseNavItems = [
  { label: "Overview", href: "/", active: true },
  { label: "Incidents", href: "#" },
  { label: "Inspections", href: "#" },
  { label: "Training", href: "#" },
  { label: "Reports", href: "#" },
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
  const { user, logout } = useAuth()
  const router = useRouter()

  const navItems = [
    ...baseNavItems,
    ...(user?.journeyAccess ? [{ label: "Journey Tracker", href: "/journey-tracker" }] : []),
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
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {showSettings && (
                <li>
                  <Link
                    href="/settings"
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                  >
                    Settings
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="w-64 pl-9" />
          </div>

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
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {showSettings && (
              <li>
                <Link
                  href="/settings"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </li>
            )}
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
    </header>
  )
}

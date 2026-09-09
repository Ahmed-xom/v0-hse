"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getUserJourneyAccess } from "@/app/actions/manage-users"
import { verifyUserPassword } from "@/app/actions/verify-password"
import { getUserByEmail } from "@/app/actions/get-user-by-email"
import { createUpcomingMeetingReminders } from "@/app/actions/manage-meetings"

export type UserRole = "ADMIN SYSTEM" | "MANAGEMENT" | "SITE MANAGER" | "HSE ADMIN" | "HSE" | "HR" | "MASTER USER" | "USER" | "USER - JM"

export interface AuthUser {
  id: string
  payrollNumber: string
  name: string
  email: string
  role: UserRole
  designation: string
  businessUnit: string
  status: string
  journeyAccess: boolean
}

interface AuthContextType {
  user: AuthUser | null
  currentUser: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (updates: Pick<AuthUser, "name" | "designation" | "businessUnit">) => void
  activeCompanyId: string | null
  setActiveCompanyId: (companyId: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Admin user
const ADMIN_EMAIL = "xom-it-admin@xomoman.com"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedCompanyId = localStorage.getItem("hse_active_company")
    if (storedCompanyId) setActiveCompanyIdState(storedCompanyId)
    const storedUser = localStorage.getItem("hse_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("hse_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Look up user directly from the database (covers both static and dynamically added users)
    const foundUser = await getUserByEmail(email)

    if (!foundUser) {
      return { success: false, error: "User not found. Please check your email address." }
    }

    if (foundUser.banned) {
      return { success: false, error: "Your account has been suspended. Please contact your administrator." }
    }

    if (foundUser.status !== "Active") {
      return { success: false, error: "Your account is inactive. Please contact your administrator." }
    }

    // Verify password against the hashed value stored in neon_auth.account
    const passwordValid = await verifyUserPassword(email, password)
    if (!passwordValid) {
      return { success: false, error: "Invalid password. Please try again." }
    }

    // Fetch journey access flag from DB
    const journeyAccess = await getUserJourneyAccess(email)

    const authUser: AuthUser = {
      id: foundUser.id,
      payrollNumber: foundUser.payrollNo,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role as UserRole,
      designation: foundUser.designation,
      businessUnit: foundUser.businessUnit,
      status: foundUser.status,
      journeyAccess,
    }

    setUser(authUser)
    localStorage.setItem("hse_user", JSON.stringify(authUser))
    void createUpcomingMeetingReminders(authUser.email)

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("hse_user")
  }

  const updateProfile = (updates: Pick<AuthUser, "name" | "designation" | "businessUnit">) => {
    setUser((current) => {
      if (!current) return current
      const updated = { ...current, ...updates }
      localStorage.setItem("hse_user", JSON.stringify(updated))
      return updated
    })
  }

  const setActiveCompanyId = (companyId: string) => {
    setActiveCompanyIdState(companyId)
    localStorage.setItem("hse_active_company", companyId)
  }

  return (
    <AuthContext.Provider value={{ user, currentUser: user, isLoading, login, logout, updateProfile, activeCompanyId, setActiveCompanyId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function isAdminUser(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export function isMasterUser(role: UserRole): boolean {
  return ["ADMIN SYSTEM", "MASTER USER"].includes(role)
}

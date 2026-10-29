"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { authClient } from "@/lib/auth-client"
import { getUserJourneyAccess, getUserJourneyApprover } from "@/app/actions/manage-users"
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
  journeyApprover: boolean
}

interface AuthContextType {
  user: AuthUser | null
  currentUser: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (updates: Pick<AuthUser, "name" | "designation" | "businessUnit">) => void
  activeCompanyId: string | null
  setActiveCompanyId: (companyId: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Admin user
const ADMIN_EMAIL = "xom-it-admin@xomoman.com"

export function AuthProvider({ children, initialUser = null }: { children: ReactNode; initialUser?: AuthUser | null }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null)
  const sessionState = authClient.useSession()

  useEffect(() => { setUser(initialUser) }, [initialUser])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const failure = { success: false, error: "Invalid credentials or unable to establish a secure session. Please try again." }
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const correlationId = typeof window !== "undefined" ? window.sessionStorage.getItem("password-reset-diagnostic-id") || undefined : undefined
      const passwordValid = await verifyUserPassword(normalizedEmail, password, correlationId)
      if (passwordValid !== true) return failure

      const authResult = await authClient.signIn.email({ email: normalizedEmail, password })
      if (authResult.error) return failure
      const sessionResult = await authClient.getSession()
      const sessionUser = sessionResult.data?.user
      if (sessionResult.error || !sessionUser || sessionUser.email.toLowerCase() !== normalizedEmail || sessionResult.data?.session?.userId !== sessionUser.id) return failure

      const foundUser = await getUserByEmail(normalizedEmail)
      if (!foundUser || foundUser.id !== sessionUser.id || foundUser.banned || foundUser.status !== "Active") {
        await authClient.signOut()
        return failure
      }
      const [journeyAccess, journeyApprover] = await Promise.all([getUserJourneyAccess(foundUser.email), getUserJourneyApprover(foundUser.email)])
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
        journeyApprover,
      }
      setUser(authUser)
      void createUpcomingMeetingReminders(authUser.email)
      return { success: true }
    } catch {
      return failure
    }
  }

  const logout = async () => {
    const result = await authClient.signOut()
    if (result.error) throw new Error("Unable to end the secure session. Please try again.")
    setUser(null)
    setActiveCompanyIdState(null)
  }

  const updateProfile = (updates: Pick<AuthUser, "name" | "designation" | "businessUnit">) => {
    setUser(current => current ? { ...current, ...updates } : null)
  }

  const setActiveCompanyId = (companyId: string) => {
    setActiveCompanyIdState(companyId)
  }

  const authenticatedUser = !sessionState.error && (sessionState.isPending || sessionState.data?.user.id === user?.id) ? user : null
  return (
    <AuthContext.Provider value={{ user: authenticatedUser, currentUser: authenticatedUser, isLoading: sessionState.isPending, login, logout, updateProfile, activeCompanyId, setActiveCompanyId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export function isAdminUser(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export function isMasterUser(role: UserRole): boolean {
  return ["ADMIN SYSTEM", "MASTER USER"].includes(role)
}

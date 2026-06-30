"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { requestPasswordReset as requestPasswordResetAction } from "@/app/actions/forgot-password"
import { getUserJourneyAccess } from "@/app/actions/manage-users"
import { verifyUserPassword } from "@/app/actions/verify-password"
import { getUserByEmail } from "@/app/actions/get-user-by-email"

export type UserRole = "ADMIN SYSTEM" | "MANAGEMENT" | "SITE MANAGER" | "HSE ADMIN" | "HSE" | "HR" | "MASTER USER" | "USER" | "USER - JM"

export interface AuthUser {
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
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Admin user
const ADMIN_EMAIL = "xom-it-admin@xomoman.com"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
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

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("hse_user")
  }

  const requestPasswordReset = async (email: string): Promise<any> => {
    // Call server action to handle password reset
    try {
      const result = await requestPasswordResetAction(email)
      
      if (result.success) {
        return { 
          success: true,
          emailSent: result.emailSent || false,
          temporaryPassword: result.temporaryPassword,
          emailError: result.emailError
        }
      } else {
        return { success: false, error: result.error || "Failed to process password reset." }
      }
    } catch (error) {
      console.error('[v0] Password reset error:', error)
      return { success: false, error: "An unexpected error occurred. Please try again." }
    }
  }

  return (
    <AuthContext.Provider value={{ user, currentUser: user, isLoading, login, logout, requestPasswordReset }}>
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

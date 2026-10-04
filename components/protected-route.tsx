"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace("/sign-in")
    }
  }, [user, isLoading])

  useEffect(() => {
    // All authenticated users are allowed through the application.
  }, [])

  if (!user) {
    return null
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

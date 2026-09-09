"use client"

import Link from "next/link"
import { FormEvent, Suspense, useState } from "react"
import { CheckCircle2, LockKeyhole } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) return setMessage("Password must be at least 8 characters.")
    if (password !== confirmPassword) return setMessage("Passwords do not match.")
    setStatus("loading")
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) })
    const result = await response.json()
    setStatus(response.ok ? "success" : "error")
    setMessage(result.message || result.error || "Unable to reset your password.")
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10"><Card className="w-full max-w-md"><CardHeader className="text-center"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">{status === "success" ? <CheckCircle2 /> : <LockKeyhole />}</div><CardTitle>Choose a new password</CardTitle><CardDescription>{status === "success" ? "Your password has been updated." : "Create a new password for your AMNKO HSE account."}</CardDescription></CardHeader><CardContent>{status === "success" ? <Link href="/sign-in"><Button className="w-full">Continue to sign in</Button></Link> : <form onSubmit={handleSubmit} className="space-y-5"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></div>{message && <p className={status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message}</p>}<Button className="w-full" type="submit" disabled={status === "loading" || !token}>{status === "loading" ? "Updating..." : "Update password"}</Button></form>}</CardContent></Card></main>
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading reset form...</p></main>}><ResetPasswordForm /></Suspense>
}

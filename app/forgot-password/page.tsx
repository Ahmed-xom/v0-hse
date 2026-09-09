"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("loading")
    setMessage("")

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const result = await response.json()
    setStatus(response.ok ? "success" : "error")
    setMessage(result.message || result.error || "Unable to send the reset email.")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {status === "success" ? <CheckCircle2 /> : <Mail />}
          </div>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a secure password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link href="/sign-in"><Button className="w-full">Return to sign in</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" />
              </div>
              {message && <p className="text-sm text-destructive">{message}</p>}
              <Button className="w-full" type="submit" disabled={status === "loading"}>{status === "loading" ? "Sending..." : "Send reset link"}</Button>
              <Link href="/sign-in" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to sign in</Link>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

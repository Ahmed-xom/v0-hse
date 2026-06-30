"use client"
// v2 — removed all fallbackOtp/devOtp code; OTP sent only via email
import { useState, useRef } from "react"
import Link from "next/link"
import {
  Shield, Loader2, Mail, ArrowLeft, CheckCircle2,
  Lock, Eye, EyeOff, KeyRound, RefreshCw,
} from "lucide-react"
import { sendPasswordResetOtp, verifyOtpAndResetPassword } from "@/app/actions/password-reset-otp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Step = "email" | "otp" | "password" | "success"

const OTP_LENGTH = 6

export default function ForgotPasswordPage() {
  const [step, setStep]                       = useState<Step>("email")
  const [email, setEmail]                     = useState("")
  const [otp, setOtp]                         = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [newPassword, setNewPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew]                 = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [confirmTouched, setConfirmTouched]   = useState(false)
  const [isLoading, setIsLoading]             = useState(false)
  const [resendCooldown, setResendCooldown]   = useState(0)
  const [error, setError]                     = useState("")
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const hasMinLength   = newPassword.length >= 8
  const hasUpper       = /[A-Z]/.test(newPassword)
  const hasNumber      = /[0-9]/.test(newPassword)
  const passwordStrong = hasMinLength && hasUpper && hasNumber
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== ""
  const otpValue       = otp.join("")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const res = await sendPasswordResetOtp(email)
    setIsLoading(false)
    if (res.success) {
      setStep("otp")
      startCooldown()
    } else {
      setError(res.error ?? "Failed to send OTP.")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (otpValue.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit OTP.")
      return
    }
    setConfirmTouched(false)
    setNewPassword("")
    setConfirmPassword("")
    setStep("password")
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!passwordStrong) {
      setError("Password must be at least 8 characters and include an uppercase letter and a number.")
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }
    setIsLoading(true)
    const res = await verifyOtpAndResetPassword(email, otpValue, newPassword)
    setIsLoading(false)
    if (res.success) {
      setStep("success")
    } else {
      setError(res.error ?? "Failed to reset password.")
      if (res.error?.toLowerCase().includes("otp") || res.error?.toLowerCase().includes("expired")) {
        setStep("otp")
      }
    }
  }

  const handleResend = async () => {
    setError("")
    setIsLoading(true)
    const res = await sendPasswordResetOtp(email)
    setIsLoading(false)
    if (res.success) {
      setOtp(Array(OTP_LENGTH).fill(""))
      otpRefs.current[0]?.focus()
      startCooldown()
    } else {
      setError(res.error ?? "Failed to resend OTP.")
    }
  }

  const startCooldown = () => {
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(timer); return 0 }
        return v - 1
      })
    }, 1000)
  }

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1)
    const next = [...otp]
    next[index] = cleaned
    setOtp(next)
    if (cleaned && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill("")
    pasted.split("").forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1)
    otpRefs.current[nextFocus]?.focus()
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">HSE Dashboard</h1>
            <p className="text-sm text-muted-foreground">Health, Safety &amp; Environment</p>
          </div>
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )

  const StepDots = ({ current }: { current: number }) => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i <= current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  )

  const ErrorBox = () =>
    error ? (
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
        {error}
      </div>
    ) : null

  if (step === "email") {
    return (
      <Shell>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <StepDots current={0} />
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a one-time code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <ErrorBox />
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !email}>
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
                  : "Send OTP"
                }
              </Button>
              <Link href="/sign-in">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />Back to Sign In
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  if (step === "otp") {
    return (
      <Shell>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
            </div>
            <StepDots current={1} />
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              It expires in 10 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <ErrorBox />
              <div className="space-y-2">
                <Label className="text-center block">One-Time Password</Label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`
                        h-12 w-12 rounded-lg border text-center text-xl font-semibold
                        bg-background transition-all duration-150 outline-none
                        focus:border-primary focus:ring-2 focus:ring-primary/30
                        ${digit ? "border-primary/60 text-foreground" : "border-border text-muted-foreground"}
                      `}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={otpValue.length < OTP_LENGTH}>
                Verify OTP
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {"Didn't receive the code? "}
                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />Resend OTP
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(Array(OTP_LENGTH).fill("")); setError("") }}
                className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />Change email
              </button>
            </form>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  if (step === "password") {
    return (
      <Shell>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <StepDots current={2} />
            <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
            <CardDescription>Choose a strong password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <ErrorBox />
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="space-y-1 pt-1">
                  {[
                    { ok: hasMinLength, label: "At least 8 characters" },
                    { ok: hasUpper,     label: "One uppercase letter" },
                    { ok: hasNumber,    label: "One number" },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <div className={`h-1.5 w-1.5 rounded-full transition-colors ${ok ? "bg-primary" : "bg-muted-foreground/40"}`} />
                      <span className={`transition-colors ${ok ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    className={`pl-10 pr-10 ${
                      confirmTouched && confirmPassword.length > 0
                        ? passwordsMatch ? "border-primary/50" : "border-destructive/50"
                        : ""
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmTouched && confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !passwordStrong}>
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                  : "Save New Password"
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Password updated</CardTitle>
          <CardDescription className="text-base">
            Your password has been saved successfully. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/sign-in" className="block">
            <Button className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </Shell>
  )
}

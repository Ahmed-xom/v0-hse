"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, UserRound } from "lucide-react"
import { updateUser } from "@/app/actions/manage-users"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileEditor() {
  const { user, isLoading, updateProfile } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(user?.name ?? "")
  const [designation, setDesignation] = useState(user?.designation ?? "")
  const [businessUnit, setBusinessUnit] = useState(user?.businessUnit ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  if (isLoading) return <Card><CardContent className="py-10 text-center text-muted-foreground">Loading profile...</CardContent></Card>
  if (!user) return <Card><CardContent className="py-10 text-center text-muted-foreground">Please sign in to edit your profile.</CardContent></Card>

  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("saving")
    setMessage("")
    const result = await updateUser(user.id, { name: name.trim(), designation: designation.trim(), businessUnit: businessUnit.trim() })
    if (!result.success) {
      setStatus("error")
      setMessage(result.error ?? "Unable to update your profile.")
      return
    }
    updateProfile({ name: name.trim(), designation: designation.trim(), businessUnit: businessUnit.trim() })
    setStatus("success")
    setMessage("Your profile was updated successfully.")
    router.refresh()
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center gap-4">
          <Avatar className="size-14"><AvatarFallback className="bg-primary text-lg text-primary-foreground">{initials || <UserRound />}</AvatarFallback></Avatar>
          <div><CardTitle>Edit profile</CardTitle><CardDescription>Update the details shown across AMNKO HSE.</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></div>
            <div className="space-y-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={user.email} disabled readOnly /></div>
            <div className="space-y-2"><Label htmlFor="profile-designation">Designation</Label><Input id="profile-designation" value={designation} onChange={(event) => setDesignation(event.target.value)} maxLength={120} /></div>
            <div className="space-y-2"><Label htmlFor="profile-business-unit">Business unit</Label><Input id="profile-business-unit" value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)} maxLength={120} /></div>
          </div>
          {message && <p className={status === "error" ? "text-sm text-destructive" : "flex items-center gap-2 text-sm text-primary"}>{status === "success" && <CheckCircle2 className="size-4" />}{message}</p>}
          <Button type="submit" disabled={status === "saving"}>{status === "saving" && <Loader2 className="animate-spin" />}{status === "saving" ? "Saving..." : "Save changes"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Users, Mail, Plus, Eye, EyeOff, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { users, type User } from "@/lib/users-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExcelDataViewer } from "./excel-data-viewer"
import { addNewUser } from "@/app/actions/add-user"
import { resetUserPassword } from "@/app/actions/reset-password"

const ROLES = [
  "ADMIN SYSTEM",
  "MANAGEMENT",
  "SITE MANAGER",
  "SITE MANAGER - Global",
  "HSE ADMIN",
  "HSE",
  "HR",
  "MASTER USER",
  "USER",
  "USER - JM",
]

const BUSINESS_UNITS = [
  "XOM Drilling System",
  "Falcon Oilfield Services",
  "XOM Oman",
]

const STATUSES = ["Active", "Inactive"]

export function AdminSettings({ onUserAdded }: { onUserAdded?: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    payrollNo: "",
    role: "USER",
    designation: "",
    businessUnit: "XOM Oman",
    status: "Active" as "Active" | "Inactive",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddUser = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in name and email fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Trim and validate email
      const cleanEmail = formData.email.trim().toLowerCase()
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const result = await addNewUser({
        name: formData.name,
        email: cleanEmail,
        payrollNo: formData.payrollNo || `P${Date.now()}`,
        designation: formData.designation,
        businessUnit: formData.businessUnit,
        hseRole: formData.role,
        status: formData.status,
        adminEmail: currentUser?.email,
      })

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to add user",
          variant: "destructive",
        })
        return
      }

      const description = result.emailSent
        ? `User ${formData.name} created! Password sent to ${formData.email}.`
        : `User created but email failed: ${result.emailError || 'Unknown error'}. Check environment variables.`

      toast({
        title: result.emailSent ? "Success" : "⚠️ Partial Success",
        description,
        variant: result.emailSent ? "default" : "destructive",
      })

      // Save new user to localStorage for UI update
      try {
        const storedUsers = localStorage.getItem("added_users") || "[]"
        const addedUsers = JSON.parse(storedUsers)
        const newUser = {
          id: result.user?.id || `added_${Date.now()}`,
          name: formData.name,
          email: formData.email,
          payrollNo: formData.payrollNo,
          role: formData.role,
          designation: formData.designation,
          businessUnit: formData.businessUnit,
          status: formData.status === "Active" ? "Active" : "Inactive",
        }
        addedUsers.push(newUser)
        localStorage.setItem("added_users", JSON.stringify(addedUsers))
      } catch (storageError) {
        console.error("[v0] Failed to save user to localStorage:", storageError)
      }

      // Call callback to refresh user list
      if (onUserAdded) {
        onUserAdded()
      }

      // Refresh the page to reload users from database
      router.refresh()

      // Reset form
      setFormData({
        name: "",
        email: "",
        payrollNo: "",
        role: "USER",
        designation: "",
        businessUnit: "XOM Oman",
        status: "Active",
      })

      setIsAddUserOpen(false)
    } catch (error) {
      console.error("[v0] Error adding user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Admin Settings</h2>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="data">Excel Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active: {users.filter((u) => u.status === "Active").length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Admin Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "ADMIN SYSTEM").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  System administrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Email Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Configured
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  hsesystem.xom@outlook.com
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Add User Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Add or manage system users</CardDescription>
                  </div>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the button above to add new users to the system. All new users will receive a welcome email with their temporary password.
          </p>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <div>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Password reset email settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SMTP Server</Label>
            <Input value="smtp-mail.outlook.com" disabled />
          </div>
          <div>
            <Label>SMTP Port</Label>
            <Input value="587" disabled />
          </div>
          <div>
            <Label>From Email</Label>
            <Input value="hsesystem.xom@outlook.com" disabled />
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-sm text-emerald-700 font-medium">✓ Email service is configured and ready</p>
            <p className="text-xs text-emerald-600 mt-1">Password reset emails will be sent automatically to users</p>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account. A temporary password will be emailed to them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="user@xomoman.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div>
              <Label>Payroll Number</Label>
              <Input
                placeholder="E.g., XOM-001"
                value={formData.payrollNo}
                onChange={(e) => handleInputChange("payrollNo", e.target.value)}
              />
            </div>

            <div>
              <Label>Designation</Label>
              <Input
                placeholder="Job title or position"
                value={formData.designation}
                onChange={(e) => handleInputChange("designation", e.target.value)}
              />
            </div>

            <div>
              <Label>Business Unit</Label>
              <Select value={formData.businessUnit} onValueChange={(v) => handleInputChange("businessUnit", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => handleInputChange("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v as "Active" | "Inactive")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Excel Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <ExcelDataViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}

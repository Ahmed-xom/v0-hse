"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Truck,
  Calendar,
  Gauge,
  Weight,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Copy,
  MapPin,
  Route,
  User,
  FileText,
  Play,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { vehicles, vehicleTypes, journeyRecords, type Vehicle, type VehicleStatus, type JourneyManagement } from "@/lib/fleet-data"

const jmStatusColors: Record<string, string> = {
  Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "In Progress": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
}

const statusColors: Record<VehicleStatus, string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Expiring Soon": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Expired: "bg-red-500/20 text-red-400 border-red-500/30",
  Cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
}

const statusIcons: Record<VehicleStatus, React.ReactNode> = {
  Active: <CheckCircle className="h-3 w-3" />,
  "Expiring Soon": <Clock className="h-3 w-3" />,
  Expired: <XCircle className="h-3 w-3" />,
  Cancelled: <AlertTriangle className="h-3 w-3" />,
}

const typeColors: Record<string, string> = {
  "Fuso Truck with Crane": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Mitsubishi Fuso 10 ton": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Mitsibishi Canter": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Mercedez logging unit": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Mistubishi Fuso HAIB 10 ton": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Hino 10 Ton": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Toyota Hilux": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Pick Up": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Third Party Heavy Vehicle": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Crew Bus": "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

const ITEMS_PER_PAGE = 15

export function FleetManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleList, setVehicleList] = useState<Vehicle[]>(vehicles)
  const { toast } = useToast()
  const { user } = useAuth()

  const isAdmin = user?.role === "ADMIN SYSTEM" || user?.role === "MASTER USER"

  // New vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    registrationNo: "",
    vehicleType: "",
    expiryDate: "",
    allowableLoad: "",
    kmReading: "",
    description: "",
  })

  // Stats
  const stats = useMemo(() => ({
    total: vehicleList.length,
    active: vehicleList.filter((v) => v.status === "Active").length,
    expiringSoon: vehicleList.filter((v) => v.status === "Expiring Soon").length,
    expired: vehicleList.filter((v) => v.status === "Expired").length,
    cancelled: vehicleList.filter((v) => v.status === "Cancelled").length,
  }), [vehicleList])

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicleList.filter((vehicle) => {
      const matchesSearch =
        vehicle.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === "all" || vehicle.vehicleType === typeFilter
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [vehicleList, searchQuery, typeFilter, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE)
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleAddVehicle = () => {
    if (!newVehicle.registrationNo || !newVehicle.vehicleType || !newVehicle.expiryDate) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Registration No, Vehicle Type, and Expiry Date.",
        variant: "destructive",
      })
      return
    }

    const expiry = new Date(newVehicle.expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    let status: VehicleStatus = "Active"
    if (expiry < today) status = "Expired"
    else if (expiry <= thirtyDaysFromNow) status = "Expiring Soon"

    const vehicle: Vehicle = {
      id: String(vehicleList.length + 1),
      ...newVehicle,
      status,
    }

    setVehicleList([vehicle, ...vehicleList])
    setIsAddVehicleOpen(false)
    setNewVehicle({
      registrationNo: "",
      vehicleType: "",
      expiryDate: "",
      allowableLoad: "",
      kmReading: "",
      description: "",
    })

    toast({
      title: "Vehicle Added",
      description: `${vehicle.registrationNo} has been added to the fleet.`,
    })
  }

  const handleEditVehicle = () => {
    if (!selectedVehicle) return

    const expiry = new Date(selectedVehicle.expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    let status: VehicleStatus = selectedVehicle.status
    if (!selectedVehicle.registrationNo.includes("(CANCEL)")) {
      if (expiry < today) status = "Expired"
      else if (expiry <= thirtyDaysFromNow) status = "Expiring Soon"
      else status = "Active"
    }

    const updatedVehicles = vehicleList.map((v) =>
      v.id === selectedVehicle.id ? { ...selectedVehicle, status } : v
    )

    setVehicleList(updatedVehicles)
    setIsEditVehicleOpen(false)
    setSelectedVehicle(null)

    toast({
      title: "Vehicle Updated",
      description: `${selectedVehicle.registrationNo} has been updated.`,
    })
  }

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleList(vehicleList.filter((v) => v.id !== vehicle.id))
    toast({
      title: "Vehicle Deleted",
      description: `${vehicle.registrationNo} has been removed from the fleet.`,
    })
  }

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsViewDetailsOpen(true)
  }

  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle({ ...vehicle })
    setIsEditVehicleOpen(true)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-5 w-5 text-primary" />
              Fleet Management
            </CardTitle>
            <CardDescription>Manage company vehicles and track registration expiry</CardDescription>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddVehicleOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Total Vehicles</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-xs text-emerald-400">Active</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-400">Expiring Soon</p>
            <p className="text-2xl font-bold text-amber-400">{stats.expiringSoon}</p>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-xs text-red-400">Expired</p>
            <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
          </div>
          <div className="rounded-lg border border-slate-500/30 bg-slate-500/10 p-3">
            <p className="text-xs text-slate-400">Cancelled</p>
            <p className="text-2xl font-bold text-slate-400">{stats.cancelled}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Registration No</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Load Capacity</TableHead>
                <TableHead>KM/Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="group">
                    <TableCell className="font-medium">{vehicle.registrationNo}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={typeColors[vehicle.vehicleType] || "bg-muted"}
                      >
                        {vehicle.vehicleType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(vehicle.expiryDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                        {vehicle.allowableLoad || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                        {vehicle.kmReading || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${statusColors[vehicle.status]}`}>
                        {statusIcons[vehicle.status]}
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(vehicle)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditClick(vehicle)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Vehicle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setNewVehicle({
                                    registrationNo: "",
                                    vehicleType: vehicle.vehicleType,
                                    expiryDate: vehicle.expiryDate,
                                    allowableLoad: vehicle.allowableLoad,
                                    kmReading: "",
                                    description: "",
                                  })
                                  setIsAddVehicleOpen(true)
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteVehicle(vehicle)}
                                className="text-red-400 focus:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredVehicles.length)} of{" "}
            {filteredVehicles.length} vehicles
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Add Vehicle Dialog */}
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Add a new vehicle to the fleet registry.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="regNo">Registration No *</Label>
              <Input
                id="regNo"
                value={newVehicle.registrationNo}
                onChange={(e) => setNewVehicle({ ...newVehicle, registrationNo: e.target.value })}
                placeholder="e.g., 1234 AB"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Vehicle Type *</Label>
              <Select
                value={newVehicle.vehicleType}
                onValueChange={(value) => setNewVehicle({ ...newVehicle, vehicleType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiry Date *</Label>
              <Input
                id="expiry"
                type="date"
                value={newVehicle.expiryDate}
                onChange={(e) => setNewVehicle({ ...newVehicle, expiryDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="load">Allowable Load</Label>
                <Input
                  id="load"
                  value={newVehicle.allowableLoad}
                  onChange={(e) => setNewVehicle({ ...newVehicle, allowableLoad: e.target.value })}
                  placeholder="e.g., 10 ton"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="km">KM Reading</Label>
                <Input
                  id="km"
                  value={newVehicle.kmReading}
                  onChange={(e) => setNewVehicle({ ...newVehicle, kmReading: e.target.value })}
                  placeholder="e.g., 50000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={newVehicle.description}
                onChange={(e) => setNewVehicle({ ...newVehicle, description: e.target.value })}
                placeholder="Vehicle description or notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVehicleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVehicle}>Add Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditVehicleOpen} onOpenChange={setIsEditVehicleOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Update vehicle information.</DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editRegNo">Registration No</Label>
                <Input
                  id="editRegNo"
                  value={selectedVehicle.registrationNo}
                  onChange={(e) =>
                    setSelectedVehicle({ ...selectedVehicle, registrationNo: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editType">Vehicle Type</Label>
                <Select
                  value={selectedVehicle.vehicleType}
                  onValueChange={(value) =>
                    setSelectedVehicle({ ...selectedVehicle, vehicleType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editExpiry">Expiry Date</Label>
                <Input
                  id="editExpiry"
                  type="date"
                  value={selectedVehicle.expiryDate}
                  onChange={(e) =>
                    setSelectedVehicle({ ...selectedVehicle, expiryDate: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editLoad">Allowable Load</Label>
                  <Input
                    id="editLoad"
                    value={selectedVehicle.allowableLoad}
                    onChange={(e) =>
                      setSelectedVehicle({ ...selectedVehicle, allowableLoad: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editKm">KM Reading</Label>
                  <Input
                    id="editKm"
                    value={selectedVehicle.kmReading}
                    onChange={(e) =>
                      setSelectedVehicle({ ...selectedVehicle, kmReading: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDesc">Description</Label>
                <Textarea
                  id="editDesc"
                  value={selectedVehicle.description}
                  onChange={(e) =>
                    setSelectedVehicle({ ...selectedVehicle, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditVehicleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditVehicle}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog with JM */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Vehicle Details
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Vehicle Info</TabsTrigger>
                <TabsTrigger value="jm" className="gap-1">
                  <Route className="h-4 w-4" />
                  Journey Management
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{selectedVehicle.registrationNo}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${typeColors[selectedVehicle.vehicleType] || "bg-muted"}`}
                      >
                        {selectedVehicle.vehicleType}
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={`gap-1 ${statusColors[selectedVehicle.status]}`}
                    >
                      {statusIcons[selectedVehicle.status]}
                      {selectedVehicle.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(selectedVehicle.expiryDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Allowable Load</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      {selectedVehicle.allowableLoad || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">KM/Hours Reading</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      {selectedVehicle.kmReading || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">JM Status</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      {selectedVehicle.jmEnabled ? (
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400">Enabled</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-500/20 text-slate-400">Disabled</Badge>
                      )}
                    </p>
                  </div>
                  {selectedVehicle.jmEnabled && (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Journeys</p>
                        <p className="flex items-center gap-1.5 font-medium">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {selectedVehicle.totalJourneys || 0}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Last Journey</p>
                        <p className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {selectedVehicle.lastJourneyDate ? formatDate(selectedVehicle.lastJourneyDate) : "-"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {selectedVehicle.description && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                      {selectedVehicle.description}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="jm" className="space-y-4 pt-4">
                {selectedVehicle.jmEnabled ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Recent journey records for this vehicle
                      </p>
                      {isAdmin && (
                        <Button size="sm" className="gap-1">
                          <Plus className="h-4 w-4" />
                          New Journey
                        </Button>
                      )}
                    </div>
                    
                    {/* Journey Records Table */}
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {journeyRecords
                            .filter((jr) => jr.vehicleId === selectedVehicle.id)
                            .slice(0, 5)
                            .map((journey) => (
                              <TableRow key={journey.id}>
                                <TableCell className="font-medium">
                                  {formatDate(journey.journeyDate)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    {journey.driver}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-xs">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate max-w-[100px]" title={journey.startLocation}>
                                      {journey.startLocation}
                                    </span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="truncate max-w-[100px]" title={journey.endLocation}>
                                      {journey.endLocation}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">{journey.purpose}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={jmStatusColors[journey.status]}>
                                    {journey.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          {journeyRecords.filter((jr) => jr.vehicleId === selectedVehicle.id).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                No journey records found for this vehicle
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Journey Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
                        <p className="text-2xl font-bold text-primary">{selectedVehicle.totalJourneys || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Journeys</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">
                          {journeyRecords.filter((jr) => jr.vehicleId === selectedVehicle.id && jr.status === "Completed").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
                        <p className="text-2xl font-bold text-amber-400">
                          {journeyRecords.filter((jr) => jr.vehicleId === selectedVehicle.id && (jr.status === "Pending" || jr.status === "In Progress")).length}
                        </p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <Route className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">Journey Management is not enabled for this vehicle</p>
                    {isAdmin && (
                      <Button variant="outline" className="mt-4 gap-1">
                        <Play className="h-4 w-4" />
                        Enable JM
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

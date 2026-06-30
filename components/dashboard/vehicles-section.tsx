"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, RefreshCw, Truck, CheckCircle, XCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleStatus,
  type Vehicle,
} from "@/app/actions/manage-vehicles"

const EMPTY_FORM = {
  plate_no: "",
  vehicle_type: "",
  expiry_date: "",
  allowable_load: "",
  km_reading: "",
  description: "",
}

export function VehiclesSection() {
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await getVehicles()
    if (res.success && res.data) setVehicles(res.data)
    else toast({ title: "Error loading vehicles", description: res.error, variant: "destructive" })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const q = search.toLowerCase()
  const filtered = vehicles.filter((v) =>
    (v.plate_no ?? "").toLowerCase().includes(q) ||
    (v.vehicle_type ?? "").toLowerCase().includes(q) ||
    (v.description ?? "").toLowerCase().includes(q)
  )

  const openAdd = () => {
    setEditingVehicle(null)
    setForm(EMPTY_FORM)
    setIsFormOpen(true)
  }

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v)
    setForm({
      plate_no: v.plate_no,
      vehicle_type: v.vehicle_type,
      expiry_date: v.expiry_date ? v.expiry_date.split("T")[0] : "",
      allowable_load: v.allowable_load,
      km_reading: v.km_reading,
      description: v.description,
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = editingVehicle
      ? await updateVehicle(editingVehicle.id, form)
      : await createVehicle(form)
    setSaving(false)
    if (res.success) {
      toast({ title: editingVehicle ? "Vehicle updated" : "Vehicle added", description: `${form.plate_no} saved successfully.` })
      setIsFormOpen(false)
      load()
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await deleteVehicle(deleteId)
    setDeleteId(null)
    if (res.success) {
      toast({ title: "Vehicle deleted" })
      load()
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" })
    }
  }

  const handleToggle = async (id: number) => {
    const res = await toggleVehicleStatus(id)
    if (res.success) load()
    else toast({ title: "Error", description: res.error, variant: "destructive" })
  }

  const activeCount = vehicles.filter((v) => v.is_active).length

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Vehicles", value: vehicles.length, icon: <Truck className="h-4 w-4" /> },
          { label: "Active", value: activeCount, icon: <CheckCircle className="h-4 w-4" /> },
          { label: "Inactive", value: vehicles.length - activeCount, icon: <XCircle className="h-4 w-4" /> },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plate, type, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <p className="ml-auto text-sm text-muted-foreground">{filtered.length} vehicles</p>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b border-border/50 bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <div className="col-span-2">Plate No</div>
          <div className="col-span-3">Type / Description</div>
          <div className="col-span-2">Load</div>
          <div className="col-span-2">KM Reading</div>
          <div className="col-span-1">Expiry</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading vehicles...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Truck className="h-8 w-8 opacity-40" />
            <p className="text-sm">{search ? "No vehicles match your search." : "No vehicles yet. Add one to get started."}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((v) => (
              <div key={v.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30 transition-colors">
                <div className="col-span-2 font-mono font-medium text-foreground">{v.plate_no}</div>
                <div className="col-span-3">
                  <p className="font-medium text-foreground truncate">{v.vehicle_type}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.description}</p>
                </div>
                <div className="col-span-2 text-muted-foreground">{v.allowable_load || "—"}</div>
                <div className="col-span-2 text-muted-foreground">{v.km_reading ? Number(v.km_reading).toLocaleString() : "—"}</div>
                <div className="col-span-1 text-xs text-muted-foreground">
                  {v.expiry_date ? new Date(v.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                </div>
                <div className="col-span-1">
                  <button onClick={() => handleToggle(v.id)}>
                    <Badge variant={v.is_active ? "default" : "secondary"} className="cursor-pointer text-xs">
                      {v.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
            <DialogDescription>
              {editingVehicle ? `Editing ${editingVehicle.plate_no}` : "Add a new vehicle to the fleet."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plate_no">Plate Number *</Label>
                <Input id="plate_no" placeholder="e.g. 9250YW" value={form.plate_no} onChange={(e) => setForm((f) => ({ ...f, plate_no: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                <Input id="vehicle_type" placeholder="e.g. Fuso Truck" value={form.vehicle_type} onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="e.g. Fuso Truck with Crane FOF" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="allowable_load">Allowable Load</Label>
                <Input id="allowable_load" placeholder="e.g. 10 ton" value={form.allowable_load} onChange={(e) => setForm((f) => ({ ...f, allowable_load: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="km_reading">KM Reading</Label>
                <Input id="km_reading" type="number" placeholder="e.g. 248905" value={form.km_reading} onChange={(e) => setForm((f) => ({ ...f, km_reading: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input id="expiry_date" type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.plate_no || !form.vehicle_type}>
              {saving ? "Saving..." : editingVehicle ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the vehicle from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

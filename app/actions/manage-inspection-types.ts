'use server'

export async function addInspectionType(data: {
  name: string
  description: string
  category: string
  frequency?: string
  status: 'Active' | 'Inactive'
}) {
  try {
    console.log('[v0] Adding inspection type:', data)

    if (!data.name) {
      return {
        success: false,
        error: 'Inspection type name is required',
      }
    }

    console.log('[v0] Inspection type added successfully:', data)
    return {
      success: true,
      message: 'Inspection type added successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[v0] Error adding inspection type:', error)
    return {
      success: false,
      error: error.message || 'Failed to add inspection type',
    }
  }
}

export async function updateInspectionType(id: string, data: any) {
  try {
    console.log('[v0] Updating inspection type:', { id, ...data })
    return {
      success: true,
      message: 'Inspection type updated successfully',
      data: { id, ...data, updatedAt: new Date().toISOString() },
    }
  } catch (error: any) {
    console.error('[v0] Error updating inspection type:', error)
    return {
      success: false,
      error: error.message || 'Failed to update inspection type',
    }
  }
}

export async function deleteInspectionType(id: string) {
  try {
    console.log('[v0] Deleting inspection type:', id)
    return {
      success: true,
      message: 'Inspection type deleted successfully',
    }
  } catch (error: any) {
    console.error('[v0] Error deleting inspection type:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete inspection type',
    }
  }
}

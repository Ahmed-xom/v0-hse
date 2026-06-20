'use server'

export async function addMasterCategory(data: {
  name: string
  description: string
  icon: string
  color?: string
}) {
  try {
    console.log('[v0] Adding master category:', data)

    if (!data.name) {
      return {
        success: false,
        error: 'Category name is required',
      }
    }

    console.log('[v0] Master category added successfully:', data)
    return {
      success: true,
      message: 'Master category added successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[v0] Error adding master category:', error)
    return {
      success: false,
      error: error.message || 'Failed to add master category',
    }
  }
}

export async function addMasterSection(data: {
  categoryId: string
  name: string
  description: string
  itemCount?: number
}) {
  try {
    console.log('[v0] Adding master section:', data)

    if (!data.name) {
      return {
        success: false,
        error: 'Section name is required',
      }
    }

    console.log('[v0] Master section added successfully:', data)
    return {
      success: true,
      message: 'Master section added successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[v0] Error adding master section:', error)
    return {
      success: false,
      error: error.message || 'Failed to add master section',
    }
  }
}

export async function addMasterItem(data: {
  sectionId: string
  name: string
  description: string
  value?: string
}) {
  try {
    console.log('[v0] Adding master item:', data)

    if (!data.name) {
      return {
        success: false,
        error: 'Item name is required',
      }
    }

    console.log('[v0] Master item added successfully:', data)
    return {
      success: true,
      message: 'Master item added successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[v0] Error adding master item:', error)
    return {
      success: false,
      error: error.message || 'Failed to add master item',
    }
  }
}

export async function updateMasterItem(id: string, data: any) {
  try {
    console.log('[v0] Updating master item:', { id, ...data })
    return {
      success: true,
      message: 'Master item updated successfully',
      data: { id, ...data, updatedAt: new Date().toISOString() },
    }
  } catch (error: any) {
    console.error('[v0] Error updating master item:', error)
    return {
      success: false,
      error: error.message || 'Failed to update master item',
    }
  }
}

export async function deleteMasterItem(id: string) {
  try {
    console.log('[v0] Deleting master item:', id)
    return {
      success: true,
      message: 'Master item deleted successfully',
    }
  } catch (error: any) {
    console.error('[v0] Error deleting master item:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete master item',
    }
  }
}

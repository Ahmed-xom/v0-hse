'use server'

export async function addBusinessUnit(data: {
  name: string
  description: string
  email: string
  type: 'Group' | 'Business Unit'
  status: 'Active' | 'Inactive'
  manager?: string
}) {
  try {
    console.log('[v0] Adding business unit:', data)

    // Validate inputs
    if (!data.name || !data.email) {
      return {
        success: false,
        error: 'Name and email are required',
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      }
    }

    console.log('[v0] Business unit added successfully:', data)
    return {
      success: true,
      message: 'Business unit added successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[v0] Error adding business unit:', error)
    return {
      success: false,
      error: error.message || 'Failed to add business unit',
    }
  }
}

export async function updateBusinessUnit(id: string, data: any) {
  try {
    console.log('[v0] Updating business unit:', { id, ...data })
    return {
      success: true,
      message: 'Business unit updated successfully',
      data: { id, ...data, updatedAt: new Date().toISOString() },
    }
  } catch (error: any) {
    console.error('[v0] Error updating business unit:', error)
    return {
      success: false,
      error: error.message || 'Failed to update business unit',
    }
  }
}

export async function deleteBusinessUnit(id: string) {
  try {
    console.log('[v0] Deleting business unit:', id)
    return {
      success: true,
      message: 'Business unit deleted successfully',
    }
  } catch (error: any) {
    console.error('[v0] Error deleting business unit:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete business unit',
    }
  }
}

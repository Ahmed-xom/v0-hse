import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const maxSize = 10 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: 'Only PDF, JPG, PNG, and WEBP files are allowed.' }, { status: 400 })
  if (file.size > maxSize) return NextResponse.json({ error: 'Files must be 10 MB or smaller.' }, { status: 400 })
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const blob = await put(`master-attachments/${session.user.id}/${crypto.randomUUID()}-${safeName}`, file, { access: 'private', addRandomSuffix: false })
  return NextResponse.json({ pathname: blob.pathname, filename: file.name })
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ success: true })
}

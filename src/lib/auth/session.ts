import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}

export async function requireRole(role: 'agent' | 'manager') {
  const session = await requireAuth()
  if (session.user.role !== role && session.user.role !== 'manager') {
    redirect('/dashboard')
  }
  return session
}

export async function getOptionalSession() {
  return getServerSession()
}

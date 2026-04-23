import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function redirectSignedInUser(path = '/dashboard') {
  const { userId } = await auth()

  if (userId) {
    redirect(path)
  }
}

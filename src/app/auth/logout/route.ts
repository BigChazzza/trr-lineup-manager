import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Sign out user
  await supabase.auth.signOut()

  // Redirect to home
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  })
}

export async function GET(request: Request) {
  const supabase = await createClient()

  // Sign out user
  await supabase.auth.signOut()

  // Redirect to home
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  })
}

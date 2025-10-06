// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Lightweight wrapper to create a browser supabase client. This mirrors
// the pattern used by the official auth helpers but keeps the dependency
// surface minimal. Use this on client components.
export const supabaseBrowser = (): SupabaseClient => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side client that reads cookies from Next's cookie store. This
// is a minimal server client useful in server components / route handlers.
export const supabaseServer = (): SupabaseClient => {
  const cookieStore = cookies()
  // Note: @supabase/supabase-js doesn't accept cookies the same way as
  // the auth-helpers; if you need full server-side auth integration
  // (respecting Next cookies/sessions), consider installing
  // `@supabase/auth-helpers-nextjs` and using
  // `createServerSupabaseClient({ cookies })` instead.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

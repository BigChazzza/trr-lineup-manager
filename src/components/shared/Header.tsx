import Link from 'next/link'
import Image from 'next/image'
import { getUser } from '@/lib/auth/getSession'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'
import { DiscordLoginButton } from '@/components/auth/DiscordLoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'

export async function Header() {
  const user = await getUser()
  const userIsAdmin = user ? await isAdmin() : false

  let userData = null
  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('username, avatar_url, discord_roles')
      .eq('discord_id', user.user_metadata?.provider_id)
      .single()

    userData = data
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/trr-logo.webp"
                alt="TRR Logo"
                width={48}
                height={48}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                The Rogue Regiment
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/games" className="text-sm font-medium hover:text-gray-700">
                Games
              </Link>
              <Link href="/playbooks" className="text-sm font-medium hover:text-gray-700">
                Playbooks
              </Link>
              {userIsAdmin && (
                <>
                  <Link href="/admin/dashboard" className="text-sm font-medium hover:text-gray-700">
                    Admin
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div>
            {user && userData ? (
              <UserMenu user={userData} isAdmin={userIsAdmin} />
            ) : (
              <DiscordLoginButton />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

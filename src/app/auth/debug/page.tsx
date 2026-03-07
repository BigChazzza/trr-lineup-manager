import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/getSession'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AuthDebugPage() {
  const user = await getUser()
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Environment Variables</h3>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
                <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Session Status</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p>Session: {session ? '✅ Active' : '❌ No session'}</p>
                <p>User: {user ? '✅ Authenticated' : '❌ Not authenticated'}</p>
              </div>
            </div>

            {user && (
              <div>
                <h3 className="font-semibold mb-2">User Info</h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  <p>ID: {user.id}</p>
                  <p>Email: {user.email}</p>
                  <p>Provider: {user.app_metadata?.provider}</p>
                  <p>Discord ID: {user.user_metadata?.provider_id}</p>
                </div>
              </div>
            )}

            {session && (
              <div>
                <h3 className="font-semibold mb-2">Session Info</h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto max-h-60">
                  <pre>{JSON.stringify(session, null, 2)}</pre>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Troubleshooting Steps</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Verify Discord OAuth redirect URI: <code className="bg-gray-200 px-1">{process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback</code></li>
                <li>Check Discord OAuth is enabled in Supabase: Authentication → Providers → Discord</li>
                <li>Verify .env.local has correct values</li>
                <li>Try in incognito mode (to rule out cookie issues)</li>
                <li>Clear browser cookies and try again</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

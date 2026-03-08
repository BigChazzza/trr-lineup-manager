import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/getSession'
import { isAdmin } from '@/lib/auth/roles'
import { getBotConfig } from '@/server-actions/bot-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BotConfigForm } from '@/components/admin/BotConfigForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function BotConfigPage() {
  const user = await getUser()
  const userIsAdmin = await isAdmin()

  if (!user || !userIsAdmin) {
    redirect('/')
  }

  const configResult = await getBotConfig()
  const config = configResult.success ? configResult.data : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Discord Bot Configuration</CardTitle>
            <CardDescription>
              Configure where the bot creates game signup channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BotConfigForm defaultValues={config} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Find Discord IDs</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>1. Enable Developer Mode:</strong> Discord Settings → App Settings → Advanced → Developer Mode (toggle ON)
            </p>
            <p>
              <strong>2. Get Guild ID:</strong> Right-click your server icon → Copy Server ID
            </p>
            <p>
              <strong>3. Get Category ID:</strong> Right-click the category name in your server → Copy Channel ID
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

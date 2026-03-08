'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { botConfigSchema, type BotConfigFormData } from '@/lib/schemas/bot-config'
import { updateBotConfig } from '@/server-actions/bot-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

interface BotConfigFormProps {
  defaultValues?: BotConfigFormData | null
}

export function BotConfigForm({ defaultValues }: BotConfigFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BotConfigFormData>({
    resolver: zodResolver(botConfigSchema),
    defaultValues: {
      guild_id: defaultValues?.guild_id || '',
      signup_category_id: defaultValues?.signup_category_id || '',
    },
  })

  async function onSubmit(data: BotConfigFormData) {
    setIsSubmitting(true)
    try {
      const result = await updateBotConfig(data)

      if (result.success) {
        toast({
          title: 'Configuration saved',
          description: 'Discord bot settings have been updated.',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save configuration',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="guild_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discord Guild (Server) ID</FormLabel>
              <FormControl>
                <Input placeholder="123456789012345678" {...field} />
              </FormControl>
              <FormDescription>
                Your Discord server ID where the bot will create channels
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="signup_category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Signup Category ID</FormLabel>
              <FormControl>
                <Input placeholder="123456789012345678" {...field} />
              </FormControl>
              <FormDescription>
                Discord category where game signup channels will be created
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </Button>
      </form>
    </Form>
  )
}

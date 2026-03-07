'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { gameSchema, type GameFormData, HLL_MAPS, HLL_MODES, HLL_GAME_SIZES, HLL_FACTIONS } from '@/lib/schemas/games'
import { createGame, updateGame } from '@/server-actions/games'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface GameFormProps {
  defaultValues?: Partial<GameFormData>
  gameId?: string
  playbooks?: Array<{ id: string; name: string }>
}

export function GameForm({ defaultValues, gameId, playbooks = [] }: GameFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      date: defaultValues?.date || '',
      time: defaultValues?.time || '',
      map: defaultValues?.map || '',
      mode: defaultValues?.mode || '',
      game_size: defaultValues?.game_size || '',
      faction: defaultValues?.faction || '',
      strat_maps_link: defaultValues?.strat_maps_link || '',
      playbook_id: defaultValues?.playbook_id || null,
      status: defaultValues?.status || 'open',
      match_result: defaultValues?.match_result,
      match_score: defaultValues?.match_score,
      winning_clan: defaultValues?.winning_clan || '',
      stats_url: defaultValues?.stats_url || '',
      stream_link: defaultValues?.stream_link || '',
    },
  })

  async function onSubmit(data: GameFormData) {
    setIsSubmitting(true)

    try {
      const result = gameId
        ? await updateGame(gameId, data)
        : await createGame(data)

      if (result.success) {
        toast({
          title: gameId ? 'Game updated' : 'Game created',
          description: `${data.name} has been ${gameId ? 'updated' : 'created'} successfully.`,
        })
        router.push('/games')
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit form',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., League Match vs Alpha Company" {...field} />
              </FormControl>
              <FormDescription>
                Give your game a descriptive name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="map"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Map</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a map" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HLL_MAPS.map((map) => (
                      <SelectItem key={map} value={map}>
                        {map}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HLL_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="game_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game Size</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select game size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HLL_GAME_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Maximum player count for this match
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="faction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Faction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HLL_FACTIONS.map((faction) => (
                      <SelectItem key={faction} value={faction}>
                        {faction}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Which faction you&apos;ll be playing as
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="strat_maps_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strategy Maps Link (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://drive.google.com/... or https://imgur.com/..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Link to tactical drawings or strategy documentation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {playbooks.length > 0 && (
          <FormField
            control={form.control}
            name="playbook_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Playbook (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a playbook template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No playbook</SelectItem>
                    {playbooks.map((playbook) => (
                      <SelectItem key={playbook.id} value={playbook.id}>
                        {playbook.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a playbook to pre-populate squads and roles
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open for Signups</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Open games are visible to all players for signup
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Post-Game Statistics Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Post-Game Statistics (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            Add match results and links after the game is completed
          </p>

          <FormField
            control={form.control}
            name="match_result"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match Result (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select winner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="axis_victory">Axis Victory</SelectItem>
                    <SelectItem value="allies_victory">Allies Victory</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Who won the match?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="match_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match Score (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select final score" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="5-0">5-0</SelectItem>
                    <SelectItem value="4-1">4-1</SelectItem>
                    <SelectItem value="3-2">3-2</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Final capture point score</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="winning_clan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Winning Clan (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TRR, DIXX" {...field} />
                </FormControl>
                <FormDescription>
                  Name of the winning clan or team
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stats_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stats URL (Optional)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://stats.example.com/match/123" {...field} />
                </FormControl>
                <FormDescription>
                  Link to match statistics or scoreboard
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stream_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stream Link (Optional)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://youtube.com/watch?v=..." {...field} />
                </FormControl>
                <FormDescription>
                  Link to VOD recording or stream
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : gameId ? 'Update Game' : 'Create Game'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

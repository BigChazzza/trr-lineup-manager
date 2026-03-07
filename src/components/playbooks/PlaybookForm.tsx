'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { playbookSchema, type PlaybookFormData } from '@/lib/schemas/playbooks'
import { createPlaybook, updatePlaybook } from '@/server-actions/playbooks'
import { PLAYBOOK_TEMPLATES, type TemplateName } from '@/lib/playbook-templates'
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
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, MoveUp, MoveDown } from 'lucide-react'

interface PlaybookFormProps {
  defaultValues?: Partial<PlaybookFormData>
  playbookId?: string
}

export function PlaybookForm({ defaultValues, playbookId }: PlaybookFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PlaybookFormData>({
    resolver: zodResolver(playbookSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      is_default: false,
      google_doc_link: '',
      squads: [
        {
          name: '',
          squad_order: 0,
          roles: [{ role_name: '', role_order: 0 }],
          tasks: [],
        },
      ],
    },
  })

  const { fields: squadFields, append: appendSquad, remove: removeSquad, move: moveSquad } = useFieldArray({
    control: form.control,
    name: 'squads',
  })

  function loadTemplate(templateName: TemplateName) {
    const template = PLAYBOOK_TEMPLATES[templateName]
    form.reset(template)
    toast({
      title: 'Template loaded',
      description: `${templateName} template has been loaded. You can customize it before saving.`,
    })
  }

  async function onSubmit(data: PlaybookFormData) {
    setIsSubmitting(true)

    try {
      // Normalize squad_order, role_order, and task_order based on array indices
      const normalizedData = {
        ...data,
        squads: data.squads.map((squad, squadIndex) => ({
          ...squad,
          squad_order: squadIndex,
          roles: squad.roles.map((role, roleIndex) => ({
            ...role,
            role_order: roleIndex,
          })),
          tasks: squad.tasks.map((task, taskIndex) => ({
            ...task,
            task_order: taskIndex,
          })),
        })),
      }

      const result = playbookId
        ? await updatePlaybook(playbookId, normalizedData)
        : await createPlaybook(normalizedData)

      if (result.success) {
        toast({
          title: playbookId ? 'Playbook updated' : 'Playbook created',
          description: `${data.name} has been ${playbookId ? 'updated' : 'created'} successfully.`,
        })
        router.push('/playbooks')
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        })
      }
    } catch (error) {
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
        {/* Template Selection - only show when creating new playbook */}
        {!playbookId && (
          <Card>
            <CardHeader>
              <CardTitle>Start from Template</CardTitle>
              <CardDescription>Load a pre-configured playbook template to get started quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {Object.keys(PLAYBOOK_TEMPLATES).map((templateName) => (
                  <Button
                    key={templateName}
                    type="button"
                    variant="outline"
                    onClick={() => loadTemplate(templateName as TemplateName)}
                  >
                    Load {templateName}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Playbook Info */}
        <Card>
          <CardHeader>
            <CardTitle>Playbook Information</CardTitle>
            <CardDescription>Basic details about this tactical playbook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playbook Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Offensive Units, Standard Infantry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the tactical approach and when to use this playbook"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="google_doc_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Doc Link (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://docs.google.com/document/d/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to detailed tactical guide or strategy document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <label className="text-sm font-medium leading-none">
                      Set as default playbook
                    </label>
                    <FormDescription>
                      Default playbooks are automatically suggested when creating games
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Squads Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Squads</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendSquad({
                  name: '',
                  squad_order: squadFields.length,
                  roles: [{ role_name: '', role_order: 0 }],
                  tasks: [],
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Squad
            </Button>
          </div>

          {squadFields.map((squadField, squadIndex) => (
            <SquadCard
              key={squadField.id}
              squadIndex={squadIndex}
              form={form}
              onRemove={() => removeSquad(squadIndex)}
              onMoveUp={() => squadIndex > 0 && moveSquad(squadIndex, squadIndex - 1)}
              onMoveDown={() => squadIndex < squadFields.length - 1 && moveSquad(squadIndex, squadIndex + 1)}
              isFirst={squadIndex === 0}
              isLast={squadIndex === squadFields.length - 1}
            />
          ))}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (playbookId ? 'Updating...' : 'Creating...')
              : (playbookId ? 'Update Playbook' : 'Create Playbook')
            }
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

interface SquadCardProps {
  squadIndex: number
  form: any
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}

function SquadCard({ squadIndex, form, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: SquadCardProps) {
  const { fields: roleFields, append: appendRole, remove: removeRole, move: moveRole } = useFieldArray({
    control: form.control,
    name: `squads.${squadIndex}.roles`,
  })

  const { fields: taskFields, append: appendTask, remove: removeTask, move: moveTask } = useFieldArray({
    control: form.control,
    name: `squads.${squadIndex}.tasks`,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">Squad {squadIndex + 1}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={isFirst}
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={isLast}
            >
              <MoveDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={form.watch('squads').length === 1}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Squad Name */}
        <FormField
          control={form.control}
          name={`squads.${squadIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Squad Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1.1 - Playing left hand side" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Roles Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold">Roles</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendRole({ role_name: '', role_order: roleFields.length })}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Role
            </Button>
          </div>

          {roleFields.map((roleField, roleIndex) => (
            <div key={roleField.id} className="flex items-center gap-2">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name={`squads.${squadIndex}.roles.${roleIndex}.role_name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="e.g., Squad Leader, Medic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => roleIndex > 0 && moveRole(roleIndex, roleIndex - 1)}
                  disabled={roleIndex === 0}
                >
                  <MoveUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => roleIndex < roleFields.length - 1 && moveRole(roleIndex, roleIndex + 1)}
                  disabled={roleIndex === roleFields.length - 1}
                >
                  <MoveDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRole(roleIndex)}
                  disabled={roleFields.length === 1}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold">Tasks (Optional)</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendTask({ task_description: '', task_order: taskFields.length })}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Task
            </Button>
          </div>

          {taskFields.length > 0 && (
            <div className="space-y-2">
              {taskFields.map((taskField, taskIndex) => (
                <div key={taskField.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`squads.${squadIndex}.tasks.${taskIndex}.task_description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="e.g., Secure center point" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => taskIndex > 0 && moveTask(taskIndex, taskIndex - 1)}
                      disabled={taskIndex === 0}
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => taskIndex < taskFields.length - 1 && moveTask(taskIndex, taskIndex + 1)}
                      disabled={taskIndex === taskFields.length - 1}
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(taskIndex)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {taskFields.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No tasks added yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

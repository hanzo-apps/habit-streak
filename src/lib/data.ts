import { useCallback } from 'react'
import { useQuery, useMutation } from '@hanzo/base/react'
import type { Habit, Checkin } from './habits'

/**
 * The Base data seam. Both collections are org-scoped and carry the signed-in
 * user's IAM token (wired once in providers.tsx). Realtime is off — a static
 * SPA refetches after each write, one simple path (mirrors the reference).
 */

export function useHabits() {
  const { data, isLoading, error, refetch } = useQuery<Habit>('habits', {
    sort: 'created',
    realtime: false,
  })
  const create = useMutation('habits', 'create')
  const del = useMutation('habits', 'delete')

  const add = useCallback(
    async (name: string, cadence: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      await create.mutate({ name: trimmed, cadence })
      await refetch()
    },
    [create, refetch],
  )

  const remove = useCallback(
    async (id: string) => {
      await del.mutate({ id })
      await refetch()
    },
    [del, refetch],
  )

  return {
    habits: data,
    isLoading,
    error,
    refetch,
    add,
    remove,
    adding: create.isLoading,
    addError: create.error,
  }
}

export function useCheckins() {
  const { data, isLoading, error, refetch } = useQuery<Checkin>('checkins', {
    sort: '-day',
    realtime: false,
  })
  const create = useMutation('checkins', 'create')
  const del = useMutation('checkins', 'delete')

  /** Toggle a habit's check-in for a given day (create if absent, else delete). */
  const toggle = useCallback(
    async (habitId: string, day: string) => {
      const existing = data.find((c) => c.habit === habitId && c.day === day)
      if (existing) await del.mutate({ id: existing.id })
      else await create.mutate({ habit: habitId, day })
      await refetch()
    },
    [data, create, del, refetch],
  )

  return {
    checkins: data,
    isLoading,
    error,
    refetch,
    toggle,
    busy: create.isLoading || del.isLoading,
  }
}

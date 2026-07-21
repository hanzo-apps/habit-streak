import type { BaseRecord } from '@hanzo/base/react'

/**
 * Domain model + pure date/streak/heatmap math for Habit Streak.
 *
 * Everything here is TZ-safe and side-effect free: a calendar day is a
 * `YYYY-MM-DD` key, and all arithmetic runs on integer "ordinals" (days since
 * the epoch) so a heatmap never drifts across a timezone boundary. Keep this
 * file in lockstep with schema.sql (the `habits` + `checkins` collections).
 */

/** One row of the `habits` collection. */
export interface Habit extends BaseRecord {
  name: string
  cadence: string
}

/** One row of the `checkins` collection: a habit marked done on a `day`. */
export interface Checkin extends BaseRecord {
  habit: string
  day: string
}

/** How many week-columns the detail heatmap shows. */
export const HEATMAP_WEEKS = 18

/** The cadences a habit can carry (metadata; streaks count calendar days). */
export const CADENCES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
] as const

/** Human label for a stored cadence value. */
export function cadenceLabel(value: string): string {
  return CADENCES.find((c) => c.value === value)?.label ?? value
}

const FULL_DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const FULL_MONTH = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** Today's local calendar day as `YYYY-MM-DD`. */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** `YYYY-MM-DD` -> integer day ordinal (stable, independent of local TZ). */
export function ordinal(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** Day ordinal -> `YYYY-MM-DD`. */
export function keyFromOrdinal(n: number): string {
  const dt = new Date(n * 86_400_000)
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

/** Weekday of an ordinal: 0 = Sunday … 6 = Saturday. */
export function dowOf(n: number): number {
  return ((n % 7) + 4) % 7 // ordinal 0 (1970-01-01) was a Thursday
}

/** A calm long-form date, e.g. "Thursday, July 21". */
export function niceDate(key: string): string {
  const [, m, d] = key.split('-').map(Number)
  return `${FULL_DOW[dowOf(ordinal(key))]}, ${FULL_MONTH[m - 1]} ${d}`
}

/** The set of days a habit was checked in on. */
export function daysFor(checkins: Checkin[], habitId: string): Set<string> {
  const out = new Set<string>()
  for (const c of checkins) if (c.habit === habitId) out.add(c.day)
  return out
}

/** For each checked day, the length of the consecutive run ending on it. */
export function runMap(days: Set<string>): Map<string, number> {
  const byOrd = new Map<number, number>()
  const ords = [...days].map(ordinal).sort((a, b) => a - b)
  for (const o of ords) byOrd.set(o, (byOrd.get(o - 1) ?? 0) + 1)
  const out = new Map<string, number>()
  for (const [o, run] of byOrd) out.set(keyFromOrdinal(o), run)
  return out
}

export interface Stats {
  /** Consecutive days ending today (or yesterday, so an unchecked today is grace). */
  current: number
  /** Longest run of consecutive days ever. */
  longest: number
  /** Total days checked in. */
  total: number
}

export function computeStats(days: Set<string>): Stats {
  let longest = 0
  for (const run of runMap(days).values()) if (run > longest) longest = run

  const tOrd = ordinal(todayKey())
  let cursor = days.has(keyFromOrdinal(tOrd)) ? tOrd : tOrd - 1
  let current = 0
  while (days.has(keyFromOrdinal(cursor))) {
    current++
    cursor--
  }

  return { current, longest, total: days.size }
}

export type CellState = 'future' | 'empty' | 'filled'
export interface Cell {
  key: string
  state: CellState
  run: number
}
export interface Heatmap {
  /** Column-major weeks, each a Sunday…Saturday array of 7 cells. */
  weeks: Cell[][]
}

export function buildHeatmap(days: Set<string>): Heatmap {
  const runs = runMap(days)
  const tOrd = ordinal(todayKey())
  const start = tOrd - dowOf(tOrd) - (HEATMAP_WEEKS - 1) * 7 // Sunday of the first column
  const weeks: Cell[][] = []
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const col: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const o = start + w * 7 + d
      const key = keyFromOrdinal(o)
      const state: CellState = o > tOrd ? 'future' : days.has(key) ? 'filled' : 'empty'
      col.push({ key, state, run: runs.get(key) ?? 0 })
    }
    weeks.push(col)
  }
  return { weeks }
}

/** A green-scale token for a heatmap cell — deeper green means a longer streak. */
export type CellToken =
  | '$color3'
  | '$green5'
  | '$green7'
  | '$green8'
  | '$green9'
  | '$green10'
  | '$green11'

export function cellToken(state: CellState, run: number): CellToken {
  if (state !== 'filled') return '$color3'
  if (run <= 1) return '$green5'
  if (run <= 3) return '$green7'
  if (run <= 6) return '$green8'
  if (run <= 13) return '$green9'
  if (run <= 27) return '$green10'
  return '$green11'
}

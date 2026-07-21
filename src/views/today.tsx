import { XStack, YStack, H2, SizableText, Paragraph, Spinner } from '@hanzo/gui'
import { useHabits } from '../lib/data'
import { useCheckins } from '../lib/data'
import {
  cadenceLabel,
  computeStats,
  daysFor,
  niceDate,
  todayKey,
  type Habit,
} from '../lib/habits'
import { Badge, CheckButton, MiniWeek, PrimaryButton, Empty, card } from '../ui'

/** Today's habits — a calm checklist with big buttons and a glanceable week. */
export function Today({ onAdd, onOpen }: { onAdd: () => void; onOpen: (id: string) => void }) {
  const { habits, isLoading, error } = useHabits()
  const checkins = useCheckins()
  const tk = todayKey()

  if (isLoading || checkins.isLoading) {
    return (
      <XStack alignItems="center" gap="$2" opacity={0.6}>
        <Spinner /> <SizableText>Loading your habits…</SizableText>
      </XStack>
    )
  }

  if (error) {
    return (
      <Paragraph color="$red10">
        Couldn’t reach Base ({error.message}). Confirm VITE_HANZO_BASE_URL and that you’re signed in.
      </Paragraph>
    )
  }

  const doneToday = habits.filter((h) => daysFor(checkins.checkins, h.id).has(tk)).length

  return (
    <YStack gap="$4">
      <YStack gap="$1">
        <SizableText size="$3" opacity={0.6}>
          {niceDate(tk)}
        </SizableText>
        <H2>
          {habits.length === 0
            ? 'Start a habit'
            : doneToday === habits.length
              ? 'All done today'
              : `${doneToday} of ${habits.length} done today`}
        </H2>
      </YStack>

      {habits.length === 0 ? (
        <Empty
          title="No habits yet"
          hint="Add your first habit and check in every day to grow a streak."
        />
      ) : (
        <YStack gap="$3">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              days={daysFor(checkins.checkins, habit.id)}
              checkedToday={daysFor(checkins.checkins, habit.id).has(tk)}
              busy={checkins.busy}
              onToggle={() => checkins.toggle(habit.id, tk)}
              onOpen={() => onOpen(habit.id)}
            />
          ))}
        </YStack>
      )}

      <PrimaryButton label="＋  New habit" onPress={onAdd} />
    </YStack>
  )
}

function HabitRow({
  habit,
  days,
  checkedToday,
  busy,
  onToggle,
  onOpen,
}: {
  habit: Habit
  days: Set<string>
  checkedToday: boolean
  busy: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  const { current } = computeStats(days)
  return (
    <XStack {...card} padding="$4" alignItems="center" gap="$4">
      <YStack flex={1} gap="$2" cursor="pointer" onPress={onOpen}>
        <XStack alignItems="center" gap="$2">
          <SizableText size="$6">{habit.name}</SizableText>
          <Badge label={cadenceLabel(habit.cadence)} />
        </XStack>
        <XStack alignItems="center" gap="$3">
          <SizableText size="$3" color={current > 0 ? '$green10' : '$color'} opacity={current > 0 ? 1 : 0.55}>
            {current > 0 ? `${current} day streak` : 'No streak yet'}
          </SizableText>
          <MiniWeek days={days} />
        </XStack>
      </YStack>
      <CheckButton checked={checkedToday} disabled={busy} onToggle={onToggle} />
    </XStack>
  )
}

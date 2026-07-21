import { XStack, YStack, H1, SizableText, Paragraph, Spinner } from '@hanzo/gui'
import { useHabits, useCheckins } from '../lib/data'
import { cadenceLabel, computeStats, daysFor, niceDate, todayKey } from '../lib/habits'
import { Badge, CheckButton, GhostButton, Heatmap, StatTile, card } from '../ui'

/** One habit in full: today's toggle, the streak stats, and the green heatmap. */
export function Detail({ habitId, onBack }: { habitId: string; onBack: () => void }) {
  const { habits, isLoading, error, remove } = useHabits()
  const checkins = useCheckins()
  const tk = todayKey()

  if (isLoading || checkins.isLoading) {
    return (
      <XStack alignItems="center" gap="$2" opacity={0.6}>
        <Spinner /> <SizableText>Loading…</SizableText>
      </XStack>
    )
  }

  if (error) {
    return <Paragraph color="$red10">Couldn’t reach Base ({error.message}).</Paragraph>
  }

  const habit = habits.find((h) => h.id === habitId)
  if (!habit) {
    return (
      <YStack gap="$3">
        <Paragraph opacity={0.6}>This habit is gone.</Paragraph>
        <GhostButton label="←  Back" onPress={onBack} />
      </YStack>
    )
  }

  const days = daysFor(checkins.checkins, habit.id)
  const checkedToday = days.has(tk)
  const stats = computeStats(days)

  async function deleteHabit() {
    await remove(habitId)
    onBack()
  }

  return (
    <YStack gap="$5">
      <XStack alignItems="center" justifyContent="space-between">
        <GhostButton label="←  Today" onPress={onBack} />
        <GhostButton label="Delete" danger onPress={deleteHabit} />
      </XStack>

      <XStack {...card} padding="$4" alignItems="center" gap="$4">
        <YStack flex={1} gap="$2">
          <XStack alignItems="center" gap="$2">
            <H1 fontSize="$8">{habit.name}</H1>
            <Badge label={cadenceLabel(habit.cadence)} />
          </XStack>
          <SizableText size="$3" opacity={0.6}>
            {checkedToday ? `Checked in for ${niceDate(tk)}` : `Tap to check in for ${niceDate(tk)}`}
          </SizableText>
        </YStack>
        <CheckButton
          checked={checkedToday}
          disabled={checkins.busy}
          onToggle={() => checkins.toggle(habit.id, tk)}
          size={64}
        />
      </XStack>

      <XStack gap="$3">
        <StatTile label="Current streak" value={stats.current} hot={stats.current > 0} />
        <StatTile label="Longest streak" value={stats.longest} />
        <StatTile label="Total days" value={stats.total} />
      </XStack>

      <YStack {...card} padding="$4" gap="$3">
        <SizableText size="$5">Consistency</SizableText>
        <SizableText size="$2" opacity={0.55}>
          Last 18 weeks — deeper green means a longer run.
        </SizableText>
        <Heatmap days={days} />
      </YStack>
    </YStack>
  )
}

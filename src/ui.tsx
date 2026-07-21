import type { ReactNode } from 'react'
import {
  Circle,
  H1,
  H2,
  SizableText,
  XStack,
  YStack,
  Button,
  ScrollView,
} from '@hanzo/gui'
import {
  buildHeatmap,
  cellToken,
  keyFromOrdinal,
  ordinal,
  runMap,
  todayKey,
  type CellToken,
} from './lib/habits'

/**
 * The Habit Streak look: calm dark surfaces, generous space, one green accent.
 * Every piece is a @hanzo/gui primitive with Tamagui LONGHAND props (tsc
 * enforces this — shorthands render but fail typecheck).
 */

/** Shared elevated-surface style, spread onto card-like stacks. */
export const card = {
  backgroundColor: '$color2',
  borderColor: '$borderColor',
  borderWidth: 1,
  borderRadius: '$6',
} as const

/** Wordmark: a green check tile + the app name. Clickable back to Today. */
export function Brand({ onPress }: { onPress?: () => void }) {
  return (
    <XStack
      alignItems="center"
      gap="$2"
      cursor={onPress ? 'pointer' : 'default'}
      onPress={onPress}
    >
      <YStack
        width={30}
        height={30}
        borderRadius="$3"
        backgroundColor="$green9"
        alignItems="center"
        justifyContent="center"
      >
        <SizableText size="$5" color="$green12">
          ✓
        </SizableText>
      </YStack>
      <H1 fontSize="$7">Habit Streak</H1>
    </XStack>
  )
}

/** The big, satisfying daily toggle — filled green when done, outline when not. */
export function CheckButton({
  checked,
  onToggle,
  disabled,
  size = 52,
}: {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
  size?: number
}) {
  return (
    <Circle
      size={size}
      alignItems="center"
      justifyContent="center"
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      backgroundColor={checked ? '$green9' : undefined}
      borderWidth={checked ? 0 : 2}
      borderColor="$green7"
      hoverStyle={{ borderColor: '$green8', backgroundColor: checked ? '$green10' : '$green2' }}
      pressStyle={{ scale: 0.92, backgroundColor: checked ? '$green10' : '$green3' }}
      onPress={disabled ? undefined : onToggle}
    >
      <SizableText size={size >= 48 ? '$8' : '$5'} color={checked ? '$green12' : '$green8'}>
        ✓
      </SizableText>
    </Circle>
  )
}

/** A small pill — muted by default, green when it marks momentum. */
export function Badge({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'green' }) {
  const green = tone === 'green'
  return (
    <XStack
      backgroundColor={green ? '$green4' : '$color3'}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius={999}
      alignItems="center"
    >
      <SizableText size="$1" color={green ? '$green11' : '$color'} opacity={green ? 1 : 0.7}>
        {label}
      </SizableText>
    </XStack>
  )
}

/** One big number + a quiet label. */
export function StatTile({ label, value, hot }: { label: string; value: number; hot?: boolean }) {
  return (
    <YStack {...card} flex={1} padding="$3" gap="$1" alignItems="center">
      <H2 color={hot ? '$green10' : '$color'}>{value}</H2>
      <SizableText size="$2" opacity={0.6}>
        {label}
      </SizableText>
    </YStack>
  )
}

/** A green primary action. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <Button
      size="$5"
      backgroundColor="$green9"
      borderWidth={0}
      disabled={disabled || loading}
      opacity={disabled ? 0.5 : 1}
      hoverStyle={{ backgroundColor: '$green10' }}
      pressStyle={{ backgroundColor: '$green10' }}
      onPress={onPress}
    >
      <SizableText size="$4" color="$green12">
        {loading ? 'Working…' : label}
      </SizableText>
    </Button>
  )
}

/** A quiet, chromeless text action (back / delete / secondary). */
export function GhostButton({
  label,
  onPress,
  danger,
}: {
  label: string
  onPress: () => void
  danger?: boolean
}) {
  return (
    <Button size="$3" chromeless onPress={onPress}>
      <SizableText size="$3" color={danger ? '$red10' : '$color'} opacity={danger ? 1 : 0.8}>
        {label}
      </SizableText>
    </Button>
  )
}

/** A segmented single-choice control (used for cadence). */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <XStack {...card} padding="$1" gap="$1">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <XStack
            key={opt.value}
            flex={1}
            alignItems="center"
            justifyContent="center"
            paddingVertical="$2"
            borderRadius="$4"
            cursor="pointer"
            backgroundColor={active ? '$green9' : undefined}
            hoverStyle={{ backgroundColor: active ? '$green9' : '$color3' }}
            onPress={() => onChange(opt.value)}
          >
            <SizableText size="$3" color={active ? '$green12' : '$color'} opacity={active ? 1 : 0.7}>
              {opt.label}
            </SizableText>
          </XStack>
        )
      })}
    </XStack>
  )
}

/** The last seven days as a compact strip, today ringed. */
export function MiniWeek({ days }: { days: Set<string> }) {
  const tk = todayKey()
  const runs = runMap(days)
  const start = ordinal(tk) - 6
  return (
    <XStack gap={4}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const key = keyFromOrdinal(start + i)
        const filled = days.has(key)
        return (
          <YStack
            key={key}
            width={16}
            height={16}
            borderRadius={4}
            backgroundColor={filled ? cellToken('filled', runs.get(key) ?? 1) : '$color3'}
            borderWidth={key === tk ? 2 : 0}
            borderColor="$green7"
          />
        )
      })}
    </XStack>
  )
}

const LEGEND: CellToken[] = ['$color3', '$green5', '$green7', '$green9', '$green11']

/** The full calendar heatmap — the app's centerpiece. */
export function Heatmap({ days }: { days: Set<string> }) {
  const { weeks } = buildHeatmap(days)
  const tk = todayKey()
  const rows = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <YStack gap="$3">
      <XStack gap="$2">
        <YStack gap={3}>
          {rows.map((label, i) => (
            <XStack key={i} height={14} alignItems="center">
              <SizableText size="$1" opacity={0.4}>
                {label}
              </SizableText>
            </XStack>
          ))}
        </YStack>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap={3}>
            {weeks.map((col, wi) => (
              <YStack key={wi} gap={3}>
                {col.map((cell) => (
                  <YStack
                    key={cell.key}
                    width={14}
                    height={14}
                    borderRadius={3}
                    opacity={cell.state === 'future' ? 0 : 1}
                    backgroundColor={cellToken(cell.state, cell.run)}
                    borderWidth={cell.key === tk ? 2 : 0}
                    borderColor="$green7"
                  />
                ))}
              </YStack>
            ))}
          </XStack>
        </ScrollView>
      </XStack>

      <XStack gap="$2" alignItems="center" justifyContent="flex-end">
        <SizableText size="$1" opacity={0.5}>
          Less
        </SizableText>
        <XStack gap={3}>
          {LEGEND.map((token) => (
            <YStack key={token} width={12} height={12} borderRadius={3} backgroundColor={token} />
          ))}
        </XStack>
        <SizableText size="$1" opacity={0.5}>
          More
        </SizableText>
      </XStack>
    </YStack>
  )
}

/** A calm empty-state block. */
export function Empty({ title, hint }: { title: string; hint: ReactNode }) {
  return (
    <YStack {...card} padding="$6" gap="$2" alignItems="center">
      <SizableText size="$5">{title}</SizableText>
      <SizableText size="$3" opacity={0.6} textAlign="center">
        {hint}
      </SizableText>
    </YStack>
  )
}

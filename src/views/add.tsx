import { useState } from 'react'
import { XStack, YStack, H2, SizableText, Paragraph, Input } from '@hanzo/gui'
import { useHabits } from '../lib/data'
import { CADENCES } from '../lib/habits'
import { GhostButton, PrimaryButton, Segmented, card } from '../ui'

/** Add a habit — a name and a cadence, then check in every day. */
export function Add({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { add, adding, addError } = useHabits()
  const [name, setName] = useState('')
  const [cadence, setCadence] = useState<string>(CADENCES[0].value)

  async function create() {
    if (!name.trim() || adding) return
    await add(name, cadence)
    onDone()
  }

  return (
    <YStack gap="$5">
      <XStack alignItems="center">
        <GhostButton label="←  Today" onPress={onCancel} />
      </XStack>

      <YStack gap="$2">
        <H2>New habit</H2>
        <Paragraph opacity={0.6}>Small and daily beats big and rare. Name one thing.</Paragraph>
      </YStack>

      <YStack {...card} padding="$4" gap="$4">
        <YStack gap="$2">
          <SizableText size="$2" opacity={0.6}>
            Habit
          </SizableText>
          <Input
            size="$5"
            value={name}
            placeholder="Read 10 pages"
            onChangeText={setName}
            onSubmitEditing={create}
          />
        </YStack>

        <YStack gap="$2">
          <SizableText size="$2" opacity={0.6}>
            Cadence
          </SizableText>
          <Segmented options={CADENCES} value={cadence} onChange={setCadence} />
        </YStack>
      </YStack>

      {addError ? <Paragraph color="$red10">{addError.message}</Paragraph> : null}

      <PrimaryButton
        label="Create habit"
        loading={adding}
        disabled={!name.trim()}
        onPress={create}
      />
    </YStack>
  )
}

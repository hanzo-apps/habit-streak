import { useIam } from '@hanzo/iam/react'
import { YStack, XStack, H1, Paragraph, SizableText, Button } from '@hanzo/gui'

/** An illustrative streak strip (chrome, not a metric). */
const ORNAMENT = ['$green3', '$green5', '$green7', '$green9', '$green11', '$green9', '$green7'] as const

/**
 * Signed-out landing. One action: PKCE sign-in with Hanzo (hanzo.id). There is
 * no local credential form — Hanzo IAM owns every credential interaction.
 */
export function SignedOut() {
  const { login, isLoading } = useIam()

  return (
    <YStack
      flex={1}
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      gap="$6"
      padding="$6"
      backgroundColor="$background"
    >
      <YStack alignItems="center" gap="$5" maxWidth={460}>
        <YStack
          width={64}
          height={64}
          borderRadius="$6"
          backgroundColor="$green9"
          alignItems="center"
          justifyContent="center"
        >
          <SizableText fontSize={34} lineHeight={40} color="$green12">
            ✓
          </SizableText>
        </YStack>

        <YStack alignItems="center" gap="$3">
          <H1 textAlign="center">Habit Streak</H1>
          <Paragraph textAlign="center" opacity={0.6}>
            Build habits with streaks and heatmaps. Check in each day, keep the run alive, and watch
            a calm green grid fill in.
          </Paragraph>
        </YStack>

        <XStack gap={6}>
          {ORNAMENT.map((token, i) => (
            <YStack key={i} width={22} height={22} borderRadius={6} backgroundColor={token} />
          ))}
        </XStack>
      </YStack>

      <Button
        size="$5"
        backgroundColor="$green9"
        borderWidth={0}
        disabled={isLoading}
        hoverStyle={{ backgroundColor: '$green10' }}
        pressStyle={{ backgroundColor: '$green10' }}
        onPress={() => login()}
      >
        <SizableText size="$4" color="$green12">
          {isLoading ? 'Loading…' : 'Sign in with Hanzo'}
        </SizableText>
      </Button>

      <SizableText size="$1" opacity={0.4}>
        Secured by Hanzo IAM
      </SizableText>
    </YStack>
  )
}

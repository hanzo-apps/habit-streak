import { useState } from 'react'
import { useIam } from '@hanzo/iam/react'
import { XStack, YStack, SizableText, Button } from '@hanzo/gui'
import { Brand } from '../ui'
import { Today } from './today'
import { Detail } from './detail'
import { Add } from './add'

/**
 * Signed-in shell. One static SPA, no router: a tiny view-state machine swaps
 * between Today, a habit's Detail, and Add. The top bar (brand + who + sign
 * out) stays constant; the brand returns to Today.
 */
type Route = { name: 'today' } | { name: 'detail'; habitId: string } | { name: 'add' }

export function Home() {
  const { user, logout } = useIam()
  const who = user?.displayName || user?.name || user?.email || 'you'
  const [route, setRoute] = useState<Route>({ name: 'today' })
  const today = () => setRoute({ name: 'today' })

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$background">
      <XStack
        alignItems="center"
        justifyContent="space-between"
        padding="$4"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <Brand onPress={today} />
        <XStack alignItems="center" gap="$3">
          <SizableText size="$2" opacity={0.55} numberOfLines={1} maxWidth={160}>
            {who}
          </SizableText>
          <Button size="$3" chromeless onPress={() => logout()}>
            Sign out
          </Button>
        </XStack>
      </XStack>

      <YStack
        padding="$4"
        paddingBottom="$8"
        gap="$4"
        width="100%"
        maxWidth={560}
        alignSelf="center"
      >
        {route.name === 'today' && (
          <Today
            onAdd={() => setRoute({ name: 'add' })}
            onOpen={(habitId) => setRoute({ name: 'detail', habitId })}
          />
        )}
        {route.name === 'detail' && <Detail habitId={route.habitId} onBack={today} />}
        {route.name === 'add' && <Add onDone={today} onCancel={today} />}
      </YStack>
    </YStack>
  )
}

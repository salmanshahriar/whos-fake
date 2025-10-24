"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/utils/session"
import { Users, CircleDotDashed } from "lucide-react"
import { GameRulesModal } from "@/components/game-rules-modal"
import { deleteGameRoom } from "@/lib/actions/cleanup"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (session) {
      router.push(`/lobby/${session.roomId}?playerId=${session.playerId}`)
    }

    return () => {
      const session = getSession()
      if (session?.isHost) {
        deleteGameRoom(session.roomId).catch((error) => console.error("[v0] Failed to cleanup room:", error))
      }
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border shadow-xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-lg">
              <CircleDotDashed className="h-10 w-10 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-5xl font-bold text-foreground">Who's Fake?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-8">
          <Button asChild size="lg" className="w-full h-14 text-lg font-semibold shadow-lg">
            <Link href="/host">
              <CircleDotDashed className="h-5 w-5 mr-2" />
              Host Game
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full h-14 text-lg font-semibold bg-transparent">
            <Link href="/join">
              <Users className="h-5 w-5 mr-2" />
              Join Game
            </Link>
          </Button>
          <GameRulesModal buttonText="Rules & Guidelines" />
        </CardContent>
      </Card>
    </div>
  )
}

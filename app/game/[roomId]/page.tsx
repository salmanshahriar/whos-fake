"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { Room, Player } from "@/lib/types"
import { Eye, EyeOff } from "lucide-react"

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const searchParams = useSearchParams()
  const playerId = searchParams.get("playerId")
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [wordRevealed, setWordRevealed] = useState(false)
  const [isReturning, setIsReturning] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [roomResult, playerResult] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).single(),
        playerId ? supabase.from("players").select("*").eq("id", playerId).single() : Promise.resolve(null),
      ])

      if (roomResult.data) setRoom(roomResult.data)
      if (playerResult && playerResult.data) setCurrentPlayer(playerResult.data)
    }

    fetchData()
  }, [roomId, playerId, supabase])

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const { data: roomData } = await supabase.from("rooms").select("*").eq("id", roomId).single()

      if (roomData) {
        setRoom(roomData)
        if (roomData.phase === "lobby") {
          router.push(`/lobby/${roomId}?playerId=${playerId}`)
        }
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [roomId, playerId, router, supabase])

  useEffect(() => {
    const channel = supabase
      .channel(`game:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updatedRoom = payload.new as Room
          setRoom(updatedRoom)
          if (updatedRoom.phase === "lobby") {
            router.push(`/lobby/${roomId}?playerId=${playerId}`)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, playerId, router, supabase])

  const handleReturnToLobby = async () => {
    if (!room || !currentPlayer?.is_host || isReturning) return

    setIsReturning(true)

    try {
      await Promise.all([
        supabase.from("players").update({ is_imposter: false }).eq("room_id", roomId),
        supabase.from("rooms").update({ phase: "lobby", current_word: null }).eq("id", roomId),
      ])
    } catch (err) {
      console.error("[v0] Error returning to lobby:", err)
      setIsReturning(false)
    }
  }

  if (!room || !currentPlayer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const isImposter = currentPlayer.is_imposter

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-xl border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Secret Word</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-6">
            <Button
              variant={wordRevealed ? "secondary" : "default"}
              size="lg"
              onClick={() => setWordRevealed(!wordRevealed)}
              className="gap-2 text-lg px-8 h-14 shadow-lg"
            >
              {wordRevealed ? (
                <>
                  <EyeOff className="h-5 w-5" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5" />
                  Reveal
                </>
              )}
            </Button>

            {wordRevealed && (
              <div
                className={`w-full rounded-2xl p-8 text-center transition-all duration-300 animate-in fade-in zoom-in ${
                  isImposter ? "bg-red-50 border-2 border-red-300" : "bg-secondary border-2 border-accent/30"
                }`}
              >
                {isImposter ? (
                  <h2 className="text-4xl font-bold text-red-600">You're the Imposter!</h2>
                ) : (
                  <h2 className="text-5xl font-bold text-foreground">{room.current_word}</h2>
                )}
              </div>
            )}
          </div>

          {currentPlayer.is_host ? (
            <Button
              onClick={handleReturnToLobby}
              disabled={isReturning}
              size="lg"
              className="w-full h-14 text-lg shadow-lg"
            >
              {isReturning ? "Returning..." : "New Round"}
            </Button>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">Waiting for host...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

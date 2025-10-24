"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { saveSession } from "@/lib/utils/session"
import { Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function JoinPage() {
  const searchParams = useSearchParams()
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase())
    }
  }, [searchParams])

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const normalizedCode = roomCode.trim().toUpperCase()

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", normalizedCode)
        .single()

      if (roomError || !room) {
        setError("Room not found")
        setIsLoading(false)
        return
      }

      if (room.phase !== "lobby") {
        setError("Game already started")
        setIsLoading(false)
        return
      }

      const { count } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)

      const playerNumber = (count || 0) + 1

      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          room_id: room.id,
          name: `Player ${playerNumber}`,
          is_host: false,
        })
        .select()
        .single()

      if (playerError) throw playerError

      saveSession(room.id, player.id)

      router.push(`/lobby/${room.id}?playerId=${player.id}`)
    } catch (err) {
      console.error("[v0] Error joining room:", err)
      setError("Failed to join")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center space-y-4 relative">
          <Link href="/" className="absolute left-4 top-4">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center justify-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <Users className="h-8 w-8 text-accent-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Join Game</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <Input
              type="text"
              placeholder="ABCD"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="text-center text-4xl font-bold tracking-[0.5em] h-16 border-2"
              required
              autoFocus
            />

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive p-2 text-center">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full h-14 text-lg shadow-lg" disabled={isLoading}>
              {isLoading ? "Joining..." : "Join"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

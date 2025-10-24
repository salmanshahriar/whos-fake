"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { generateRoomCode } from "@/lib/utils/room-code"
import { saveSession } from "@/lib/utils/session"
import { GalleryVertical as GamepadVertical, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function HostPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateRoom = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const roomCode = generateRoomCode()

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          code: roomCode,
          num_imposters: 1,
          phase: "lobby",
        })
        .select()
        .single()

      if (roomError) throw roomError

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
          is_host: true,
        })
        .select()
        .single()

      if (playerError) throw playerError

      await supabase.from("rooms").update({ host_player_id: player.id }).eq("id", room.id)

      saveSession(room.id, player.id)

      router.push(`/lobby/${room.id}?playerId=${player.id}`)
    } catch (err) {
      console.error("[v0] Error creating room:", err)
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
          <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <GamepadVertical className="h-8 w-8 text-accent-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Host Game</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateRoom} size="lg" className="w-full h-14 text-lg shadow-lg" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Room"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

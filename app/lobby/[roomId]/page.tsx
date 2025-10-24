"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { clearSession } from "@/lib/utils/session"
import type { Room, Player } from "@/lib/types"
import { Users, Crown, Check, Settings, LogOut, Share2 } from "lucide-react"
import { GameRulesModal } from "@/components/game-rules-modal"

export default function LobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const searchParams = useSearchParams()
  const playerId = searchParams.get("playerId")
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newImposterCount, setNewImposterCount] = useState(1)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomResult, playersResult, playerResult] = await Promise.all([
          supabase.from("rooms").select("*").eq("id", roomId).single(),
          supabase.from("players").select("*").eq("room_id", roomId).order("joined_at", { ascending: true }),
          playerId ? supabase.from("players").select("*").eq("id", playerId).single() : Promise.resolve(null),
        ])

        if (roomResult.error) throw roomResult.error
        setRoom(roomResult.data)
        setNewImposterCount(roomResult.data.num_imposters)

        if (roomResult.data.phase === "in-game") {
          router.push(`/game/${roomId}?playerId=${playerId}`)
          return
        }

        if (playersResult.data) setPlayers(playersResult.data)
        if (playerResult && playerResult.data) setCurrentPlayer(playerResult.data)
      } catch (err) {
        console.error("[v0] Error loading lobby:", err)
      }
    }

    fetchData()
  }, [roomId, playerId, supabase, router])

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const { data: roomData } = await supabase.from("rooms").select("*").eq("id", roomId).single()

      if (roomData) {
        setRoom(roomData)
        if (roomData.phase === "in-game") {
          router.push(`/game/${roomId}?playerId=${playerId}`)
        }
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [roomId, playerId, router, supabase])

  useEffect(() => {
    const channel = supabase
      .channel(`lobby:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updatedRoom = payload.new as Room
          setRoom(updatedRoom)
          if (updatedRoom.phase === "in-game") {
            router.push(`/game/${roomId}?playerId=${playerId}`)
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase
            .from("players")
            .select("*")
            .eq("room_id", roomId)
            .order("joined_at", { ascending: true })
          if (data) setPlayers(data)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, playerId, router, supabase])

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleStartGame = async () => {
    if (!room || !currentPlayer?.is_host || isStarting) return

    setIsStarting(true)

    try {
      if (players.length < room.num_imposters + 1) {
        alert(`Need at least ${room.num_imposters + 1} players`)
        setIsStarting(false)
        return
      }

      const { data: words } = await supabase.from("words").select("word")
      if (!words || words.length === 0) throw new Error("No words available")

      const randomWord = words[Math.floor(Math.random() * words.length)].word
      const shuffledPlayers = shuffleArray(players)
      const imposterIds = shuffledPlayers.slice(0, room.num_imposters).map((p) => p.id)

      await Promise.all([
        ...players.map((player) =>
          supabase
            .from("players")
            .update({ is_imposter: imposterIds.includes(player.id) })
            .eq("id", player.id),
        ),
        supabase.from("rooms").update({ phase: "in-game", current_word: randomWord }).eq("id", roomId),
      ])
    } catch (err) {
      console.error("[v0] Error starting game:", err)
      setIsStarting(false)
    }
  }

  const handleCopyLink = () => {
    if (room) {
      const shareUrl = `${window.location.origin}/join?code=${room.code}`
      navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleCopyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleUpdateSettings = async () => {
    if (!room || !currentPlayer?.is_host) return

    await supabase.from("rooms").update({ num_imposters: newImposterCount }).eq("id", roomId)
    setRoom({ ...room, num_imposters: newImposterCount })
    setSettingsOpen(false)
  }

  const handleLeave = () => {
    clearSession()
    router.push("/")
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl border shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Lobby</CardTitle>
            <div className="flex gap-2">
              <GameRulesModal />
              {currentPlayer?.is_host && (
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="imposter-count">Imposter count</Label>
                        <Input
                          id="imposter-count"
                          type="number"
                          min={1}
                          max={Math.max(1, players.length - 1)}
                          value={newImposterCount}
                          onChange={(e) => setNewImposterCount(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <Button onClick={handleUpdateSettings} className="w-full">
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-transparent"
                onClick={handleCopyLink}
                title="Invite people"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent" onClick={handleLeave}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-4 rounded-xl border-2 border-accent/30 bg-secondary p-6 cursor-pointer transition-all hover:border-accent/60 active:scale-95"
          >
            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground mb-2">Room Code</p>
              <p className="text-4xl font-bold tracking-widest text-accent">{room.code}</p>
              {copiedCode && <p className="text-xs text-accent mt-2">Copied!</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-semibold">{players.length}</span>
              </div>
              <Badge variant="secondary">{room.num_imposters} Imposter</Badge>
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                      {player.name.charAt(0)}
                    </div>
                    <span className="font-medium">{player.name}</span>
                    {player.id === playerId && <Badge variant="secondary">You</Badge>}
                  </div>
                  {player.is_host && <Crown className="h-5 w-5 text-accent fill-current" />}
                </div>
              ))}
            </div>
          </div>

          {currentPlayer?.is_host ? (
            <Button onClick={handleStartGame} disabled={isStarting} size="lg" className="w-full h-14 text-lg shadow-lg">
              {isStarting ? "Starting..." : "Start Game"}
            </Button>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">Waiting for host...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

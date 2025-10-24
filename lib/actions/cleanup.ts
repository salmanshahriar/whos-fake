"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function deleteGameRoom(roomId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Delete all players in the room first (cascade will handle this, but explicit for safety)
    await supabase.from("players").delete().eq("room_id", roomId)

    // Delete the room
    const { error } = await supabase.from("rooms").delete().eq("id", roomId)

    if (error) {
      console.error("[v0] Error deleting room:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Cleanup error:", error)
    return { success: false, error: String(error) }
  }
}

export async function cleanupStaleRooms() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Calculate timestamp for 10 minutes ago
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    // Delete rooms that haven't been active for 10+ minutes
    const { error } = await supabase.from("rooms").delete().lt("last_activity", tenMinutesAgo)

    if (error) {
      console.error("[v0] Error cleaning up stale rooms:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Stale room cleanup error:", error)
    return { success: false, error: String(error) }
  }
}

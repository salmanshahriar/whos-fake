import { cleanupStaleRooms } from "@/lib/actions/cleanup"

export async function GET() {
  try {
    const result = await cleanupStaleRooms()
    return Response.json(result)
  } catch (error) {
    console.error("[v0] Cleanup API error:", error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export const SESSION_KEYS = {
  ROOM_ID: "whoknows_room_id",
  PLAYER_ID: "whoknows_player_id",
} as const

export function saveSession(roomId: string, playerId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(SESSION_KEYS.ROOM_ID, roomId)
  localStorage.setItem(SESSION_KEYS.PLAYER_ID, playerId)
}

export function getSession() {
  if (typeof window === "undefined") return null
  const roomId = localStorage.getItem(SESSION_KEYS.ROOM_ID)
  const playerId = localStorage.getItem(SESSION_KEYS.PLAYER_ID)
  return roomId && playerId ? { roomId, playerId } : null
}

export function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEYS.ROOM_ID)
  localStorage.removeItem(SESSION_KEYS.PLAYER_ID)
}

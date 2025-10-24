export interface Room {
  id: string
  code: string
  host_player_id: string | null
  num_imposters: number
  phase: "lobby" | "in-game"
  current_word: string | null
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  name: string
  is_host: boolean
  is_imposter: boolean
  joined_at: string
}

export interface Word {
  id: string
  word: string
  created_at: string
}

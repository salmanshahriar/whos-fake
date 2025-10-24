-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_player_id UUID,
  num_imposters INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'lobby',
  current_word TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  is_imposter BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster room code lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

-- Create index for faster player lookups by room
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);

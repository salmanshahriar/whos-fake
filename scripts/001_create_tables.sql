-- 1. Create rooms table (without host_player_id FK initially)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_player_id UUID,
  num_imposters INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'lobby',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  is_imposter BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,  -- New: Track if player is ready
  score INTEGER DEFAULT 0,         -- New: Track score
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add the Foreign Key to rooms table (since players table now exists)
ALTER TABLE rooms
ADD CONSTRAINT fk_host_player
FOREIGN KEY (host_player_id)
REFERENCES players(id)
ON DELETE SET NULL;

-- 4. Create words table
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create index for faster room code lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

-- 6. Create index for faster player lookups by room
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
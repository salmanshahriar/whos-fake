-- Enable Row Level Security on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms table
-- Anyone can read rooms (needed for joining via code)
CREATE POLICY "rooms_select_all"
  ON rooms FOR SELECT
  USING (true);

-- Anyone can insert rooms (needed for creating new rooms)
CREATE POLICY "rooms_insert_all"
  ON rooms FOR INSERT
  WITH CHECK (true);

-- Anyone can update rooms (needed for game state changes)
CREATE POLICY "rooms_update_all"
  ON rooms FOR UPDATE
  USING (true);

-- Anyone can delete rooms (cleanup)
CREATE POLICY "rooms_delete_all"
  ON rooms FOR DELETE
  USING (true);

-- RLS Policies for players table
-- Anyone can read players (needed for lobby display)
CREATE POLICY "players_select_all"
  ON players FOR SELECT
  USING (true);

-- Anyone can insert players (needed for joining)
CREATE POLICY "players_insert_all"
  ON players FOR INSERT
  WITH CHECK (true);

-- Anyone can update players (needed for game state)
CREATE POLICY "players_update_all"
  ON players FOR UPDATE
  USING (true);

-- Anyone can delete players (needed for leaving)
CREATE POLICY "players_delete_all"
  ON players FOR DELETE
  USING (true);

-- RLS Policies for words table
-- Anyone can read words (needed for game)
CREATE POLICY "words_select_all"
  ON words FOR SELECT
  USING (true);

-- Only allow inserts for seeding (can be restricted later)
CREATE POLICY "words_insert_all"
  ON words FOR INSERT
  WITH CHECK (true);

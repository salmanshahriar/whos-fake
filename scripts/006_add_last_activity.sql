-- Add last_activity column to rooms table to track when games were last active
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity);

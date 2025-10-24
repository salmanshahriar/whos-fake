-- Make player names optional and add auto-generated names
ALTER TABLE players ALTER COLUMN name DROP NOT NULL;
ALTER TABLE players ALTER COLUMN name SET DEFAULT 'Player';

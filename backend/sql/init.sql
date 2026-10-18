-- Red Tetris Leaderboard Schema

CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    lines INTEGER NOT NULL DEFAULT 0,
    mode VARCHAR(20) NOT NULL DEFAULT 'classic',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard (score DESC);

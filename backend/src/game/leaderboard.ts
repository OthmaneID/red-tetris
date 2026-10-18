import type { GameMode, LeaderboardEntry } from "../schema/socket.ts";
import { getPool, isDatabaseConnected } from "../db/client.ts";

export class Leaderboard {
  private entries: LeaderboardEntry[] = [];
  private readonly limit: number;

  constructor(limit = 20) {
    this.limit = limit;
  }

  public async syncFromDatabase(): Promise<void> {
    if (!isDatabaseConnected()) return;
    try {
      const pool = await getPool();
      if (!pool) return;
      const res = await pool.query(
        "SELECT username, score, lines, mode, EXTRACT(EPOCH FROM created_at) * 1000 AS at FROM leaderboard ORDER BY score DESC LIMIT $1",
        [this.limit]
      );
      if (res && Array.isArray(res.rows)) {
        this.entries = (res.rows as Array<{
          username: string;
          score: number | string;
          lines: number | string;
          mode: string;
          at: number | string;
        }>).map((row) => ({
          username: row.username,
          score: Number(row.score),
          lines: Number(row.lines),
          mode: row.mode as GameMode,
          at: Number(row.at),
        }));
      }
    } catch (err) {
      console.warn("Failed to sync leaderboard from database:", (err as Error).message);
    }
  }

  public record(username: string, score: number, lines: number, mode: GameMode): void {
    if (!username || score <= 0) return;
    const now = Date.now();
    this.entries.push({ username, score, lines, mode, at: now });
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, this.limit);

    if (isDatabaseConnected()) {
      getPool().then((pool) => {
        pool
          ?.query(
            "INSERT INTO leaderboard (username, score, lines, mode) VALUES ($1, $2, $3, $4)",
            [username, score, lines, mode]
          )
          .catch((err) => {
            console.warn("Failed to persist score to Postgres:", err.message);
          });
      });
    }
  }

  public top(count = 10): LeaderboardEntry[] {
    return this.entries.slice(0, count);
  }

  public clear(): void {
    this.entries = [];
    if (isDatabaseConnected()) {
      getPool().then((pool) => {
        pool?.query("DELETE FROM leaderboard").catch((err) => {
          console.warn("Failed to clear Postgres leaderboard:", err.message);
        });
      });
    }
  }
}

export const leaderboard = new Leaderboard(20);

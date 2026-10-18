import type { GameMode, LeaderboardEntry } from "../schema/socket.ts";

export class Leaderboard {
  private entries: LeaderboardEntry[] = [];
  private readonly limit: number;

  constructor(limit = 20) {
    this.limit = limit;
  }

  public record(username: string, score: number, lines: number, mode: GameMode): void {
    if (!username || score <= 0) return;
    this.entries.push({ username, score, lines, mode, at: Date.now() });
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, this.limit);
  }

  public top(count = 10): LeaderboardEntry[] {
    return this.entries.slice(0, count);
  }

  public clear(): void {
    this.entries = [];
  }
}

export const leaderboard = new Leaderboard();

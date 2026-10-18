import { describe, it, expect, afterEach, vi } from "vitest";
import { Leaderboard } from "./leaderboard.ts";
import * as dbClient from "../db/client.ts";

describe("Leaderboard", () => {
  it("records and sorts by score descending", () => {
    const board = new Leaderboard();
    board.record("alice", 100, 2, "classic");
    board.record("bob", 500, 6, "gravity");
    board.record("cara", 300, 4, "invisible");
    const top = board.top();
    expect(top.map((e) => e.username)).toEqual(["bob", "cara", "alice"]);
  });

  it("ignores zero or negative scores and empty names", () => {
    const board = new Leaderboard();
    board.record("alice", 0, 0, "classic");
    board.record("", 100, 1, "classic");
    expect(board.top()).toHaveLength(0);
  });

  it("limits stored entries", () => {
    const board = new Leaderboard(3);
    for (let i = 1; i <= 10; i++) board.record(`p${i}`, i * 10, i, "classic");
    const top = board.top(10);
    expect(top).toHaveLength(3);
    expect(top[0].score).toBe(100);
  });

  it("clears entries", () => {
    const board = new Leaderboard();
    board.record("alice", 100, 2, "classic");
    board.clear();
    expect(board.top()).toHaveLength(0);
  });

  describe("database integration", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("syncs from database when connected", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [
          { username: "hero", score: 9999, lines: 40, mode: "classic", at: 1000 },
          { username: "zero", score: 1200, lines: 10, mode: "invisible", at: 900 },
        ],
      });

      vi.spyOn(dbClient, "isDatabaseConnected").mockReturnValue(true);
      vi.spyOn(dbClient, "getPool").mockResolvedValue({
        query: mockQuery,
        connect: vi.fn(),
      });

      const board = new Leaderboard(10);
      await board.syncFromDatabase();

      expect(board.top()).toHaveLength(2);
      expect(board.top()[0].username).toBe("hero");
      expect(board.top()[0].score).toBe(9999);
    });

    it("inserts into database on record when connected", async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [] });

      vi.spyOn(dbClient, "isDatabaseConnected").mockReturnValue(true);
      vi.spyOn(dbClient, "getPool").mockResolvedValue({
        query: mockQuery,
        connect: vi.fn(),
      });

      const board = new Leaderboard(10);
      board.record("superman", 5000, 20, "classic");

      await new Promise((r) => setTimeout(r, 10));

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO leaderboard"),
        ["superman", 5000, 20, "classic"]
      );
    });

    it("clears database table on clear when connected", async () => {
      const mockQuery = vi.fn().mockResolvedValue({ rows: [] });

      vi.spyOn(dbClient, "isDatabaseConnected").mockReturnValue(true);
      vi.spyOn(dbClient, "getPool").mockResolvedValue({
        query: mockQuery,
        connect: vi.fn(),
      });

      const board = new Leaderboard(10);
      board.clear();

      await new Promise((r) => setTimeout(r, 10));

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM leaderboard")
      );
    });
  });
});

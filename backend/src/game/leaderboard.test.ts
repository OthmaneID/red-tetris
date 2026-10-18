import { describe, it, expect } from "vitest";
import { Leaderboard } from "./leaderboard.ts";

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
});

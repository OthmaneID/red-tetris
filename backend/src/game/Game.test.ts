import { describe, it, expect } from "vitest";
import { Game } from "./Game.ts";

describe("Game", () => {
  it("makes the first player the leader", () => {
    const game = new Game("room1");
    const res = game.addPlayer("s1", "alice");
    expect(res.ok).toBe(true);
    expect(game.leaderId).toBe("s1");
    expect(game.players[0].role).toBe("leader");
  });

  it("rejects duplicate usernames but treats same id as idempotent", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    expect(game.addPlayer("s1", "alice").ok).toBe(true);
    expect(game.hasUsername("ALICE")).toBe(true);
    const dup = game.addPlayer("s2", "alice");
    expect(dup.ok).toBe(true);
    expect(game.players).toHaveLength(1);
  });

  it("reconnects a known username to a new socket id", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    const res = game.addPlayer("s2", "alice");
    expect(res.ok).toBe(true);
    expect(game.leaderId).toBe("s2");
    expect(game.players).toHaveLength(1);
  });

  it("blocks new players once playing", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.start();
    const res = game.addPlayer("s2", "bob");
    expect(res.ok).toBe(false);
  });

  it("promotes a new leader when the leader leaves", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.addPlayer("s2", "bob");
    const { leaderChanged } = game.removePlayer("s1");
    expect(leaderChanged).toBe(true);
    expect(game.leaderId).toBe("s2");
  });

  it("resets players and generates shared pieces on start", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.addPlayer("s2", "bob");
    game.start();
    expect(game.isPlaying).toBe(true);
    expect(game.pieceTypes().length).toBeGreaterThanOrEqual(14);
    expect(game.players.every((p) => p.isAlive)).toBe(true);
  });

  it("extends the piece buffer on demand", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.start();
    const before = game.pieceTypes().length;
    const extended = game.ensurePieces(before);
    expect(extended.length).toBeGreaterThanOrEqual(before + 14);
  });

  it("computes penalty as n-1 for n>1 only", () => {
    const game = new Game("room1");
    expect(game.penaltyFor(1)).toBe(0);
    expect(game.penaltyFor(0)).toBe(0);
    expect(game.penaltyFor(2)).toBe(1);
    expect(game.penaltyFor(4)).toBe(3);
  });

  it("ends a multiplayer game when one player remains", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.addPlayer("s2", "bob");
    game.start();
    game.eliminate("s1");
    const end = game.checkEnd();
    expect(end.ended).toBe(true);
    expect(end.winner?.id).toBe("s2");
    expect(game.isPlaying).toBe(false);
  });

  it("ends a solo game when the only player tops out", () => {
    const game = new Game("solo");
    game.addPlayer("s1", "alice");
    game.start();
    game.eliminate("s1");
    const end = game.checkEnd();
    expect(end.ended).toBe(true);
    expect(end.winner?.id).toBe("s1");
  });

  it("ignores a second elimination of the same player", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.addPlayer("s2", "bob");
    game.start();
    expect(game.eliminate("s1")?.id).toBe("s1");
    expect(game.eliminate("s1")).toBeUndefined();
    expect(game.aliveCount()).toBe(1);
  });

  it("updates score and serializes to room info", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.setMode("gravity");
    game.updateScore("s1", 1200, 10);
    const info = game.toInfo();
    expect(info.mode).toBe("gravity");
    expect(info.players[0].score).toBe(1200);
    expect(info.id).toBe("room1");
  });

  it("does not change mode mid-game", () => {
    const game = new Game("room1");
    game.addPlayer("s1", "alice");
    game.start();
    game.setMode("invisible");
    expect(game.mode).toBe("classic");
  });
});

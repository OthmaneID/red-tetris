import { describe, it, expect } from "vitest";
import { GameManager } from "./GameManager.ts";

describe("GameManager", () => {
  it("creates a game on first join", () => {
    const gm = new GameManager();
    const res = gm.joinGame("room1", "s1", "alice");
    expect(res.ok).toBe(true);
    expect(gm.count()).toBe(1);
    expect(gm.getGame("room1")?.leaderId).toBe("s1");
  });

  it("rejects empty room or username", () => {
    const gm = new GameManager();
    expect(gm.joinGame("", "s1", "alice").ok).toBe(false);
    expect(gm.joinGame("room1", "s1", "  ").ok).toBe(false);
  });

  it("blocks joining a game in progress", () => {
    const gm = new GameManager();
    gm.joinGame("room1", "s1", "alice");
    gm.startGame("room1", "s1");
    const res = gm.joinGame("room1", "s2", "bob");
    expect(res.ok).toBe(false);
  });

  it("deletes a game when the last player leaves", () => {
    const gm = new GameManager();
    gm.joinGame("room1", "s1", "alice");
    const res = gm.leaveGame("room1", "s1");
    expect(res.wasDeleted).toBe(true);
    expect(gm.count()).toBe(0);
  });

  it("reports leader change and end result on leave", () => {
    const gm = new GameManager();
    gm.joinGame("room1", "s1", "alice");
    gm.joinGame("room1", "s2", "bob");
    gm.startGame("room1", "s1");
    const res = gm.leaveGame("room1", "s1");
    expect(res.wasDeleted).toBe(false);
    expect(res.leaderChanged).toBe(true);
    expect(res.end.ended).toBe(true);
    expect(res.end.winner?.id).toBe("s2");
  });

  it("only lets the leader start", () => {
    const gm = new GameManager();
    gm.joinGame("room1", "s1", "alice");
    gm.joinGame("room1", "s2", "bob");
    expect(gm.startGame("room1", "s2").ok).toBe(false);
    expect(gm.startGame("room1", "s1").ok).toBe(true);
  });

  it("refuses to start an unknown or already playing room", () => {
    const gm = new GameManager();
    expect(gm.startGame("ghost", "s1").ok).toBe(false);
    gm.joinGame("room1", "s1", "alice");
    gm.startGame("room1", "s1");
    expect(gm.startGame("room1", "s1").ok).toBe(false);
  });

  it("sets mode only for the leader before play", () => {
    const gm = new GameManager();
    gm.joinGame("room1", "s1", "alice");
    expect(gm.setMode("room1", "s2", "gravity").ok).toBe(false);
    expect(gm.setMode("room1", "s1", "gravity").ok).toBe(true);
    expect(gm.getGame("room1")?.mode).toBe("gravity");
  });

  it("finds a game by socket id", () => {
    const gm = new GameManager();
    gm.joinGame("room1", "s1", "alice");
    expect(gm.findGameBySocket("s1")?.id).toBe("room1");
    expect(gm.findGameBySocket("nope")).toBeUndefined();
  });

  it("returns a safe result when leaving an unknown room", () => {
    const gm = new GameManager();
    const res = gm.leaveGame("ghost", "s1");
    expect(res.wasDeleted).toBe(false);
    expect(res.end.ended).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { Player } from "./Player.ts";

describe("Player", () => {
  it("initializes with defaults", () => {
    const player = new Player("sock1", "alice");
    expect(player.id).toBe("sock1");
    expect(player.username).toBe("alice");
    expect(player.role).toBe("player");
    expect(player.isAlive).toBe(true);
    expect(player.score).toBe(0);
    expect(player.spectrum).toHaveLength(10);
  });

  it("accepts an explicit leader role", () => {
    expect(new Player("s", "bob", "leader").role).toBe("leader");
  });

  it("resets mutable state", () => {
    const player = new Player("s", "bob");
    player.isAlive = false;
    player.score = 500;
    player.lines = 7;
    player.spectrum = [5, 5, 5];
    player.reset();
    expect(player.isAlive).toBe(true);
    expect(player.score).toBe(0);
    expect(player.lines).toBe(0);
    expect(player.spectrum).toEqual(Array(10).fill(0));
  });

  it("clamps spectrum to 10 columns", () => {
    const player = new Player("s", "bob");
    player.setSpectrum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(player.spectrum).toHaveLength(10);
    expect(player.spectrum[9]).toBe(10);
  });

  it("serializes to info", () => {
    const player = new Player("s", "bob", "leader");
    const info = player.toInfo();
    expect(info).toMatchObject({
      id: "s",
      username: "bob",
      role: "leader",
      isAlive: true,
      score: 0,
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseHash, updateHash } from "./hashRouter.ts";

describe("hashRouter", () => {
  beforeEach(() => {
    // Setup mock globalThis.window if running in node env
    if (typeof globalThis.window === "undefined") {
      (globalThis as unknown as { window: { location: { hash: string } } }).window = {
        location: { hash: "" },
      };
    } else {
      window.location.hash = "";
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseHash", () => {
    it("parses valid hash matching #<room>[<player_name>]", () => {
      const result = parseHash("#alpha[john_doe]");
      expect(result).toEqual({
        room: "alpha",
        username: "john_doe",
      });
    });

    it("parses hash without leading #", () => {
      const result = parseHash("beta[super_player]");
      expect(result).toEqual({
        room: "beta",
        username: "super_player",
      });
    });

    it("handles whitespace inside room and username", () => {
      const result = parseHash("# room1 [ player2 ]");
      expect(result).toEqual({
        room: "room1",
        username: "player2",
      });
    });

    it("falls back gracefully when hash contains only room name", () => {
      const result = parseHash("#solo_room");
      expect(result.room).toBe("solo_room");
      expect(result.username).toMatch(/^player_\d+/);
    });

    it("falls back to default alpha and random player when hash is completely empty", () => {
      const result = parseHash("");
      expect(result.room).toBe("alpha");
      expect(result.username).toMatch(/^player_\d+/);
    });
  });

  describe("updateHash", () => {
    it("updates window.location.hash to subject format #<room>[<player_name>]", () => {
      updateHash("gamma", "bob");
      expect(window.location.hash).toBe("#gamma[bob]");
    });

    it("does not reassign if hash is already identical", () => {
      window.location.hash = "#omega[alice]";
      const original = window.location.hash;
      updateHash("omega", "alice");
      expect(window.location.hash).toBe(original);
    });
  });
});

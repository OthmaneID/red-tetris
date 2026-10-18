import { describe, it, expect } from "vitest";
import { MatchmakingQueue } from "./matchmakingQueue.ts";

describe("MatchmakingQueue", () => {
  it("queues the first player and pairs the second", () => {
    const q = new MatchmakingQueue();
    const first = q.addPlayer("s1", "alice");
    expect(first.matched).toBe(false);
    expect(q.getQueueLength()).toBe(1);

    const second = q.addPlayer("s2", "bob");
    expect(second.matched).toBe(true);
    if (second.matched) {
      expect(second.match.player1.socketId).toBe("s1");
      expect(second.match.player2.socketId).toBe("s2");
      expect(second.match.roomId).toMatch(/^match-/);
    }
    expect(q.getQueueLength()).toBe(0);
  });

  it("deduplicates a re-adding socket", () => {
    const q = new MatchmakingQueue();
    q.addPlayer("s1", "alice");
    q.addPlayer("s1", "alice");
    expect(q.getQueueLength()).toBe(1);
  });

  it("removes a waiting player", () => {
    const q = new MatchmakingQueue();
    q.addPlayer("s1", "alice");
    expect(q.removePlayer("s1")).toBe(true);
    expect(q.isPlayerInQueue("s1")).toBe(false);
    expect(q.removePlayer("s1")).toBe(false);
  });
});

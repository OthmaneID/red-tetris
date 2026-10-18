import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSocketListeners, socketEmitters } from "./socketEvents.ts";
import { socket } from "../socket.ts";

describe("socketEvents", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerSocketListeners", () => {
    it("registers listeners on the socket and returns an unregister cleanup function", () => {
      const onConnect = vi.fn();
      const onGameStarted = vi.fn();
      const onPenalty = vi.fn();

      const onSpy = vi.spyOn(socket, "on");
      const offSpy = vi.spyOn(socket, "off");

      const unregister = registerSocketListeners({
        onConnect,
        onGameStarted,
        onPenalty,
      });

      expect(onSpy).toHaveBeenCalledWith("connect", onConnect);
      expect(onSpy).toHaveBeenCalledWith("game:started", onGameStarted);
      expect(onSpy).toHaveBeenCalledWith("game:penalty", onPenalty);

      unregister();

      expect(offSpy).toHaveBeenCalledWith("connect", onConnect);
      expect(offSpy).toHaveBeenCalledWith("game:started", onGameStarted);
      expect(offSpy).toHaveBeenCalledWith("game:penalty", onPenalty);
    });

    it("handles all possible socket event handlers gracefully", () => {
      const handlers = {
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onConnectError: vi.fn(),
        onRoomUpdated: vi.fn(),
        onRoomError: vi.fn(),
        onQueueMatched: vi.fn(),
        onGameStarted: vi.fn(),
        onPieces: vi.fn(),
        onPenalty: vi.fn(),
        onSpectrum: vi.fn(),
        onEliminated: vi.fn(),
        onEnded: vi.fn(),
      };

      const onSpy = vi.spyOn(socket, "on");
      const offSpy = vi.spyOn(socket, "off");

      const cleanup = registerSocketListeners(handlers);
      expect(onSpy).toHaveBeenCalledTimes(12);

      cleanup();
      expect(offSpy).toHaveBeenCalledTimes(12);
    });
  });

  describe("socketEmitters", () => {
    it("emits joinRoom with callback", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      const cb = vi.fn();
      socketEmitters.joinRoom({ room: "roomA", username: "p1" }, cb);
      expect(emitSpy).toHaveBeenCalledWith("room:join", { room: "roomA", username: "p1" }, cb);
    });

    it("emits leaveRoom", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.leaveRoom();
      expect(emitSpy).toHaveBeenCalledWith("room:leave");
    });

    it("emits setMode", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.setMode("invisible");
      expect(emitSpy).toHaveBeenCalledWith("room:setMode", { mode: "invisible" });
    });

    it("emits joinQueue and leaveQueue", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.joinQueue({ username: "speedy" });
      expect(emitSpy).toHaveBeenCalledWith("queue:join", { username: "speedy" }, undefined);

      socketEmitters.leaveQueue();
      expect(emitSpy).toHaveBeenCalledWith("queue:leave");
    });

    it("emits startGame", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.startGame();
      expect(emitSpy).toHaveBeenCalledWith("game:start", undefined);
    });

    it("emits requestPieces", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.requestPieces(14);
      expect(emitSpy).toHaveBeenCalledWith("game:requestPieces", { haveCount: 14 });
    });

    it("emits sendLinesCleared", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.sendLinesCleared(3);
      expect(emitSpy).toHaveBeenCalledWith("game:linesCleared", { count: 3 });
    });

    it("emits sendSpectrum", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.sendSpectrum([0, 2, 4, 1, 0, 0, 0, 0, 0, 0]);
      expect(emitSpy).toHaveBeenCalledWith("game:spectrum", {
        spectrum: [0, 2, 4, 1, 0, 0, 0, 0, 0, 0],
      });
    });

    it("emits sendGameOver", () => {
      const emitSpy = vi.spyOn(socket, "emit");
      socketEmitters.sendGameOver(1500, 12);
      expect(emitSpy).toHaveBeenCalledWith("game:over", { score: 1500, lines: 12 });
    });
  });
});

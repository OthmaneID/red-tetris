import { Game } from "./Game.ts";
import type { Player } from "./Player.ts";
import type { GameMode } from "../schema/socket.ts";

export class GameManager {
  private games: Map<string, Game> = new Map();

  public getGame(id: string): Game | undefined {
    return this.games.get(id);
  }

  public joinGame(
    roomId: string,
    socketId: string,
    username: string
  ): { ok: boolean; error?: string; game?: Game } {
    const room = roomId.trim();
    const name = username.trim();

    if (!room || !name) {
      return { ok: false, error: "Room name and username are required." };
    }

    let game = this.games.get(room);
    if (!game) {
      game = new Game(room);
      this.games.set(room, game);
    }

    const result = game.addPlayer(socketId, name);
    if (!result.ok) {
      if (game.isEmpty()) this.games.delete(room);
      return { ok: false, error: result.error };
    }

    return { ok: true, game };
  }

  public leaveGame(
    roomId: string,
    socketId: string
  ): {
    game?: Game;
    wasDeleted: boolean;
    leaderChanged: boolean;
    end: { ended: boolean; winner: Player | null };
  } {
    const game = this.games.get(roomId);
    if (!game) {
      return { wasDeleted: false, leaderChanged: false, end: { ended: false, winner: null } };
    }

    const { leaderChanged, end } = game.removePlayer(socketId);

    if (game.isEmpty()) {
      this.games.delete(roomId);
      return { wasDeleted: true, leaderChanged, end };
    }

    return { game, wasDeleted: false, leaderChanged, end };
  }

  public startGame(
    roomId: string,
    requesterId: string
  ): { ok: boolean; error?: string; game?: Game } {
    const game = this.games.get(roomId);
    if (!game) return { ok: false, error: "Room not found." };
    if (game.leaderId !== requesterId) {
      return { ok: false, error: "Only the room leader can start the game." };
    }
    if (game.isPlaying) {
      return { ok: false, error: "Game is already in progress." };
    }
    game.start();
    return { ok: true, game };
  }

  public setMode(
    roomId: string,
    requesterId: string,
    mode: GameMode
  ): { ok: boolean; game?: Game } {
    const game = this.games.get(roomId);
    if (!game || game.leaderId !== requesterId) return { ok: false };
    game.setMode(mode);
    return { ok: true, game };
  }

  public findGameBySocket(socketId: string): Game | undefined {
    for (const game of this.games.values()) {
      if (game.getPlayer(socketId)) return game;
    }
    return undefined;
  }

  public count(): number {
    return this.games.size;
  }
}

export const gameManager = new GameManager();

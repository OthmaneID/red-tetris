import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../schema/socket.ts";
import { gameManager } from "../game/GameManager.ts";
import { matchmakingQueue } from "../game/matchmakingQueue.ts";
import { leaderboard } from "../game/leaderboard.ts";
import type { Game } from "../game/Game.ts";
import type { Player } from "../game/Player.ts";

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

function emitEnded(io: TypedServer, game: Game, winner: Player | null): void {
  io.to(game.id).emit("game:ended", {
    winnerId: winner ? winner.id : null,
    winnerUsername: winner ? winner.username : null,
  });
  io.to(game.id).emit("room:updated", game.toInfo());
}

export function registerSocketHandlers(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    socket.on("room:join", ({ room, username }, callback) => {
      const result = gameManager.joinGame(room, socket.id, username);

      if (!result.ok || !result.game) {
        socket.emit("room:error", { message: result.error || "Failed to join room" });
        if (callback) callback({ success: false, error: result.error });
        return;
      }

      socket.data.roomId = result.game.id;
      socket.data.username = username.trim();
      socket.join(result.game.id);

      if (callback) callback({ success: true, room: result.game.toInfo() });
      io.to(result.game.id).emit("room:updated", result.game.toInfo());
    });

    socket.on("room:leave", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const { game, wasDeleted, end } = gameManager.leaveGame(roomId, socket.id);
      socket.leave(roomId);
      delete socket.data.roomId;

      if (!wasDeleted && game) {
        if (end.ended) emitEnded(io, game, end.winner);
        else io.to(roomId).emit("room:updated", game.toInfo());
      }
    });

    socket.on("room:setMode", ({ mode }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const { ok, game } = gameManager.setMode(roomId, socket.id, mode);
      if (ok && game) io.to(roomId).emit("room:updated", game.toInfo());
    });

    socket.on("queue:join", ({ username }, callback) => {
      const name = username.trim() || `player_${Math.floor(100 + Math.random() * 900)}`;
      socket.data.username = name;

      if (socket.data.roomId) {
        const { game, wasDeleted } = gameManager.leaveGame(socket.data.roomId, socket.id);
        socket.leave(socket.data.roomId);
        if (!wasDeleted && game) io.to(game.id).emit("room:updated", game.toInfo());
        delete socket.data.roomId;
      }

      const queued = matchmakingQueue.addPlayer(socket.id, name);

      if (!queued.matched) {
        if (callback) callback({ success: true, queued: true });
        return;
      }

      const { roomId, player1, player2 } = queued.match;
      gameManager.joinGame(roomId, player1.socketId, player1.username);
      const join2 = gameManager.joinGame(roomId, player2.socketId, player2.username);
      const game = join2.game;
      if (!game) {
        if (callback) callback({ success: false, queued: false, error: "Matchmaking failed." });
        return;
      }

      for (const entry of [player1, player2]) {
        const sock = io.sockets.sockets.get(entry.socketId);
        if (sock) {
          sock.data.roomId = roomId;
          sock.data.username = entry.username;
          sock.join(roomId);
        }
        io.to(entry.socketId).emit("queue:matched", { room: roomId, username: entry.username });
      }

      game.start();
      io.to(roomId).emit("room:updated", game.toInfo());
      io.to(roomId).emit("game:started", { pieces: game.pieceTypes(), mode: game.mode });

      if (callback) callback({ success: true, queued: false });
    });

    socket.on("queue:leave", () => {
      matchmakingQueue.removePlayer(socket.id);
    });

    socket.on("game:start", (callback) => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        if (callback) callback({ success: false, error: "You are not in a room." });
        return;
      }

      const { ok, error, game } = gameManager.startGame(roomId, socket.id);
      if (!ok || !game) {
        if (callback) callback({ success: false, error });
        return;
      }

      io.to(roomId).emit("room:updated", game.toInfo());
      io.to(roomId).emit("game:started", { pieces: game.pieceTypes(), mode: game.mode });
      if (callback) callback({ success: true });
    });

    socket.on("game:requestPieces", ({ haveCount }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const game = gameManager.getGame(roomId);
      if (!game || !game.isPlaying) return;
      const pieces = game.ensurePieces(haveCount);
      io.to(roomId).emit("game:pieces", { pieces });
    });

    socket.on("game:linesCleared", ({ count }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const game = gameManager.getGame(roomId);
      if (!game || !game.isPlaying) return;

      const penalty = game.penaltyFor(count);
      if (penalty > 0) {
        socket.to(roomId).emit("game:penalty", {
          count: penalty,
          from: socket.data.username || "opponent",
        });
      }
    });

    socket.on("game:spectrum", ({ spectrum }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const game = gameManager.getGame(roomId);
      if (!game) return;
      const player = game.getPlayer(socket.id);
      if (!player) return;

      player.setSpectrum(spectrum);
      socket.to(roomId).emit("game:spectrum", {
        playerId: socket.id,
        username: player.username,
        spectrum: player.spectrum,
      });
    });

    socket.on("game:over", ({ score, lines }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const game = gameManager.getGame(roomId);
      if (!game) return;

      game.updateScore(socket.id, score, lines);
      const player = game.eliminate(socket.id);
      if (!player) return;

      leaderboard.record(player.username, score, lines, game.mode);
      io.to(roomId).emit("game:eliminated", { playerId: player.id, username: player.username });

      const end = game.checkEnd();
      if (end.ended) emitEnded(io, game, end.winner);
      else io.to(roomId).emit("room:updated", game.toInfo());
    });

    socket.on("disconnect", () => {
      matchmakingQueue.removePlayer(socket.id);

      const roomId = socket.data.roomId;
      if (!roomId) return;

      const { game, wasDeleted, end } = gameManager.leaveGame(roomId, socket.id);
      if (!wasDeleted && game) {
        if (end.ended) emitEnded(io, game, end.winner);
        else io.to(roomId).emit("room:updated", game.toInfo());
      }
    });
  });
}

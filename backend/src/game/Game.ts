import { Player } from "./Player.ts";
import { Piece } from "./Piece.ts";
import type { GameMode, RoomInfo, TetrominoType } from "../schema/socket.ts";

const PIECE_BUFFER = 14;

export class Game {
  public readonly id: string;
  public leaderId: string;
  public isPlaying: boolean;
  public mode: GameMode;
  public players: Player[];
  public pieces: Piece[];
  private startedWith: number;

  constructor(id: string) {
    this.id = id;
    this.leaderId = "";
    this.isPlaying = false;
    this.mode = "classic";
    this.players = [];
    this.pieces = [];
    this.startedWith = 0;
  }

  public getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  public hasUsername(username: string): boolean {
    const lower = username.toLowerCase();
    return this.players.some((p) => p.username.toLowerCase() === lower);
  }

  public addPlayer(
    id: string,
    username: string
  ): { ok: boolean; error?: string; player?: Player } {
    const existingById = this.getPlayer(id);
    if (existingById) {
      return { ok: true, player: existingById };
    }

    const reconnecting = this.players.find(
      (p) => p.username.toLowerCase() === username.toLowerCase()
    );
    if (reconnecting) {
      const wasLeader = reconnecting.id === this.leaderId;
      reconnecting.id = id;
      if (wasLeader) this.leaderId = id;
      return { ok: true, player: reconnecting };
    }

    if (this.isPlaying) {
      return { ok: false, error: "Game is already in progress in this room." };
    }

    const isFirst = this.players.length === 0;
    const player = new Player(id, username, isFirst ? "leader" : "player");
    if (isFirst) this.leaderId = id;
    this.players.push(player);
    return { ok: true, player };
  }

  public removePlayer(id: string): {
    leaderChanged: boolean;
    end: { ended: boolean; winner: Player | null };
  } {
    const before = this.players.length;
    this.players = this.players.filter((p) => p.id !== id);

    let leaderChanged = false;
    if (this.leaderId === id && this.players.length > 0) {
      const next = this.players[0];
      next.role = "leader";
      this.leaderId = next.id;
      leaderChanged = true;
    }

    let end: { ended: boolean; winner: Player | null } = { ended: false, winner: null };
    if (this.players.length < before && this.isPlaying) {
      end = this.checkEnd();
    }

    return { leaderChanged, end };
  }

  public isEmpty(): boolean {
    return this.players.length === 0;
  }

  public setMode(mode: GameMode): void {
    if (!this.isPlaying) this.mode = mode;
  }

  public start(): void {
    this.isPlaying = true;
    this.startedWith = this.players.length;
    this.pieces = [...Piece.bag(), ...Piece.bag()];
    for (const player of this.players) player.reset();
  }

  public pieceTypes(): TetrominoType[] {
    return this.pieces.map((p) => p.type);
  }

  public ensurePieces(haveCount: number): TetrominoType[] {
    const target = haveCount + PIECE_BUFFER;
    while (this.pieces.length < target) {
      this.pieces.push(...Piece.bag());
    }
    return this.pieceTypes();
  }

  public penaltyFor(linesCleared: number): number {
    return linesCleared > 1 ? linesCleared - 1 : 0;
  }

  public updateScore(id: string, score: number, lines: number): void {
    const player = this.getPlayer(id);
    if (!player) return;
    player.score = score;
    player.lines = lines;
  }

  public aliveCount(): number {
    return this.players.filter((p) => p.isAlive).length;
  }

  public eliminate(id: string): Player | undefined {
    const player = this.getPlayer(id);
    if (!player || !player.isAlive) return undefined;
    player.isAlive = false;
    return player;
  }

  public checkEnd(): { ended: boolean; winner: Player | null } {
    if (!this.isPlaying) return { ended: false, winner: null };

    const alive = this.players.filter((p) => p.isAlive);

    if (this.startedWith > 1 && alive.length <= 1) {
      this.isPlaying = false;
      return { ended: true, winner: alive[0] ?? null };
    }

    if (this.startedWith <= 1 && alive.length === 0) {
      this.isPlaying = false;
      return { ended: true, winner: this.players[0] ?? null };
    }

    return { ended: false, winner: null };
  }

  public toInfo(): RoomInfo {
    return {
      id: this.id,
      leaderId: this.leaderId,
      isPlaying: this.isPlaying,
      mode: this.mode,
      players: this.players.map((p) => p.toInfo()),
    };
  }
}

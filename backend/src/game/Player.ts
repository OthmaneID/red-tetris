import type { PlayerInfo, PlayerRole } from "../schema/socket.ts";

const EMPTY_SPECTRUM = (): number[] => Array(10).fill(0);

export class Player {
  public id: string;
  public readonly username: string;
  public role: PlayerRole;
  public isAlive: boolean;
  public score: number;
  public lines: number;
  public spectrum: number[];

  constructor(id: string, username: string, role: PlayerRole = "player") {
    this.id = id;
    this.username = username;
    this.role = role;
    this.isAlive = true;
    this.score = 0;
    this.lines = 0;
    this.spectrum = EMPTY_SPECTRUM();
  }

  public reset(): void {
    this.isAlive = true;
    this.score = 0;
    this.lines = 0;
    this.spectrum = EMPTY_SPECTRUM();
  }

  public setSpectrum(spectrum: number[]): void {
    this.spectrum = spectrum.slice(0, 10);
  }

  public toInfo(): PlayerInfo {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      isAlive: this.isAlive,
      score: this.score,
      spectrum: this.spectrum,
    };
  }
}

import type { TetrominoType } from "../schema/socket.ts";

const SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export const TETROMINO_TYPES: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export class Piece {
  public readonly type: TetrominoType;
  public readonly shape: number[][];

  constructor(type: TetrominoType) {
    this.type = type;
    this.shape = SHAPES[type].map((row) => [...row]);
  }

  public clone(): Piece {
    return new Piece(this.type);
  }

  public static fromType(type: TetrominoType): Piece {
    return new Piece(type);
  }

  public static bag(): Piece[] {
    const types = [...TETROMINO_TYPES];
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    return types.map((type) => new Piece(type));
  }
}

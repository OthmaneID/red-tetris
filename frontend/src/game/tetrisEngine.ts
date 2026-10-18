import { PENALTY_CELL, type BoardMatrix } from "../constants/tetris.ts";
import type { TetrominoType } from "../types/socket.ts";

export const BOARD_ROWS = 20;
export const BOARD_COLS = 10;

export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
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

export const TETROMINO_LIST: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export interface ActivePiece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
}

export function createEmptyBoard(): BoardMatrix {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));
}

export function generateBag(): TetrominoType[] {
  const bag = [...TETROMINO_LIST];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function createPiece(type: TetrominoType): ActivePiece {
  const shape = TETROMINO_SHAPES[type].map((row) => [...row]);
  const width = shape[0].length;
  const x = Math.floor((BOARD_COLS - width) / 2);
  return { type, shape, x, y: 0 };
}

export function checkCollision(
  piece: { shape: number[][]; x: number; y: number },
  board: BoardMatrix
): boolean {
  const { shape, x, y } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardX = x + c;
        const boardY = y + r;

        if (boardX < 0 || boardX >= BOARD_COLS) return true;
        if (boardY >= BOARD_ROWS) return true;
        if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
      }
    }
  }

  return false;
}

export function lockPieceToBoard(piece: ActivePiece, board: BoardMatrix): BoardMatrix {
  const newBoard = board.map((row) => [...row]);
  const { shape, x, y, type } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardY = y + r;
        const boardX = x + c;
        if (boardY >= 0 && boardY < BOARD_ROWS && boardX >= 0 && boardX < BOARD_COLS) {
          newBoard[boardY][boardX] = type;
        }
      }
    }
  }

  return newBoard;
}

function isClearableRow(row: (string | number)[]): boolean {
  return row.every((cell) => cell !== 0 && cell !== PENALTY_CELL);
}

export function clearFullLines(board: BoardMatrix): {
  newBoard: BoardMatrix;
  linesCleared: number;
} {
  const remainingRows = board.filter((row) => !isClearableRow(row));
  const linesCleared = BOARD_ROWS - remainingRows.length;

  if (linesCleared === 0) {
    return { newBoard: board, linesCleared: 0 };
  }

  const emptyRows = Array.from({ length: linesCleared }, () => Array(BOARD_COLS).fill(0));
  return { newBoard: [...emptyRows, ...remainingRows], linesCleared };
}

export function addPenaltyLines(board: BoardMatrix, count: number): BoardMatrix {
  if (count <= 0) return board;

  const kept = board.slice(count);
  const penaltyRows = Array.from({ length: count }, () =>
    Array(BOARD_COLS).fill(PENALTY_CELL)
  );
  const merged = [...kept, ...penaltyRows];

  while (merged.length < BOARD_ROWS) {
    merged.unshift(Array(BOARD_COLS).fill(0));
  }

  return merged.slice(merged.length - BOARD_ROWS);
}

export function computeSpectrum(board: BoardMatrix): number[] {
  const heights: number[] = Array(BOARD_COLS).fill(0);

  for (let c = 0; c < BOARD_COLS; c++) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      if (board[r][c] !== 0) {
        heights[c] = BOARD_ROWS - r;
        break;
      }
    }
  }

  return heights;
}

export function getDisplayBoard(board: BoardMatrix, piece: ActivePiece | null): BoardMatrix {
  if (!piece) return board;

  const display = board.map((row) => [...row]);
  const { shape, x, y, type } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardY = y + r;
        const boardX = x + c;
        if (boardY >= 0 && boardY < BOARD_ROWS && boardX >= 0 && boardX < BOARD_COLS) {
          display[boardY][boardX] = type;
        }
      }
    }
  }

  return display;
}

export function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }

  return rotated;
}

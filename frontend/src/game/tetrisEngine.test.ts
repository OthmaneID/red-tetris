import { describe, it, expect } from "vitest";
import { PENALTY_CELL } from "../constants/tetris.ts";
import {
  BOARD_COLS,
  BOARD_ROWS,
  addPenaltyLines,
  checkCollision,
  clearFullLines,
  computeSpectrum,
  createEmptyBoard,
  createPiece,
  generateBag,
  getDisplayBoard,
  lockPieceToBoard,
  rotateMatrix,
} from "./tetrisEngine.ts";

const fullRow = () => Array(BOARD_COLS).fill("I");

describe("tetrisEngine", () => {
  it("creates an empty 20x10 board", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_ROWS);
    expect(board[0]).toHaveLength(BOARD_COLS);
    expect(board.flat().every((c) => c === 0)).toBe(true);
  });

  it("produces a complete shuffled 7-bag", () => {
    const bag = generateBag();
    expect(bag).toHaveLength(7);
    expect(new Set(bag).size).toBe(7);
  });

  it("spawns a piece centered at the top", () => {
    const piece = createPiece("O");
    expect(piece.type).toBe("O");
    expect(piece.y).toBe(0);
    expect(piece.x).toBe(Math.floor((BOARD_COLS - piece.shape[0].length) / 2));
  });

  it("detects wall, floor and block collisions", () => {
    const board = createEmptyBoard();
    const piece = createPiece("O");
    expect(checkCollision(piece, board)).toBe(false);
    expect(checkCollision({ ...piece, x: -1 }, board)).toBe(true);
    expect(checkCollision({ ...piece, x: BOARD_COLS }, board)).toBe(true);
    expect(checkCollision({ ...piece, y: BOARD_ROWS }, board)).toBe(true);

    const occupied = createEmptyBoard();
    occupied[1][piece.x] = "T";
    expect(checkCollision(piece, occupied)).toBe(true);
  });

  it("locks a piece into a fresh board without mutating the input", () => {
    const board = createEmptyBoard();
    const piece = createPiece("O");
    const next = lockPieceToBoard(piece, board);
    expect(next).not.toBe(board);
    const filled = next.flat().filter((c) => c !== 0).length;
    expect(filled).toBe(4);
    expect(board.flat().every((c) => c === 0)).toBe(true);
  });

  it("clears full rows and counts them", () => {
    const board = createEmptyBoard();
    board[BOARD_ROWS - 1] = fullRow();
    board[BOARD_ROWS - 2] = fullRow();
    const { newBoard, linesCleared } = clearFullLines(board);
    expect(linesCleared).toBe(2);
    expect(newBoard).toHaveLength(BOARD_ROWS);
    expect(newBoard[BOARD_ROWS - 1].every((c) => c === 0)).toBe(true);
  });

  it("returns the same board when nothing clears", () => {
    const board = createEmptyBoard();
    const { newBoard, linesCleared } = clearFullLines(board);
    expect(linesCleared).toBe(0);
    expect(newBoard).toBe(board);
  });

  it("never clears indestructible penalty rows", () => {
    const board = createEmptyBoard();
    board[BOARD_ROWS - 1] = Array(BOARD_COLS).fill(PENALTY_CELL);
    const { newBoard, linesCleared } = clearFullLines(board);
    expect(linesCleared).toBe(0);
    expect(newBoard[BOARD_ROWS - 1].every((c) => c === PENALTY_CELL)).toBe(true);
  });

  it("adds penalty rows at the bottom and keeps board height", () => {
    const board = createEmptyBoard();
    board[BOARD_ROWS - 1][0] = "T";
    const penalized = addPenaltyLines(board, 2);
    expect(penalized).toHaveLength(BOARD_ROWS);
    expect(penalized[BOARD_ROWS - 1].every((c) => c === PENALTY_CELL)).toBe(true);
    expect(penalized[BOARD_ROWS - 2].every((c) => c === PENALTY_CELL)).toBe(true);
    expect(penalized[BOARD_ROWS - 3][0]).toBe("T");
  });

  it("returns the board unchanged for non-positive penalties", () => {
    const board = createEmptyBoard();
    expect(addPenaltyLines(board, 0)).toBe(board);
  });

  it("computes per-column spectrum heights", () => {
    const board = createEmptyBoard();
    board[BOARD_ROWS - 1][0] = "T";
    board[BOARD_ROWS - 3][5] = "I";
    const spectrum = computeSpectrum(board);
    expect(spectrum).toHaveLength(BOARD_COLS);
    expect(spectrum[0]).toBe(1);
    expect(spectrum[5]).toBe(3);
    expect(spectrum[9]).toBe(0);
  });

  it("overlays the active piece for display", () => {
    const board = createEmptyBoard();
    const piece = createPiece("T");
    const display = getDisplayBoard(board, piece);
    expect(display.flat().filter((c) => c === "T").length).toBe(4);
    expect(getDisplayBoard(board, null)).toBe(board);
  });

  it("rotates a matrix 90 degrees clockwise", () => {
    const input = [
      [1, 0],
      [0, 0],
    ];
    expect(rotateMatrix(input)).toEqual([
      [0, 1],
      [0, 0],
    ]);
  });
});

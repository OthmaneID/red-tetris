import { describe, it, expect } from "vitest";
import { Piece, TETROMINO_TYPES } from "./Piece.ts";

describe("Piece", () => {
  it("exposes the 7 tetromino types", () => {
    expect(TETROMINO_TYPES).toHaveLength(7);
    expect(new Set(TETROMINO_TYPES).size).toBe(7);
  });

  it("builds a piece with an independent shape copy", () => {
    const piece = new Piece("T");
    expect(piece.type).toBe("T");
    piece.shape[0][0] = 9;
    const fresh = new Piece("T");
    expect(fresh.shape[0][0]).not.toBe(9);
  });

  it("clones to the same type", () => {
    const original = new Piece("L");
    const clone = original.clone();
    expect(clone.type).toBe("L");
    expect(clone).not.toBe(original);
  });

  it("creates from type via factory", () => {
    expect(Piece.fromType("Z").type).toBe("Z");
  });

  it("produces a full 7-bag with every type once", () => {
    const bag = Piece.bag();
    expect(bag).toHaveLength(7);
    const types = bag.map((p) => p.type).sort();
    expect(types).toEqual([...TETROMINO_TYPES].sort());
  });
});

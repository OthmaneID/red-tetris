import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardMatrix } from "../constants/tetris.ts";
import type { GameMode, TetrominoType } from "../types/socket.ts";
import {
  type ActivePiece,
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

const LINE_POINTS = [0, 100, 300, 500, 800];
const REFILL_THRESHOLD = 5;

export interface UseTetrisOptions {
  onLinesCleared?: (count: number) => void;
  onSpectrumChange?: (spectrum: number[]) => void;
  onGameOver?: (stats: { score: number; lines: number }) => void;
  onNeedPieces?: (consumed: number) => void;
}

export interface UseTetrisReturn {
  board: BoardMatrix;
  currentPiece: ActivePiece | null;
  nextPiece: TetrominoType | null;
  score: number;
  lines: number;
  level: number;
  mode: GameMode;
  isGameOver: boolean;
  isPlaying: boolean;
  endReason: "topped_out" | "abandoned" | null;
  startSolo: (mode?: GameMode) => void;
  startMultiplayer: (pieces: TetrominoType[], mode: GameMode) => void;
  setSequence: (pieces: TetrominoType[]) => void;
  applyPenalty: (count: number) => void;
  endGame: (reason?: "topped_out" | "abandoned") => void;
  resetGame: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  hardDrop: () => void;
  rotate: () => void;
}

export function useTetris(options: UseTetrisOptions = {}): UseTetrisReturn {
  const [board, setBoard] = useState<BoardMatrix>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [mode, setMode] = useState<GameMode>("classic");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [endReason, setEndReason] = useState<"topped_out" | "abandoned" | null>(null);

  const sequenceRef = useRef<TetrominoType[]>([]);
  const seqIndexRef = useRef(0);
  const requestedLenRef = useRef(0);
  const multiRef = useRef(false);
  const modeRef = useRef<GameMode>("classic");

  const currentPieceRef = useRef<ActivePiece | null>(null);
  const nextPieceRef = useRef<TetrominoType | null>(null);
  const boardRef = useRef<BoardMatrix>(board);
  const isPlayingRef = useRef(isPlaying);
  const isGameOverRef = useRef(isGameOver);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  currentPieceRef.current = currentPiece;
  boardRef.current = board;
  isPlayingRef.current = isPlaying;
  isGameOverRef.current = isGameOver;

  const pullNext = useCallback((): TetrominoType => {
    const seq = sequenceRef.current;
    if (seqIndexRef.current >= seq.length) {
      seq.push(...generateBag());
    }
    const type = seq[seqIndexRef.current];
    seqIndexRef.current += 1;

    if (multiRef.current && optionsRef.current.onNeedPieces) {
      const remaining = seq.length - seqIndexRef.current;
      if (remaining <= REFILL_THRESHOLD && seq.length !== requestedLenRef.current) {
        requestedLenRef.current = seq.length;
        optionsRef.current.onNeedPieces(seqIndexRef.current);
      }
    }

    return type;
  }, []);

  const endGame = useCallback((reason: "topped_out" | "abandoned" = "abandoned") => {
    setIsPlaying(false);
    setIsGameOver(true);
    setEndReason(reason);
    setCurrentPiece(null);
    currentPieceRef.current = null;
    isPlayingRef.current = false;
  }, []);

  const triggerTopOut = useCallback(() => {
    endGame("topped_out");
    if (optionsRef.current.onGameOver) {
      optionsRef.current.onGameOver({ score: scoreRef.current, lines: linesRef.current });
    }
  }, [endGame]);

  const settle = useCallback(
    (lockedBoard: BoardMatrix) => {
      const { newBoard, linesCleared } = clearFullLines(lockedBoard);

      if (linesCleared > 0) {
        scoreRef.current += (LINE_POINTS[linesCleared] || 100) * levelRef.current;
        linesRef.current += linesCleared;
        levelRef.current = Math.floor(linesRef.current / 10) + 1;
        setScore(scoreRef.current);
        setLines(linesRef.current);
        setLevel(levelRef.current);
        if (optionsRef.current.onLinesCleared) optionsRef.current.onLinesCleared(linesCleared);
      }

      boardRef.current = newBoard;
      setBoard(newBoard);
      if (optionsRef.current.onSpectrumChange) {
        optionsRef.current.onSpectrumChange(computeSpectrum(newBoard));
      }

      const upcoming = nextPieceRef.current ?? pullNext();
      const newNext = pullNext();
      const spawned = createPiece(upcoming);

      if (checkCollision(spawned, newBoard)) {
        triggerTopOut();
        return;
      }

      currentPieceRef.current = spawned;
      nextPieceRef.current = newNext;
      setCurrentPiece(spawned);
      setNextPiece(newNext);
    },
    [pullNext, triggerTopOut]
  );

  const moveDown = useCallback(() => {
    const active = currentPieceRef.current;
    if (!active || !isPlayingRef.current || isGameOverRef.current) return;

    const nextPos = { ...active, y: active.y + 1 };
    if (!checkCollision(nextPos, boardRef.current)) {
      currentPieceRef.current = nextPos;
      setCurrentPiece(nextPos);
    } else {
      settle(lockPieceToBoard(active, boardRef.current));
    }
  }, [settle]);

  const moveLeft = useCallback(() => {
    const active = currentPieceRef.current;
    if (!active || !isPlayingRef.current || isGameOverRef.current) return;
    const nextPos = { ...active, x: active.x - 1 };
    if (!checkCollision(nextPos, boardRef.current)) {
      currentPieceRef.current = nextPos;
      setCurrentPiece(nextPos);
    }
  }, []);

  const moveRight = useCallback(() => {
    const active = currentPieceRef.current;
    if (!active || !isPlayingRef.current || isGameOverRef.current) return;
    const nextPos = { ...active, x: active.x + 1 };
    if (!checkCollision(nextPos, boardRef.current)) {
      currentPieceRef.current = nextPos;
      setCurrentPiece(nextPos);
    }
  }, []);

  const rotate = useCallback(() => {
    const active = currentPieceRef.current;
    if (!active || !isPlayingRef.current || isGameOverRef.current) return;

    const rotatedShape = rotateMatrix(active.shape);
    const offsets = [0, -1, 1, -2, 2];
    for (const offset of offsets) {
      const candidate = { ...active, shape: rotatedShape, x: active.x + offset };
      if (!checkCollision(candidate, boardRef.current)) {
        currentPieceRef.current = candidate;
        setCurrentPiece(candidate);
        return;
      }
    }
  }, []);

  const hardDrop = useCallback(() => {
    const active = currentPieceRef.current;
    if (!active || !isPlayingRef.current || isGameOverRef.current) return;

    let targetY = active.y;
    while (!checkCollision({ ...active, y: targetY + 1 }, boardRef.current)) {
      targetY++;
    }

    const dropped = { ...active, y: targetY };
    currentPieceRef.current = dropped;
    setCurrentPiece(dropped);
    settle(lockPieceToBoard(dropped, boardRef.current));
  }, [settle]);

  const applyPenalty = useCallback((count: number) => {
    if (count <= 0 || !isPlayingRef.current) return;

    const penalized = addPenaltyLines(boardRef.current, count);
    boardRef.current = penalized;
    setBoard(penalized);

    const active = currentPieceRef.current;
    if (active) {
      let y = active.y;
      while (y > -4 && checkCollision({ ...active, y }, penalized)) y--;
      const adjusted = { ...active, y };
      currentPieceRef.current = adjusted;
      setCurrentPiece(adjusted);
    }

    if (optionsRef.current.onSpectrumChange) {
      optionsRef.current.onSpectrumChange(computeSpectrum(penalized));
    }
  }, []);

  const begin = useCallback(
    (seq: TetrominoType[], multi: boolean, gameMode: GameMode) => {
      sequenceRef.current = [...seq];
      seqIndexRef.current = 0;
      requestedLenRef.current = 0;
      multiRef.current = multi;
      modeRef.current = gameMode;
      setMode(gameMode);

      scoreRef.current = 0;
      linesRef.current = 0;
      levelRef.current = 1;

      const firstType = pullNext();
      const secondType = pullNext();
      const fresh = createEmptyBoard();

      boardRef.current = fresh;
      const spawned = createPiece(firstType);
      currentPieceRef.current = spawned;
      nextPieceRef.current = secondType;

      setBoard(fresh);
      setCurrentPiece(spawned);
      setNextPiece(secondType);
      setScore(0);
      setLines(0);
      setLevel(1);
      setIsGameOver(false);
      setEndReason(null);
      setIsPlaying(true);
      isPlayingRef.current = true;
      isGameOverRef.current = false;
    },
    [pullNext]
  );

  const startSolo = useCallback(
    (gameMode: GameMode = "classic") => {
      begin([...generateBag(), ...generateBag()], false, gameMode);
    },
    [begin]
  );

  const startMultiplayer = useCallback(
    (pieces: TetrominoType[], gameMode: GameMode) => {
      begin(pieces, true, gameMode);
    },
    [begin]
  );

  const setSequence = useCallback((pieces: TetrominoType[]) => {
    sequenceRef.current = pieces;
  }, []);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setIsGameOver(false);
    setEndReason(null);
    setCurrentPiece(null);
    setNextPiece(null);
    setScore(0);
    setLines(0);
    setLevel(1);
    setBoard(createEmptyBoard());
    sequenceRef.current = [];
    seqIndexRef.current = 0;
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    currentPieceRef.current = null;
    nextPieceRef.current = null;
    isPlayingRef.current = false;
    isGameOverRef.current = false;
  }, []);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const isFast = modeRef.current === "gravity";
    const base = isFast ? 400 : 800;
    const step = isFast ? 45 : 70;
    const min = isFast ? 60 : 100;
    const speed = Math.max(min, base - (level - 1) * step);

    const interval = setInterval(moveDown, speed);
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, level, moveDown]);

  const hideStack = mode === "invisible" && isPlaying && !isGameOver;
  const viewBoard = hideStack ? createEmptyBoard() : board;
  const displayBoard = getDisplayBoard(viewBoard, currentPiece);

  return {
    board: displayBoard,
    currentPiece,
    nextPiece,
    score,
    lines,
    level,
    mode,
    isGameOver,
    isPlaying,
    endReason,
    startSolo,
    startMultiplayer,
    setSequence,
    applyPenalty,
    endGame,
    resetGame,
    moveLeft,
    moveRight,
    moveDown,
    hardDrop,
    rotate,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socket } from "./socket.ts";
import { registerSocketListeners, socketEmitters } from "./events/socketEvents.ts";
import { Header } from "./components/Header.tsx";
import { Board } from "./components/Board.tsx";
import { SpectrumBoard } from "./components/SpectrumBoard.tsx";
import { RoomCard } from "./components/RoomCard.tsx";
import { StatsCard } from "./components/StatsCard.tsx";
import { ControlsCard } from "./components/ControlsCard.tsx";
import { NextPieceCard } from "./components/NextPieceCard.tsx";
import { LeaderboardCard } from "./components/LeaderboardCard.tsx";
import { ModeSelector } from "./components/ModeSelector.tsx";
import { useTetris } from "./game/useTetris.ts";
import { parseHash, updateHash } from "./utils/hashRouter.ts";
import type { GameMode, LeaderboardEntry, RoomInfo } from "./types/socket.ts";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
type UiMode = "Solo" | "Multiplayer";
type MatchResult = { outcome: "win" | "lose"; winner: string | null } | null;

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);

  const initialRoute = useMemo(() => parseHash(), []);
  const [room, setRoom] = useState(initialRoute.room);
  const [username, setUsername] = useState(initialRoute.username);

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isQueuing, setIsQueuing] = useState(false);
  const [gameMode, setGameMode] = useState<UiMode>("Solo");
  const [soloMode, setSoloMode] = useState<GameMode>("classic");

  const [liveSpectra, setLiveSpectra] = useState<Record<string, number[]>>({});
  const [matchResult, setMatchResult] = useState<MatchResult>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const gameModeRef = useRef<UiMode>(gameMode);
  gameModeRef.current = gameMode;

  const {
    board,
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
  } = useTetris({
    onLinesCleared: (count) => {
      if (gameModeRef.current === "Multiplayer") socketEmitters.sendLinesCleared(count);
    },
    onSpectrumChange: (spectrum) => {
      if (gameModeRef.current === "Multiplayer") socketEmitters.sendSpectrum(spectrum);
    },
    onGameOver: ({ score: finalScore, lines: finalLines }) => {
      if (gameModeRef.current === "Multiplayer") socketEmitters.sendGameOver(finalScore, finalLines);
    },
    onNeedPieces: (consumed) => {
      if (gameModeRef.current === "Multiplayer") socketEmitters.requestPieces(consumed);
    },
  });

  const fetchLeaderboard = useCallback(() => {
    fetch(`${BACKEND_URL}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.entries ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    function handleHashChange() {
      const { room: nextRoom, username: nextUser } = parseHash();
      setRoom(nextRoom);
      setUsername(nextUser);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (gameMode === "Multiplayer") updateHash(room, username);
  }, [gameMode, room, username]);

  const handleModeChange = (newMode: UiMode) => {
    if (newMode === gameMode) return;

    if (isQueuing) {
      socketEmitters.leaveQueue();
      setIsQueuing(false);
    }

    if (isPlaying) {
      endGame("abandoned");
      if (gameMode === "Multiplayer") socketEmitters.sendGameOver(score, lines);
    } else {
      resetGame();
    }

    setMatchResult(null);
    setGameMode(newMode);
  };

  useEffect(() => {
    const cleanup = registerSocketListeners({
      onConnect: () => {
        setIsConnected(true);
        setSocketId(socket.id ?? null);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setSocketId(null);
        setIsQueuing(false);
      },
      onRoomUpdated: (updatedRoom) => {
        setRoomInfo(updatedRoom);
        setRoomError(null);
      },
      onRoomError: (err) => setRoomError(err.message),
      onQueueMatched: ({ room: matchedRoom, username: matchedUser }) => {
        setIsQueuing(false);
        setRoom(matchedRoom);
        setUsername(matchedUser);
        updateHash(matchedRoom, matchedUser);
      },
      onGameStarted: ({ pieces, mode: gm }) => {
        setMatchResult(null);
        setLiveSpectra({});
        startMultiplayer(pieces, gm);
      },
      onPieces: ({ pieces }) => setSequence(pieces),
      onPenalty: ({ count }) => applyPenalty(count),
      onSpectrum: ({ playerId, spectrum }) => {
        setLiveSpectra((prev) => ({ ...prev, [playerId]: spectrum }));
      },
      onEliminated: () => undefined,
      onEnded: ({ winnerId, winnerUsername }) => {
        endGame(winnerId === socket.id ? "abandoned" : "topped_out");
        setMatchResult({
          outcome: winnerId === socket.id ? "win" : "lose",
          winner: winnerUsername,
        });
        fetchLeaderboard();
      },
    });
    return cleanup;
  }, [startMultiplayer, setSequence, applyPenalty, endGame, fetchLeaderboard]);

  useEffect(() => {
    if (gameMode === "Multiplayer" && isConnected && !isQueuing) {
      socketEmitters.joinRoom({ room, username }, (res) => {
        if (res.success && res.room) {
          setRoomInfo(res.room);
          setRoomError(null);
        } else if (res.error) {
          setRoomError(res.error);
        }
      });
    } else if (gameMode === "Solo") {
      if (isQueuing) {
        socketEmitters.leaveQueue();
        setIsQueuing(false);
      }
      socketEmitters.leaveRoom();
      setRoomInfo(null);
      setRoomError(null);
    }
  }, [gameMode, isConnected, room, username, isQueuing]);

  const isLeader = Boolean(roomInfo && socketId && roomInfo.leaderId === socketId);
  const roomMode: GameMode = roomInfo?.mode ?? "classic";

  const opponents = useMemo(() => {
    if (!roomInfo || !socketId) return [];
    return roomInfo.players
      .filter((p) => p.id !== socketId)
      .map((p) => ({
        id: p.id,
        username: p.username,
        isAlive: p.isAlive,
        spectrum: liveSpectra[p.id] ?? p.spectrum,
      }));
  }, [roomInfo, socketId, liveSpectra]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          moveLeft();
          break;
        case "ArrowRight":
          e.preventDefault();
          moveRight();
          break;
        case "ArrowDown":
          e.preventDefault();
          moveDown();
          break;
        case "ArrowUp":
          e.preventDefault();
          rotate();
          break;
        case "Space":
          e.preventDefault();
          hardDrop();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isGameOver, moveLeft, moveRight, moveDown, rotate, hardDrop]);

  const showBlockingOverlay =
    (gameMode === "Solo" && isGameOver) || (gameMode === "Multiplayer" && matchResult !== null);
  const isSpectating = gameMode === "Multiplayer" && isGameOver && matchResult === null;

  const onStartSolo = () => {
    setMatchResult(null);
    startSolo(soloMode);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono selection:bg-rose-500 selection:text-white">
      <Header
        room={room}
        username={username}
        isConnected={isConnected}
        socketId={socketId}
        gameMode={gameMode}
        onToggleMode={handleModeChange}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          {gameMode === "Multiplayer" ? (
            <RoomCard
              room={room}
              username={username}
              players={roomInfo?.players || []}
              errorMessage={roomError}
              isQueuing={isQueuing}
              isPlaying={isPlaying || Boolean(roomInfo?.isPlaying)}
              isLeader={isLeader}
              mode={roomMode}
              onStartGame={() => {
                setMatchResult(null);
                socketEmitters.startGame((res) => {
                  if (!res.success && res.error) setRoomError(res.error);
                });
              }}
              onSetMode={(m) => socketEmitters.setMode(m)}
              onJoinQueue={() => {
                setIsQueuing(true);
                socketEmitters.joinQueue({ username }, (res) => {
                  if (!res.success && res.error) {
                    setIsQueuing(false);
                    setRoomError(res.error);
                  }
                });
              }}
              onLeaveQueue={() => {
                socketEmitters.leaveQueue();
                setIsQueuing(false);
              }}
            />
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
              <h2 className="text-xs uppercase text-neutral-500 font-bold tracking-widest">
                Solo Practice
              </h2>
              <p className="text-xs text-neutral-400">
                Play standard Tetris. Arrows move and rotate, space for hard drop.
              </p>
              <ModeSelector value={soloMode} disabled={isPlaying} onChange={setSoloMode} />
              <button
                type="button"
                onClick={onStartSolo}
                className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors cursor-pointer border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              >
                {isPlaying ? "Restart Game" : isGameOver ? "Play Again" : "Start Game"}
              </button>
            </div>
          )}
          <ControlsCard />
        </div>

        <div
          className={`flex flex-col items-center ${
            gameMode === "Multiplayer" ? "lg:col-span-6" : "lg:col-span-5"
          }`}
        >
          {isSpectating && (
            <div className="mb-3 w-full text-center text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded py-1.5">
              You topped out — spectating until the match ends.
            </div>
          )}

          <div className="w-full bg-neutral-900 border-2 border-neutral-800 p-3 sm:p-4 rounded-xl shadow-2xl relative">
            {showBlockingOverlay && (
              <div className="absolute inset-0 z-20 bg-neutral-950/85 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl p-6 text-center">
                <span
                  className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                    matchResult?.outcome === "win" ? "text-emerald-400" : "text-rose-500"
                  }`}
                >
                  {gameMode === "Multiplayer"
                    ? matchResult?.outcome === "win"
                      ? "Victory"
                      : "Defeat"
                    : endReason === "abandoned"
                    ? "Game Ended"
                    : "Game Over"}
                </span>
                <h3 className="text-2xl font-black text-white mb-2">
                  {gameMode === "Multiplayer"
                    ? matchResult?.outcome === "win"
                      ? "You are the last one standing"
                      : `${matchResult?.winner ?? "Opponent"} wins`
                    : endReason === "abandoned"
                    ? "Session Completed"
                    : "Blocks Topped Out"}
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Score: <span className="text-amber-400 font-bold">{score}</span> | Lines:{" "}
                  <span className="text-cyan-400 font-bold">{lines}</span>
                </p>
                {gameMode === "Solo" && (
                  <button
                    type="button"
                    onClick={onStartSolo}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-5 rounded text-sm transition-colors cursor-pointer border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  >
                    Play Again
                  </button>
                )}
              </div>
            )}

            {gameMode === "Multiplayer" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-items-center">
                <Board
                  board={board}
                  playerName={username}
                  badgeLabel="You"
                  statusText={isGameOver ? "Out" : isPlaying ? "Playing" : "Ready"}
                  isStatusPositive={!isGameOver && isPlaying}
                  isOpponent={false}
                />
                {opponents.length > 0 ? (
                  opponents.map((opp) => (
                    <SpectrumBoard
                      key={opp.id}
                      spectrum={opp.spectrum}
                      playerName={opp.username}
                      isAlive={opp.isAlive}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center text-xs text-neutral-600 border border-dashed border-neutral-800 rounded-lg w-full min-h-48">
                    Waiting for opponents…
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center w-full">
                <Board
                  board={board}
                  playerName={username}
                  badgeLabel="Solo"
                  statusText={
                    isGameOver
                      ? endReason === "abandoned"
                        ? "Completed"
                        : "Game Over"
                      : isPlaying
                      ? "In Game"
                      : "Press Start"
                  }
                  isStatusPositive={!isGameOver && isPlaying}
                  isOpponent={false}
                />
              </div>
            )}
          </div>
        </div>

        <div
          className={`space-y-4 ${
            gameMode === "Multiplayer" ? "lg:col-span-3" : "lg:col-span-4"
          }`}
        >
          <StatsCard score={score} lines={lines} level={level} />
          <NextPieceCard type={nextPiece ?? undefined} />
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest text-center">
            Mode: <span className="text-neutral-400">{mode}</span>
          </div>
          <LeaderboardCard entries={leaderboard} />
        </div>
      </main>
    </div>
  );
}

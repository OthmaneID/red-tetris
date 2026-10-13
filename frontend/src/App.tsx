import { useEffect, useState } from "react";
import { socket } from "./socket.ts";
import { registerSocketListeners } from "./events/socketEvents.ts";
import { Header } from "./components/Header.tsx";
import { Board } from "./components/Board.tsx";
import { RoomCard } from "./components/RoomCard.tsx";
import { StatsCard } from "./components/StatsCard.tsx";
import { ControlsCard } from "./components/ControlsCard.tsx";
import { NextPieceCard } from "./components/NextPieceCard.tsx";
import type { BoardMatrix } from "./constants/tetris.ts";
import "./App.css";

// 10x20 standard board representation
const INITIAL_BOARD: BoardMatrix = Array.from({ length: 20 }, () =>
  Array(10).fill(0)
);

// Sample opponent spectrum mockup (rows filled at bottom)
const INITIAL_OPPONENT_SPECTRUM: BoardMatrix = Array.from({ length: 20 }, (_, row) =>
  Array(10).fill(row >= 15 ? 1 : 0)
);

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [room] = useState("alpha");
  const [username] = useState("player1");
  const [score] = useState(1240);
  const [lines] = useState(12);
  const [level] = useState(2);
  const [board] = useState<BoardMatrix>(INITIAL_BOARD);
  const [opponentBoard] = useState<BoardMatrix>(INITIAL_OPPONENT_SPECTRUM);
  const [opponentName] = useState("player2");
  const [opponentAlive] = useState(true);
  const [gameMode, setGameMode] = useState<"Solo" | "Multiplayer">("Solo");

  useEffect(() => {
    const cleanup = registerSocketListeners({
      onConnect: () => {
        setIsConnected(true);
        setSocketId(socket.id ?? null);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setSocketId(null);
      },
    });

    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono selection:bg-rose-500 selection:text-white">
      {/* Top Header Bar with Mode Toggle */}
      <Header
        room={room}
        username={username}
        isConnected={isConnected}
        socketId={socketId}
        gameMode={gameMode}
        onToggleMode={setGameMode}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Room info (Multiplayer only) & Controls */}
        <div className="lg:col-span-3 space-y-4">
          {gameMode === "Multiplayer" ? (
            <RoomCard room={room} username={username} isLeader={true} />
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <h2 className="text-xs uppercase text-neutral-500 font-bold tracking-widest mb-3">
                Solo Practice
              </h2>
              <p className="text-xs text-neutral-400 mb-4">
                Play standard Tetris at your own pace. Clear lines to level up and increase speed.
              </p>
              <button
                type="button"
                className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors cursor-pointer border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              >
                Start Solo Game
              </button>
            </div>
          )}
          <ControlsCard />
        </div>

        {/* Center Arena: Adapts width and contents based on gameMode */}
        <div
          className={`flex flex-col items-center ${
            gameMode === "Multiplayer" ? "lg:col-span-6" : "lg:col-span-5"
          }`}
        >
          <div className="w-full bg-neutral-900 border-2 border-neutral-800 p-3 sm:p-4 rounded-xl shadow-2xl">
            {gameMode === "Multiplayer" ? (
              // Side by side dual boards for multiplayer
              <div className="grid grid-cols-2 gap-4 sm:gap-6 justify-items-center">
                <Board
                  board={board}
                  playerName={username}
                  badgeLabel="You"
                  statusText="Playing"
                  isStatusPositive={true}
                  isOpponent={false}
                />
                <Board
                  board={opponentBoard}
                  playerName={opponentName}
                  badgeLabel="Rival"
                  statusText={opponentAlive ? "Alive" : "K.O."}
                  isStatusPositive={opponentAlive}
                  isOpponent={true}
                />
              </div>
            ) : (
              // Single centered player board for Solo mode
              <div className="flex justify-center w-full">
                <Board
                  board={board}
                  playerName={username}
                  badgeLabel="Solo"
                  statusText="In Game"
                  isStatusPositive={true}
                  isOpponent={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics & Next Piece Preview */}
        <div
          className={`space-y-4 ${
            gameMode === "Multiplayer" ? "lg:col-span-3" : "lg:col-span-4"
          }`}
        >
          <StatsCard score={score} lines={lines} level={level} />
          <NextPieceCard type="T" />
        </div>
      </main>
    </div>
  );
}

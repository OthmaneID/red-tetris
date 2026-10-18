export interface QueuedPlayer {
  socketId: string;
  username: string;
  joinedAt: number;
}

export interface MatchResult {
  roomId: string;
  player1: QueuedPlayer;
  player2: QueuedPlayer;
}

export class MatchmakingQueue {
  private queue: QueuedPlayer[] = [];

  /**
   * Adds a player to the matchmaking queue.
   * If another player is already waiting, pairs them immediately.
   */
  public addPlayer(
    socketId: string,
    username: string
  ): { matched: false; queued: true } | { matched: true; match: MatchResult } {
    // Remove if already in queue to avoid duplicates
    this.removePlayer(socketId);

    if (this.queue.length > 0) {
      const opponent = this.queue.shift()!;
      const currentPlayer: QueuedPlayer = {
        socketId,
        username,
        joinedAt: Date.now(),
      };

      // Generate a clean room name formatted for URL hash
      const randomCode = Math.random().toString(36).substring(2, 7);
      const roomId = `match-${randomCode}`;

      return {
        matched: true,
        match: {
          roomId,
          player1: opponent,
          player2: currentPlayer,
        },
      };
    }

    this.queue.push({
      socketId,
      username,
      joinedAt: Date.now(),
    });

    return { matched: false, queued: true };
  }

  /**
   * Removes a player from the queue if they cancel or disconnect.
   */
  public removePlayer(socketId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((player) => player.socketId !== socketId);
    return this.queue.length < initialLength;
  }

  /**
   * Checks if a player is currently waiting in the queue.
   */
  public isPlayerInQueue(socketId: string): boolean {
    return this.queue.some((player) => player.socketId === socketId);
  }

  /**
   * Returns current queue size.
   */
  public getQueueLength(): number {
    return this.queue.length;
  }
}

export const matchmakingQueue = new MatchmakingQueue();

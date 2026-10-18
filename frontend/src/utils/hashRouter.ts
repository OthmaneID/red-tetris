export interface HashRoute {
  room: string;
  username: string;
}

/**
 * Parses URL hash adhering to the Red Tetris subject format: #<room>[<player_name>]
 * Example: #alpha[player1] -> { room: "alpha", username: "player1" }
 */
export function parseHash(hash = window.location.hash): HashRoute {
  // Remove leading '#' if present
  const cleanHash = hash.replace(/^#/, "").trim();

  // Regex matching <room>[<player_name>]
  const match = cleanHash.match(/^([^\[\]]+)\[([^\[\]]+)\]$/);

  if (match) {
    const [, room, username] = match;
    return {
      room: room.trim() || "lobby",
      username: username.trim() || `player_${Math.floor(Math.random() * 1000)}`,
    };
  }

  // Fallbacks if no valid hash or plain room without username
  return {
    room: cleanHash || "alpha",
    username: `player_${Math.floor(100 + Math.random() * 900)}`,
  };
}

/**
 * Updates the browser URL hash without causing a page reload
 */
export function updateHash(room: string, username: string): void {
  const newHash = `#${room}[${username}]`;
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
}
